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

    Task<(decimal AverageRating, int ReviewsCount)> GetProductReviewStatsAsync(
        int productId,
        CancellationToken cancellationToken = default);
}
