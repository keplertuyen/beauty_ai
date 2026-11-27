using System.Text.Json.Serialization;

namespace BeautyAI.Application.DTOs;

public record SkinQuizRecommendationRequest(
    [property: JsonPropertyName("skin_type")] string? SkinType = null,
    [property: JsonPropertyName("concerns")] IReadOnlyList<string>? Concerns = null,
    [property: JsonPropertyName("category")] string? Category = null,
    [property: JsonPropertyName("budget_max")] decimal? BudgetMax = null,
    [property: JsonPropertyName("top_k")] int TopK = 12
);
