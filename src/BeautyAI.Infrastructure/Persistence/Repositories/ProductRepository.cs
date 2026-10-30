using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly BeautyAIDbContext _context;

    public ProductRepository(BeautyAIDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetProductsAsync(
        ProductFilterParams filter,
        IEnumerable<string>? allergyBlacklist,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .AsNoTracking();

        // 1. Text Search (Query)
        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var q = filter.Query.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(q) ||
                (p.Brand != null && p.Brand.Name.ToLower().Contains(q)) ||
                (p.Description != null && p.Description.ToLower().Contains(q)));
        }

        // 2. Category Filter
        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            var cat = filter.Category.Trim();
            query = query.Where(p =>
                p.Department == cat ||
                (p.Category != null && (
                    p.Category.Name == cat ||
                    p.Category.Slug == cat ||
                    (p.Category.Parent != null && (p.Category.Parent.Name == cat || p.Category.Parent.Slug == cat))
                )));
        }

        // 3. Brand Filter
        if (!string.IsNullOrWhiteSpace(filter.Brand))
        {
            var b = filter.Brand.Trim();
            query = query.Where(p => p.Brand != null && (p.Brand.Name == b || p.Brand.Slug == b));
        }

        // 4. Skin Type Filter
        if (!string.IsNullOrWhiteSpace(filter.SkinType) &&
            !string.Equals(filter.SkinType, "All", StringComparison.OrdinalIgnoreCase))
        {
            var st = filter.SkinType.Trim();
            query = query.Where(p =>
                p.TargetSkinTypes.Contains(st) ||
                p.TargetSkinTypes.Contains("All"));
        }

        // 5. Price Range
        if (filter.MinPrice.HasValue && filter.MinPrice.Value > 0)
        {
            query = query.Where(p => p.PriceUsd >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue && filter.MaxPrice.Value < 500)
        {
            query = query.Where(p => p.PriceUsd <= filter.MaxPrice.Value);
        }

        // 6. Safe For Me: Zero-Tolerance Allergy Blacklist Exclusion + Group B Unverified Cosmetic Exclusion
        if (filter.SafeForMe || allergyBlacklist != null)
        {
            // Exclude Group B cosmetics that lack manufacturer INCI data (keep Group A Tools & Brushes)
            query = query.Where(p =>
                p.Department == "Tools & Brushes" ||
                (!string.IsNullOrEmpty(p.IngredientListRaw) && p.IngredientListRaw != "No ingredients listed"));

            var allergens = CosmeticKnowledgeBase.ExpandAllergyBlacklist(allergyBlacklist)
                .Select(a => a.ToLower())
                .Distinct()
                .ToList();

            if (allergens.Count > 0)
            {
                // Exclude products that contain any allergen in product_ingredients -> ingredient.inci_name
                query = query.Where(p => !p.ProductIngredients.Any(pi =>
                    pi.Ingredient != null && allergens.Contains(pi.Ingredient.InciName.ToLower())));

                // Also exclude products where raw ingredient string contains the allergen name
                foreach (var allergen in allergens)
                {
                    query = query.Where(p => !p.IngredientListRaw.ToLower().Contains(allergen));
                }
            }
        }

        // 7. Sorting
        query = (filter.SortBy?.ToLower()) switch
        {
            "price_asc" => query.OrderBy(p => p.PriceUsd),
            "price_desc" => query.OrderByDescending(p => p.PriceUsd),
            "reviews" => query.OrderByDescending(p => p.Reviews.Count),
            "loves" => query.OrderByDescending(p => p.Reviews.Count),
            _ => query.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 5.0)
                      .ThenByDescending(p => p.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Product?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Product?> GetProductByCodeOrSlugAsync(string codeOrSlug, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
                .ThenInclude(c => c!.Parent)
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == codeOrSlug || p.Slug == codeOrSlug, cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Brand>> GetBrandsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Brands
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetSimilarProductsAsync(
        int productId,
        int categoryId,
        IEnumerable<string>? allergyBlacklist,
        int limit = 6,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.Id != productId && p.CategoryId == categoryId);

        if (allergyBlacklist != null && allergyBlacklist.Any())
        {
            query = query.Where(p =>
                p.Department == "Tools & Brushes" ||
                (!string.IsNullOrEmpty(p.IngredientListRaw) && p.IngredientListRaw != "No ingredients listed"));

            var allergens = CosmeticKnowledgeBase.ExpandAllergyBlacklist(allergyBlacklist)
                .Select(a => a.ToLower())
                .Distinct()
                .ToList();

            if (allergens.Any())
            {
                query = query.Where(p => !p.ProductIngredients.Any(pi =>
                    pi.Ingredient != null && allergens.Contains(pi.Ingredient.InciName.ToLower())));

                foreach (var allergen in allergens)
                {
                    query = query.Where(p => !p.IngredientListRaw.ToLower().Contains(allergen));
                }
            }
        }

        return await query
            .OrderByDescending(p => p.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<(decimal AverageRating, int ReviewsCount)> GetProductReviewStatsAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _context.Reviews
            .Where(r => r.ProductId == productId)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        if (reviews.Count == 0)
            return (5.0m, 0);

        var avg = (decimal)reviews.Average();
        return (Math.Round(avg, 1), reviews.Count);
    }

    public async Task<Dictionary<int, (decimal AverageRating, int ReviewsCount)>> GetProductsReviewStatsAsync(
        IEnumerable<int> productIds,
        CancellationToken cancellationToken = default)
    {
        var ids = productIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<int, (decimal AverageRating, int ReviewsCount)>();

        var stats = await _context.Reviews
            .Where(r => ids.Contains(r.ProductId))
            .GroupBy(r => r.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                AvgRating = (decimal)g.Average(r => r.Rating),
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        return stats.ToDictionary(
            s => s.ProductId,
            s => (Math.Round(s.AvgRating, 1), s.Count));
    }

    public async Task<(IReadOnlyList<Review> Items, int TotalCount)> GetProductReviewsAsync(
        int productId,
        string? skinType = null,
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId);

        if (!string.IsNullOrWhiteSpace(skinType) &&
            !string.Equals(skinType, "All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.SkinType.ToLower() == skinType.Trim().ToLower());
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var validPage = Math.Max(1, page);
        var validPageSize = Math.Clamp(pageSize, 1, 50);

        var items = await query
            .OrderByDescending(r => r.Id)
            .Skip((validPage - 1) * validPageSize)
            .Take(validPageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
