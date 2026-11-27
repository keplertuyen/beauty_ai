using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductCache? _productCache;

    public OrderService(
        IOrderRepository orderRepository,
        IProductCache? productCache = null)
    {
        _orderRepository = orderRepository;
        _productCache = productCache;
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

        var products = await _orderRepository.GetProductsByIdsForUpdateAsync(requestedIds, cancellationToken);
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
            PaymentMethod = "COD",
            PaymentStatus = "Pending",
            OrderStatus = "Pending",
            TotalAmountUsd = totalUsd,
            ConflictAcknowledged = request.ConflictAcknowledged,
            CreatedAtUtc = DateTime.UtcNow,
            OrderItems = orderItems
        };

        var savedOrder = await _orderRepository.CreateOrderAsync(order, cancellationToken);

        foreach (var product in products)
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
            Items: items
        );
    }
}
