using System.Text.Json.Serialization;

namespace BeautyAI.Application.DTOs;

public record InciAnalysisRequest(
    [property: JsonPropertyName("ingredients_text")] string IngredientsText,
    [property: JsonPropertyName("target_area")] string? TargetArea = "face",
    [property: JsonPropertyName("category")] string? Category = null,
    [property: JsonPropertyName("condition")] string? Condition = null,
    [property: JsonPropertyName("skin_type")] string? SkinType = null
);

public record InciAnalysisResponse(
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("safety_score")] decimal FormulaRating,
    [property: JsonPropertyName("compatible_skin_types")] IReadOnlyList<CompatibleSkinTypeDto> CompatibleSkinTypes,
    [property: JsonPropertyName("benefits")] IReadOnlyList<string> Benefits,
    [property: JsonPropertyName("cautions")] IReadOnlyList<CautionDto> Cautions,
    [property: JsonPropertyName("combination_warnings")] IReadOnlyList<CombinationWarningDto> CombinationWarnings,
    [property: JsonPropertyName("condition_evaluation")] ConditionEvaluationDto? ConditionEvaluation,
    [property: JsonPropertyName("identified_ingredients")] IReadOnlyList<AnalyzedIngredientDto> IdentifiedIngredients,
    [property: JsonPropertyName("unknown_ingredients")] IReadOnlyList<string> UnknownIngredients
);

public record AnalyzedIngredientDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("inci_name")] string InciName,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("safety")] string SafetyStatus,
    [property: JsonPropertyName("function")] string Function,
    [property: JsonPropertyName("benefits")] IReadOnlyList<string> Benefits,
    [property: JsonPropertyName("caution")] string? Caution,
    [property: JsonPropertyName("comedogenic_rating")] int? ComedogenicRating,
    [property: JsonPropertyName("irritation_rating")] int? IrritationRating,
    [property: JsonPropertyName("target_areas")] IReadOnlyList<string> TargetAreas
);

public record CompatibleSkinTypeDto(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("score")] int Score,
    [property: JsonPropertyName("vi_name")] string ViName
);

public record CautionDto(
    [property: JsonPropertyName("caution")] string Caution,
    [property: JsonPropertyName("ingredient")] string Ingredient
);

public record CombinationWarningDto(
    [property: JsonPropertyName("warning")] string Warning,
    [property: JsonPropertyName("ingredients_involved")] IReadOnlyList<string> IngredientsInvolved,
    [property: JsonPropertyName("severity")] string Severity,
    [property: JsonPropertyName("recommendation")] string Recommendation
);

public record ConditionEvaluationDto(
    [property: JsonPropertyName("condition_name")] string ConditionName,
    [property: JsonPropertyName("is_suitable")] bool IsSuitable
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
