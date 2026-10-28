using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Xunit;

namespace BeautyAI.UnitTests;

public class ProductServiceTests
{
    private class FakeProductRepository : IProductRepository
    {
        public readonly List<Product> Products = new();
        public IEnumerable<string>? LastAllergyBlacklist { get; private set; }

        public Task<(IReadOnlyList<Product> Items, int TotalCount)> GetProductsAsync(
            ProductFilterParams filter,
            IEnumerable<string>? allergyBlacklist,
            CancellationToken cancellationToken = default)
        {
            LastAllergyBlacklist = allergyBlacklist;
            var list = Products.AsEnumerable();

            if (allergyBlacklist != null && allergyBlacklist.Any())
            {
                var allergens = allergyBlacklist.Select(a => a.ToLowerInvariant()).ToList();
                list = list.Where(p => !allergens.Any(a => p.IngredientListRaw.ToLowerInvariant().Contains(a)));
            }

            var items = list.ToList();
            return Task.FromResult(((IReadOnlyList<Product>)items, items.Count));
        }

        public Task<Product?> GetProductByIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.FirstOrDefault(p => p.Id == id));

        public Task<Product?> GetProductByCodeOrSlugAsync(string codeOrSlug, CancellationToken cancellationToken = default) =>
            Task.FromResult(Products.FirstOrDefault(p => p.Code == codeOrSlug || p.Slug == codeOrSlug));

        public Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((IReadOnlyList<Category>)new List<Category>());

        public Task<IReadOnlyList<Brand>> GetBrandsAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult((IReadOnlyList<Brand>)new List<Brand>());

        public Task<(decimal AverageRating, int ReviewsCount)> GetProductReviewStatsAsync(int productId, CancellationToken cancellationToken = default) =>
            Task.FromResult((5.0m, 0));
    }

    private class FakeSkinProfileRepository : ISkinProfileRepository
    {
        public SkinProfile? Profile { get; set; }
        public List<UserAllergy> Allergies { get; set; } = new();

        public Task<SkinProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default) =>
            Task.FromResult(Profile);

        public Task<SkinProfile> CreateAsync(SkinProfile profile, CancellationToken ct = default) =>
            Task.FromResult(profile);

        public Task<SkinProfile> UpdateAsync(SkinProfile profile, CancellationToken ct = default) =>
            Task.FromResult(profile);

        public Task<List<UserAllergy>> GetAllergiesByUserIdAsync(int userId, CancellationToken ct = default) =>
            Task.FromResult(Allergies);

        public Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default) =>
            Task.FromResult(allergy);

        public Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default) =>
            Task.FromResult(true);

        public Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default) =>
            Task.CompletedTask;
    }

    [Fact]
    public async Task GetCatalogAsync_WhenSafeForMeIsTrueAndUserLoggedIn_AppliesAllergyFilter()
    {
        var productRepo = new FakeProductRepository();
        productRepo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Alcohol Cleanser",
            Slug = "alcohol-cleanser",
            BrandId = 1,
            CategoryId = 1,
            PriceUsd = 20.00m,
            IngredientListRaw = "Water, Alcohol Denat, Glycerin"
        });

        var skinProfileRepo = new FakeSkinProfileRepository
        {
            Profile = new SkinProfile { UserId = 5, SkinType = SkinType.Oily },
            Allergies = new List<UserAllergy>
            {
                new() { UserId = 5, IngredientName = "Alcohol Denat" }
            }
        };

        var service = new ProductService(productRepo, skinProfileRepo);
        var filter = new ProductFilterParams(SafeForMe: true, Page: 1, PageSize: 10);

        var result = await service.GetCatalogAsync(filter, currentUserId: 5);

        Assert.NotNull(result);
        Assert.NotNull(productRepo.LastAllergyBlacklist);
        Assert.Contains("Alcohol Denat", productRepo.LastAllergyBlacklist);
        Assert.Empty(result.Items);
    }

    [Fact]
    public async Task GetCatalogAsync_WhenSafeForMeIsFalse_DoesNotFilterAllergies()
    {
        var productRepo = new FakeProductRepository();
        productRepo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Alcohol Cleanser",
            Slug = "alcohol-cleanser",
            BrandId = 1,
            CategoryId = 1,
            PriceUsd = 20.00m,
            IngredientListRaw = "Water, Alcohol Denat, Glycerin"
        });

        var skinProfileRepo = new FakeSkinProfileRepository
        {
            Profile = new SkinProfile { UserId = 5, SkinType = SkinType.Oily },
            Allergies = new List<UserAllergy>
            {
                new() { UserId = 5, IngredientName = "Alcohol Denat" }
            }
        };

        var service = new ProductService(productRepo, skinProfileRepo);
        var filter = new ProductFilterParams(SafeForMe: false, Page: 1, PageSize: 10);

        var result = await service.GetCatalogAsync(filter, currentUserId: 5);

        Assert.NotNull(result);
        Assert.Null(productRepo.LastAllergyBlacklist);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task GetProductDetailAsync_WhenProductExists_ReturnsCorrectDto()
    {
        var productRepo = new FakeProductRepository();
        productRepo.Products.Add(new Product
        {
            Id = 1,
            Code = "P001",
            Name = "Soothing Cleanser",
            Slug = "soothing-cleanser",
            BrandId = 1,
            CategoryId = 1,
            PriceUsd = 28.00m,
            IngredientListRaw = "Water, Glycerin, Centella Asiatica Extract",
            TargetSkinTypes = new[] { "Sensitive", "Dry" }
        });

        var skinProfileRepo = new FakeSkinProfileRepository();
        var service = new ProductService(productRepo, skinProfileRepo);

        var detail = await service.GetProductDetailAsync("1", null);

        Assert.NotNull(detail);
        Assert.Equal("Soothing Cleanser", detail.Name);
        Assert.Equal(28.00m, detail.PriceUsd);
    }
}
