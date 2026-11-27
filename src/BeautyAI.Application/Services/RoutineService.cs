using System.Text.Json;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Services;

public class RoutineService : IRoutineService
{
    private readonly IProductRepository _productRepository;
    private readonly ISkinProfileRepository _skinProfileRepository;
    private readonly IToolsService _toolsService;
    private readonly IRoutineRepository _routineRepository;

    public RoutineService(
        IProductRepository productRepository,
        ISkinProfileRepository skinProfileRepository,
        IToolsService toolsService,
        IRoutineRepository routineRepository)
    {
        _productRepository = productRepository;
        _skinProfileRepository = skinProfileRepository;
        _toolsService = toolsService;
        _routineRepository = routineRepository;
    }

    public async Task<RoutineResultDto> GenerateRoutineAsync(
        int? userId,
        GenerateRoutineRequest request,
        CancellationToken cancellationToken = default)
    {
        string skinType = "Combination";
        string budgetLevel = "Medium";
        List<string> concerns = new();
        List<string> userAllergies = new();

        if (userId.HasValue)
        {
            var profile = await _skinProfileRepository.GetByUserIdAsync(userId.Value, cancellationToken);
            if (profile != null)
            {
                skinType = profile.SkinType.ToString();
                budgetLevel = profile.BudgetLevel.ToString();
                if (profile.SkinConcerns != null && profile.SkinConcerns.Count > 0)
                {
                    concerns.AddRange(profile.SkinConcerns);
                }
            }

            var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(userId.Value, cancellationToken);
            if (allergies.Count > 0)
            {
                userAllergies.AddRange(allergies.Select(a => a.IngredientName));
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SkinType))
            skinType = request.SkinType.Trim();
        if (!string.IsNullOrWhiteSpace(request.BudgetLevel))
            budgetLevel = request.BudgetLevel.Trim();
        if (request.SkinConcerns != null && request.SkinConcerns.Count > 0)
            concerns = request.SkinConcerns;

        decimal? maxPrice = budgetLevel.Equals("Low", StringComparison.OrdinalIgnoreCase) ? 35m :
                            budgetLevel.Equals("Medium", StringComparison.OrdinalIgnoreCase) ? 80m : null;

        var catalogFilter = new ProductFilterParams(
            MaxPrice: maxPrice,
            PageSize: 100
        );

        var (allProducts, _) = await _productRepository.GetProductsAsync(catalogFilter, userAllergies, cancellationToken);

        var skincareProducts = allProducts.Where(p =>
            !string.IsNullOrWhiteSpace(p.Category?.Name) &&
            (p.Category.Name.Contains("Clean", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Toner", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Serum", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Treatment", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Moistur", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Cream", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Sun", StringComparison.OrdinalIgnoreCase) ||
             p.Category.Name.Contains("Mask", StringComparison.OrdinalIgnoreCase))
        ).ToList();

        if (skincareProducts.Count == 0)
        {
            skincareProducts = allProducts.ToList();
        }

        Product? amCleanser = PickProduct(skincareProducts, new[] { "cleanser", "wash", "foaming" }, skinType, null);
        Product? amToner = PickProduct(skincareProducts, new[] { "toner", "essence", "antioxidant", "vitamin c" }, skinType, new[] { amCleanser?.Id ?? 0 });
        Product? amMoisturizer = PickProduct(skincareProducts, new[] { "moisturizer", "day cream", "lotion", "hydrat" }, skinType, new[] { amCleanser?.Id ?? 0, amToner?.Id ?? 0 });
        Product? amSunscreen = PickProduct(skincareProducts, new[] { "sunscreen", "sun", "spf", "shield" }, skinType, new[] { amCleanser?.Id ?? 0, amToner?.Id ?? 0, amMoisturizer?.Id ?? 0 });

        Product? pmCleanser = PickProduct(skincareProducts, new[] { "cleansing balm", "cleansing oil", "cleanser", "wash" }, skinType, null) ?? amCleanser;
        Product? pmTreatment = PickProduct(skincareProducts, new[] { "retinol", "bha", "serum", "treatment", "peeling", "night" }, skinType, new[] { pmCleanser?.Id ?? 0, amToner?.Id ?? 0 });
        Product? pmMoisturizer = PickProduct(skincareProducts, new[] { "night cream", "barrier", "repair", "moisturizer", "cream" }, skinType, new[] { pmCleanser?.Id ?? 0, pmTreatment?.Id ?? 0 }) ?? amMoisturizer;

        var allRecommended = new[] { amCleanser, amToner, amMoisturizer, amSunscreen, pmCleanser, pmTreatment, pmMoisturizer }
            .Where(p => p != null)
            .Select(p => p!)
            .DistinctBy(p => p.Id)
            .ToList();

        var conflictCheck = await _toolsService.CheckCartConflictsAsync(
            new ConflictCheckRequest(allRecommended.Select(p => p.Id).ToList()),
            cancellationToken);

        var amList = new List<ProductSummaryDto>();
        var pmList = new List<ProductSummaryDto>();
        var detailedSteps = new List<RoutineStepDto>();

        void AddStep(Product? prod, string timing, int order, string stepName, string desc, List<ProductSummaryDto> targetList)
        {
            if (prod == null) return;
            var summary = MapSummary(prod);
            targetList.Add(summary);
            detailedSteps.Add(new RoutineStepDto(order, stepName, timing, desc, summary));
        }

        AddStep(amCleanser, "AM", 1, "Cleanse", "Gentle morning cleanse to prep skin for daytime hydration.", amList);
        AddStep(amToner, "AM", 2, "Tone & Prep", "Hydrate skin barrier and infuse antioxidants for daytime protection.", amList);
        AddStep(amMoisturizer, "AM", 3, "Moisturize", "Lock in lightweight moisture without clogging pores.", amList);
        AddStep(amSunscreen, "AM", 4, "Sun Protection", "Broad-spectrum UV protection to prevent premature aging and hyperpigmentation.", amList);

        AddStep(pmCleanser, "PM", 1, "Double Cleanse", "Thoroughly remove daily grime, pollutants, and SPF residue.", pmList);
        AddStep(pmTreatment, "PM", 2, "Targeted Treatment", "Cellular renewal and targeted concern repair (Retinoid / BHA / Peptides).", pmList);
        AddStep(pmMoisturizer, "PM", 3, "Night Recovery", "Intense barrier replenishment and overnight skin restoration.", pmList);

        decimal totalCost = allRecommended.Sum(p => p.PriceUsd);

        return new RoutineResultDto(
            AmRoutine: amList,
            PmRoutine: pmList,
            DetailedSteps: detailedSteps,
            TotalCostUsd: Math.Round(totalCost, 2),
            InternalConflicts: conflictCheck.Conflicts.ToList()
        );
    }

