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
    private readonly IProductCache? _productCache;

    public ProductService(
        IProductRepository productRepository,
        ISkinProfileRepository skinProfileRepository,
        IProductCache? productCache = null)
    {
        _productRepository = productRepository;
        _skinProfileRepository = skinProfileRepository;
        _productCache = productCache;
    }

    private async Task<Product?> ResolveStaticProductAsync(string idOrCodeOrSlug, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idOrCodeOrSlug))
            return null;

        var key = idOrCodeOrSlug.Trim();
        if (_productCache != null && _productCache.TryGetProduct(key, out var cached) && cached != null)
        {
            return cached;
        }

        Product? product = null;
        if (int.TryParse(key, out var id))
        {
            product = await _productRepository.GetProductByIdAsync(id, cancellationToken);
        }
        product ??= await _productRepository.GetProductByCodeOrSlugAsync(key, cancellationToken);

        if (product != null)
        {
            _productCache?.SetProduct(product, key);
        }

        return product;
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
        var filteringBlacklist = filter.SafeForMe ? (allergyNames ?? new List<string>()) : null;

        var (items, totalCount) = await _productRepository.GetProductsAsync(
            filter,
            filteringBlacklist,
            cancellationToken);

        var summaryItems = items.Select(p =>
        {
            var matchResult = SuitabilityScoreCalculator.Calculate(p, skinProfile, allergyNames);
            decimal? rating = p.ReviewsCount > 0 ? p.AvgRating : null;

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
                Rating: rating,
                ReviewsCount: p.ReviewsCount,
                TargetSkinTypes: p.TargetSkinTypes ?? Array.Empty<string>(),
                SuitabilityVerdict: matchResult.Verdict,
                SuitabilityLabel: matchResult.VerdictLabel,
                HasAllergyWarning: matchResult.HasAllergyWarning,
                MatchedAllergen: matchResult.MatchedAllergen,
                SuitabilityReason: matchResult.MatchReason,
                HasIngredients: matchResult.HasIngredients,
                IsNonCosmeticTool: matchResult.IsNonCosmeticTool,
                Department: p.Department ?? "Skincare",
                SizeDisplay: p.SizeDisplay,
                LovesCount: p.LovesCount
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
        var product = await ResolveStaticProductAsync(idOrCodeOrSlug, cancellationToken);
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

        var dbIngMap = product.ProductIngredients?
            .Where(pi => pi.Ingredient != null && !string.IsNullOrWhiteSpace(pi.Ingredient.InciName))
            .GroupBy(pi => pi.Ingredient!.InciName.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First().Ingredient!, StringComparer.OrdinalIgnoreCase);

        var effectiveRawInci = !string.IsNullOrWhiteSpace(product.IngredientListRaw) &&
                               !string.Equals(product.IngredientListRaw, "No ingredients listed", StringComparison.OrdinalIgnoreCase)
            ? product.IngredientListRaw
            : (ingredientsDto.Count > 0 ? string.Join(", ", ingredientsDto.Select(i => i.InciName)) : "");

        var breakdownDomain = CosmeticKnowledgeBase.AnalyzeFormula(
            rawIngredientsText: effectiveRawInci,
            productName: product.Name,
            department: product.Department ?? "Skincare",
            categoryName: product.Category?.Name ?? "Skincare",
            explicitTargetArea: null,
            skinProfile: skinProfile,
            userAllergies: allergyNames,
            targetSkinTypes: product.TargetSkinTypes,
            dbIngredientMap: dbIngMap
        );

        var formulaBreakdownDto = new ProductFormulaBreakdownDto(
            TargetArea: breakdownDomain.TargetArea,
            BenefitsTitle: breakdownDomain.BenefitsTitle,
            Benefits: breakdownDomain.Benefits,
            KeyIngredients: breakdownDomain.KeyIngredients
                .Select(k => new KeyIngredientDto(k.CommonName, k.InciName, k.RoleLabel, k.Explanation, k.IsFeaturedInProductName))
                .ToList(),
            FunctionalGroups: breakdownDomain.FunctionalGroups
                .Select(g => new FunctionalGroupDto(g.GroupTitle, g.PlainExplanation, g.Count, g.Ingredients))
                .ToList(),
            Cautions: breakdownDomain.Cautions
                .Select(c => new FormulaCautionDto(c.Type, c.Title, c.Message, c.IngredientsInvolved))
                .ToList(),
            FragranceDisclosure: breakdownDomain.FragranceDisclosure,
            TotalIngredientsCount: breakdownDomain.TotalIngredientsCount,
            RawInciList: breakdownDomain.RawInciTokens,
            MayContainList: breakdownDomain.MayContainTokens
        );

        var (rating, reviewsCount, ratingDistribution) = await _productRepository.GetProductReviewStatsAsync(product.Id, cancellationToken);

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
            IngredientListRaw: effectiveRawInci,
            Rating: rating,
            ReviewsCount: reviewsCount,
            TargetSkinTypes: product.TargetSkinTypes ?? Array.Empty<string>(),
            StockQuantity: product.StockQuantity,
            Ingredients: ingredientsDto,
            SuitabilityVerdict: matchResult.Verdict,
            SuitabilityLabel: matchResult.VerdictLabel,
            HasAllergyWarning: matchResult.HasAllergyWarning,
            MatchedAllergen: matchResult.MatchedAllergen,
            SuitabilityReason: matchResult.MatchReason,
            HasIngredients: matchResult.HasIngredients,
            IsNonCosmeticTool: matchResult.IsNonCosmeticTool,
            Department: product.Department ?? "Skincare",
            FormulaBreakdown: formulaBreakdownDto,
            SizeDisplay: product.SizeDisplay,
            LovesCount: product.LovesCount,
            RatingDistribution: ratingDistribution
        );
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetSimilarProductsAsync(
        string idOrCodeOrSlug,
        int? currentUserId = null,
        int limit = 6,
        CancellationToken cancellationToken = default)
    {
        var product = await ResolveStaticProductAsync(idOrCodeOrSlug, cancellationToken);
        if (product == null)
            return Array.Empty<ProductSummaryDto>();

        SkinProfile? skinProfile = null;
        List<string>? allergyNames = null;

        if (currentUserId.HasValue)
        {
            skinProfile = await _skinProfileRepository.GetByUserIdAsync(currentUserId.Value, cancellationToken);
            var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(currentUserId.Value, cancellationToken);
            allergyNames = allergies.Select(a => a.IngredientName).ToList();
        }

        var similarProducts = await _productRepository.GetSimilarProductsAsync(
            product.Id,
            product.CategoryId,
            allergyNames,
            limit,
            cancellationToken);

        return similarProducts.Select(p =>
        {
            var match = SuitabilityScoreCalculator.Calculate(p, skinProfile, allergyNames);
            decimal? rating = p.ReviewsCount > 0 ? p.AvgRating : null;

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
                Rating: rating,
                ReviewsCount: p.ReviewsCount,
                TargetSkinTypes: p.TargetSkinTypes ?? Array.Empty<string>(),
                SuitabilityVerdict: match.Verdict,
                SuitabilityLabel: match.VerdictLabel,
                HasAllergyWarning: match.HasAllergyWarning,
                MatchedAllergen: match.MatchedAllergen,
                SuitabilityReason: match.MatchReason,
                HasIngredients: match.HasIngredients,
                IsNonCosmeticTool: match.IsNonCosmeticTool,
                Department: p.Department ?? "Skincare",
                SizeDisplay: p.SizeDisplay,
                LovesCount: p.LovesCount
            );
        }).ToList();
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        if (_productCache != null && _productCache.TryGetCategories(out var cached) && cached != null && cached.Count > 0)
            return cached;

        var categories = await _productRepository.GetCategoriesAsync(cancellationToken);
        var result = categories.Select(c => new CategoryDto(
            Id: c.Id,
            Name: c.Name,
            Slug: c.Slug,
            ParentId: c.ParentId
        )).ToList();

        if (result.Count > 0)
            _productCache?.SetCategories(result);

        return result;
    }

    public async Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken cancellationToken = default)
    {
        if (_productCache != null && _productCache.TryGetBrands(out var cached) && cached != null && cached.Count > 0)
            return cached;

        var brands = await _productRepository.GetBrandsAsync(cancellationToken);
        var result = brands.Select(b => new BrandDto(
            Id: b.Id,
            Name: b.Name,
            Slug: b.Slug,
            OriginCountry: b.OriginCountry
        )).ToList();

        if (result.Count > 0)
            _productCache?.SetBrands(result);

        return result;
    }

    public async Task<PagedResult<ProductReviewDto>> GetProductReviewsAsync(
        string idOrCodeOrSlug,
        string? skinType = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        int productId = 0;
        if (int.TryParse(idOrCodeOrSlug, out var parsedId))
        {
            productId = parsedId;
        }
        else
        {
            var product = await _productRepository.GetProductByCodeOrSlugAsync(idOrCodeOrSlug, cancellationToken);
            if (product != null)
                productId = product.Id;
        }

        if (productId <= 0)
        {
            return new PagedResult<ProductReviewDto>(
                Items: Array.Empty<ProductReviewDto>(),
                Total: 0,
                Page: page,
                PageSize: pageSize,
                Pages: 0
            );
        }

        var (items, totalCount) = await _productRepository.GetProductReviewsAsync(
            productId,
            skinType,
            page,
            pageSize,
            cancellationToken);

        var dtos = items.Select(r => new ProductReviewDto(
            Id: r.Id,
            ProductId: r.ProductId,
            AuthorName: r.AuthorName,
            Rating: r.Rating,
            SkinType: r.SkinType,
            SkinConcerns: r.SkinConcerns,
            Content: r.Content,
            CreatedAt: r.CreatedAtUtc
        )).ToList();

        var validPageSize = pageSize > 0 ? pageSize : 10;
        var pages = (int)Math.Ceiling((double)totalCount / validPageSize);

        return new PagedResult<ProductReviewDto>(
            Items: dtos,
            Total: totalCount,
            Page: page,
            PageSize: validPageSize,
            Pages: pages
        );
    }

    public async Task<ProductReviewDto> AddReviewAsync(
        int? userId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var targetId = request.ProductId;
        if (string.IsNullOrWhiteSpace(targetId))
            throw new ArgumentException("Product ID is required", nameof(request.ProductId));

        Product? product = null;
        if (int.TryParse(targetId, out var parsedId))
        {
            product = await _productRepository.GetProductByIdAsync(parsedId, cancellationToken);
        }
        if (product == null)
        {
            product = await _productRepository.GetProductByCodeOrSlugAsync(targetId, cancellationToken);
        }

        if (product == null)
            throw new KeyNotFoundException($"Product with ID/code '{targetId}' not found.");

        var rating = Math.Clamp(request.Rating, 1, 5);
        var content = !string.IsNullOrWhiteSpace(request.Content) ? request.Content : request.ReviewText;
        var authorName = !string.IsNullOrWhiteSpace(request.AuthorName) ? request.AuthorName.Trim() : "BeautyAI Shopper";

        var skinType = "Unknown";
        if (!string.IsNullOrWhiteSpace(request.SkinType))
        {
            var raw = request.SkinType.Trim().ToLowerInvariant();
            if (raw.Contains("oily")) skinType = "Oily";
            else if (raw.Contains("dry")) skinType = "Dry";
            else if (raw.Contains("comb")) skinType = "Combination";
            else if (raw.Contains("norm")) skinType = "Normal";
            else if (raw.Contains("sens")) skinType = "Sensitive";
        }

        var review = new Review
        {
            ProductId = product.Id,
            ProductCode = product.Code,
            UserId = userId,
            AuthorName = authorName,
            Rating = rating,
            SkinType = skinType,
            SkinConcerns = request.SkinConcerns,
            Content = content
        };

        var saved = await _productRepository.AddReviewAsync(review, cancellationToken);

        // Invalidate product cache for this product so review count & rating refresh immediately
        _productCache?.InvalidateProduct(product.Id, product.Code, product.Slug);

        return new ProductReviewDto(
            Id: saved.Id,
            ProductId: saved.ProductId,
            AuthorName: saved.AuthorName,
            Rating: saved.Rating,
            SkinType: saved.SkinType,
            SkinConcerns: saved.SkinConcerns,
            Content: saved.Content,
            CreatedAt: saved.CreatedAtUtc
        );
    }
}
