using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Infrastructure.Caching;
using Microsoft.Extensions.Caching.Memory;
using Xunit;

namespace BeautyAI.UnitTests;

public class ProductCacheInvalidationTests
{
    private class StubProductRepository : IProductRepository
    {
        public readonly List<Product> Products = new();
        public readonly List<Brand> Brands = new();
        public readonly List<Category> Categories = new();
        public int GetByIdCalls { get; private set; }
        public int GetBrandsCalls { get; private set; }
        public int GetCategoriesCalls { get; private set; }

        public Task<(IReadOnlyList<Product> Items, int TotalCount)> GetProductsAsync(ProductFilterParams filter, IEnumerable<string>? userAllergies = null, CancellationToken ct = default)
            => Task.FromResult<(IReadOnlyList<Product>, int)>((Products, Products.Count));

        public Task<Product?> GetProductByIdAsync(int id, CancellationToken ct = default)
        {
            GetByIdCalls++;
            return Task.FromResult(Products.FirstOrDefault(p => p.Id == id));
        }

        public Task<Product?> GetProductByCodeOrSlugAsync(string codeOrSlug, CancellationToken ct = default)
            => Task.FromResult(Products.FirstOrDefault(p => p.Code == codeOrSlug || p.Slug == codeOrSlug));

        public Task<IReadOnlyList<Product>> GetSimilarProductsAsync(int productId, int categoryId, IEnumerable<string>? userAllergies = null, int limit = 6, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Product>>(Array.Empty<Product>());

        public Task<(IReadOnlyList<Review> Items, int TotalCount)> GetProductReviewsAsync(int productId, string? skinType = null, int page = 1, int pageSize = 10, CancellationToken ct = default)
            => Task.FromResult<(IReadOnlyList<Review>, int)>((Array.Empty<Review>(), 0));

        public Task<Review> AddReviewAsync(Review review, CancellationToken ct = default) => Task.FromResult(review);

        public Task<(decimal? AverageRating, int ReviewsCount, IReadOnlyDictionary<int, int> Distribution)> GetProductReviewStatsAsync(int productId, CancellationToken ct = default)
            => Task.FromResult<(decimal?, int, IReadOnlyDictionary<int, int>)>((null, 0, new Dictionary<int, int>()));

        public Task<Dictionary<int, (decimal? AverageRating, int ReviewsCount)>> GetProductsReviewStatsAsync(IEnumerable<int> productIds, CancellationToken ct = default)
            => Task.FromResult(new Dictionary<int, (decimal? AverageRating, int ReviewsCount)>());

        public Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken ct = default)
        {
            GetCategoriesCalls++;
            return Task.FromResult<IReadOnlyList<Category>>(Categories.ToList());
        }

        public Task<IReadOnlyList<Brand>> GetBrandsAsync(CancellationToken ct = default)
        {
            GetBrandsCalls++;
            return Task.FromResult<IReadOnlyList<Brand>>(Brands.ToList());
        }

        public Task<AdminAnalyticsDto> GetAdminAnalyticsAsync(CancellationToken ct = default)
            => throw new NotImplementedException();

        public Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAdminProductsAsync(AdminProductFilterParams filter, CancellationToken ct = default)
            => Task.FromResult<(IReadOnlyList<Product>, int)>((Products, Products.Count));

        public Task<Product?> GetAdminProductByIdAsync(int id, CancellationToken ct = default)
            => Task.FromResult(Products.FirstOrDefault(p => p.Id == id));

        public Task<Product> CreateProductAsync(Product product, CancellationToken ct = default)
        {
            product.Id = Products.Count + 1;
            Products.Add(product);
            return Task.FromResult(product);
        }

        public Task<Product> UpdateProductAsync(Product product, CancellationToken ct = default)
        {
            var idx = Products.FindIndex(p => p.Id == product.Id);
            if (idx >= 0) Products[idx] = product;
            return Task.FromResult(product);
        }

