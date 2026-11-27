using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;

namespace BeautyAI.Application.Services;

public class RecommendationService : IRecommendationService
{
    private readonly IProductService _productService;

    public RecommendationService(IProductService productService)
    {
        _productService = productService;
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(
        int topK = 8,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(topK, 1, 24);
        var result = await _productService.GetCatalogAsync(
            new ProductFilterParams(
                SortBy: "rating",
                SafeForMe: currentUserId.HasValue,
                Page: 1,
                PageSize: limit
            ),
            currentUserId,
            cancellationToken);

        return result.Items;
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetTrendingAsync(
        int topK = 12,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(topK, 1, 24);
        var result = await _productService.GetCatalogAsync(
            new ProductFilterParams(
                SortBy: "loves",
                SafeForMe: currentUserId.HasValue,
                Page: 1,
                PageSize: limit
            ),
            currentUserId,
            cancellationToken);

        return result.Items;
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetSkinQuizRecommendationsAsync(
        SkinQuizRecommendationRequest? request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        request ??= new SkinQuizRecommendationRequest();

        var limit = Math.Clamp(request.TopK > 0 ? request.TopK : 12, 1, 24);
        var normalizedSkinType = NormalizeSkinType(request.SkinType);
        var (minPrice, maxPrice) = MapBudgetBracket(request.BudgetMax);
        var category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        var safeForMe = currentUserId.HasValue;

        // 1. Strict match: category + skin type + budget bracket (+ SafeForMe if authenticated)
        var result = await _productService.GetCatalogAsync(
            new ProductFilterParams(
                Category: category,
                SkinType: normalizedSkinType,
                MinPrice: minPrice,
                MaxPrice: maxPrice,
                SortBy: "rating",
                SafeForMe: safeForMe,
                Page: 1,
                PageSize: limit
            ),
            currentUserId,
            cancellationToken);

        // 2. Relax lower budget bound if strict bracket returned no items
        if (result.Items.Count == 0 && minPrice.HasValue)
        {
            result = await _productService.GetCatalogAsync(
                new ProductFilterParams(
                    Category: category,
                    SkinType: normalizedSkinType,
                    MaxPrice: maxPrice,
                    SortBy: "rating",
                    SafeForMe: safeForMe,
                    Page: 1,
                    PageSize: limit
                ),
                currentUserId,
                cancellationToken);
        }

        // 3. Relax skin type filter if still empty (keep category, budget cap, and allergy safety)
        if (result.Items.Count == 0 && normalizedSkinType != null)
        {
            result = await _productService.GetCatalogAsync(
                new ProductFilterParams(
                    Category: category,
                    MaxPrice: maxPrice,
                    SortBy: "rating",
                    SafeForMe: safeForMe,
                    Page: 1,
                    PageSize: limit
                ),
                currentUserId,
                cancellationToken);
        }

        // 4. Final fallback: relax category while preserving budget cap and allergy safety
        if (result.Items.Count == 0 && category != null)
        {
            result = await _productService.GetCatalogAsync(
                new ProductFilterParams(
                    MaxPrice: maxPrice,
                    SortBy: "rating",
                    SafeForMe: safeForMe,
                    Page: 1,
                    PageSize: limit
                ),
                currentUserId,
                cancellationToken);
        }

        return result.Items;
    }

    private static string? NormalizeSkinType(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return raw.Trim().ToLowerInvariant() switch
        {
            "oily" => "Oily",
            "dry" => "Dry",
            "combination" => "Combination",
            "normal" => "Normal",
            "sensitive" => "Sensitive",
            _ => raw.Trim()
        };
    }

    private static (decimal? MinPrice, decimal? MaxPrice) MapBudgetBracket(decimal? budgetMax)
    {
        if (!budgetMax.HasValue || budgetMax.Value <= 0 || budgetMax.Value >= 9999m)
            return (null, null);

        if (budgetMax.Value <= 20m)
            return (null, 20m);

        if (budgetMax.Value <= 50m)
            return (20m, 50m);

        if (budgetMax.Value <= 100m)
            return (50m, 100m);

        return (null, budgetMax.Value);
    }
}
