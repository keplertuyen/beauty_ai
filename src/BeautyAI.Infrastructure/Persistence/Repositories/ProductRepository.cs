using System.Linq.Expressions;
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
            .Where(p => p.SellingStatus == "Active")
            .AsNoTracking();

        // 1. Text Search (Query) — Tokenized multi-word search for Brand, Name, Category, Description
        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var rawQuery = filter.Query.Trim();
            var tokens = rawQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var token in tokens)
            {
                var t = token.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(t) ||
                    (p.Brand != null && p.Brand.Name.ToLower().Contains(t)) ||
                    (p.Category != null && p.Category.Name.ToLower().Contains(t)) ||
                    (p.Description != null && p.Description.ToLower().Contains(t)));
            }
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

        if (filter.MinRating.HasValue && filter.MinRating.Value > 0)
        {
            query = query.Where(p => p.ReviewsCount > 0 && p.AvgRating >= filter.MinRating.Value);
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

        // 6b. Active Ingredients Filter (AND across selected actives, OR across curated INCI synonyms)
        if (!string.IsNullOrWhiteSpace(filter.ActiveIngredients))
        {
            var activeKeys = filter.ActiveIngredients
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (activeKeys.Count > 0)
            {
                // Require verified INCI data (excludes non-cosmetic tools & products without ingredient lists)
                query = query.Where(p =>
                    !string.IsNullOrEmpty(p.IngredientListRaw) &&
                    p.IngredientListRaw != "No ingredients listed");

                foreach (var activeKey in activeKeys)
                {
                    var terms = CosmeticKnowledgeBase.ExpandActiveIngredientTerms(activeKey);
                    if (terms.Count > 0)
                    {
                        query = query.Where(BuildIngredientContainsAnyExpression(terms));
                    }
                }
            }
        }

        // 6c. Free-From Claims Filter (excludes forbidden INCI synonyms & products lacking INCI data)
        if (!string.IsNullOrWhiteSpace(filter.FreeFrom))
        {
            var freeFromKeys = filter.FreeFrom
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var excludedTerms = freeFromKeys
                .SelectMany(CosmeticKnowledgeBase.ExpandFreeFromTerms)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (excludedTerms.Count > 0)
            {
                query = query.Where(p =>
                    !string.IsNullOrEmpty(p.IngredientListRaw) &&
                    p.IngredientListRaw != "No ingredients listed");

                foreach (var term in excludedTerms)
                {
                    var t = term;
                    query = query.Where(p => !p.IngredientListRaw.ToLower().Contains(t));
                }
            }
        }

        // 6d. Clean Claims / Highlights Filter (AND across selected claims matched in description)
        if (!string.IsNullOrWhiteSpace(filter.HighlightsFilter))
        {
            var highlights = filter.HighlightsFilter
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var highlight in highlights)
            {
                var hl = highlight.ToLower();
                query = query.Where(p => p.Description != null && p.Description.ToLower().Contains(hl));
            }
        }

        // 7. Sorting — Uses direct columns (avg_rating, reviews_count, loves_count) with zero subqueries!
        //    Products with 0 reviews (AvgRating == null) are ordered AFTER reviewed products in Top Rated.
        query = (filter.SortBy?.ToLower()) switch
        {
            "price_asc" => query.OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                                .ThenBy(p => p.PriceUsd)
                                .ThenByDescending(p => p.LovesCount),
            "price_desc" => query.OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                                 .ThenByDescending(p => p.PriceUsd)
                                 .ThenByDescending(p => p.LovesCount),
            "reviews" => query.OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                              .ThenByDescending(p => p.ReviewsCount)
                              .ThenByDescending(p => p.LovesCount),
            "loves" => query.OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                            .ThenByDescending(p => p.LovesCount)
                            .ThenByDescending(p => p.ReviewsCount),
            _ => query.OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                      .ThenByDescending(p => p.ReviewsCount > 0)
                      .ThenByDescending(p => p.AvgRating ?? 0m)
                      .ThenByDescending(p => p.ReviewsCount)
                      .ThenByDescending(p => p.LovesCount)
                      .ThenBy(p => p.Id)
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

    private static Expression<Func<Product, bool>> BuildIngredientContainsAnyExpression(IReadOnlyList<string> lowerTerms)
    {
        var param = Expression.Parameter(typeof(Product), "p");
        var prop = Expression.Property(param, nameof(Product.IngredientListRaw));
        var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
        var containsMethod = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
        var toLower = Expression.Call(prop, toLowerMethod);

        Expression? body = null;
        foreach (var term in lowerTerms)
        {
            var call = Expression.Call(toLower, containsMethod, Expression.Constant(term));
            body = body == null ? call : Expression.OrElse(body, call);
        }

        return Expression.Lambda<Func<Product, bool>>(body ?? Expression.Constant(true), param);
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
            .FirstOrDefaultAsync(p => p.Id == id && p.SellingStatus == "Active", cancellationToken);
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
            .FirstOrDefaultAsync(
                p => (p.Code == codeOrSlug || p.Slug == codeOrSlug) && p.SellingStatus == "Active",
                cancellationToken);
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
            .Where(p => p.Id != productId && p.CategoryId == categoryId && p.SellingStatus == "Active");

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

        var primaryMatches = await query
            .OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
            .ThenByDescending(p => p.ReviewsCount > 0)
            .ThenByDescending(p => p.LovesCount)
            .ThenByDescending(p => p.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);

        // If the subcategory has fewer verified-image products than requested, prefer verified-image items from the same parent/department
        var verifiedCount = primaryMatches.Count(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"));
        if (verifiedCount < limit && primaryMatches.Count > 0)
        {
            var dept = primaryMatches[0].Department;
            var existingIds = primaryMatches.Select(p => p.Id).Append(productId).ToList();
            var extraVerified = await _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .AsNoTracking()
                .Where(p => !existingIds.Contains(p.Id) &&
                            p.Department == dept &&
                            p.SellingStatus == "Active" &&
                            p.ImageUrl != null &&
                            p.ImageUrl.StartsWith("/images/products/"))
                .OrderByDescending(p => p.ReviewsCount > 0)
                .ThenByDescending(p => p.LovesCount)
                .Take(limit - verifiedCount)
                .ToListAsync(cancellationToken);

            if (extraVerified.Count > 0)
            {
                primaryMatches = primaryMatches
                    .Where(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
                    .Concat(extraVerified)
                    .Concat(primaryMatches.Where(p => p.ImageUrl == null || !p.ImageUrl.StartsWith("/images/products/") ))
                    .Take(limit)
                    .ToList();
            }
        }

        return primaryMatches;
    }

    public async Task<(decimal? AverageRating, int ReviewsCount, IReadOnlyDictionary<int, int> Distribution)> GetProductReviewStatsAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var distribution = new Dictionary<int, int>
        {
            [5] = 0,
            [4] = 0,
            [3] = 0,
            [2] = 0,
            [1] = 0
        };

        var grouped = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && !r.IsHidden)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int totalCount = 0;
        long weightedSum = 0;
        foreach (var g in grouped)
        {
            var star = Math.Clamp(g.Rating, 1, 5);
            distribution[star] = distribution.GetValueOrDefault(star) + g.Count;
            totalCount += g.Count;
            weightedSum += (long)star * g.Count;
        }

        if (totalCount == 0)
            return (null, 0, distribution);

        var avg = Math.Round((decimal)weightedSum / totalCount, 1);
        return (avg, totalCount, distribution);
    }

    public async Task<Dictionary<int, (decimal? AverageRating, int ReviewsCount)>> GetProductsReviewStatsAsync(
        IEnumerable<int> productIds,
        CancellationToken cancellationToken = default)
    {
        var ids = productIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<int, (decimal? AverageRating, int ReviewsCount)>();

        var stats = await _context.Reviews
            .AsNoTracking()
            .Where(r => ids.Contains(r.ProductId) && !r.IsHidden)
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
            s => ((decimal?)Math.Round(s.AvgRating, 1), s.Count));
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
            .Where(r => r.ProductId == productId && !r.IsHidden);

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

    public async Task<Review> AddReviewAsync(Review review, CancellationToken cancellationToken = default)
    {
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        // Keep denormalized avg_rating and reviews_count on products in sync
        var (avg, count, _) = await GetProductReviewStatsAsync(review.ProductId, cancellationToken);
        await _context.Products
            .Where(p => p.Id == review.ProductId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.AvgRating, avg)
                .SetProperty(p => p.ReviewsCount, count),
                cancellationToken);

        return review;
    }

    public async Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAdminProductsAsync(
        AdminProductFilterParams filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Query))
        {
            var rawQuery = filter.Query.Trim();
            var tokens = rawQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var token in tokens)
            {
                var t = token.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(t) ||
                    p.Code.ToLower().Contains(t) ||
                    (p.Brand != null && p.Brand.Name.ToLower().Contains(t)) ||
                    (p.Category != null && p.Category.Name.ToLower().Contains(t)));
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.Category) &&
            !string.Equals(filter.Category, "All", StringComparison.OrdinalIgnoreCase))
        {
            var cat = filter.Category.Trim();
            query = query.Where(p => p.Category != null && (p.Category.Name == cat || p.Category.Slug == cat));
        }

        if (!string.IsNullOrWhiteSpace(filter.Brand) &&
            !string.Equals(filter.Brand, "All", StringComparison.OrdinalIgnoreCase))
        {
            var b = filter.Brand.Trim();
            query = query.Where(p => p.Brand != null && (p.Brand.Name == b || p.Brand.Slug == b));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            !string.Equals(filter.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            var st = filter.Status.Trim();
            query = query.Where(p => p.SellingStatus == st);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(p => p.ImageUrl != null && p.ImageUrl.StartsWith("/images/products/"))
            .ThenByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Product?> GetAdminProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> SlugExistsAsync(string slug, int? excludeProductId = null, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .AnyAsync(
                p => p.Slug == slug && (!excludeProductId.HasValue || p.Id != excludeProductId.Value),
                cancellationToken);
    }

    public async Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task SyncProductIngredientsAsync(int productId, string ingredientListRaw, CancellationToken cancellationToken = default)
    {
        var existingLinks = await _context.ProductIngredients
            .Where(pi => pi.ProductId == productId)
            .ToListAsync(cancellationToken);

        if (existingLinks.Count > 0)
        {
            _context.ProductIngredients.RemoveRange(existingLinks);
        }

        if (string.IsNullOrWhiteSpace(ingredientListRaw))
        {
            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        var tokens = CosmeticKnowledgeBase.SplitInciList(ingredientListRaw);
        if (tokens.Count == 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        var allIngredients = await _context.Ingredients
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var ingredientMap = allIngredients
            .Where(i => !string.IsNullOrWhiteSpace(i.InciName))
            .GroupBy(i => i.InciName.Trim().ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First().Id);

        var addedIngredientIds = new HashSet<int>();
        var position = 1;

        foreach (var rawToken in tokens)
        {
            var key = rawToken.Trim().ToLowerInvariant();
            if (ingredientMap.TryGetValue(key, out var ingredientId) && addedIngredientIds.Add(ingredientId))
            {
                _context.ProductIngredients.Add(new ProductIngredient
                {
                    ProductId = productId,
                    IngredientId = ingredientId,
                    PositionOrder = position
                });
            }
            position++;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<AdminAnalyticsDto> GetAdminAnalyticsAsync(CancellationToken cancellationToken = default)
    {
        var totalProducts = await _context.Products.AsNoTracking().CountAsync(cancellationToken);
        var totalBrands = await _context.Brands.AsNoTracking().CountAsync(cancellationToken);

        // 1. Full catalog category distribution
        var catRows = await _context.Products
            .AsNoTracking()
            .GroupBy(p => p.Category != null ? p.Category.Name : "Skincare")
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var catDist = catRows.ToDictionary(x => x.Category, x => x.Count);

        // 2. Full catalog brand distribution (top 15 brands by real product count)
        var brandRows = await _context.Products
            .AsNoTracking()
            .GroupBy(p => p.Brand != null ? p.Brand.Name : "BeautyAI")
            .Select(g => new { Brand = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(15)
            .ToListAsync(cancellationToken);

        var brandDist = brandRows.ToDictionary(x => x.Brand, x => x.Count);

        // 3. Full catalog price range distribution
        var budgetCount = await _context.Products.AsNoTracking().CountAsync(p => p.PriceUsd < 25m, cancellationToken);
        var midCount = await _context.Products.AsNoTracking().CountAsync(p => p.PriceUsd >= 25m && p.PriceUsd < 50m, cancellationToken);
        var premiumCount = await _context.Products.AsNoTracking().CountAsync(p => p.PriceUsd >= 50m && p.PriceUsd < 100m, cancellationToken);
        var luxuryCount = await _context.Products.AsNoTracking().CountAsync(p => p.PriceUsd >= 100m, cancellationToken);

        var priceDist = new Dictionary<string, int>
        {
            ["Budget (<$25)"] = budgetCount,
            ["Mid-Range ($25-$50)"] = midCount,
            ["Premium ($50-$100)"] = premiumCount,
            ["Luxury (>$100)"] = luxuryCount
        };

        // 4. Real rating distribution across the reviews table
        var ratingRows = await _context.Reviews
            .AsNoTracking()
            .Where(r => !r.IsHidden)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var ratingDist = new Dictionary<string, int>
        {
            ["5"] = 0,
            ["4"] = 0,
            ["3"] = 0,
            ["2"] = 0,
            ["1"] = 0
        };
        long weightedSum = 0;
        int totalReviews = 0;
        foreach (var row in ratingRows)
        {
            var key = Math.Clamp(row.Rating, 1, 5).ToString();
            ratingDist[key] = ratingDist.GetValueOrDefault(key) + row.Count;
            weightedSum += (long)row.Rating * row.Count;
            totalReviews += row.Count;
        }

        decimal avgRating = totalReviews > 0
            ? Math.Round((decimal)weightedSum / totalReviews, 2)
            : 0m;

        // 5. Real Top 10 Products ranked by verified review count & average rating from the reviews table
        var topReviewGroups = await _context.Reviews
            .AsNoTracking()
            .Where(r => !r.IsHidden)
            .GroupBy(r => r.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ReviewsCount = g.Count(),
                AvgRating = g.Average(r => r.Rating)
            })
            .OrderByDescending(x => x.ReviewsCount)
            .ThenByDescending(x => x.AvgRating)
            .Take(10)
            .ToListAsync(cancellationToken);

        var topProductIds = topReviewGroups.Select(x => x.ProductId).ToList();
        var topProductEntities = await _context.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Where(p => topProductIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var topProducts = new List<AdminTopProductDto>();
        foreach (var grp in topReviewGroups)
        {
            if (!topProductEntities.TryGetValue(grp.ProductId, out var p))
                continue;

            topProducts.Add(new AdminTopProductDto(
                ProductId: p.Id,
                Code: p.Code,
                ProductName: p.Name,
                BrandName: p.Brand?.Name ?? "BeautyAI",
                PrimaryCategory: p.Category?.Name ?? "Skincare",
                PriceUsd: p.PriceUsd,
                Rating: Math.Round((decimal)grp.AvgRating, 2),
                ReviewsCount: grp.ReviewsCount,
                SellingStatus: p.SellingStatus,
                ImageUrl: !string.IsNullOrWhiteSpace(p.ImageUrl) ? p.ImageUrl : $"/images/products/{p.Code}.webp"
            ));
        }

        // Fallback if reviews table is empty in a fresh environment
        if (topProducts.Count == 0)
        {
            var fallbackProducts = await _context.Products
                .AsNoTracking()
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .OrderBy(p => p.Id)
                .Take(10)
                .ToListAsync(cancellationToken);

            foreach (var p in fallbackProducts)
            {
                topProducts.Add(new AdminTopProductDto(
                    ProductId: p.Id,
                    Code: p.Code,
                    ProductName: p.Name,
                    BrandName: p.Brand?.Name ?? "BeautyAI",
                    PrimaryCategory: p.Category?.Name ?? "Skincare",
                    PriceUsd: p.PriceUsd,
                    Rating: 0m,
                    ReviewsCount: 0,
                    SellingStatus: p.SellingStatus,
                    ImageUrl: !string.IsNullOrWhiteSpace(p.ImageUrl) ? p.ImageUrl : $"/images/products/{p.Code}.webp"
                ));
            }
        }

        return new AdminAnalyticsDto(
            TotalProducts: totalProducts,
            TotalBrands: totalBrands > 0 ? totalBrands : brandDist.Count,
            TotalReviews: totalReviews,
            AverageRating: avgRating,
            CategoryDistribution: catDist,
            BrandDistribution: brandDist,
            PriceRangeDistribution: priceDist,
            RatingDistribution: ratingDist,
            TopProducts: topProducts
        );
    }
}
