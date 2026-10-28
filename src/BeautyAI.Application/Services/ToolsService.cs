using System.Text.RegularExpressions;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Services;

public class ToolsService : IToolsService
{
    private readonly IToolRepository _toolRepository;

    private static readonly Dictionary<string, (string Category, string Function, string[] Benefits, string Safety, int Comedo, int Irritation, string? Caution)> CommonBeautyChemicals = new(StringComparer.OrdinalIgnoreCase)
    {
        ["aqua"] = ("humectant", "Solvent and carrier foundation for cosmetic formulations", new[] { "Hydration Carrier" }, "safe", 0, 0, null),
        ["water"] = ("humectant", "Solvent and carrier foundation for cosmetic formulations", new[] { "Hydration Carrier" }, "safe", 0, 0, null),
        ["glycerin"] = ("humectant", "Master humectant that attracts and locks atmospheric moisture into skin", new[] { "Deep Hydration", "Moisture Retention", "Skin Barrier Support" }, "safe", 0, 0, null),
        ["niacinamide"] = ("active", "Vitamin B3 that refines pores, regulates excess sebum, and strengthens lipid barrier", new[] { "Pore Refinement", "Sebum Regulation", "Barrier Reinforcement", "Even Tone" }, "safe", 0, 0, null),
        ["hyaluronic acid"] = ("humectant", "High-capacity humectant holding up to 1000x its weight in water", new[] { "Plumping Hydration", "Surface Smoothing" }, "safe", 0, 0, null),
        ["sodium hyaluronate"] = ("humectant", "Bio-compatible low molecular hyaluronic acid penetrating deep epidermal layers", new[] { "Intense Hydration", "Skin Plumping", "Elasticity Boost" }, "safe", 0, 0, null),
        ["salicylic acid"] = ("exfoliant", "Oil-soluble beta hydroxy acid penetrating pores to clear debris and blemish lesions", new[] { "BHA Pore Clearing", "Acne Blemish Defense", "Texture Smoothing" }, "safe", 0, 1, "Mild tingling on initial use. Always pair with SPF in daytime."),
        ["glycolic acid"] = ("exfoliant", "Alpha hydroxy acid accelerating cell renewal and shedding dead surface cells", new[] { "AHA Chemical Exfoliation", "Radiance Renewal", "Texture Refinement" }, "safe", 0, 2, "Increases sun sensitivity. Do not combine with strong retinoids in same step."),
        ["lactic acid"] = ("exfoliant", "Gentle hydrating alpha hydroxy acid smoothing rough texture while attracting moisture", new[] { "Gentle Exfoliation", "Hydrating Renewal", "Softening" }, "safe", 0, 1, null),
        ["retinol"] = ("anti-aging", "Gold-standard vitamin A stimulating collagen synthesis and cellular turnover", new[] { "Wrinkle Reduction", "Cellular Renewal", "Firmness Enhancement" }, "warning", 0, 2, "Potent active. Introduce gradually and alternate with exfoliating acids."),
        ["ascorbic acid"] = ("brightening", "Pure L-ascorbic acid providing antioxidant defense and fading dark spots", new[] { "Vitamin C Antioxidant Defense", "Dark Spot Brightening", "Collagen Support" }, "safe", 0, 2, "Low pH may tingle on reactive skin. Store away from direct sunlight."),
        ["ceramide"] = ("barrier-repair", "Essential lipid matrix component repairing intercellular moisture barrier", new[] { "Barrier Repair", "Moisture Seal", "Sensitivity Reduction" }, "safe", 0, 0, null),
        ["centella asiatica"] = ("soothing", "Ancient cica botanical extract rich in madecassoside calming reactive redness", new[] { "Redness Relief", "Micro-wound Healing", "Inflammation Calming" }, "safe", 0, 0, null),
        ["panthenol"] = ("soothing", "Pro-vitamin B5 delivering instant soothing relief and barrier hydration", new[] { "Barrier Repair", "Soothing Relief", "Redness Calming" }, "safe", 0, 0, null),
        ["squalane"] = ("emollient", "Skin-identical light lipid providing weightless nourishment without clogging pores", new[] { "Weightless Moisture", "Non-comedogenic Softening", "Lipid Replenishment" }, "safe", 0, 0, null),
        ["diisostearyl malate"] = ("emollient", "Premium ester providing velvety slip, high shine, and protective barrier", new[] { "Smooth Texture", "Moisture Softening", "Protective Cushion" }, "safe", 0, 0, null),
        ["dimethicone"] = ("emollient", "Breathable silicone elastomer smoothing texture and preventing trans-epidermal water loss", new[] { "Silky Slip", "Moisture Lock Barrier", "Surface Smoothing" }, "safe", 1, 0, null),
        ["tocopherol"] = ("active", "Vitamin E lipid-soluble antioxidant protecting formula from oxidation", new[] { "Antioxidant Defense", "Formula Stability", "Free Radical Protection" }, "safe", 0, 0, null),
        ["tocopheryl acetate"] = ("active", "Stable ester of Vitamin E conditioning skin and defending against free radicals", new[] { "Antioxidant Shield", "Skin Conditioning" }, "safe", 0, 0, null),
        ["parfum"] = ("fragrance", "Synthetic aromatic scent blend", new[] { "Sensory Aromatic Experience" }, "warning", 0, 2, "Potential sensitizer for reactive or compromised skin barriers."),
        ["fragrance"] = ("fragrance", "Synthetic aromatic scent blend", new[] { "Sensory Aromatic Experience" }, "warning", 0, 2, "Potential sensitizer for reactive or compromised skin barriers."),
        ["alcohol denat"] = ("active", "Quick-drying solvent enhancing formula penetration and lightweight feel", new[] { "Lightweight Finish", "Rapid Absorption" }, "warning", 0, 2, "May dehydrate dry, sensitive, or eczema-prone skin barriers."),
        ["phenoxyethanol"] = ("preservative", "Broad-spectrum cosmetic antimicrobial preservative preventing contamination", new[] { "Microbial Protection", "Formula Safety" }, "safe", 0, 0, null),
        ["titanium dioxide"] = ("sun-protection", "Physical mineral filter deflecting UVA and UVB radiation", new[] { "Broad-Spectrum UV Defense", "Physical Mineral Shield" }, "safe", 0, 0, null),
        ["zinc oxide"] = ("sun-protection", "Soothing mineral broad-spectrum sunscreen filter calming inflammation", new[] { "Broad-Spectrum UV Shield", "Anti-inflammatory Calming" }, "safe", 0, 0, null),
        ["caprylic/capric triglyceride"] = ("emollient", "Naturally derived coconut ester delivering rich silky emollience", new[] { "Silky Softening", "Skin Conditioning", "Non-greasy Nourishment" }, "safe", 0, 0, null),
        ["hydrogenated polyisobutene"] = ("emollient", "Synthetic fluid delivering smooth gloss finish and moisture barrier", new[] { "Gloss Cushion", "Moisture Retention" }, "safe", 0, 0, null),
        ["limonene"] = ("fragrance", "Natural citrus terpene component adding fresh aroma", new[] { "Natural Citrus Fragrance" }, "warning", 0, 1, "Citrus scent component with potential sensitizing properties."),
        ["citric acid"] = ("active", "Gentle AHA pH adjuster and mild surface radiance enhancer", new[] { "Formula pH Optimization", "Gentle Surface Glow" }, "safe", 0, 0, null),
        ["sodium hydroxide"] = ("active", "Precise pH balancing mineral salt ensuring formula skin compatibility", new[] { "Skin-Neutral pH Balance" }, "safe", 0, 0, null)
    };

