using System.Text.Json.Serialization;

namespace BeautyAI.Application.DTOs;

public record AiConsultRequest(
    string Message,
    List<string>? ConversationHistory = null
);

public record AiConsultResponse(
    string Reply,
    List<ProductSummaryDto> RecommendedProducts,
    [property: JsonPropertyName("is_pathology")] bool IsPathology = false,
    [property: JsonPropertyName("zalo_deep_link")] string? ZaloDeepLink = null,
    [property: JsonPropertyName("suggested_action")] string? SuggestedAction = null
);
