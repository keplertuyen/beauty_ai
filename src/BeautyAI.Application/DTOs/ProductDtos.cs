using System.Text.Json.Serialization;

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
    decimal? Rating,
    int ReviewsCount,
    string[] TargetSkinTypes,
    string SuitabilityVerdict,
    string SuitabilityLabel,
    bool HasAllergyWarning,
    string? MatchedAllergen = null,
    string? SuitabilityReason = null,
    bool HasIngredients = true,
    bool IsNonCosmeticTool = false,
    string Department = "Skincare",
    string? SizeDisplay = null,
    int LovesCount = 0
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
    decimal? Rating,
    int ReviewsCount,
    string[] TargetSkinTypes,
    int StockQuantity,
    IReadOnlyList<ProductIngredientDto> Ingredients,
    string SuitabilityVerdict,
    string SuitabilityLabel,
    bool HasAllergyWarning,
    string? MatchedAllergen = null,
    string? SuitabilityReason = null,
    bool HasIngredients = true,
    bool IsNonCosmeticTool = false,
    string Department = "Skincare",
    ProductFormulaBreakdownDto? FormulaBreakdown = null,
    string? SizeDisplay = null,
    int LovesCount = 0,
    IReadOnlyDictionary<int, int>? RatingDistribution = null
);

public record ProductFormulaBreakdownDto(
    string TargetArea,
    string BenefitsTitle,
    IReadOnlyList<string> Benefits,
    IReadOnlyList<KeyIngredientDto> KeyIngredients,
    IReadOnlyList<FunctionalGroupDto> FunctionalGroups,
    IReadOnlyList<FormulaCautionDto> Cautions,
    string? FragranceDisclosure,
    int TotalIngredientsCount,
    IReadOnlyList<string> RawInciList,
    IReadOnlyList<string>? MayContainList = null
);

public record KeyIngredientDto(
    string CommonName,
    string InciName,
    string RoleLabel,
    string Explanation,
    bool IsFeaturedInProductName
);

public record FunctionalGroupDto(
    string GroupTitle,
    string PlainExplanation,
    int Count,
    IReadOnlyList<string> Ingredients
);

public record FormulaCautionDto(
    string Type,
    string Title,
    string Message,
    IReadOnlyList<string> IngredientsInvolved
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

public record CreateReviewRequest(
    [property: JsonPropertyName("product_id")] string? ProductId = null,
    [property: JsonPropertyName("author_id")] string? AuthorId = null,
    [property: JsonPropertyName("author_name")] string? AuthorName = null,
    [property: JsonPropertyName("rating")] int Rating = 5,
    [property: JsonPropertyName("skin_type")] string? SkinType = null,
    [property: JsonPropertyName("skin_concerns")] string? SkinConcerns = null,
    [property: JsonPropertyName("content")] string? Content = null,
    [property: JsonPropertyName("review_text")] string? ReviewText = null,
    [property: JsonPropertyName("is_recommended")] int? IsRecommended = null
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
    int PageSize = 20,
    string? ActiveIngredients = null,
    string? FreeFrom = null,
    string? HighlightsFilter = null
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize,
    int Pages
);
