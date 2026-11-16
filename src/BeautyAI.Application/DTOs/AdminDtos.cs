namespace BeautyAI.Application.DTOs;

public record AdminKpisDto(
    int TotalProducts,
    int TotalOrders,
    decimal TotalRevenueUsd,
    int ActiveUsers,
    int PendingOrders
);

public record CreateProductAdminRequest(
    string Name,
    string? BrandName,
    string? CategoryName,
    decimal PriceUsd,
    string IngredientListRaw,
    string[]? TargetSkinTypes = null,
    string? Description = null,
    string? ImageUrl = null
);

public record UpdateOrderStatusRequest(
    string Status
);
