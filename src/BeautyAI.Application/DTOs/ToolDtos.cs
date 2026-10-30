using System.Text.Json.Serialization;

namespace BeautyAI.Application.DTOs;

public record InciAnalysisRequest(
    [property: JsonPropertyName("ingredients_text")] string IngredientsText,
    [property: JsonPropertyName("target_area")] string? TargetArea = null,
    [property: JsonPropertyName("department")] string? Department = null,
    [property: JsonPropertyName("category")] string? Category = null,
    [property: JsonPropertyName("product_name")] string? ProductName = null,
    [property: JsonPropertyName("condition")] string? Condition = null,
    [property: JsonPropertyName("skin_type")] string? SkinType = null
);

public record InciAnalysisResponse(
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("verdict")] string Verdict,
    [property: JsonPropertyName("verdict_label")] string VerdictLabel,
    [property: JsonPropertyName("verdict_reason")] string VerdictReason,
    [property: JsonPropertyName("requires_skin_id")] bool RequiresSkinId,
    [property: JsonPropertyName("user_skin_type")] string? UserSkinType,
    [property: JsonPropertyName("target_area")] string TargetArea,
    [property: JsonPropertyName("department")] string? Department,
    [property: JsonPropertyName("has_allergy_warning")] bool HasAllergyWarning,
    [property: JsonPropertyName("allergy_matches")] IReadOnlyList<string> AllergyMatches,
    [property: JsonPropertyName("key_ingredients")] IReadOnlyList<AnalyzedKeyIngredientDto> KeyIngredients,
    [property: JsonPropertyName("functional_groups")] IReadOnlyList<AnalyzedFunctionalGroupDto> FunctionalGroups,
    [property: JsonPropertyName("benefits_title")] string BenefitsTitle,
    [property: JsonPropertyName("benefits")] IReadOnlyList<string> Benefits,
    [property: JsonPropertyName("cautions")] IReadOnlyList<AnalyzedCautionDto> Cautions,
    [property: JsonPropertyName("combination_warnings")] IReadOnlyList<CombinationWarningDto> CombinationWarnings,
    [property: JsonPropertyName("fragrance_disclosure")] string? FragranceDisclosure,
    [property: JsonPropertyName("total_ingredients_count")] int TotalIngredientsCount,
    [property: JsonPropertyName("raw_inci_list")] IReadOnlyList<string> RawInciList
);

public record AnalyzedKeyIngredientDto(
    [property: JsonPropertyName("common_name")] string CommonName,
    [property: JsonPropertyName("inci_name")] string InciName,
    [property: JsonPropertyName("role_label")] string RoleLabel,
    [property: JsonPropertyName("explanation")] string Explanation,
    [property: JsonPropertyName("is_featured_in_product_name")] bool IsFeaturedInProductName
);

public record AnalyzedFunctionalGroupDto(
    [property: JsonPropertyName("group_title")] string GroupTitle,
    [property: JsonPropertyName("plain_explanation")] string PlainExplanation,
    [property: JsonPropertyName("count")] int Count,
    [property: JsonPropertyName("ingredients")] IReadOnlyList<string> Ingredients
);

public record AnalyzedCautionDto(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("caution")] string Caution,
    [property: JsonPropertyName("ingredients_involved")] IReadOnlyList<string> IngredientsInvolved
);

public record CombinationWarningDto(
    [property: JsonPropertyName("warning")] string Warning,
    [property: JsonPropertyName("ingredients_involved")] IReadOnlyList<string> IngredientsInvolved,
    [property: JsonPropertyName("severity")] string Severity,
    [property: JsonPropertyName("recommendation")] string Recommendation
);

public record ConflictCheckRequest(
    [property: JsonPropertyName("product_ids")] IReadOnlyList<int> ProductIds
);

public record ConflictCheckResponse(
    [property: JsonPropertyName("has_conflict")] bool HasConflict,
    [property: JsonPropertyName("conflicts")] IReadOnlyList<ConflictDetailDto> Conflicts
);

public record ConflictDetailDto(
    [property: JsonPropertyName("product_a")] string ProductA,
    [property: JsonPropertyName("product_b")] string ProductB,
    [property: JsonPropertyName("ingredient_a")] string IngredientA,
    [property: JsonPropertyName("ingredient_b")] string IngredientB,
    [property: JsonPropertyName("severity")] string Severity,
    [property: JsonPropertyName("reason")] string Reason,
    [property: JsonPropertyName("recommendation")] string Recommendation
);
