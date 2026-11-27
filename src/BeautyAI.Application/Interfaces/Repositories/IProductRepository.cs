using BeautyAI.Application.DTOs;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetProductsAsync(
        ProductFilterParams filter,
        IEnumerable<string>? allergyBlacklist,
        CancellationToken cancellationToken = default);

    Task<Product?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Product?> GetProductByCodeOrSlugAsync(string codeOrSlug, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Brand>> GetBrandsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetSimilarProductsAsync(
        int productId,
        int categoryId,
        IEnumerable<string>? allergyBlacklist,
        int limit = 6,
        CancellationToken cancellationToken = default);

    Task<(decimal? AverageRating, int ReviewsCount, IReadOnlyDictionary<int, int> Distribution)> GetProductReviewStatsAsync(
        int productId,
        CancellationToken cancellationToken = default);

    Task<Dictionary<int, (decimal? AverageRating, int ReviewsCount)>> GetProductsReviewStatsAsync(
        IEnumerable<int> productIds,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Review> Items, int TotalCount)> GetProductReviewsAsync(
        int productId,
        string? skinType = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    Task<Review> AddReviewAsync(Review review, CancellationToken cancellationToken = default);

    Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAdminProductsAsync(
        AdminProductFilterParams filter,
        CancellationToken cancellationToken = default);

    Task<Product?> GetAdminProductByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, int? excludeProductId = null, CancellationToken cancellationToken = default);

    Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task SyncProductIngredientsAsync(int productId, string ingredientListRaw, CancellationToken cancellationToken = default);

    Task<AdminAnalyticsDto> GetAdminAnalyticsAsync(CancellationToken cancellationToken = default);
}
