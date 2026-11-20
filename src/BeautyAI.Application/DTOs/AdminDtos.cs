namespace BeautyAI.Application.DTOs;

public record AdminKpisDto(
    int TotalProducts,
    int TotalOrders,
    decimal TotalRevenueUsd,
    int ActiveUsers,
    int PendingOrders
);

public record AdminTopProductDto(
    int ProductId,
    string Code,
    string ProductName,
    string BrandName,
    string PrimaryCategory,
    decimal PriceUsd,
    decimal Rating,
    int ReviewsCount,
    string SellingStatus,
    string? ImageUrl
);

public record AdminAnalyticsDto(
    int TotalProducts,
    int TotalBrands,
    int TotalReviews,
    decimal AverageRating,
    Dictionary<string, int> CategoryDistribution,
    Dictionary<string, int> BrandDistribution,
    Dictionary<string, int> PriceRangeDistribution,
    Dictionary<string, int> RatingDistribution,
    IReadOnlyList<AdminTopProductDto> TopProducts
);

public record AdminProductDto(
    int Id,
    string Code,
    string Name,
    string Slug,
    int BrandId,
    string BrandName,
    int CategoryId,
    string CategoryName,
    string Department,
    decimal PriceUsd,
    int? VolumeMl,
    int StockQuantity,
    string SellingStatus,
    string? Description,
    string? ImageUrl,
    string IngredientListRaw,
    string[] TargetSkinTypes,
    decimal Rating,
    int ReviewsCount,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record AdminProductFilterParams(
    string? Query = null,
    string? Category = null,
    string? Brand = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 10
);

public record CreateProductAdminRequest(
    string Name,
    string? BrandName = null,
    string? CategoryName = null,
    decimal PriceUsd = 0m,
    string IngredientListRaw = "",
    string[]? TargetSkinTypes = null,
    string? Description = null,
    string? ImageUrl = null,
    int StockQuantity = 100,
    int? VolumeMl = null,
    string? SellingStatus = "Active",
    int? BrandId = null,
    int? CategoryId = null
);

public record UpdateProductAdminRequest(
    string Name,
    string? BrandName = null,
    string? CategoryName = null,
    decimal PriceUsd = 0m,
    string IngredientListRaw = "",
    string[]? TargetSkinTypes = null,
    string? Description = null,
    string? ImageUrl = null,
    int StockQuantity = 100,
    int? VolumeMl = null,
    string? SellingStatus = "Active",
    int? BrandId = null,
    int? CategoryId = null
);

public record UpdateOrderStatusRequest(
    string Status
);
