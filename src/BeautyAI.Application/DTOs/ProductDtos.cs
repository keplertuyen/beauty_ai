namespace BeautyAI.Application.DTOs;

public record ProductSummaryDto(
    int Id,
    string Code,
    string Name,
    string Slug,
    string BrandName,
    string CategoryName,
    decimal PriceUsd,
    int? VolumeMl,
    string? ImageUrl,
    decimal Rating,
    int ReviewsCount,
    string[] TargetSkinTypes,
    int? SuitabilityScore,
    bool HasAllergyWarning,
    string? MatchedAllergen = null
);

public record ProductDetailDto(
    int Id,
    string Code,
    string Name,
    string Slug,
    string BrandName,
    string CategoryName,
    decimal PriceUsd,
    int? VolumeMl,
    string? Description,
    string? ImageUrl,
    string IngredientListRaw,
    decimal Rating,
    int ReviewsCount,
    string[] TargetSkinTypes,
    int StockQuantity,
    IReadOnlyList<ProductIngredientDto> Ingredients,
    int? SuitabilityScore,
    bool HasAllergyWarning,
    string? MatchedAllergen = null
);

public record ProductIngredientDto(
    int Id,
    string InciName,
    string FunctionGroup,
    string? Description,
    bool IsActiveIngredient,
    int? ComedogenicRating,
    int? IrritationRating,
    int PositionOrder
);

public record CategoryDto(
    int Id,
    string Name,
    string Slug,
    int? ParentId
);

public record BrandDto(
    int Id,
    string Name,
    string Slug,
    string? OriginCountry
);

public record ProductReviewDto(
    long Id,
    int ProductId,
    string AuthorName,
    int Rating,
    string SkinType,
    string? SkinConcerns,
    string? Content,
    DateTime CreatedAt
);

public record ProductFilterParams(
    string? Query = null,
    string? Category = null,
    string? Brand = null,
    string? SkinType = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    decimal? MinRating = null,
    string? SortBy = "rating",
    bool SafeForMe = false,
    int Page = 1,
    int PageSize = 20
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int Pages
);
