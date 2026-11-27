using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace BeautyAI.Infrastructure.Caching;

public class MemoryProductCache : IProductCache
{
    private const string ProductKeyPrefix = "product:";
    private const string CategoriesKey = "catalog:categories";
    private const string BrandsKey = "catalog:brands";

    private static readonly TimeSpan ProductTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan TaxonomyTtl = TimeSpan.FromMinutes(10);

    private readonly IMemoryCache _memoryCache;

    public MemoryProductCache(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public bool TryGetProduct(string key, out Product? product)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            product = null;
            return false;
        }

        return _memoryCache.TryGetValue(NormalizeProductKey(key), out product);
    }

    public void SetProduct(Product product, params string[] extraKeys)
    {
        if (product == null) return;

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ProductTtl
        };

        _memoryCache.Set(NormalizeProductKey(product.Id.ToString()), product, options);

        if (!string.IsNullOrWhiteSpace(product.Code))
            _memoryCache.Set(NormalizeProductKey(product.Code), product, options);

        if (!string.IsNullOrWhiteSpace(product.Slug))
            _memoryCache.Set(NormalizeProductKey(product.Slug), product, options);

        foreach (var extra in extraKeys)
        {
            if (!string.IsNullOrWhiteSpace(extra))
                _memoryCache.Set(NormalizeProductKey(extra), product, options);
        }
    }

    public void InvalidateProduct(int productId, string? code = null, string? slug = null)
    {
        _memoryCache.Remove(NormalizeProductKey(productId.ToString()));

        if (!string.IsNullOrWhiteSpace(code))
            _memoryCache.Remove(NormalizeProductKey(code));

        if (!string.IsNullOrWhiteSpace(slug))
            _memoryCache.Remove(NormalizeProductKey(slug));
    }

    public bool TryGetCategories(out IReadOnlyList<CategoryDto>? categories)
    {
        return _memoryCache.TryGetValue(CategoriesKey, out categories);
    }

    public void SetCategories(IReadOnlyList<CategoryDto> categories)
    {
        _memoryCache.Set(CategoriesKey, categories, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TaxonomyTtl
        });
    }

    public void InvalidateCategories()
    {
        _memoryCache.Remove(CategoriesKey);
    }

    public bool TryGetBrands(out IReadOnlyList<BrandDto>? brands)
    {
        return _memoryCache.TryGetValue(BrandsKey, out brands);
    }

    public void SetBrands(IReadOnlyList<BrandDto> brands)
    {
        _memoryCache.Set(BrandsKey, brands, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TaxonomyTtl
        });
    }

    public void InvalidateBrands()
    {
        _memoryCache.Remove(BrandsKey);
    }

    private static string NormalizeProductKey(string key) =>
        ProductKeyPrefix + key.Trim().ToLowerInvariant();
}
