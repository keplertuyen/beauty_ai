using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IProductService
{
    Task<PagedResult<ProductSummaryDto>> GetCatalogAsync(
        ProductFilterParams filter,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<ProductDetailDto?> GetProductDetailAsync(
        string idOrCodeOrSlug,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetSimilarProductsAsync(
        string idOrCodeOrSlug,
        int? currentUserId = null,
        int limit = 6,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken cancellationToken = default);
}
