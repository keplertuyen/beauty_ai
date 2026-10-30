using BeautyAI.Domain.Entities;

namespace BeautyAI.Domain.Services;

public record SuitabilityVerdictResult(
    string Verdict,
    string VerdictLabel,
    bool HasAllergyWarning,
    string? MatchedAllergen = null,
    string? MatchReason = null,
    bool HasIngredients = true,
    bool IsNonCosmeticTool = false
);

/// <summary>
/// Domain service implementing INV-01: Text-based suitability verdict calculation based on skin profile
/// and expanded allergy blacklist. NEVER computes any numeric safety/hazard or percentage scores.
/// </summary>
public static class SuitabilityScoreCalculator
{
    public static SuitabilityVerdictResult Calculate(
        Product product,
        SkinProfile? skinProfile,
        IEnumerable<string>? allergyBlacklist)
    {
        if (product == null)
            throw new ArgumentNullException(nameof(product));

        var department = product.Department ?? "Skincare";
        var categoryName = product.Category?.Name ?? "";
        var targetArea = CosmeticKnowledgeBase.ResolveTargetArea(department, categoryName);

        // 1. Group A: Non-cosmetic Tools & Accessories
        if (string.Equals(department, "Tools & Brushes", StringComparison.OrdinalIgnoreCase) ||
            targetArea == "non-cosmetic")
        {
            return new SuitabilityVerdictResult(
                Verdict: "AccessoryTool",
                VerdictLabel: "Accessory / Tool",
                HasAllergyWarning: false,
                MatchedAllergen: null,
                MatchReason: "Physical beauty tool or accessory — contains no chemical cosmetic ingredients.",
                HasIngredients: false,
                IsNonCosmeticTool: true
            );
        }

        // 2. Group B: Cosmetic product missing manufacturer INCI list
        var rawInci = (product.IngredientListRaw ?? "").Trim();
        var hasStructured = product.ProductIngredients != null && product.ProductIngredients.Count > 0;
        var hasRaw = !string.IsNullOrWhiteSpace(rawInci) &&
                     !string.Equals(rawInci, "No ingredients listed", StringComparison.OrdinalIgnoreCase) &&
                     rawInci.Length >= 3;

        if (!hasRaw && !hasStructured)
        {
            return new SuitabilityVerdictResult(
                Verdict: "InsufficientData",
                VerdictLabel: "Insufficient INCI Data",
                HasAllergyWarning: false,
                MatchedAllergen: null,
                MatchReason: "Manufacturer has not provided a detailed INCI list for this product — unable to cross-check against your allergy profile.",
                HasIngredients: false,
                IsNonCosmeticTool: false
            );
        }

        // 3. Zero-Allergy Check (using expanded synonym dictionary + structured & raw ingredients)
        if (allergyBlacklist != null)
        {
            // Check structured ingredients first
            if (product.ProductIngredients != null)
            {
                foreach (var pi in product.ProductIngredients)
                {
                    var inci = pi.Ingredient?.InciName;
                    if (!string.IsNullOrWhiteSpace(inci))
                    {
                        var match = CosmeticKnowledgeBase.MatchAllergenInToken(inci, allergyBlacklist);
                        if (match != null)
                        {
                            return new SuitabilityVerdictResult(
                                Verdict: "AllergyConflict",
                                VerdictLabel: "Not Suitable — Allergy Alert",
                                HasAllergyWarning: true,
                                MatchedAllergen: match,
                                MatchReason: $"Contains {match}, which matches your personal Allergy Blacklist.",
                                HasIngredients: true,
                                IsNonCosmeticTool: false
                            );
                        }
                    }
                }
            }

            // Check raw ingredient tokens
            if (hasRaw)
            {
                var tokens = CosmeticKnowledgeBase.SplitInciList(rawInci);
                foreach (var token in tokens)
                {
                    var match = CosmeticKnowledgeBase.MatchAllergenInToken(token, allergyBlacklist);
                    if (match != null)
                    {
                        return new SuitabilityVerdictResult(
                            Verdict: "AllergyConflict",
                            VerdictLabel: "Not Suitable — Allergy Alert",
                            HasAllergyWarning: true,
                            MatchedAllergen: match,
                            MatchReason: $"Contains {match}, which matches your personal Allergy Blacklist.",
                            HasIngredients: true,
                            IsNonCosmeticTool: false
                        );
                    }
                }
            }
        }

        // 4. If user has not set up Skin Profile yet
        if (skinProfile == null)
        {
            return new SuitabilityVerdictResult(
                Verdict: "RequiresSkinId",
                VerdictLabel: "Complete Skin ID to Check",
                HasAllergyWarning: false,
                MatchedAllergen: null,
                MatchReason: "Complete your 30-second Digital Skin ID to see your personalized formula match.",
                HasIngredients: true,
                IsNonCosmeticTool: false
            );
        }

        // 5. Evaluate compatibility & soft cautions for user's SkinType
        var userSkinType = skinProfile.SkinType.ToString();
        var rawLower = rawInci.ToLowerInvariant();
        var isFragranceDept = string.Equals(department, "Fragrance", StringComparison.OrdinalIgnoreCase) || targetArea == "fragrance";

        // Soft caution check for Sensitive skin (synthetic fragrance or drying alcohol)
        if (string.Equals(userSkinType, "Sensitive", StringComparison.OrdinalIgnoreCase) && !isFragranceDept)
        {
            if (rawLower.Contains("parfum") || rawLower.Contains("fragrance") || rawLower.Contains("limonene") || rawLower.Contains("linalool"))
            {
                return new SuitabilityVerdictResult(
                    Verdict: "MatchWithNotes",
                    VerdictLabel: "Match with Notes",
                    HasAllergyWarning: false,
                    MatchedAllergen: null,
                    MatchReason: "Zero personal allergy conflicts, but contains fragrance components — patch-test for Sensitive skin.",
                    HasIngredients: true,
                    IsNonCosmeticTool: false
                );
            }
        }

        if ((string.Equals(userSkinType, "Dry", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(userSkinType, "Sensitive", StringComparison.OrdinalIgnoreCase)) &&
            !isFragranceDept &&
            (rawLower.Contains("alcohol denat") || rawLower.Contains("sd alcohol")))
        {
            return new SuitabilityVerdictResult(
                Verdict: "MatchWithNotes",
                VerdictLabel: "Match with Notes",
                HasAllergyWarning: false,
                MatchedAllergen: null,
                MatchReason: $"Contains quick-drying Alcohol Denat. — follow with barrier moisturizer on {userSkinType} skin.",
                HasIngredients: true,
                IsNonCosmeticTool: false
            );
        }

        var targetSkinTypes = product.TargetSkinTypes ?? Array.Empty<string>();
        if (targetSkinTypes.Length > 0 && targetArea == "face")
        {
            var isDirectMatch = targetSkinTypes.Any(t => string.Equals(t, userSkinType, StringComparison.OrdinalIgnoreCase)) ||
                                targetSkinTypes.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));

            if (!isDirectMatch)
            {
                return new SuitabilityVerdictResult(
                    Verdict: "MatchWithNotes",
                    VerdictLabel: "Match with Notes",
                    HasAllergyWarning: false,
                    MatchedAllergen: null,
                    MatchReason: $"Safe for your allergy list; primarily targeted for {string.Join("/", targetSkinTypes)} skin.",
                    HasIngredients: true,
                    IsNonCosmeticTool: false
                );
            }
        }

        return new SuitabilityVerdictResult(
            Verdict: "GoodMatch",
            VerdictLabel: "Good Match",
            HasAllergyWarning: false,
            MatchedAllergen: null,
            MatchReason: $"Well-suited for your {userSkinType} skin profile with zero allergy conflicts.",
            HasIngredients: true,
            IsNonCosmeticTool: false
        );
    }
}