    public ToolsService(IToolRepository toolRepository)
    {
        _toolRepository = toolRepository;
    }

    public async Task<InciAnalysisResponse> AnalyzeInciAsync(InciAnalysisRequest request, CancellationToken cancellationToken = default)
    {
        var rawText = request.IngredientsText?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new InciAnalysisResponse(
                Summary: "No ingredients provided for analysis.",
                FormulaRating: 5.0m,
                CompatibleSkinTypes: Array.Empty<CompatibleSkinTypeDto>(),
                Benefits: Array.Empty<string>(),
                Cautions: Array.Empty<CautionDto>(),
                CombinationWarnings: Array.Empty<CombinationWarningDto>(),
                ConditionEvaluation: null,
                IdentifiedIngredients: Array.Empty<AnalyzedIngredientDto>(),
                UnknownIngredients: Array.Empty<string>()
            );
        }

        var rawTokens = Regex.Split(rawText, @"[,;\n]")
            .Select(s => s.Trim().TrimEnd('.'))
            .Where(s => s.Length > 1)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var identified = new List<AnalyzedIngredientDto>();
        var unknown = new List<string>();
        var cautions = new List<CautionDto>();
        var benefitsSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var dbIngredients = await _toolRepository.GetAllIngredientsAsync(cancellationToken);
        var dbMap = dbIngredients.ToDictionary(i => i.InciName.ToLower().Trim(), i => i);

