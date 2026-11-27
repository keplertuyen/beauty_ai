using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using Xunit;

namespace BeautyAI.UnitTests;

public class OrderServiceTests
{
    private class InMemoryOrderRepository : IOrderRepository
    {
        public readonly List<Product> Products = new();
        public readonly List<Order> Orders = new();
        public int TransactionCalls { get; private set; }
        private readonly SemaphoreSlim _txLock = new(1, 1);

        public async Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default)
        {
            TransactionCalls++;
            await _txLock.WaitAsync(cancellationToken);
            try
            {
                return await action(cancellationToken);
            }
            finally
            {
                _txLock.Release();
            }
        }

        public Task<IReadOnlyList<Product>> GetProductsByIdsForUpdateAsync(IReadOnlyList<int> productIds, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Product>>(Products.Where(p => productIds.Contains(p.Id)).ToList());

        public Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default)
        {
            order.Id = Orders.Count + 1;
            Orders.Add(order);
            return Task.FromResult(order);
        }

        public Task<IReadOnlyList<Order>> GetOrdersByUserIdAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Order>>(Orders.Where(o => o.UserId == userId).ToList());

        public Task<IReadOnlyList<Order>> GetAllOrdersAsync(int limit = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Order>>(Orders.Take(limit).ToList());

        public Task<Order?> GetOrderByIdAsync(int id, CancellationToken cancellationToken = default)
            => Task.FromResult(Orders.FirstOrDefault(o => o.Id == id));

        public Task<bool> UpdateOrderStatusAsync(int id, string newStatus, string? trackingNumber = null, string? adminNotes = null, CancellationToken cancellationToken = default)
        {
            var order = Orders.FirstOrDefault(o => o.Id == id);
            if (order == null) return Task.FromResult(false);
            order.OrderStatus = newStatus;
            order.TrackingNumber = trackingNumber;
            order.AdminNotes = adminNotes;
            return Task.FromResult(true);
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private class FakeToolsService : IToolsService
    {
        public bool ReturnConflict { get; set; }

        public Task<InciAnalysisResponse> AnalyzeInciAsync(InciAnalysisRequest request, int? userId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<ConflictCheckResponse> CheckCartConflictsAsync(ConflictCheckRequest request, CancellationToken cancellationToken = default)
        {
            if (!ReturnConflict)
            {
                return Task.FromResult(new ConflictCheckResponse(false, Array.Empty<ConflictDetailDto>()));
            }

            return Task.FromResult(new ConflictCheckResponse(
                HasConflict: true,
                Conflicts: new[]
                {
                    new ConflictDetailDto(
                        ProductA: "Retinol Serum",
                        ProductB: "BHA Toner",
                        IngredientA: "Retinol",
                        IngredientB: "Salicylic Acid",
                        Severity: "Warning",
                        Reason: "Potential irritation when layered.",
                        Recommendation: "Alternate evenings."
                    )
                }));
        }

        public Task<object> GetSkinTypeGuideAsync(string area = "face", CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    [Fact]
    public async Task CreateOrderAsync_RecalculatesTotalFromDb_PersistsNotes_AndRunsInTransaction()
    {
        var repo = new InMemoryOrderRepository();
        repo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Gentle Cleanser",
            Slug = "gentle-cleanser",
            PriceUsd = 24.50m,
            StockQuantity = 10,
            SellingStatus = "Active",
            IngredientListRaw = "Water"
        });

        var service = new OrderService(repo);
        var dto = await service.CreateOrderAsync(7, new CreateOrderRequest(
            RecipientName: "Alice",
            PhoneNumber: "0901234567",
            ShippingAddress: "123 Main St",
            Notes: "Deliver after 5 PM",
            Items: new[] { new CreateOrderItemRequest(1, 2) }
        ));

        Assert.Equal(49.00m, dto.TotalUsd);
        Assert.Equal("Deliver after 5 PM", dto.Notes);
        Assert.Equal("Deliver after 5 PM", repo.Orders[0].Notes);
        Assert.Equal(8, repo.Products[0].StockQuantity);
        Assert.Equal(1, repo.TransactionCalls);
    }

    [Fact]
    public async Task CreateOrderAsync_ThrowsWhenOutOfStock()
    {
        var repo = new InMemoryOrderRepository();
        repo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Rare Serum",
            Slug = "rare-serum",
            PriceUsd = 60m,
            StockQuantity = 1,
            SellingStatus = "Active",
            IngredientListRaw = "Water"
        });

        var service = new OrderService(repo);
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateOrderAsync(7, new CreateOrderRequest(
                RecipientName: "Alice",
                PhoneNumber: "0901234567",
                ShippingAddress: "123 Main St",
                Items: new[] { new CreateOrderItemRequest(1, 2) }
            )));

        Assert.Contains("Insufficient stock", ex.Message);
        Assert.Equal(1, repo.Products[0].StockQuantity);
    }

