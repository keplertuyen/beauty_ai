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
    DateTime? UpdatedAtUtc,
    string? SizeDisplay = null
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
    int? CategoryId = null,
    string? Department = null,
    string? SizeDisplay = null
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
    int? CategoryId = null,
    string? Department = null,
    string? SizeDisplay = null
);

public record UpdateOrderStatusRequest(
    string Status,
    string? TrackingNumber = null,
    string? AdminNotes = null
);

public record AdminUserDto(
    int Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    bool IsActive,
    int OrdersCount,
    decimal TotalSpentUsd,
    DateTime CreatedAtUtc
);

public record UpdateUserStatusRequest(bool IsActive);

public record UpdateUserRoleRequest(string Role);

public record AdminReviewDto(
    long Id,
    int ProductId,
    string? ProductCode,
    string ProductName,
    string? ProductImageUrl,
    int? UserId,
    string AuthorName,
    int Rating,
    string SkinType,
    string? Content,
    bool IsHidden,
    string? ModerationReason,
    DateTime CreatedAtUtc
);

public record UpdateReviewVisibilityRequest(
    bool IsHidden,
    string? ModerationReason = null
);

public record CreateSupportTicketRequest(
    string Name,
    string Email,
    string Subject,
    string Message
);

public record SupportTicketDto(
    int Id,
    string TicketCode,
    int? UserId,
    string Name,
    string Email,
    string Subject,
    string Message,
    string Status,
    string? AdminReply,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record UpdateSupportTicketRequest(
    string Status,
    string? AdminReply = null
);

public record AdminIngredientDto(
    int Id,
    string InciName,
    string FunctionGroup,
    string? Description,
    bool IsActiveIngredient,
    int? ComedogenicRating,
    int? IrritationRating,
    int ProductsCount
);

public record UpsertIngredientRequest(
    string InciName,
    string FunctionGroup,
    string? Description = null,
    bool IsActiveIngredient = false,
    int? ComedogenicRating = null,
    int? IrritationRating = null
);

public record AdminConflictRuleDto(
    int Id,
    string ActiveIngredientA,
    string ActiveIngredientB,
    string Severity,
    string Reason,
    string Recommendation
);

public record UpsertConflictRuleRequest(
    string ActiveIngredientA,
    string ActiveIngredientB,
    string Severity,
    string Reason,
    string Recommendation
);

public record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int Pages
);

public record AdminBrandDto(
    int Id,
    string Name,
    string Slug,
    string? OriginCountry,
    int ProductsCount
);

public record UpsertBrandRequest(
    string Name,
    string? OriginCountry = null
);

public record AdminCategoryDto(
    int Id,
    string Name,
    string Slug,
    int? ParentId,
    string? ParentName,
    int ProductsCount,
    int SubCategoriesCount
);

public record UpsertCategoryRequest(
    string Name,
    int? ParentId = null
);