        foreach (var token in rawTokens)
        {
            var cleanToken = token.ToLower();
            var tokenClean = Regex.Replace(cleanToken, @"\(.*?\)", "").Trim();

            Ingredient? matchedDb = null;
            if (dbMap.TryGetValue(cleanToken, out var dbIng) || dbMap.TryGetValue(tokenClean, out dbIng))
            {
                matchedDb = dbIng;
            }
            else
            {
                matchedDb = dbIngredients.FirstOrDefault(i =>
                    cleanToken.Contains(i.InciName.ToLower()) || i.InciName.ToLower().Contains(tokenClean));
            }

            var dictMatchKey = CommonBeautyChemicals.Keys.FirstOrDefault(k =>
                cleanToken.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                k.Contains(tokenClean, StringComparison.OrdinalIgnoreCase));

            if (dictMatchKey != null)
            {
                var dictInfo = CommonBeautyChemicals[dictMatchKey];
                var targetAreas = request.TargetArea?.ToLower() switch
                {
                    "hair" => new[] { "hair" },
                    "body" => new[] { "body" },
                    _ => new[] { "face" }
                };

                identified.Add(new AnalyzedIngredientDto(
                    Name: token,
                    InciName: matchedDb?.InciName ?? token,
                    Category: dictInfo.Category,
                    SafetyStatus: dictInfo.Safety,
                    Function: matchedDb?.Description ?? dictInfo.Function,
                    Benefits: dictInfo.Benefits,
                    Caution: dictInfo.Caution,
                    ComedogenicRating: matchedDb?.ComedogenicRating ?? dictInfo.Comedo,
                    IrritationRating: matchedDb?.IrritationRating ?? dictInfo.Irritation,
                    TargetAreas: targetAreas
                ));

                foreach (var b in dictInfo.Benefits) benefitsSet.Add(b);
                if (!string.IsNullOrEmpty(dictInfo.Caution))
                {
                    cautions.Add(new CautionDto(dictInfo.Caution, token));
                }
            }
            else if (matchedDb != null)
            {
                var cat = (matchedDb.FunctionGroup?.ToLower()) switch
                {
                    "hydrating" => "humectant",
                    "exfoliating" => "exfoliant",
                    "antioxidant" => "active",
                    "soothing" => "soothing",
                    _ => "emollient"
                };

                var defaultBenefits = new[] { $"{matchedDb.FunctionGroup} Support", "Skin Conditioning" };
                var safety = (matchedDb.IrritationRating ?? 0) >= 2 ? "warning" : "safe";
                string? caution = (matchedDb.IrritationRating ?? 0) >= 2
                    ? $"Contains {matchedDb.InciName} with elevated irritation rating ({matchedDb.IrritationRating}/5)."
                    : null;

                identified.Add(new AnalyzedIngredientDto(
                    Name: token,
                    InciName: matchedDb.InciName,
                    Category: cat,
                    SafetyStatus: safety,
                    Function: matchedDb.Description ?? "Formulation stabilizing and conditioning agent.",
                    Benefits: defaultBenefits,
                    Caution: caution,
                    ComedogenicRating: matchedDb.ComedogenicRating ?? 0,
                    IrritationRating: matchedDb.IrritationRating ?? 0,
                    TargetAreas: new[] { request.TargetArea ?? "face" }
                ));

                foreach (var b in defaultBenefits) benefitsSet.Add(b);
                if (caution != null) cautions.Add(new CautionDto(caution, token));
            }
            else
            {
                if (cleanToken.Contains("oil") || cleanToken.Contains("butter") || cleanToken.Contains("wax") || cleanToken.Contains("ester"))
                {
                    identified.Add(new AnalyzedIngredientDto(
                        Name: token,
                        InciName: token,
                        Category: "emollient",
                        SafetyStatus: "safe",
                        Function: "Natural lipid or plant-derived nourishing emollient.",
                        Benefits: new[] { "Lipid Nourishment", "Moisture Sealing" },
                        Caution: null,
                        ComedogenicRating: 1,
                        IrritationRating: 0,
                        TargetAreas: new[] { request.TargetArea ?? "face" }
                    ));
                    benefitsSet.Add("Lipid Nourishment");
                }
                else if (cleanToken.Contains("extract") || cleanToken.Contains("ferment") || cleanToken.Contains("juice"))
                {
                    identified.Add(new AnalyzedIngredientDto(
                        Name: token,
                        InciName: token,
                        Category: "soothing",
                        SafetyStatus: "safe",
                        Function: "Botanical soothing phyto-nutrient extract.",
                        Benefits: new[] { "Botanical Defense", "Skin Calming" },
                        Caution: null,
                        ComedogenicRating: 0,
                        IrritationRating: 0,
                        TargetAreas: new[] { request.TargetArea ?? "face" }
                    ));
                    benefitsSet.Add("Botanical Defense");
                }
                else
                {
                    unknown.Add(token);
                }
            }
        }

