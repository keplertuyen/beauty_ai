using System.Text.Json.Serialization;

namespace BeautyAI.Application.DTOs;

public record CreateOrderItemRequest(
    [property: JsonPropertyName("product_id")] int ProductId,
    [property: JsonPropertyName("quantity")] int Quantity
);

public record CreateOrderRequest(
    [property: JsonPropertyName("recipient_name")] string RecipientName,
    [property: JsonPropertyName("phone_number")] string PhoneNumber,
    [property: JsonPropertyName("shipping_address")] string ShippingAddress,
    [property: JsonPropertyName("notes")] string? Notes = null,
    [property: JsonPropertyName("conflict_acknowledged")] bool ConflictAcknowledged = false,
    [property: JsonPropertyName("items")] IReadOnlyList<CreateOrderItemRequest>? Items = null
);

public record OrderItemDto(
    [property: JsonPropertyName("product_id")] int ProductId,
    [property: JsonPropertyName("product_code")] string? ProductCode,
    [property: JsonPropertyName("product_name")] string ProductName,
    [property: JsonPropertyName("brand_name")] string BrandName,
    [property: JsonPropertyName("image_url")] string? ImageUrl,
    [property: JsonPropertyName("quantity")] int Quantity,
    [property: JsonPropertyName("unit_price_usd")] decimal UnitPriceUsd,
    [property: JsonPropertyName("total_price_usd")] decimal TotalPriceUsd
);

public record OrderDto(
    [property: JsonPropertyName("order_id")] int OrderId,
    [property: JsonPropertyName("order_code")] string OrderCode,
    [property: JsonPropertyName("recipient_name")] string RecipientName,
    [property: JsonPropertyName("phone_number")] string PhoneNumber,
    [property: JsonPropertyName("shipping_address")] string ShippingAddress,
    [property: JsonPropertyName("payment_method")] string PaymentMethod,
    [property: JsonPropertyName("payment_status")] string PaymentStatus,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("total_usd")] decimal TotalUsd,
    [property: JsonPropertyName("conflict_acknowledged")] bool ConflictAcknowledged,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("items")] IReadOnlyList<OrderItemDto> Items
);
