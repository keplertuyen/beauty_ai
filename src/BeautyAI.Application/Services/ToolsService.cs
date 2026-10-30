using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using BeautyAI.Domain.Services;

namespace BeautyAI.Application.Services;

public class ToolsService : IToolsService
{
    private readonly IToolRepository _toolRepository;
    private readonly ISkinProfileRepository _skinProfileRepository;

    public ToolsService(
        IToolRepository toolRepository,
        ISkinProfileRepository skinProfileRepository)
    {
        _toolRepository = toolRepository;
        _skinProfileRepository = skinProfileRepository;
    }

    public async Task<InciAnalysisResponse> AnalyzeInciAsync(
        InciAnalysisRequest request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var rawText = request.IngredientsText?.Trim() ?? string.Empty;

        SkinProfile? skinProfile = null;
        List<string> allergyNames = new();
        bool requiresSkinId = true;

        if (currentUserId.HasValue)
        {
            skinProfile = await _skinProfileRepository.GetByUserIdAsync(currentUserId.Value, cancellationToken);
            var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(currentUserId.Value, cancellationToken);
            allergyNames = allergies.Select(a => a.IngredientName).ToList();

            // Check whether user has completed their Skin ID beyond the auto-created blank placeholder
            if (skinProfile != null)
            {
                var hasConcerns = skinProfile.SkinConcerns != null && skinProfile.SkinConcerns.Count > 0;
                var hasAllergies = allergyNames.Count > 0;
                var hasCustomGoal = !string.IsNullOrWhiteSpace(skinProfile.PrimaryGoal) &&
                                    !string.Equals(skinProfile.PrimaryGoal, "Maintain Healthy Skin", StringComparison.OrdinalIgnoreCase);

                requiresSkinId = !(hasConcerns || hasAllergies || hasCustomGoal);
            }
        }

        // Allow request skin_type override if user explicitly changed the dropdown in Analyzer
        if (!string.IsNullOrWhiteSpace(request.SkinType) &&
            Enum.TryParse<SkinType>(request.SkinType, true, out var overrideSkinType))
        {
            skinProfile = new SkinProfile
            {
                UserId = currentUserId ?? 0,
                SkinType = overrideSkinType,
                SkinConcerns = skinProfile?.SkinConcerns ?? new List<string>(),
                PrimaryGoal = skinProfile?.PrimaryGoal ?? "Personalized Care"
            };
        }

        var dbIngredients = await _toolRepository.GetAllIngredientsAsync(cancellationToken);
        var dbMap = dbIngredients
            .Where(i => !string.IsNullOrWhiteSpace(i.InciName))
            .GroupBy(i => i.InciName.ToLowerInvariant().Trim())
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var breakdown = CosmeticKnowledgeBase.AnalyzeFormula(
            rawIngredientsText: rawText,
            productName: request.ProductName,
            department: request.Department,
            categoryName: request.Category,
            explicitTargetArea: request.TargetArea,
            skinProfile: requiresSkinId && string.IsNullOrWhiteSpace(request.SkinType) ? null : skinProfile,
            userAllergies: allergyNames,
            targetSkinTypes: null,
            dbIngredientMap: dbMap
        );

        // Combination Warnings (12 clinical conflict rules) — ONLY relevant for Face Skincare
        var combinationWarnings = new List<CombinationWarningDto>();
        if (breakdown.TargetArea == "face" &&
            (string.IsNullOrWhiteSpace(request.Department) ||
             string.Equals(request.Department, "Skincare", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(request.Department, "Men", StringComparison.OrdinalIgnoreCase)))
        {
            var conflictRules = await _toolRepository.GetAllConflictRulesAsync(cancellationToken);
            var lowerTokens = breakdown.RawInciTokens.Select(t => t.ToLowerInvariant()).ToList();

            foreach (var rule in conflictRules)
            {
                var a = rule.ActiveIngredientA.ToLowerInvariant();
                var b = rule.ActiveIngredientB.ToLowerInvariant();

                var hasA = lowerTokens.Any(n => n.Contains(a));
                var hasB = lowerTokens.Any(n => n.Contains(b));

                if (hasA && hasB)
                {
                    combinationWarnings.Add(new CombinationWarningDto(
                        Warning: $"Active interaction between {rule.ActiveIngredientA} and {rule.ActiveIngredientB}: {rule.Reason}",
                        IngredientsInvolved: new[] { rule.ActiveIngredientA, rule.ActiveIngredientB },
                        Severity: rule.Severity,
                        Recommendation: rule.Recommendation
                    ));
                }
            }
        }

        var summary = breakdown.IsNonCosmeticTool
            ? "Physical beauty tool or accessory — contains no chemical cosmetic ingredients."
            : !breakdown.HasIngredients
                ? "Manufacturer has not provided a detailed INCI ingredient list for this product."
                : $"Analyzed {breakdown.TotalIngredientsCount} INCI ingredients for {FormatTargetAreaLabel(breakdown.TargetArea)}. " +
                  $"Highlighted {breakdown.KeyIngredients.Count} key ingredients across {breakdown.FunctionalGroups.Count} functional groups.";

        return new InciAnalysisResponse(
            Summary: summary,
            Verdict: breakdown.Verdict,
            VerdictLabel: breakdown.VerdictLabel,
            VerdictReason: breakdown.VerdictReason,
            RequiresSkinId: requiresSkinId,
            UserSkinType: skinProfile?.SkinType.ToString(),
            TargetArea: breakdown.TargetArea,
            Department: request.Department,
            HasAllergyWarning: breakdown.HasAllergyWarning,
            AllergyMatches: breakdown.AllergyMatches,
            KeyIngredients: breakdown.KeyIngredients
                .Select(k => new AnalyzedKeyIngredientDto(
                    k.CommonName,
                    k.InciName,
                    k.RoleLabel,
                    k.Explanation,
                    k.IsFeaturedInProductName))
                .ToList(),
            FunctionalGroups: breakdown.FunctionalGroups
                .Select(g => new AnalyzedFunctionalGroupDto(
                    g.GroupTitle,
                    g.PlainExplanation,
                    g.Count,
                    g.Ingredients))
                .ToList(),
            BenefitsTitle: breakdown.BenefitsTitle,
            Benefits: breakdown.Benefits,
            Cautions: breakdown.Cautions
                .Select(c => new AnalyzedCautionDto(
                    c.Type,
                    c.Title,
                    c.Message,
                    c.IngredientsInvolved))
                .ToList(),
            CombinationWarnings: combinationWarnings,
            FragranceDisclosure: breakdown.FragranceDisclosure,
            TotalIngredientsCount: breakdown.TotalIngredientsCount,
            RawInciList: breakdown.RawInciTokens
        );
    }

    public async Task<ConflictCheckResponse> CheckCartConflictsAsync(
        ConflictCheckRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.ProductIds == null || request.ProductIds.Count < 2)
        {
            return new ConflictCheckResponse(false, Array.Empty<ConflictDetailDto>());
        }

        var products = await _toolRepository.GetProductsForConflictCheckAsync(request.ProductIds, cancellationToken);
        var conflictRules = await _toolRepository.GetAllConflictRulesAsync(cancellationToken);
        var detected = new List<ConflictDetailDto>();

        for (int i = 0; i < products.Count; i++)
        {
            for (int j = i + 1; j < products.Count; j++)
            {
                var p1 = products[i];
                var p2 = products[j];

                var ing1 = p1.ProductIngredients.Select(pi => pi.Ingredient?.InciName ?? "").Concat(new[] { p1.IngredientListRaw }).ToList();
                var ing2 = p2.ProductIngredients.Select(pi => pi.Ingredient?.InciName ?? "").Concat(new[] { p2.IngredientListRaw }).ToList();

                foreach (var rule in conflictRules)
                {
                    var a = rule.ActiveIngredientA.ToLowerInvariant();
                    var b = rule.ActiveIngredientB.ToLowerInvariant();

                    var p1HasA = ing1.Any(x => x.ToLowerInvariant().Contains(a));
                    var p2HasB = ing2.Any(x => x.ToLowerInvariant().Contains(b));

                    var p1HasB = ing1.Any(x => x.ToLowerInvariant().Contains(b));
                    var p2HasA = ing2.Any(x => x.ToLowerInvariant().Contains(a));

                    if ((p1HasA && p2HasB) || (p1HasB && p2HasA))
                    {
                        detected.Add(new ConflictDetailDto(
                            ProductA: p1.Name,
                            ProductB: p2.Name,
                            IngredientA: rule.ActiveIngredientA,
                            IngredientB: rule.ActiveIngredientB,
                            Severity: rule.Severity,
                            Reason: rule.Reason,
                            Recommendation: rule.Recommendation
                        ));
                    }
                }
            }
        }

        return new ConflictCheckResponse(detected.Count > 0, detected);
    }