        var combinationWarnings = new List<CombinationWarningDto>();
        var conflictRules = await _toolRepository.GetAllConflictRulesAsync(cancellationToken);
        var identifiedNames = identified.Select(i => i.Name.ToLower()).ToList();

        foreach (var rule in conflictRules)
        {
            var a = rule.ActiveIngredientA.ToLower();
            var b = rule.ActiveIngredientB.ToLower();

            var hasA = identifiedNames.Any(n => n.Contains(a) || a.Contains(n));
            var hasB = identifiedNames.Any(n => n.Contains(b) || b.Contains(n));

            if (hasA && hasB)
            {
                combinationWarnings.Add(new CombinationWarningDto(
                    Warning: $"Conflict detected between {rule.ActiveIngredientA} and {rule.ActiveIngredientB}: {rule.Reason}",
                    IngredientsInvolved: new[] { rule.ActiveIngredientA, rule.ActiveIngredientB },
                    Severity: rule.Severity,
                    Recommendation: rule.Recommendation
                ));
            }
        }

        var hasDryingAlcohol = identified.Any(i => i.Name.Contains("alcohol denat", StringComparison.OrdinalIgnoreCase));
        var hasHeavyOils = identified.Any(i => i.ComedogenicRating >= 2);
        var hasSensitizing = cautions.Count > 0;

        var oilyScore = Math.Clamp(85 - (hasHeavyOils ? 20 : 0) + (identified.Any(i => i.InciName.Contains("salicylic") || i.InciName.Contains("niacinamide")) ? 10 : 0), 40, 95);
        var dryScore = Math.Clamp(85 + (identified.Any(i => i.Category == "humectant" || i.Category == "emollient") ? 10 : 0) - (hasDryingAlcohol ? 25 : 0), 40, 98);
        var combiScore = Math.Clamp(90 - (hasHeavyOils && hasDryingAlcohol ? 20 : 0), 50, 95);
        var sensitiveScore = Math.Clamp(90 - (hasSensitizing ? 20 : 0) - (hasDryingAlcohol ? 15 : 0), 35, 95);
        var normalScore = 95;

        var compatibleSkinTypes = new List<CompatibleSkinTypeDto>
        {
            new("normal", normalScore, "Normal"),
            new("dry", dryScore, "Dry"),
            new("combination", combiScore, "Combination"),
            new("oily", oilyScore, "Oily"),
            new("sensitive", sensitiveScore, "Sensitive")
        };

