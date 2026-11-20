using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using Xunit;

namespace BeautyAI.UnitTests;

public class AdminProductServiceTests
{
    private class FakeAdminProductRepository : IProductRepository
    {
        public readonly List<Product> Products = new();
        public readonly List<Brand> Brands = new()
        {
            new() { Id = 1, Name = "BeautyAI", Slug = "beautyai" },
            new() { Id = 2, Name = "The Ordinary", Slug = "the-ordinary" }
        };
        public readonly List<Category> Categories = new()
        {
            new() { Id = 1, Name = "Moisturizer", Slug = "moisturizer" },
            new() { Id = 2, Name = "Serum", Slug = "serum" },
            new() { Id = 3, Name = "Cleanser", Slug = "cleanser" }
        };
        public readonly List<Review> Reviews = new();
        public readonly Dictionary<int, List<string>> SyncedIngredientsByProduct = new();
        public int SyncCallCount { get; private set; }

        public Task<(IReadOnlyList<Product> Items, int TotalCount)> GetProductsAsync(
            ProductFilterParams filter,
            IEnumerable<string>? allergyBlacklist,
            CancellationToken cancellationToken = default)
        {
            var active = Products.Where(p => p.SellingStatus == "Active").ToList();
            return Task.FromResult(((IReadOnlyList<Product>)active, active.Count));
        }

        public Task<Product?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.FirstOrDefault(p => p.Id == id && p.SellingStatus == "Active"));

        public Task<Product?> GetProductByCodeOrSlugAsync(string codeOrSlug, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.FirstOrDefault(p =>
                (p.Code == codeOrSlug || p.Slug == codeOrSlug) && p.SellingStatus == "Active"));

        public Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((IReadOnlyList<Category>)Categories);

        public Task<IReadOnlyList<Brand>> GetBrandsAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((IReadOnlyList<Brand>)Brands);

        public Task<IReadOnlyList<Product>> GetSimilarProductsAsync(
            int productId,
            int categoryId,
            IEnumerable<string>? allergyBlacklist,
            int limit = 6,
            CancellationToken cancellationToken = default)
        {
            var items = Products
                .Where(p => p.Id != productId && p.CategoryId == categoryId && p.SellingStatus == "Active")
                .Take(limit)
                .ToList();
            return Task.FromResult((IReadOnlyList<Product>)items);
        }

        public Task<(decimal AverageRating, int ReviewsCount)> GetProductReviewStatsAsync(
            int productId,
            CancellationToken cancellationToken = default)
        {
            var count = Reviews.Count(r => r.ProductId == productId);
            return Task.FromResult((5.0m, count));
        }

        public Task<Dictionary<int, (decimal AverageRating, int ReviewsCount)>> GetProductsReviewStatsAsync(
            IEnumerable<int> productIds,
            CancellationToken cancellationToken = default)
        {
            var dict = productIds.Distinct().ToDictionary(
                id => id,
                id => (5.0m, Reviews.Count(r => r.ProductId == id)));
            return Task.FromResult(dict);
        }

        public Task<(IReadOnlyList<Review> Items, int TotalCount)> GetProductReviewsAsync(
            int productId,
            string? skinType = null,
            int page = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            var list = Reviews.Where(r => r.ProductId == productId).ToList();
            return Task.FromResult(((IReadOnlyList<Review>)list, list.Count));
        }

        public Task<Review> AddReviewAsync(Review review, CancellationToken cancellationToken = default)
        {
            review.Id = Reviews.Count + 1;
            Reviews.Add(review);
            return Task.FromResult(review);
        }

