using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using Xunit;

namespace BeautyAI.UnitTests;

public class RecommendationServiceTests
{
    private class RecordingProductService : IProductService
    {
        public readonly List<(ProductFilterParams Filter, int? UserId)> Calls = new();
        public Func<ProductFilterParams, int?, PagedResult<ProductSummaryDto>> Handler { get; set; } =
            (filter, _) => new PagedResult<ProductSummaryDto>(
                Items: new[] { MakeSampleProduct(1, "Hydrating Serum", 35m) },
                Total: 1,
                Page: filter.Page,
                PageSize: filter.PageSize,
                Pages: 1
            );

        public Task<PagedResult<ProductSummaryDto>> GetCatalogAsync(ProductFilterParams filter, int? currentUserId = null, CancellationToken cancellationToken = default)
        {
            Calls.Add((filter, currentUserId));
            return Task.FromResult(Handler(filter, currentUserId));
        }

        public Task<ProductDetailDto?> GetProductDetailAsync(string idOrCodeOrSlug, int? currentUserId = null, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<ProductSummaryDto>> GetSimilarProductsAsync(string idOrCodeOrSlug, int? currentUserId = null, int limit = 6, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<PagedResult<ProductReviewDto>> GetProductReviewsAsync(string idOrCodeOrSlug, string? skinType = null, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<ProductReviewDto> AddReviewAsync(int? userId, CreateReviewRequest request, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private static ProductSummaryDto MakeSampleProduct(int id, string name, decimal price) =>
        new(
            Id: id,
            Code: $"P{id:D4}",
            Name: name,
            Slug: name.ToLowerInvariant().Replace(' ', '-'),
            BrandName: "BeautyAI Lab",
            CategoryName: "Moisturizers",
            PriceUsd: price,
            VolumeMl: 50,
            ImageUrl: $"/images/products/P{id:D4}.webp",
            Rating: 4.7m,
            ReviewsCount: 120,
            TargetSkinTypes: new[] { "Oily", "Combination" },
            SuitabilityVerdict: "GoodMatch",
            SuitabilityLabel: "Good Match",
            HasAllergyWarning: false
        );

    [Fact]
    public async Task GetFeaturedAsync_ClampsTopK_AndSortsByRating()
    {
        var productService = new RecordingProductService();
        var service = new RecommendationService(productService);

        var items = await service.GetFeaturedAsync(topK: 100);

        Assert.Single(items);
        Assert.Single(productService.Calls);
        Assert.Equal("rating", productService.Calls[0].Filter.SortBy);
        Assert.Equal(24, productService.Calls[0].Filter.PageSize);
    }

    [Fact]
    public async Task GetTrendingAsync_UsesLovesSortOrder()
    {
        var productService = new RecordingProductService();
        var service = new RecommendationService(productService);

        var items = await service.GetTrendingAsync(topK: 8);

        Assert.Single(items);
        Assert.Single(productService.Calls);
        Assert.Equal("loves", productService.Calls[0].Filter.SortBy);
        Assert.Equal(8, productService.Calls[0].Filter.PageSize);
    }

    [Fact]
    public async Task GetSkinQuizRecommendationsAsync_MapsBudgetBracket_AndEnforcesSafeForMeForAuthenticatedUser()
    {
        var productService = new RecordingProductService();
        var service = new RecommendationService(productService);

        var request = new SkinQuizRecommendationRequest(
            SkinType: "oily",
            Concerns: new[] { "acne", "pores" },
            Category: "Moisturizers",
            BudgetMax: 50,
            TopK: 12
        );

        var items = await service.GetSkinQuizRecommendationsAsync(request, currentUserId: 42);

        Assert.Single(items);
        Assert.Single(productService.Calls);
        var call = productService.Calls[0];
        Assert.Equal(42, call.UserId);
        Assert.True(call.Filter.SafeForMe);
        Assert.Equal("Oily", call.Filter.SkinType);
        Assert.Equal("Moisturizers", call.Filter.Category);
        Assert.Equal(20m, call.Filter.MinPrice);
        Assert.Equal(50m, call.Filter.MaxPrice);
    }

    [Fact]
    public async Task GetSkinQuizRecommendationsAsync_RelaxesFiltersGracefully_WhenStrictQueryEmpty()
    {
        var productService = new RecordingProductService
        {
            Handler = (filter, _) =>
            {
                if (filter.MinPrice.HasValue)
                    return new PagedResult<ProductSummaryDto>(Array.Empty<ProductSummaryDto>(), 0, 1, filter.PageSize, 0);

                return new PagedResult<ProductSummaryDto>(new[] { MakeSampleProduct(9, "Gentle Gel", 18m) }, 1, 1, filter.PageSize, 1);
            }
        };

        var service = new RecommendationService(productService);
        var request = new SkinQuizRecommendationRequest(
            SkinType: "sensitive",
            Category: "Moisturizers",
            BudgetMax: 50,
            TopK: 6
        );

        var items = await service.GetSkinQuizRecommendationsAsync(request, currentUserId: 7);

        Assert.Single(items);
        Assert.Equal(2, productService.Calls.Count);
        Assert.Equal(20m, productService.Calls[0].Filter.MinPrice);
        Assert.Null(productService.Calls[1].Filter.MinPrice);
        Assert.True(productService.Calls[1].Filter.SafeForMe);
    }
}