        public Task<Brand> GetOrCreateBrandAsync(string brandName, CancellationToken ct = default)
        {
            var existing = Brands.FirstOrDefault(b => b.Name.Equals(brandName, StringComparison.OrdinalIgnoreCase));
            if (existing != null) return Task.FromResult(existing);
            var created = new Brand { Id = Brands.Count + 1, Name = brandName, Slug = brandName.ToLowerInvariant() };
            Brands.Add(created);
            return Task.FromResult(created);
        }

        public Task<Category> GetOrCreateCategoryAsync(string categoryName, CancellationToken ct = default)
        {
            var existing = Categories.FirstOrDefault(c => c.Name.Equals(categoryName, StringComparison.OrdinalIgnoreCase));
            if (existing != null) return Task.FromResult(existing);
            var created = new Category { Id = Categories.Count + 1, Name = categoryName, Slug = categoryName.ToLowerInvariant() };
            Categories.Add(created);
            return Task.FromResult(created);
        }

        public Task<Brand?> GetBrandByIdAsync(int id, CancellationToken ct = default)
            => Task.FromResult(Brands.FirstOrDefault(b => b.Id == id));

        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken ct = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.Id == id));

        public Task<bool> SlugExistsAsync(string slug, int? excludeProductId = null, CancellationToken ct = default)
            => Task.FromResult(Products.Any(p => p.Slug == slug && p.Id != excludeProductId));

        public Task SyncProductIngredientsAsync(int productId, string rawInci, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private class StubSkinProfileRepository : ISkinProfileRepository
    {
        public Task<SkinProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default) => Task.FromResult<SkinProfile?>(null);
        public Task<SkinProfile> CreateAsync(SkinProfile profile, CancellationToken ct = default) => Task.FromResult(profile);
        public Task<SkinProfile> UpdateAsync(SkinProfile profile, CancellationToken ct = default) => Task.FromResult(profile);
        public Task<List<UserAllergy>> GetAllergiesByUserIdAsync(int userId, CancellationToken ct = default) => Task.FromResult(new List<UserAllergy>());
        public Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default) => Task.FromResult(allergy);
        public Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default) => Task.FromResult(true);
        public Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default) => Task.CompletedTask;
    }

    private class StubOrderRepository : IOrderRepository
    {
        private readonly List<Product> _products;
        public StubOrderRepository(List<Product> products) => _products = products;

        public Task<IReadOnlyList<Product>> GetProductsByIdsForUpdateAsync(IReadOnlyList<int> productIds, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Product>>(_products.Where(p => productIds.Contains(p.Id)).ToList());

        public Task<Order> CreateOrderAsync(Order order, CancellationToken ct = default)
        {
            order.Id = 100;
            return Task.FromResult(order);
        }

        public Task<IReadOnlyList<Order>> GetOrdersByUserIdAsync(int userId, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Order>>(Array.Empty<Order>());

        public Task<IReadOnlyList<Order>> GetAllOrdersAsync(int limit = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Order>>(Array.Empty<Order>());

        public Task<Order?> GetOrderByIdAsync(int id, CancellationToken ct = default) => Task.FromResult<Order?>(null);

        public Task<bool> UpdateOrderStatusAsync(int id, string newStatus, string? trackingNumber = null, string? adminNotes = null, CancellationToken ct = default)
            => Task.FromResult(true);
    }

    [Fact]
    public async Task AdminUpdateProduct_InvalidatesCachedProduct_SoNextReadFetchesFreshData()
    {
        using var memCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new MemoryProductCache(memCache);
        var repo = new StubProductRepository();
        repo.Brands.Add(new Brand { Id = 1, Name = "CeraVe", Slug = "cerave" });
        repo.Categories.Add(new Category { Id = 1, Name = "Moisturizers", Slug = "moisturizers" });
        repo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Original Cream",
            Slug = "original-cream",
            BrandId = 1,
            CategoryId = 1,
            PriceUsd = 20m,
            StockQuantity = 50,
            SellingStatus = "Active",
            IngredientListRaw = "Water, Glycerin"
        });

        var productService = new ProductService(repo, new StubSkinProfileRepository(), cache);
        var adminService = new AdminProductService(repo, cache);

        // First read populates cache
        var first = await productService.GetProductDetailAsync("1");
        Assert.Equal(20m, first!.PriceUsd);
        Assert.Equal(1, repo.GetByIdCalls);

        // Second read hits cache
        var second = await productService.GetProductDetailAsync("1");
        Assert.Equal(20m, second!.PriceUsd);
        Assert.Equal(1, repo.GetByIdCalls);

        // Admin updates price -> invalidates cache
        await adminService.UpdateProductAsync(1, new UpdateProductAdminRequest(
            Name: "Original Cream",
            BrandId: 1,
            BrandName: null,
            CategoryId: 1,
            CategoryName: null,
            PriceUsd: 29.50m,
            StockQuantity: 50,
            VolumeMl: 50,
            Description: "Updated",
            ImageUrl: null,
            IngredientListRaw: "Water, Glycerin",
            TargetSkinTypes: new[] { "All" },
            SellingStatus: "Active"
        ));

        // Next read must miss cache and return updated price
        var third = await productService.GetProductDetailAsync("1");
        Assert.Equal(29.50m, third!.PriceUsd);
        Assert.Equal(2, repo.GetByIdCalls);
    }

    [Fact]
    public async Task OrderCheckout_InvalidatesCachedProduct_SoStockUpdatesImmediately()
    {
        using var memCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new MemoryProductCache(memCache);
        var repo = new StubProductRepository();
        var product = new Product
        {
            Id = 5,
            Code = "P005",
            Name = "Hydrating Gel",
            Slug = "hydrating-gel",
            PriceUsd = 25m,
            StockQuantity = 10,
            SellingStatus = "Active",
            IngredientListRaw = "Water"
        };
        repo.Products.Add(product);

        var productService = new ProductService(repo, new StubSkinProfileRepository(), cache);
        var orderService = new OrderService(new StubOrderRepository(repo.Products), cache);

        var before = await productService.GetProductDetailAsync("5");
        Assert.Equal(10, before!.StockQuantity);
        Assert.Equal(1, repo.GetByIdCalls);

        await orderService.CreateOrderAsync(1, new CreateOrderRequest(
            RecipientName: "Test User",
            PhoneNumber: "0901234567",
            ShippingAddress: "123 Main St",
            Items: new[] { new CreateOrderItemRequest(5, 3) }
        ));

        var after = await productService.GetProductDetailAsync("5");
        Assert.Equal(7, after!.StockQuantity);
        Assert.Equal(2, repo.GetByIdCalls);
    }

    [Fact]
    public async Task TaxonomyCache_InvalidatesBrandsAndCategories()
    {
        using var memCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new MemoryProductCache(memCache);
        var repo = new StubProductRepository();
        repo.Brands.Add(new Brand { Id = 1, Name = "BrandA", Slug = "branda" });
        repo.Categories.Add(new Category { Id = 1, Name = "CatA", Slug = "cata" });

        var productService = new ProductService(repo, new StubSkinProfileRepository(), cache);

        Assert.Single(await productService.GetBrandsAsync());
        Assert.Single(await productService.GetBrandsAsync()); // cached
        Assert.Equal(1, repo.GetBrandsCalls);

        repo.Brands.Add(new Brand { Id = 2, Name = "BrandB", Slug = "brandb" });
        cache.InvalidateBrands();
        Assert.Equal(2, (await productService.GetBrandsAsync()).Count);
        Assert.Equal(2, repo.GetBrandsCalls);

        Assert.Single(await productService.GetCategoriesAsync());
        Assert.Single(await productService.GetCategoriesAsync()); // cached
        Assert.Equal(1, repo.GetCategoriesCalls);

        repo.Categories.Add(new Category { Id = 2, Name = "CatB", Slug = "catb" });
        cache.InvalidateCategories();
        Assert.Equal(2, (await productService.GetCategoriesAsync()).Count);
        Assert.Equal(2, repo.GetCategoriesCalls);
    }
}
