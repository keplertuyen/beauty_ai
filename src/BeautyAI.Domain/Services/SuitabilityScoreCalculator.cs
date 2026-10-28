using BeautyAI.Domain.Entities;

namespace BeautyAI.Domain.Services;

public record SuitabilityScoreResult(
    int SuitabilityScore,
    bool HasAllergyWarning,
    string? MatchedAllergen = null,
    string? MatchReason = null
);

/// <summary>
/// Domain service implementing INV-01: Suitability calculation based on skin profile and allergy blacklist.
/// NEVER computes any safety/hazard scores.
/// </summary>
public static class SuitabilityScoreCalculator
{
    public static SuitabilityScoreResult Calculate(
        Product product,
        SkinProfile? skinProfile,
        IEnumerable<string>? allergyBlacklist)
    {
        if (product == null)
            throw new ArgumentNullException(nameof(product));

        // 1. Zero-Allergy Check: If any allergen is present, suitability is strictly 0
        if (allergyBlacklist != null)
        {
            var allergens = allergyBlacklist
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Select(a => a.Trim().ToLowerInvariant())
                .ToList();

            if (allergens.Count > 0)
            {
                // Check in structured product ingredients
                var matchedInIngredients = product.ProductIngredients?
                    .Select(pi => pi.Ingredient?.InciName)
                    .FirstOrDefault(inci => inci != null && allergens.Contains(inci.ToLowerInvariant()));

                if (matchedInIngredients != null)
                {
                    return new SuitabilityScoreResult(
                        SuitabilityScore: 0,
                        HasAllergyWarning: true,
                        MatchedAllergen: matchedInIngredients,
                        MatchReason: $"Contains blacklisted allergen: {matchedInIngredients}"
                    );
                }

                // Check in raw ingredient list text as safety fallback
                if (!string.IsNullOrWhiteSpace(product.IngredientListRaw))
                {
                    var rawLower = product.IngredientListRaw.ToLowerInvariant();
                    var matchedRaw = allergens.FirstOrDefault(allergen => rawLower.Contains(allergen));

                    if (matchedRaw != null)
                    {
                        return new SuitabilityScoreResult(
                            SuitabilityScore: 0,
                            HasAllergyWarning: true,
                            MatchedAllergen: matchedRaw,
                            MatchReason: $"Contains blacklisted allergen: {matchedRaw}"
                        );
                    }
                }
            }
        }

        // If no skin profile, default neutral suitability
        if (skinProfile == null)
        {
            return new SuitabilityScoreResult(
                SuitabilityScore: 80,
                HasAllergyWarning: false,
                MatchReason: "General recommendation (No skin profile set)"
            );
        }

        // 2. Skin Type Compatibility
        var userSkinType = skinProfile.SkinType.ToString();
        var targetSkinTypes = product.TargetSkinTypes ?? Array.Empty<string>();

        var score = 70; // Baseline compatibility
        var isDirectMatch = targetSkinTypes.Any(t => string.Equals(t, userSkinType, StringComparison.OrdinalIgnoreCase));
        var isUniversal = targetSkinTypes.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));

        if (isDirectMatch)
        {
            score += 25; // 95% match for directly targeted skin
        }
        else if (isUniversal || targetSkinTypes.Length == 0)
        {
            score += 15; // 85% match for universal products
        }
        else
        {
            score -= 10; // 60% for non-targeted skin
        }

        score = Math.Clamp(score, 10, 100);

        return new SuitabilityScoreResult(
            SuitabilityScore: score,
            HasAllergyWarning: false,
            MatchReason: isDirectMatch 
                ? $"Formulated specifically for {userSkinType} skin" 
                : $"Compatible with {userSkinType} skin"
        );
    }
}