        var finalRating = Math.Max(3.8m, 5.0m - (cautions.Count * 0.2m) - (combinationWarnings.Count * 0.5m));

        var summary = $"Formula successfully analyzed. Identified {identified.Count} active & functional ingredients. " +
                      (benefitsSet.Count > 0 ? $"Primary benefits include: {string.Join(", ", benefitsSet.Take(3))}." : "Well-balanced formulation profile.");

        ConditionEvaluationDto? conditionEval = null;
        if (!string.IsNullOrWhiteSpace(request.Condition))
        {
            conditionEval = new ConditionEvaluationDto(request.Condition, true);
        }

        return new InciAnalysisResponse(
            Summary: summary,
            FormulaRating: Math.Round(finalRating, 1),
            CompatibleSkinTypes: compatibleSkinTypes,
            Benefits: benefitsSet.ToList(),
            Cautions: cautions,
            CombinationWarnings: combinationWarnings,
            ConditionEvaluation: conditionEval,
            IdentifiedIngredients: identified,
            UnknownIngredients: unknown
        );
    }

    public async Task<ConflictCheckResponse> CheckCartConflictsAsync(ConflictCheckRequest request, CancellationToken cancellationToken = default)
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
                    var a = rule.ActiveIngredientA.ToLower();
                    var b = rule.ActiveIngredientB.ToLower();

                    var p1HasA = ing1.Any(x => x.ToLower().Contains(a));
                    var p2HasB = ing2.Any(x => x.ToLower().Contains(b));

                    var p1HasB = ing1.Any(x => x.ToLower().Contains(b));
                    var p2HasA = ing2.Any(x => x.ToLower().Contains(a));

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
                vi_name = "Oily Skin (Da Dầu)",
                characteristics = "Excess sebum production, enlarged pores, prone to blackheads and blemishes.",
                recommended_ingredients = new[] { "Salicylic Acid (BHA)", "Niacinamide", "Zinc PCA", "Hyaluronic Acid" },
                ingredients_to_avoid = new[] { "Mineral Oil", "High-percentage Shea Butter", "Heavy Silicones" }
            },
            ["dry"] = new
            {
                vi_name = "Dry Skin (Da Khô)",
                characteristics = "Tight sensation, flaky patches, compromised lipid barrier, rough texture.",
                recommended_ingredients = new[] { "Ceramides", "Hyaluronic Acid", "Squalane", "Glycerin", "Panthenol" },
                ingredients_to_avoid = new[] { "Alcohol Denat", "High-strength AHA peels", "Strong foaming sulfates" }
            },
            ["combination"] = new
            {
                vi_name = "Combination Skin (Da Hỗn Hợp)",
                characteristics = "Oily T-zone (forehead, nose, chin) with normal to dry cheeks.",
                recommended_ingredients = new[] { "Niacinamide", "Lightweight Hyaluronic Gel", "Centella Asiatica" },
                ingredients_to_avoid = new[] { "Heavy pore-clogging waxes in T-zone" }
            },
            ["sensitive"] = new
            {
                vi_name = "Sensitive Skin (Da Nhạy Cảm)",
                characteristics = "Easily flushed, reactive to fragrance, stinging sensation, prone to contact dermatitis.",
                recommended_ingredients = new[] { "Centella Asiatica", "Madecassoside", "Panthenol", "Colloidal Oatmeal", "Allantoin" },
                ingredients_to_avoid = new[] { "Synthetic Fragrance (Parfum)", "Essential Oils", "Alcohol Denat" }
            },
            ["normal"] = new
            {
                vi_name = "Normal Skin (Da Thường)",
                characteristics = "Well-balanced sebum and hydration, smooth texture, resilient barrier.",
                recommended_ingredients = new[] { "Vitamin C", "Peptides", "Hyaluronic Acid", "Antioxidants" },
                ingredients_to_avoid = new[] { "Over-exfoliation from multi-acid stacking" }
            }
        };

        return Task.FromResult<object>(new { guide });
    }
}
