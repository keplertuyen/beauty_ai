using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IRecommendationService
{
    Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(
        int topK = 8,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetTrendingAsync(
        int topK = 12,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetSkinQuizRecommendationsAsync(
        SkinQuizRecommendationRequest? request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);
}
