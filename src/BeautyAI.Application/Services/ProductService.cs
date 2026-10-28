using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Services;

namespace BeautyAI.Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ISkinProfileRepository _skinProfileRepository;

    public ProductService(
        IProductRepository productRepository,
        ISkinProfileRepository skinProfileRepository)
    {
        _productRepository = productRepository;
        _skinProfileRepository = skinProfileRepository;
    }

    public async Task<PagedResult<ProductSummaryDto>> GetCatalogAsync(
        ProductFilterParams filter,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        SkinProfile? skinProfile = null;
        List<string>? allergyNames = null;

        if (currentUserId.HasValue)
        {
            skinProfile = await _skinProfileRepository.GetByUserIdAsync(currentUserId.Value, cancellationToken);
            var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(currentUserId.Value, cancellationToken);
            allergyNames = allergies.Select(a => a.IngredientName).ToList();
        }

        // Only pass blacklist for filtering if SafeForMe is active
        var filteringBlacklist = filter.SafeForMe ? allergyNames : null;

        var (items, totalCount) = await _productRepository.GetProductsAsync(
            filter,
            filteringBlacklist,
            cancellationToken);

        var summaryItems = items.Select(p =>
        {
            var matchResult = SuitabilityScoreCalculator.Calculate(p, skinProfile, allergyNames);

            return new ProductSummaryDto(
                Id: p.Id,
                Code: p.Code,
                Name: p.Name,
                Slug: p.Slug,
                BrandName: p.Brand?.Name ?? "Unknown Brand",
                CategoryName: p.Category?.Name ?? "General Skincare",
                PriceUsd: p.PriceUsd,
                VolumeMl: p.VolumeMl,
                ImageUrl: p.ImageUrl,
                Rating: p.Reviews.Any() ? (decimal)p.Reviews.Average(r => r.Rating) : 5.0m,
                ReviewsCount: p.Reviews.Count,
                TargetSkinTypes: p.TargetSkinTypes ?? Array.Empty<string>(),
                SuitabilityScore: matchResult.SuitabilityScore,
                HasAllergyWarning: matchResult.HasAllergyWarning,
                MatchedAllergen: matchResult.MatchedAllergen
            );
        }).ToList();

        var pageSize = filter.PageSize > 0 ? filter.PageSize : 20;
        var pages = (int)Math.Ceiling((double)totalCount / pageSize);

        return new PagedResult<ProductSummaryDto>(
            Items: summaryItems,
            Total: totalCount,
            Page: filter.Page,
            PageSize: pageSize,
            Pages: Math.Max(1, pages)
        );
    }

    public async Task<ProductDetailDto?> GetProductDetailAsync(
        string idOrCodeOrSlug,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        Product? product = null;

        if (int.TryParse(idOrCodeOrSlug, out var id))
        {
            product = await _productRepository.GetProductByIdAsync(id, cancellationToken);
        }

        product ??= await _productRepository.GetProductByCodeOrSlugAsync(idOrCodeOrSlug, cancellationToken);

        if (product == null)
            return null;

        SkinProfile? skinProfile = null;
        List<string>? allergyNames = null;

        if (currentUserId.HasValue)
        {
            skinProfile = await _skinProfileRepository.GetByUserIdAsync(currentUserId.Value, cancellationToken);
            var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(currentUserId.Value, cancellationToken);
            allergyNames = allergies.Select(a => a.IngredientName).ToList();
        }

        var matchResult = SuitabilityScoreCalculator.Calculate(product, skinProfile, allergyNames);

        var ingredientsDto = product.ProductIngredients?
            .OrderBy(pi => pi.PositionOrder)
            .Select(pi => new ProductIngredientDto(
                Id: pi.IngredientId,
                InciName: pi.Ingredient?.InciName ?? "Unknown",
                FunctionGroup: pi.Ingredient?.FunctionGroup ?? "Other",
                Description: pi.Ingredient?.Description,
                IsActiveIngredient: pi.Ingredient?.IsActiveIngredient ?? false,
                ComedogenicRating: pi.Ingredient?.ComedogenicRating,
                IrritationRating: pi.Ingredient?.IrritationRating,
                PositionOrder: pi.PositionOrder
            ))
            .ToList() ?? new List<ProductIngredientDto>();

        var rating = product.Reviews.Any() ? (decimal)product.Reviews.Average(r => r.Rating) : 5.0m;

        return new ProductDetailDto(
            Id: product.Id,
            Code: product.Code,
            Name: product.Name,
            Slug: product.Slug,
            BrandName: product.Brand?.Name ?? "Unknown Brand",
            CategoryName: product.Category?.Name ?? "General Skincare",
            PriceUsd: product.PriceUsd,
            VolumeMl: product.VolumeMl,
            Description: product.Description,
            ImageUrl: product.ImageUrl,
            IngredientListRaw: product.IngredientListRaw,
            Rating: Math.Round(rating, 1),
            ReviewsCount: product.Reviews.Count,
            TargetSkinTypes: product.TargetSkinTypes ?? Array.Empty<string>(),
            StockQuantity: product.StockQuantity,
            Ingredients: ingredientsDto,
            SuitabilityScore: matchResult.SuitabilityScore,
            HasAllergyWarning: matchResult.HasAllergyWarning,
            MatchedAllergen: matchResult.MatchedAllergen
        );
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _productRepository.GetCategoriesAsync(cancellationToken);
        return categories.Select(c => new CategoryDto(
            Id: c.Id,
            Name: c.Name,
            Slug: c.Slug,
            ParentId: c.ParentId
        )).ToList();
    }

    public async Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken cancellationToken = default)
    {
        var brands = await _productRepository.GetBrandsAsync(cancellationToken);
        return brands.Select(b => new BrandDto(
            Id: b.Id,
            Name: b.Name,
            Slug: b.Slug,
            OriginCountry: b.OriginCountry
        )).ToList();
    }
}
