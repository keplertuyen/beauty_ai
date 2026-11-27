using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Services;

public class OrderService : IOrderService
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Pending", "Delivering", "Completed", "Cancelled"
    };

    private readonly IOrderRepository _orderRepository;
    private readonly IProductCache? _productCache;
    private readonly IToolsService? _toolsService;

    public OrderService(
        IOrderRepository orderRepository,
        IProductCache? productCache = null,
        IToolsService? toolsService = null)
    {
        _orderRepository = orderRepository;
        _productCache = productCache;
        _toolsService = toolsService;
    }

    public async Task<OrderDto> CreateOrderAsync(
        int userId,
        CreateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientName) ||
            string.IsNullOrWhiteSpace(request.PhoneNumber) ||
            string.IsNullOrWhiteSpace(request.ShippingAddress))
        {
            throw new ArgumentException("Recipient name, phone number, and shipping address are required.");
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            throw new ArgumentException("Cannot place an order with an empty cart.");
        }

        var requestedIds = request.Items
            .Where(i => i.ProductId > 0 && i.Quantity > 0)
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        if (requestedIds.Count == 0)
        {
            throw new ArgumentException("No valid cart items provided.");
        }

        // Server-side active ingredient conflict check (never trust client alone)
        if (_toolsService != null && requestedIds.Count >= 2)
        {
            var conflictResult = await _toolsService.CheckCartConflictsAsync(
                new ConflictCheckRequest(requestedIds),
                cancellationToken);

            if (conflictResult.HasConflict && !request.ConflictAcknowledged)
            {
                throw new InvalidOperationException(
                    "Your bag contains conflicting active ingredients. Please review and acknowledge the conflict notice before placing your order.");
            }
        }

        var (savedOrder, lockedProducts) = await _orderRepository.ExecuteInTransactionAsync(async txCt =>
        {
            var products = await _orderRepository.GetProductsByIdsForUpdateAsync(requestedIds, txCt);
            var productMap = products.ToDictionary(p => p.Id);

            var orderItems = new List<OrderItem>();
            decimal totalUsd = 0m;

            foreach (var reqItem in request.Items)
            {
                if (reqItem.Quantity <= 0)
                    continue;

                if (!productMap.TryGetValue(reqItem.ProductId, out var product))
                {
                    throw new InvalidOperationException($"Product #{reqItem.ProductId} does not exist.");
                }

                if (!string.Equals(product.SellingStatus, "Active", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"Product '{product.Name}' is no longer available for purchase.");
                }

                if (product.StockQuantity < reqItem.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}.");
                }

                product.StockQuantity -= reqItem.Quantity;

                var unitPrice = product.PriceUsd;
                var lineTotal = unitPrice * reqItem.Quantity;
                totalUsd += lineTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Quantity = reqItem.Quantity,
                    UnitPriceUsd = unitPrice,
                    TotalPriceUsd = lineTotal,
                    Product = product
                });
            }

            var order = new Order
            {
                UserId = userId,
                RecipientName = request.RecipientName.Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                ShippingAddress = request.ShippingAddress.Trim(),
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                PaymentMethod = "COD",
                PaymentStatus = "Pending",
                OrderStatus = "Pending",
                TotalAmountUsd = totalUsd,
                ConflictAcknowledged = request.ConflictAcknowledged,
                CreatedAtUtc = DateTime.UtcNow,
                OrderItems = orderItems
            };

            var created = await _orderRepository.CreateOrderAsync(order, txCt);
            return (created, products);
        }, cancellationToken);

        foreach (var product in lockedProducts)
        {
            _productCache?.InvalidateProduct(product.Id, product.Code, product.Slug);
        }

        return MapToDto(savedOrder);
    }

    public async Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.GetOrdersByUserIdAsync(userId, cancellationToken);
        return orders.Select(MapToDto).ToList();
    }

    public async Task<bool> UpdateOrderStatusAsync(
        int orderId,
        string newStatus,
        string? trackingNumber = null,
        string? adminNotes = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newStatus) || !ValidStatuses.Contains(newStatus.Trim()))
        {
            throw new ArgumentException(
                $"Invalid status '{newStatus}'. Valid statuses are: Pending, Delivering, Completed, Cancelled.");
        }

        var normalizedStatus = newStatus.Trim() switch
        {
            var s when s.Equals("Pending", StringComparison.OrdinalIgnoreCase) => "Pending",
            var s when s.Equals("Delivering", StringComparison.OrdinalIgnoreCase) => "Delivering",
            var s when s.Equals("Completed", StringComparison.OrdinalIgnoreCase) => "Completed",
            _ => "Cancelled"
        };

        var (found, restoredProducts) = await _orderRepository.ExecuteInTransactionAsync(async txCt =>
        {
            var order = await _orderRepository.GetOrderByIdAsync(orderId, txCt);
            if (order == null)
                return (false, (IReadOnlyList<Product>)Array.Empty<Product>());

            var currentStatus = order.OrderStatus;
            ValidateTransition(currentStatus, normalizedStatus);

            IReadOnlyList<Product> restored = Array.Empty<Product>();
            var isCancelling = string.Equals(normalizedStatus, "Cancelled", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(currentStatus, "Cancelled", StringComparison.OrdinalIgnoreCase);

            if (isCancelling && order.OrderItems.Count > 0)
            {
                var itemProductIds = order.OrderItems.Select(i => i.ProductId).Distinct().ToList();
                restored = await _orderRepository.GetProductsByIdsForUpdateAsync(itemProductIds, txCt);
                var map = restored.ToDictionary(p => p.Id);
                foreach (var item in order.OrderItems)
                {
                    if (map.TryGetValue(item.ProductId, out var product))
                    {
                        product.StockQuantity += item.Quantity;
                    }
                }
            }

            order.OrderStatus = normalizedStatus;
            if (trackingNumber != null)
            {
                order.TrackingNumber = string.IsNullOrWhiteSpace(trackingNumber) ? null : trackingNumber.Trim();
            }
            if (adminNotes != null)
            {
                order.AdminNotes = string.IsNullOrWhiteSpace(adminNotes) ? null : adminNotes.Trim();
            }

            await _orderRepository.SaveChangesAsync(txCt);
            return (true, restored);
        }, cancellationToken);

        foreach (var product in restoredProducts)
        {
            _productCache?.InvalidateProduct(product.Id, product.Code, product.Slug);
        }

        return found;
    }

    private static void ValidateTransition(string currentStatus, string nextStatus)
    {
        if (string.Equals(currentStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cancelled orders cannot be modified or cancelled again.");
        }

        if (string.Equals(currentStatus, "Completed", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(nextStatus, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Completed orders cannot transition to another status.");
        }

        if (string.Equals(currentStatus, "Delivering", StringComparison.OrdinalIgnoreCase)
            && string.Equals(nextStatus, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Delivering orders cannot revert to Pending.");
        }
    }

    private static OrderDto MapToDto(Order order)
    {
        var orderCode = $"BA-{order.CreatedAtUtc:yyyyMMdd}-{order.Id:D4}";
        var items = order.OrderItems.Select(oi => new OrderItemDto(
            ProductId: oi.ProductId,
            ProductCode: oi.Product?.Code,
            ProductName: oi.Product?.Name ?? $"Product #{oi.ProductId}",
            BrandName: oi.Product?.Brand?.Name ?? "BeautyAI",
            ImageUrl: oi.Product?.ImageUrl,
            Quantity: oi.Quantity,
            UnitPriceUsd: oi.UnitPriceUsd,
            TotalPriceUsd: oi.TotalPriceUsd
        )).ToList();

        return new OrderDto(
            OrderId: order.Id,
            OrderCode: orderCode,
            RecipientName: order.RecipientName,
            PhoneNumber: order.PhoneNumber,
            ShippingAddress: order.ShippingAddress,
            PaymentMethod: order.PaymentMethod,
            PaymentStatus: order.PaymentStatus,
            Status: order.OrderStatus.ToLowerInvariant(),
            TotalUsd: order.TotalAmountUsd,
            ConflictAcknowledged: order.ConflictAcknowledged,
            CreatedAt: order.CreatedAtUtc,
            Items: items,
            Notes: order.Notes
        );
    }
}
