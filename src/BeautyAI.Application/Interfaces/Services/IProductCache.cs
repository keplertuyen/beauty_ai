using BeautyAI.Application.DTOs;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Services;

/// <summary>
/// Per-application in-memory cache for static, user-independent catalog data
/// (never caches user-specific verdicts or allergy evaluations).
/// </summary>
public interface IProductCache
{
    bool TryGetProduct(string key, out Product? product);
    void SetProduct(Product product, params string[] extraKeys);
    void InvalidateProduct(int productId, string? code = null, string? slug = null);

    bool TryGetCategories(out IReadOnlyList<CategoryDto>? categories);
    void SetCategories(IReadOnlyList<CategoryDto> categories);
    void InvalidateCategories();

    bool TryGetBrands(out IReadOnlyList<BrandDto>? brands);
    void SetBrands(IReadOnlyList<BrandDto> brands);
    void InvalidateBrands();
}