        public Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default)
        {
            product.Id = Products.Count == 0 ? 1 : Products.Max(p => p.Id) + 1;
            product.Brand = Brands.FirstOrDefault(b => b.Id == product.BrandId);
            product.Category = Categories.FirstOrDefault(c => c.Id == product.CategoryId);
            Products.Add(product);
            return Task.FromResult(product);
        }

        public Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAdminProductsAsync(
            AdminProductFilterParams filter,
            CancellationToken cancellationToken = default)
        {
            var query = Products.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(filter.Query))
            {
                var q = filter.Query.Trim().ToLowerInvariant();
                query = query.Where(p =>
                    p.Name.ToLowerInvariant().Contains(q) ||
                    p.Code.ToLowerInvariant().Contains(q) ||
                    (p.Brand != null && p.Brand.Name.ToLowerInvariant().Contains(q)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Brand))
            {
                var b = filter.Brand.Trim();
                query = query.Where(p => p.Brand != null &&
                    (p.Brand.Name.Equals(b, StringComparison.OrdinalIgnoreCase) ||
                     p.Brand.Slug.Equals(b, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Category))
            {
                var c = filter.Category.Trim();
                query = query.Where(p => p.Category != null &&
                    (p.Category.Name.Equals(c, StringComparison.OrdinalIgnoreCase) ||
                     p.Category.Slug.Equals(c, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Status) &&
                !filter.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var st = filter.Status.Trim();
                query = query.Where(p => p.SellingStatus.Equals(st, StringComparison.OrdinalIgnoreCase));
            }

            var ordered = query.OrderByDescending(p => p.Id).ToList();
            var page = Math.Max(1, filter.Page);
            var pageSize = Math.Clamp(filter.PageSize, 1, 100);
            var paged = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return Task.FromResult(((IReadOnlyList<Product>)paged, ordered.Count));
        }

        public Task<Product?> GetAdminProductByIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.FirstOrDefault(p => p.Id == id));

        public Task<bool> SlugExistsAsync(string slug, int? excludeProductId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.Any(p =>
                p.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase) &&
                (!excludeProductId.HasValue || p.Id != excludeProductId.Value)));

        public Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default)
        {
            product.Brand = Brands.FirstOrDefault(b => b.Id == product.BrandId);
            product.Category = Categories.FirstOrDefault(c => c.Id == product.CategoryId);
            return Task.FromResult(product);
        }

        public Task SyncProductIngredientsAsync(int productId, string ingredientListRaw, CancellationToken cancellationToken = default)
        {
            SyncCallCount++;
            var tokens = ingredientListRaw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
            SyncedIngredientsByProduct[productId] = tokens;
            return Task.CompletedTask;
        }

        public Task<AdminAnalyticsDto> GetAdminAnalyticsAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(new AdminAnalyticsDto(
                TotalProducts: Products.Count,
                TotalBrands: Brands.Count,
                TotalReviews: Reviews.Count,
                AverageRating: 5.0m,
                CategoryDistribution: new Dictionary<string, int>(),
                BrandDistribution: new Dictionary<string, int>(),
                PriceRangeDistribution: new Dictionary<string, int>(),
                RatingDistribution: new Dictionary<string, int>(),
                TopProducts: Array.Empty<AdminTopProductDto>()
            ));
    }

    [Fact]
    public async Task GetProductsAsync_ReturnsAllStatuses_AndFiltersByStatusAndQuery()
    {
        // TC-ADM-CRUD-01 (AC-ADM-02-05)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Active Barrier Cream",
            BrandName: "BeautyAI",
            CategoryName: "Moisturizer",
            PriceUsd: 32m,
            IngredientListRaw: "Water, Glycerin, Ceramide NP",
            SellingStatus: "Active"
        ));
        var second = await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Retired Niacinamide Drop",
            BrandName: "The Ordinary",
            CategoryName: "Serum",
            PriceUsd: 18m,
            IngredientListRaw: "Water, Niacinamide, Zinc PCA"
        ));
        await service.DiscontinueProductAsync(second.Id);

        var all = await service.GetProductsAsync(new AdminProductFilterParams(Page: 1, PageSize: 10));
        Assert.Equal(2, all.Total);

        var onlyDiscontinued = await service.GetProductsAsync(
            new AdminProductFilterParams(Status: "Discontinued", Page: 1, PageSize: 10));
        Assert.Single(onlyDiscontinued.Items);
        Assert.Equal("Discontinued", onlyDiscontinued.Items[0].SellingStatus);

        var search = await service.GetProductsAsync(
            new AdminProductFilterParams(Query: "Barrier", Page: 1, PageSize: 10));
        Assert.Single(search.Items);
        Assert.Equal("Active Barrier Cream", search.Items[0].Name);
    }

    [Fact]
    public async Task CreateProductAsync_ValidInput_CreatesUniqueSlugAndSyncsIngredients()
    {
        // TC-ADM-CRUD-02 (AC-ADM-02-06)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        var first = await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Hydra Repair Gel",
            BrandName: "BeautyAI",
            CategoryName: "Moisturizer",
            PriceUsd: 29.50m,
            IngredientListRaw: "Water, Glycerin, Panthenol",
            TargetSkinTypes: new[] { "Oily", "Combination" },
            Description: "Lightweight gel moisturizer",
            ImageUrl: "/images/products/custom.webp",
            StockQuantity: 45,
            VolumeMl: 50
        ));

        var duplicateName = await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Hydra Repair Gel",
            BrandName: "BeautyAI",
            CategoryName: "Moisturizer",
            PriceUsd: 31.00m,
            IngredientListRaw: "Water, Glycerin, Hyaluronic Acid"
        ));

        Assert.Equal("hydra-repair-gel", first.Slug);
        Assert.NotEqual(first.Slug, duplicateName.Slug);
        Assert.Equal("Active", first.SellingStatus);
        Assert.Equal(45, first.StockQuantity);
        Assert.Equal(50, first.VolumeMl);
        Assert.Equal(2, repo.SyncCallCount);
        Assert.Contains("Panthenol", repo.SyncedIngredientsByProduct[first.Id]);
    }

    [Theory]
    [InlineData("", "BeautyAI", "Moisturizer", 25, 10, "Water, Glycerin")]
    [InlineData("Valid Name", "BeautyAI", "Moisturizer", 0, 10, "Water, Glycerin")]
    [InlineData("Valid Name", "BeautyAI", "Moisturizer", -5, 10, "Water, Glycerin")]
    [InlineData("Valid Name", "BeautyAI", "Moisturizer", 25, -1, "Water, Glycerin")]
    [InlineData("Valid Name", "BeautyAI", "Moisturizer", 25, 10, "")]
    [InlineData("Valid Name", "UnknownBrandXYZ", "Moisturizer", 25, 10, "Water, Glycerin")]
    [InlineData("Valid Name", "BeautyAI", "UnknownCategoryXYZ", 25, 10, "Water, Glycerin")]
    public async Task CreateProductAsync_InvalidInputOrUnknownBrandCategory_ThrowsArgumentException(
        string name,
        string brandName,
        string categoryName,
        decimal price,
        int stock,
        string inci)
    {
        // TC-ADM-CRUD-03 (AC-ADM-02-07) — No silent fallback for unknown brand/category
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        var req = new CreateProductAdminRequest(
            Name: name,
            BrandName: brandName,
            CategoryName: categoryName,
            PriceUsd: price,
            IngredientListRaw: inci,
            StockQuantity: stock
        );

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateProductAsync(req));
    }

    [Fact]
    public async Task CreateProductAsync_InvalidSkinType_ThrowsArgumentException()
    {
        // TC-ADM-CRUD-03 (AC-ADM-02-07)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        var req = new CreateProductAdminRequest(
            Name: "Test Serum",
            BrandName: "BeautyAI",
            CategoryName: "Serum",
            PriceUsd: 25m,
            IngredientListRaw: "Water, Niacinamide",
            TargetSkinTypes: new[] { "InvalidSkinType" }
        );

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateProductAsync(req));
    }

    [Fact]
    public async Task UpdateProductAsync_UpdatesFields_SetsUpdatedAt_AndOnlyResyncsInciWhenChanged()
    {
        // TC-ADM-CRUD-04 & TC-ADM-CRUD-05 (AC-ADM-02-08, AC-ADM-02-09)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        var created = await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Original Serum",
            BrandName: "BeautyAI",
            CategoryName: "Serum",
            PriceUsd: 30m,
            IngredientListRaw: "Water, Niacinamide",
            StockQuantity: 100
        ));
        Assert.Equal(1, repo.SyncCallCount);

        // Simulate a historical order snapshot before price change (BR-ORDER-05)
        var historicalOrderItem = new OrderItem
        {
            ProductId = created.Id,
            Quantity = 1,
            UnitPriceUsd = created.PriceUsd,
            TotalPriceUsd = created.PriceUsd
        };

        // 1. Update price & stock without changing INCI -> SyncCallCount remains 1
        var updatedSameInci = await service.UpdateProductAsync(created.Id, new UpdateProductAdminRequest(
            Name: "Original Serum v2",
            BrandName: "The Ordinary",
            CategoryName: "Serum",
            PriceUsd: 45m,
            IngredientListRaw: "Water, Niacinamide",
            TargetSkinTypes: new[] { "Oily", "Sensitive" },
            Description: "Updated formula note",
            ImageUrl: "/images/products/v2.webp",
            StockQuantity: 60,
            VolumeMl: 30,
            SellingStatus: "Active"
        ));

        Assert.Equal("Original Serum v2", updatedSameInci.Name);
        Assert.Equal("The Ordinary", updatedSameInci.BrandName);
        Assert.Equal(45m, updatedSameInci.PriceUsd);
        Assert.Equal(60, updatedSameInci.StockQuantity);
        Assert.NotNull(updatedSameInci.UpdatedAtUtc);
        Assert.Equal(30m, historicalOrderItem.UnitPriceUsd); // Historical order snapshot unaffected
        Assert.Equal(1, repo.SyncCallCount);

        // 2. Update INCI string -> triggers SyncProductIngredientsAsync (SyncCallCount becomes 2)
        var updatedNewInci = await service.UpdateProductAsync(created.Id, new UpdateProductAdminRequest(
            Name: "Original Serum v2",
            BrandName: "The Ordinary",
            CategoryName: "Serum",
            PriceUsd: 45m,
            IngredientListRaw: "Water, Niacinamide, Zinc PCA, Panthenol",
            TargetSkinTypes: new[] { "Oily", "Sensitive" },
            Description: "Updated formula note",
            ImageUrl: "/images/products/v2.webp",
            StockQuantity: 60,
            VolumeMl: 30,
            SellingStatus: "Active"
        ));

        Assert.Equal(2, repo.SyncCallCount);
        Assert.Contains("Zinc PCA", repo.SyncedIngredientsByProduct[created.Id]);
        Assert.Equal("Water, Niacinamide, Zinc PCA, Panthenol", updatedNewInci.IngredientListRaw);
    }

    [Fact]
    public async Task DiscontinueAndRestoreProductAsync_SoftDeletesAndRestoresWhilePreservingReviews()
    {
        // TC-ADM-CRUD-06 & TC-ADM-CRUD-07 (AC-ADM-02-10, AC-ADM-02-11)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        var created = await service.CreateProductAsync(new CreateProductAdminRequest(
            Name: "Seasonal Cleanser",
            BrandName: "BeautyAI",
            CategoryName: "Cleanser",
            PriceUsd: 22m,
            IngredientListRaw: "Water, Glycerin, Coco-Glucoside"
        ));

        await repo.AddReviewAsync(new Review
        {
            ProductId = created.Id,
            AuthorName = "Linh",
            Rating = 5,
            SkinType = "Dry",
            Content = "Great cleanser"
        });

        // Discontinue (logical delete)
        var discontinued = await service.DiscontinueProductAsync(created.Id);
        Assert.True(discontinued);

        // Hidden from customer catalog & customer detail
        var customerVisible = await repo.GetProductByIdAsync(created.Id);
        Assert.Null(customerVisible);

        // Still visible in Admin with reviews intact
        var adminView = await service.GetProductByIdAsync(created.Id);
        Assert.NotNull(adminView);
        Assert.Equal("Discontinued", adminView!.SellingStatus);
        Assert.Equal(1, adminView.ReviewsCount);

        // Restore brings the exact same product ID back to Active
        var restored = await service.RestoreProductAsync(created.Id);
        Assert.Equal(created.Id, restored.Id);
        Assert.Equal("Active", restored.SellingStatus);
        Assert.NotNull(await repo.GetProductByIdAsync(created.Id));
    }

    [Fact]
    public async Task NonExistentProduct_ReturnsNullOrThrowsKeyNotFoundException()
    {
        // TC-ADM-CRUD-08 (AC-ADM-02-12)
        var repo = new FakeAdminProductRepository();
        var service = new AdminProductService(repo);

        Assert.Null(await service.GetProductByIdAsync(9999));
        Assert.False(await service.DiscontinueProductAsync(9999));
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateProductAsync(9999, new UpdateProductAdminRequest(
                Name: "Ghost",
                BrandName: "BeautyAI",
                CategoryName: "Serum",
                PriceUsd: 20m,
                IngredientListRaw: "Water, Glycerin"
            )));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.RestoreProductAsync(9999));
    }
}
