using System.Text.RegularExpressions;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Services;

public class AdminProductService : IAdminProductService
{
    private static readonly HashSet<string> AllowedSkinTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "All", "Oily", "Dry", "Combination", "Sensitive", "Normal"
    };

    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Active", "Draft", "Discontinued"
    };

    private readonly IProductRepository _productRepository;

    public AdminProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<PagedResult<AdminProductDto>> GetProductsAsync(
        AdminProductFilterParams filter,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var normalizedFilter = filter with { Page = page, PageSize = pageSize };

        var (items, totalCount) = await _productRepository.GetAdminProductsAsync(normalizedFilter, cancellationToken);
        var statsMap = await _productRepository.GetProductsReviewStatsAsync(
            items.Select(p => p.Id),
            cancellationToken);

        var dtos = items.Select(p =>
        {
            var stats = statsMap.TryGetValue(p.Id, out var s) ? s : (5.0m, 0);
            return MapToDto(p, stats.Item1, stats.Item2);
        }).ToList();

        var totalPages = totalCount > 0
            ? (int)Math.Ceiling((double)totalCount / pageSize)
            : 0;

        return new PagedResult<AdminProductDto>(
            Items: dtos,
            Total: totalCount,
            Page: page,
            PageSize: pageSize,
            Pages: totalPages
        );
    }

    public async Task<AdminProductDto?> GetProductByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        if (product == null)
            return null;

        var (rating, count) = await _productRepository.GetProductReviewStatsAsync(id, cancellationToken);
        return MapToDto(product, rating, count);
    }

    public async Task<AdminProductDto> CreateProductAsync(
        CreateProductAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentException("Request payload is required.");

        var (brand, category, normalizedSkinTypes, normalizedStatus) = await ValidateAndResolveAsync(
            name: request.Name,
            brandId: request.BrandId,
            brandName: request.BrandName,
            categoryId: request.CategoryId,
            categoryName: request.CategoryName,
            priceUsd: request.PriceUsd,
            stockQuantity: request.StockQuantity,
            volumeMl: request.VolumeMl,
            ingredientListRaw: request.IngredientListRaw,
            targetSkinTypes: request.TargetSkinTypes,
            sellingStatus: request.SellingStatus,
            cancellationToken: cancellationToken
        );

        var code = "P" + DateTime.UtcNow.Ticks.ToString()[^8..];
        var slug = await GenerateUniqueSlugAsync(request.Name, null, cancellationToken);

        var product = new Product
        {
            Code = code,
            Name = request.Name.Trim(),
            Slug = slug,
            BrandId = brand.Id,
            CategoryId = category.Id,
            Department = "Skincare",
            PriceUsd = Math.Round(request.PriceUsd, 2),
            VolumeMl = request.VolumeMl,
            StockQuantity = request.StockQuantity,
            SellingStatus = normalizedStatus,
            IngredientListRaw = request.IngredientListRaw.Trim(),
            TargetSkinTypes = normalizedSkinTypes,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? "Premium skincare formulation parsed by BeautyAI."
                : request.Description.Trim(),
            ImageUrl = !string.IsNullOrWhiteSpace(request.ImageUrl)
                ? request.ImageUrl.Trim()
                : $"/images/products/{code}.webp",
            CreatedAtUtc = DateTime.UtcNow
        };

        var created = await _productRepository.CreateProductAsync(product, cancellationToken);
        await _productRepository.SyncProductIngredientsAsync(created.Id, created.IngredientListRaw, cancellationToken);

        created.Brand ??= brand;
        created.Category ??= category;

        return MapToDto(created, 5.0m, 0);
    }

    public async Task<AdminProductDto> UpdateProductAsync(
        int id,
        UpdateProductAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentException("Request payload is required.");

        var existing = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Product with ID {id} not found.");

        var (brand, category, normalizedSkinTypes, normalizedStatus) = await ValidateAndResolveAsync(
            name: request.Name,
            brandId: request.BrandId,
            brandName: request.BrandName,
            categoryId: request.CategoryId,
            categoryName: request.CategoryName,
            priceUsd: request.PriceUsd,
            stockQuantity: request.StockQuantity,
            volumeMl: request.VolumeMl,
            ingredientListRaw: request.IngredientListRaw,
            targetSkinTypes: request.TargetSkinTypes,
            sellingStatus: request.SellingStatus ?? existing.SellingStatus,
            cancellationToken: cancellationToken
        );

        var previousName = existing.Name;
        var previousInci = existing.IngredientListRaw;
        var newTrimmedName = request.Name.Trim();
        var newTrimmedInci = request.IngredientListRaw.Trim();

        existing.Name = newTrimmedName;
        if (!string.Equals(previousName, newTrimmedName, StringComparison.OrdinalIgnoreCase))
        {
            existing.Slug = await GenerateUniqueSlugAsync(newTrimmedName, existing.Id, cancellationToken);
        }

        existing.BrandId = brand.Id;
        existing.Brand = brand;
        existing.CategoryId = category.Id;
        existing.Category = category;
        existing.PriceUsd = Math.Round(request.PriceUsd, 2);
        existing.VolumeMl = request.VolumeMl;
        existing.StockQuantity = request.StockQuantity;
        existing.SellingStatus = normalizedStatus;
        existing.IngredientListRaw = newTrimmedInci;
        existing.TargetSkinTypes = normalizedSkinTypes;
        existing.Description = string.IsNullOrWhiteSpace(request.Description)
            ? existing.Description
            : request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            existing.ImageUrl = request.ImageUrl.Trim();
        }
        existing.UpdatedAtUtc = DateTime.UtcNow;

        var updated = await _productRepository.UpdateProductAsync(existing, cancellationToken);

        // Rule: Only rebuild product_ingredients when the INCI string actually changed
        if (!string.Equals(previousInci.Trim(), newTrimmedInci, StringComparison.Ordinal))
        {
            await _productRepository.SyncProductIngredientsAsync(updated.Id, updated.IngredientListRaw, cancellationToken);
        }

        var (rating, count) = await _productRepository.GetProductReviewStatsAsync(updated.Id, cancellationToken);
        return MapToDto(updated, rating, count);
    }

    public async Task<bool> DiscontinueProductAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var existing = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        if (existing == null)
            return false;

        existing.SellingStatus = "Discontinued";
        existing.UpdatedAtUtc = DateTime.UtcNow;
        await _productRepository.UpdateProductAsync(existing, cancellationToken);
        return true;
    }

    public async Task<AdminProductDto> RestoreProductAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var existing = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken);
        if (existing == null)
            throw new KeyNotFoundException($"Product with ID {id} not found.");

        existing.SellingStatus = "Active";
        existing.UpdatedAtUtc = DateTime.UtcNow;
        var updated = await _productRepository.UpdateProductAsync(existing, cancellationToken);

        var (rating, count) = await _productRepository.GetProductReviewStatsAsync(updated.Id, cancellationToken);
        return MapToDto(updated, rating, count);
    }

    private async Task<(Brand Brand, Category Category, string[] SkinTypes, string Status)> ValidateAndResolveAsync(
        string? name,
        int? brandId,
        string? brandName,
        int? categoryId,
        string? categoryName,
        decimal priceUsd,
        int stockQuantity,
        int? volumeMl,
        string? ingredientListRaw,
        string[]? targetSkinTypes,
        string? sellingStatus,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Product name is required.");
        if (name.Trim().Length > 255)
            throw new ArgumentException("Product name must not exceed 255 characters.");
        if (priceUsd <= 0 || priceUsd > 10000m)
            throw new ArgumentException("Price (USD) must be greater than 0 and at most 10,000.");
        if (stockQuantity < 0)
            throw new ArgumentException("Stock quantity cannot be negative.");
        if (volumeMl.HasValue && volumeMl.Value <= 0)
            throw new ArgumentException("Volume (ml) must be a positive number.");
        if (string.IsNullOrWhiteSpace(ingredientListRaw) || ingredientListRaw.Trim().Length < 3)
            throw new ArgumentException("INCI ingredient list is required.");

        var brands = await _productRepository.GetBrandsAsync(cancellationToken);
        Brand? brand = null;
        if (brandId.HasValue && brandId.Value > 0)
        {
            brand = brands.FirstOrDefault(b => b.Id == brandId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(brandName))
        {
            var bn = brandName.Trim();
            brand = brands.FirstOrDefault(b =>
                b.Name.Equals(bn, StringComparison.OrdinalIgnoreCase) ||
                b.Slug.Equals(bn, StringComparison.OrdinalIgnoreCase));
        }

        if (brand == null)
        {
            throw new ArgumentException(
                $"Brand '{brandName ?? brandId?.ToString() ?? ""}' was not found. Please select a valid existing brand.");
        }

        var categories = await _productRepository.GetCategoriesAsync(cancellationToken);
        Category? category = null;
        if (categoryId.HasValue && categoryId.Value > 0)
        {
            category = categories.FirstOrDefault(c => c.Id == categoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(categoryName))
        {
            var cn = categoryName.Trim();
            category = categories.FirstOrDefault(c =>
                c.Name.Equals(cn, StringComparison.OrdinalIgnoreCase) ||
                c.Slug.Equals(cn, StringComparison.OrdinalIgnoreCase));
        }

        if (category == null)
        {
            throw new ArgumentException(
                $"Category '{categoryName ?? categoryId?.ToString() ?? ""}' was not found. Please select a valid existing category.");
        }

        var normalizedSkinTypes = new List<string>();
        if (targetSkinTypes != null && targetSkinTypes.Length > 0)
        {
            foreach (var raw in targetSkinTypes)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                var token = raw.Trim();
                if (!AllowedSkinTypes.Contains(token))
                {
                    throw new ArgumentException(
                        $"Invalid target skin type '{token}'. Allowed values: {string.Join(", ", AllowedSkinTypes)}.");
                }
                var canonical = AllowedSkinTypes.First(a => a.Equals(token, StringComparison.OrdinalIgnoreCase));
                if (!normalizedSkinTypes.Contains(canonical, StringComparer.OrdinalIgnoreCase))
                    normalizedSkinTypes.Add(canonical);
            }
        }
        if (normalizedSkinTypes.Count == 0)
        {
            normalizedSkinTypes.Add("All");
        }

        var statusToken = string.IsNullOrWhiteSpace(sellingStatus) ? "Active" : sellingStatus.Trim();
        if (!AllowedStatuses.Contains(statusToken))
        {
            throw new ArgumentException(
                $"Invalid selling status '{statusToken}'. Allowed values: Active, Draft, Discontinued.");
        }
        var canonicalStatus = AllowedStatuses.First(s => s.Equals(statusToken, StringComparison.OrdinalIgnoreCase));

        return (brand, category, normalizedSkinTypes.ToArray(), canonicalStatus);
    }

    private async Task<string> GenerateUniqueSlugAsync(
        string name,
        int? excludeProductId,
        CancellationToken cancellationToken)
    {
        var baseSlug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "product";
        }

        var candidate = baseSlug;
        var suffix = 2;
        while (await _productRepository.SlugExistsAsync(candidate, excludeProductId, cancellationToken))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static AdminProductDto MapToDto(Product p, decimal rating, int reviewsCount)
    {
        var imageUrl = !string.IsNullOrWhiteSpace(p.ImageUrl)
            ? p.ImageUrl
            : $"/images/products/{p.Code}.webp";

        return new AdminProductDto(
            Id: p.Id,
            Code: p.Code,
            Name: p.Name,
            Slug: p.Slug,
            BrandId: p.BrandId,
            BrandName: p.Brand?.Name ?? "BeautyAI",
            CategoryId: p.CategoryId,
            CategoryName: p.Category?.Name ?? "Skincare",
            Department: p.Department ?? "Skincare",
            PriceUsd: p.PriceUsd,
            VolumeMl: p.VolumeMl,
            StockQuantity: p.StockQuantity,
            SellingStatus: string.IsNullOrWhiteSpace(p.SellingStatus) ? "Active" : p.SellingStatus,
            Description: p.Description,
            ImageUrl: imageUrl,
            IngredientListRaw: p.IngredientListRaw,
            TargetSkinTypes: p.TargetSkinTypes ?? new[] { "All" },
            Rating: rating,
            ReviewsCount: reviewsCount,
            CreatedAtUtc: p.CreatedAtUtc,
            UpdatedAtUtc: p.UpdatedAtUtc
        );
    }
}
