namespace BeautyAI.Application.DTOs;

public record AiConsultRequest(
    string Message,
    List<string>? ConversationHistory = null
);

public record AiConsultResponse(
    string Reply,
    List<ProductSummaryDto> RecommendedProducts
);