    public Task<object> GetSkinTypeGuideAsync(string area = "face", CancellationToken cancellationToken = default)
    {
        var guide = new Dictionary<string, object>
        {
            ["oily"] = new
            {
                vi_name = "Oily & Blemish-Prone Skin",
                tip = "Focus on lightweight gel hydrators and oil-soluble BHA to keep pores clear without stripping your barrier.",
                recommended = new[] { "Niacinamide (Vitamin B3)", "Salicylic Acid (BHA)", "Zinc PCA", "Sodium Hyaluronate", "Centella Asiatica" },
                avoid = new[] { "Heavy Occlusive Waxes", "Coconut Oil (on face)", "Pore-Clogging Esters" }
            },
            ["dry"] = new
            {
                vi_name = "Dry & Dehydrated Skin",
                tip = "Layer water-binding humectants under ceramide-rich lipids to seal in moisture and prevent trans-epidermal water loss.",
                recommended = new[] { "Ceramide NP / AP / EOP", "Squalane", "Hyaluronic Acid", "Glycerin", "Panthenol (Pro-Vitamin B5)", "Shea Butter" },
                avoid = new[] { "High-Proof Alcohol Denat.", "Daily High-Strength Acid Peels", "Harsh Foaming Sulfates" }
            },
            ["combination"] = new
            {
                vi_name = "Combination Skin",
                tip = "Balance your oily T-zone and drier cheeks with adaptable biomimetic hydrators and gentle pore-refining actives.",
                recommended = new[] { "Niacinamide", "Panthenol", "Squalane", "Lactic Acid (Gentle AHA)", "Green Tea Extract" },
                avoid = new[] { "Overly Heavy Butters on T-Zone", "Stripping Astringent Toners" }
            },
            ["sensitive"] = new
            {
                vi_name = "Sensitive & Reactive Skin",
                tip = "Prioritize barrier-calming botanicals and fragrance-free formulations; patch-test potent actives before full application.",
                recommended = new[] { "Centella Asiatica (Madecassoside)", "Colloidal Oatmeal", "Panthenol", "Allantoin", "Ceramides", "Azelaic Acid" },
                avoid = new[] { "Synthetic Fragrance (Parfum)", "Strong Essential Oils", "Alcohol Denat.", "High-Percentage Glycolic Acid" }
            },
            ["normal"] = new
            {
                vi_name = "Normal & Balanced Skin",
                tip = "Maintain barrier resilience with daytime antioxidants + SPF and gentle nighttime cellular renewal.",
                recommended = new[] { "Vitamin C (Ascorbic Acid)", "Peptides", "Hyaluronic Acid", "Retinol (PM)", "Niacinamide" },
                avoid = new[] { "Stacking Multiple Exfoliating Acids in the Same Routine" }
            }
        };

        return Task.FromResult<object>(new { guide });
    }

    private static string FormatTargetAreaLabel(string targetArea) => targetArea switch
    {
        "eye" => "Eye Area Care",
        "lips" => "Lip Care & Makeup",
        "hair" => "Hair & Scalp Care",
        "body" => "Bath & Body Care",
        "fragrance" => "Fragrance (Pulse Points)",
        "nails" => "Nail Care",
        _ => "Face Skincare & Complexion"
    };
}