    [Fact]
    public async Task CreateOrderAsync_ConcurrentOrders_NeverDriveStockNegative()
    {
        var repo = new InMemoryOrderRepository();
        repo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Limited Cream",
            Slug = "limited-cream",
            PriceUsd = 30m,
            StockQuantity = 1,
            SellingStatus = "Active",
            IngredientListRaw = "Water"
        });

        var service = new OrderService(repo);
        var req = new CreateOrderRequest(
            RecipientName: "Buyer",
            PhoneNumber: "0901234567",
            ShippingAddress: "123 Main St",
            Items: new[] { new CreateOrderItemRequest(1, 1) }
        );

        var tasks = new[]
        {
            Task.Run(async () => { try { await service.CreateOrderAsync(1, req); return true; } catch (InvalidOperationException) { return false; } }),
            Task.Run(async () => { try { await service.CreateOrderAsync(2, req); return true; } catch (InvalidOperationException) { return false; } })
        };

        var results = await Task.WhenAll(tasks);

        Assert.Equal(1, results.Count(r => r));
        Assert.Equal(1, results.Count(r => !r));
        Assert.Equal(0, repo.Products[0].StockQuantity);
        Assert.True(repo.TransactionCalls >= 2);
    }

    [Fact]
    public async Task CreateOrderAsync_RejectsUnacknowledgedConflict_AndAllowsWhenAcknowledged()
    {
        var repo = new InMemoryOrderRepository();
        repo.Products.AddRange(new[]
        {
            new Product { Id = 1, Code = "P001", Name = "Retinol Serum", Slug = "retinol", PriceUsd = 40m, StockQuantity = 5, SellingStatus = "Active", IngredientListRaw = "Water, Retinol" },
            new Product { Id = 2, Code = "P002", Name = "BHA Toner", Slug = "bha", PriceUsd = 25m, StockQuantity = 5, SellingStatus = "Active", IngredientListRaw = "Water, Salicylic Acid" }
        });

        var tools = new FakeToolsService { ReturnConflict = true };
        var service = new OrderService(repo, toolsService: tools);

        var items = new[] { new CreateOrderItemRequest(1, 1), new CreateOrderItemRequest(2, 1) };

        // Must reject when ConflictAcknowledged == false
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateOrderAsync(1, new CreateOrderRequest("Alice", "0901234567", "123 St", ConflictAcknowledged: false, Items: items)));
        Assert.Contains("conflict", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(5, repo.Products[0].StockQuantity);

        // Must succeed when ConflictAcknowledged == true
        var ok = await service.CreateOrderAsync(1, new CreateOrderRequest("Alice", "0901234567", "123 St", ConflictAcknowledged: true, Items: items));
        Assert.True(ok.ConflictAcknowledged);
        Assert.Equal(4, repo.Products[0].StockQuantity);
    }

    [Fact]
    public async Task UpdateOrderStatusAsync_CancelRestoresStockOnce_AndBlocksInvalidTransitions()
    {
        var repo = new InMemoryOrderRepository();
        var product = new Product { Id = 1, Code = "P001", Name = "Cream", Slug = "cream", PriceUsd = 20m, StockQuantity = 10, SellingStatus = "Active", IngredientListRaw = "Water" };
        repo.Products.Add(product);

        var service = new OrderService(repo);
        var created = await service.CreateOrderAsync(1, new CreateOrderRequest(
            "Alice", "0901234567", "123 St", Items: new[] { new CreateOrderItemRequest(1, 3) }));
        Assert.Equal(7, product.StockQuantity);

        // First cancel restores stock back to 10
        var cancelled = await service.UpdateOrderStatusAsync(created.OrderId, "Cancelled");
        Assert.True(cancelled);
        Assert.Equal(10, product.StockQuantity);

        // Second cancel must be rejected (cannot double-cancel / double-restore stock)
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateOrderStatusAsync(created.OrderId, "Cancelled"));
        Assert.Equal(10, product.StockQuantity);

        // Cancelled -> Delivering must be rejected
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateOrderStatusAsync(created.OrderId, "Delivering"));
    }
}