    public async Task<SavedRoutineDto> SaveRoutineAsync(
        int userId,
        SaveRoutineRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrWhiteSpace(request.RoutineName))
            throw new ArgumentException("Routine name is required.", nameof(request.RoutineName));

        var productIds = request.ProductIds ?? new List<int>();
        var saved = new SavedRoutine
        {
            UserId = userId,
            RoutineName = request.RoutineName.Trim(),
            RoutineType = !string.IsNullOrWhiteSpace(request.RoutineType) ? request.RoutineType.Trim() : "Morning",
            ItemsJson = JsonSerializer.Serialize(productIds),
            Notes = request.Notes
        };

        var created = await _routineRepository.CreateAsync(saved, cancellationToken);
        var products = await LoadProductSummariesAsync(productIds, cancellationToken);

        return new SavedRoutineDto(
            Id: created.Id,
            UserId: created.UserId,
            RoutineName: created.RoutineName,
            RoutineType: created.RoutineType,
            Products: products,
            Notes: created.Notes,
            CreatedAtUtc: created.CreatedAtUtc
        );
    }

    public async Task<IReadOnlyList<SavedRoutineDto>> GetUserSavedRoutinesAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var list = await _routineRepository.GetByUserIdAsync(userId, cancellationToken);
        var result = new List<SavedRoutineDto>();

        foreach (var r in list)
        {
            List<int> productIds = new();
            try
            {
                productIds = JsonSerializer.Deserialize<List<int>>(r.ItemsJson) ?? new();
            }
            catch { /* ignore json parse errors */ }

            var products = await LoadProductSummariesAsync(productIds, cancellationToken);
            result.Add(new SavedRoutineDto(
                Id: r.Id,
                UserId: r.UserId,
                RoutineName: r.RoutineName,
                RoutineType: r.RoutineType,
                Products: products,
                Notes: r.Notes,
                CreatedAtUtc: r.CreatedAtUtc
            ));
        }

        return result;
    }

    public async Task<bool> DeleteSavedRoutineAsync(
        int userId,
        int routineId,
        CancellationToken cancellationToken = default)
    {
        return await _routineRepository.DeleteAsync(routineId, userId, cancellationToken);
    }

    private Product? PickProduct(
        IReadOnlyList<Product> products,
        string[] keywords,
        string skinType,
        IEnumerable<int>? excludeIds)
    {
        var excludeSet = excludeIds?.ToHashSet() ?? new HashSet<int>();
        var candidates = products.Where(p => !excludeSet.Contains(p.Id)).ToList();

        var matches = candidates.Where(p =>
            keywords.Any(k =>
                (p.Category?.Name != null && p.Category.Name.Contains(k, StringComparison.OrdinalIgnoreCase)) ||
                p.Name.Contains(k, StringComparison.OrdinalIgnoreCase)
            )
        ).ToList();

        if (matches.Count == 0)
        {
            matches = candidates;
        }

        var skinMatches = matches.Where(p =>
            p.TargetSkinTypes != null &&
            p.TargetSkinTypes.Any(st => st.Contains(skinType, StringComparison.OrdinalIgnoreCase) ||
                                        st.Equals("All", StringComparison.OrdinalIgnoreCase))
        ).ToList();

        var pool = skinMatches.Count > 0 ? skinMatches : matches;
        return pool.OrderByDescending(p => p.PriceUsd).FirstOrDefault() ?? candidates.FirstOrDefault();
    }

    private async Task<List<ProductSummaryDto>> LoadProductSummariesAsync(
        IEnumerable<int> productIds,
        CancellationToken cancellationToken)
    {
        var summaries = new List<ProductSummaryDto>();
        foreach (var id in productIds.Distinct())
        {
            var p = await _productRepository.GetProductByIdAsync(id, cancellationToken);
            if (p != null)
            {
                summaries.Add(MapSummary(p));
            }
        }
        return summaries;
    }

    private static ProductSummaryDto MapSummary(Product p)
    {
        var imgUrl = !string.IsNullOrWhiteSpace(p.ImageUrl)
            ? p.ImageUrl
            : $"/images/products/{p.Code}.webp";

        return new ProductSummaryDto(
            Id: p.Id,
            Code: p.Code,
            Name: p.Name,
            Slug: p.Slug,
            BrandName: p.Brand?.Name ?? "BeautyAI Brand",
            CategoryName: p.Category?.Name ?? "Skincare",
            PriceUsd: p.PriceUsd,
            VolumeMl: p.VolumeMl,
            ImageUrl: imgUrl,
            Rating: p.ReviewsCount > 0 ? p.AvgRating : null,
            ReviewsCount: p.ReviewsCount,
            TargetSkinTypes: p.TargetSkinTypes ?? Array.Empty<string>(),
            SuitabilityVerdict: "Highly Recommended",
            SuitabilityLabel: "Safe & Effective",
            HasAllergyWarning: false,
            Department: p.Department ?? "Skincare",
            SizeDisplay: p.SizeDisplay,
            LovesCount: p.LovesCount
        );
    }
}
