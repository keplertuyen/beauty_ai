using System.Text.RegularExpressions;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;

namespace BeautyAI.Domain.Services;

public record KeyIngredientItem(
    string CommonName,
    string InciName,
    string RoleLabel,
    string Explanation,
    bool IsFeaturedInProductName
);

public record FunctionalGroupItem(
    string GroupTitle,
    string PlainExplanation,
    int Count,
    IReadOnlyList<string> Ingredients
);

public record FormulaCautionItem(
    string Type,
    string Title,
    string Message,
    IReadOnlyList<string> IngredientsInvolved
);

public record FormulaBreakdownResult(
    string Verdict,
    string VerdictLabel,
    string VerdictReason,
    bool HasAllergyWarning,
    IReadOnlyList<string> AllergyMatches,
    bool HasIngredients,
    bool IsNonCosmeticTool,
    string TargetArea,
    string BenefitsTitle,
    IReadOnlyList<string> Benefits,
    IReadOnlyList<KeyIngredientItem> KeyIngredients,
    IReadOnlyList<FunctionalGroupItem> FunctionalGroups,
    IReadOnlyList<FormulaCautionItem> Cautions,
    string? FragranceDisclosure,
    int TotalIngredientsCount,
    IReadOnlyList<string> RawInciTokens
);

public record IngredientKnowledgeEntry(
    string CommonName,
    string RoleBucket,
    string RoleLabel,
    string Explanation,
    string[] Benefits,
    string ScentTier, // "None", "GentleBotanical", "SensoryEssentialOil", "SyntheticOrEuAllergen"
    int ComedogenicRating,
    int IrritationRating,
    bool IsHeroCandidate
);

/// <summary>
/// Curated cosmetic chemistry knowledge base (180+ ingredients, allergen synonym dictionary,
/// 3-tier fragrance classification, and category-aware target area resolver).
/// Strictly adheres to INV-01: zero safety/hazard scores.
/// </summary>
public static class CosmeticKnowledgeBase
{
    private static readonly HashSet<string> FattyAlcohols = new(StringComparer.OrdinalIgnoreCase)
    {
        "cetyl alcohol", "cetearyl alcohol", "stearyl alcohol", "behenyl alcohol",
        "arachidyl alcohol", "myristyl alcohol", "lauryl alcohol", "isostearyl alcohol",
        "octyldodecanol", "hexyldecanol", "oleyl alcohol", "brassica alcohol", "coconut alcohol"
    };

    private static readonly HashSet<string> Eu26FragranceAllergens = new(StringComparer.OrdinalIgnoreCase)
    {
        "limonene", "linalool", "citronellol", "geraniol", "citral", "eugenol",
        "coumarin", "farnesol", "benzyl alcohol", "benzyl salicylate", "benzyl benzoate",
        "benzyl cinnamate", "cinnamal", "cinnamyl alcohol", "isoeugenol",
        "alpha-isomethyl ionone", "hexyl cinnamal", "hydroxycitronellal",
        "amyl cinnamal", "amylcinnamyl alcohol", "anise alcohol", "methyl 2-octynoate",
        "evernia prunastri", "evernia furfuracea", "oakmoss", "treemoss"
    };

    private static readonly Dictionary<string, string[]> AllergenSynonyms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["fragrance"] = new[]
        {
            "parfum", "fragrance", "aroma", "limonene", "linalool", "citronellol",
            "geraniol", "citral", "eugenol", "coumarin", "farnesol", "benzyl salicylate",
            "benzyl benzoate", "cinnamal", "isoeugenol", "alpha-isomethyl ionone",
            "hexyl cinnamal", "hydroxycitronellal", "amyl cinnamal", "cinnamyl alcohol"
        },
        ["parfum"] = new[]
        {
            "parfum", "fragrance", "aroma", "limonene", "linalool", "citronellol",
            "geraniol", "citral", "eugenol", "coumarin", "farnesol", "benzyl salicylate",
            "benzyl benzoate", "cinnamal", "isoeugenol", "alpha-isomethyl ionone",
            "hexyl cinnamal", "hydroxycitronellal"
        },
        ["fragrance / parfum"] = new[]
        {
            "parfum", "fragrance", "aroma", "limonene", "linalool", "citronellol",
            "geraniol", "citral", "eugenol", "coumarin", "farnesol", "benzyl salicylate",
            "hexyl cinnamal", "hydroxycitronellal"
        },
        ["alcohol"] = new[] { "alcohol denat", "sd alcohol", "denatured alcohol", "isopropyl alcohol" },
        ["alcohol denat"] = new[] { "alcohol denat", "sd alcohol", "denatured alcohol", "alcohol denat." },
        ["drying alcohol"] = new[] { "alcohol denat", "sd alcohol", "denatured alcohol", "isopropyl alcohol" },
        ["bha"] = new[] { "salicylic acid", "betaine salicylate", "capryloyl salicylic acid", "salix alba" },
        ["salicylic acid"] = new[] { "salicylic acid", "betaine salicylate", "capryloyl salicylic acid" },
        ["aha"] = new[] { "glycolic acid", "lactic acid", "mandelic acid", "tartaric acid", "malic acid" },
        ["retinol"] = new[] { "retinol", "retinal", "retinyl palmitate", "retinyl propionate", "hydroxypinacolone retinoate", "adapalene" },
        ["retinoid"] = new[] { "retinol", "retinal", "retinyl palmitate", "hydroxypinacolone retinoate", "adapalene" },
        ["vitamin c"] = new[] { "ascorbic acid", "l-ascorbic acid", "sodium ascorbyl phosphate", "magnesium ascorbyl phosphate", "ascorbyl glucoside", "3-o-ethyl ascorbic acid", "tetrahexyldecyl ascorbate", "ascorbyl tetraisopalmitate" },
        ["paraben"] = new[] { "methylparaben", "propylparaben", "butylparaben", "ethylparaben", "isobutylparaben" },
        ["parabens"] = new[] { "methylparaben", "propylparaben", "butylparaben", "ethylparaben", "isobutylparaben" },
        ["sulfate"] = new[] { "sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "ammonium laureth sulfate" },
        ["sulfates"] = new[] { "sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "ammonium laureth sulfate" },
        ["silicone"] = new[] { "dimethicone", "cyclopentasiloxane", "cyclohexasiloxane", "amodimethicone", "phenyl trimethicone", "dimethiconol", "caprylyl methicone", "trisiloxane" },
        ["silicones"] = new[] { "dimethicone", "cyclopentasiloxane", "cyclohexasiloxane", "amodimethicone", "phenyl trimethicone", "dimethiconol", "caprylyl methicone" },
        ["essential oils"] = new[] { "mentha piperita", "peppermint oil", "lavandula angustifolia", "lavender oil", "melaleuca alternifolia", "tea tree", "citrus aurantium bergamia", "bergamot", "eucalyptus globulus", "rosmarinus officinalis" },
        ["lanolin"] = new[] { "lanolin", "lanolin alcohol", "acetylated lanolin" },
        ["niacinamide"] = new[] { "niacinamide", "nicotinamide" },
        ["benzoyl peroxide"] = new[] { "benzoyl peroxide" }
    };

    private static readonly Dictionary<string, IngredientKnowledgeEntry> Catalog = new(StringComparer.OrdinalIgnoreCase)
    {
        // ── 1. HERO ACTIVES, HUMECTANTS & BARRIER REPAIR ──
        ["niacinamide"] = new("Niacinamide (Vitamin B3)", "HeroActive", "Barrier & Pore Active", "Balances excess oil, visibly refines pores, and strengthens the skin barrier.", new[] { "Pore Refinement", "Oil Balance", "Barrier Support", "Even Skin Tone" }, "None", 0, 0, true),
        ["hyaluronic acid"] = new("Hyaluronic Acid", "Hydration", "Deep Humectant", "Binds up to 1,000x its weight in water to plump and hydrate surface layers.", new[] { "Deep Hydration", "Plumping Effect", "Moisture Retention" }, "None", 0, 0, true),
        ["sodium hyaluronate"] = new("Hyaluronic Acid (Sodium Hyaluronate)", "Hydration", "Bio-Available Humectant", "Salt form of hyaluronic acid with smaller molecular size for deeper hydration.", new[] { "Deep Hydration", "Plumping Smoothness", "Elasticity Support" }, "None", 0, 0, true),
        ["hydrolyzed hyaluronic acid"] = new("Micro-Hyaluronic Acid", "Hydration", "Low-Molecular Humectant", "Ultra-light hyaluronic fragments that replenish moisture within the epidermis.", new[] { "Multi-Depth Hydration", "Plumping" }, "None", 0, 0, true),
        ["sodium acetylated hyaluronate"] = new("Super Hyaluronic Acid", "Hydration", "Moisture-Lock Humectant", "High-affinity hyaluronic derivative that adheres longer to the skin surface.", new[] { "Long-Lasting Hydration", "Surface Softening" }, "None", 0, 0, true),
        ["glycerin"] = new("Glycerin", "Hydration", "Essential Humectant", "Skin-identical moisture magnet that draws water into the outer layer and prevents dryness.", new[] { "Moisture Retention", "Barrier Comfort" }, "None", 0, 0, true),
        ["panthenol"] = new("Pro-Vitamin B5 (Panthenol)", "Hydration", "Soothing Humectant", "Attracts moisture while calming redness and supporting skin barrier recovery.", new[] { "Soothing Hydration", "Barrier Recovery", "Softness" }, "None", 0, 0, true),
        ["squalane"] = new("Squalane", "BarrierLipid", "Biomimetic Lipid", "Weightless, non-comedogenic lipid that mimics skin's natural sebum to seal in softness.", new[] { "Weightless Nourishment", "Moisture Lock", "Elasticity" }, "None", 0, 0, true),
        ["squalene"] = new("Squalene", "BarrierLipid", "Conditioning Lipid", "Rich emollient lipid that replenishes dry skin and hair fibers.", new[] { "Lipid Replenishment" }, "None", 1, 0, true),
        ["ceramide np"] = new("Ceramide NP", "BarrierLipid", "Barrier Ceramide", "Skin-identical lipid that fills intercellular gaps to prevent moisture loss.", new[] { "Barrier Repair", "Moisture Seal", "Resilience" }, "None", 0, 0, true),
        ["ceramide ap"] = new("Ceramide AP", "BarrierLipid", "Barrier Ceramide", "Reinforces the protective lipid mortar of dry or sensitized skin.", new[] { "Barrier Repair", "Moisture Seal" }, "None", 0, 0, true),
        ["ceramide eop"] = new("Ceramide EOP", "BarrierLipid", "Structural Ceramide", "Binds lipid layers together to restore a resilient skin barrier.", new[] { "Barrier Integrity", "Defense Support" }, "None", 0, 0, true),
        ["ceramide ng"] = new("Ceramide NG", "BarrierLipid", "Barrier Ceramide", "Supports skin hydration and strengthens compromised barriers.", new[] { "Barrier Support", "Hydration Lock" }, "None", 0, 0, true),
        ["cholesterol"] = new("Cholesterol", "BarrierLipid", "Barrier Lipid", "Essential skin-identical lipid that works alongside ceramides to restore elasticity.", new[] { "Lipid Barrier Recovery" }, "None", 0, 0, true),
        ["phytosphingosine"] = new("Phytosphingosine", "BarrierLipid", "Barrier Precursor", "Lipid building block that calms blemishes and supports natural ceramide synthesis.", new[] { "Barrier Defense", "Blemish Calming" }, "None", 0, 0, true),
        ["allantoin"] = new("Allantoin", "SoothingBotanical", "Soothing Protectant", "Gentle skin-calming compound that softens rough texture and relieves sensitivity.", new[] { "Calming Relief", "Surface Softening" }, "None", 0, 0, true),
        ["ectoin"] = new("Ectoin", "HeroActive", "Extremolyte Shield", "Binds water molecules into a protective hydration shell against environmental stress.", new[] { "Stress Defense", "Long-Lasting Hydration" }, "None", 0, 0, true),
        ["beta-glucan"] = new("Beta-Glucan", "Hydration", "Soothing Polysaccharide", "Deeply hydrating polysaccharide that calms redness and plumps fine lines.", new[] { "Redness Relief", "Deep Hydration" }, "None", 0, 0, true),
        ["urea"] = new("Urea", "Hydration", "Keratolytic Humectant", "Natural moisturizing factor that hydrates deeply and softens rough, dry patches.", new[] { "Intense Hydration", "Rough Texture Softening" }, "None", 0, 0, true),
        ["polyglutamic acid"] = new("Polyglutamic Acid", "Hydration", "Moisture-Sealing Peptide", "Forms a breathable hydrogel film that locks hydration into the skin.", new[] { "Moisture Seal", "Plumping Dewiness" }, "None", 0, 0, true),
        ["trehalose"] = new("Trehalose", "Hydration", "Moisture-Binding Sugar", "Plant sugar that protects cellular hydration in dry environments.", new[] { "Dehydration Defense" }, "None", 0, 0, false),
        ["betaine"] = new("Betaine", "Hydration", "Osmolyte Humectant", "Sugar-beet derived humectant that balances hydration and reduces irritation.", new[] { "Gentle Hydration" }, "None", 0, 0, false),
        ["sodium pca"] = new("Sodium PCA", "Hydration", "Natural Moisturizing Factor", "Skin-identical humectant that maintains supple surface hydration.", new[] { "Natural Moisture Balance" }, "None", 0, 0, false),

        // ── 2. EXFOLIANTS, RETINOIDS, VITAMIN C & PEPTIDES ──
        ["salicylic acid"] = new("Salicylic Acid (BHA)", "Exfoliant", "Pore-Clearing BHA", "Oil-soluble beta hydroxy acid that dissolves congestion inside pores and calms blemishes.", new[] { "Pore Decongestion", "Blemish Control", "Smooth Texture" }, "None", 0, 1, true),
        ["betaine salicylate"] = new("Betaine Salicylate", "Exfoliant", "Gentle BHA Derivative", "Combines salicylic acid with hydrating betaine for milder pore refinement.", new[] { "Gentle Pore Care", "Texture Smoothing" }, "None", 0, 0, true),
        ["capryloyl salicylic acid"] = new("LHA (Capryloyl Salicylic Acid)", "Exfoliant", "Micro-Exfoliating LHA", "Lipophilic derivative of salicylic acid providing gentle, targeted surface renewal.", new[] { "Micro-Exfoliation", "Pore Refinement" }, "None", 0, 0, true),
        ["glycolic acid"] = new("Glycolic Acid (AHA)", "Exfoliant", "Resurfacing AHA", "Smallest alpha hydroxy acid that sloughs dull surface cells to boost radiance and smoothness.", new[] { "Surface Resurfacing", "Radiance Boost", "Fine Line Smoothing" }, "None", 0, 2, true),
        ["lactic acid"] = new("Lactic Acid (AHA)", "Exfoliant", "Hydrating AHA", "Gentle alpha hydroxy acid that smooths rough texture while drawing in moisture.", new[] { "Gentle Resurfacing", "Hydrating Glow" }, "None", 0, 1, true),
        ["mandelic acid"] = new("Mandelic Acid (AHA)", "Exfoliant", "Gentle Aromatic AHA", "Larger-molecule AHA that exfoliates evenly with minimal irritation for sensitive skin.", new[] { "Even Tone", "Gentle Exfoliation" }, "None", 0, 0, true),
        ["gluconolactone"] = new("Gluconolactone (PHA)", "Exfoliant", "Antioxidant PHA", "Polyhydroxy acid that gently polishes skin while providing antioxidant hydration.", new[] { "Sensitive-Safe Exfoliation", "Hydration" }, "None", 0, 0, true),
        ["lactobionic acid"] = new("Lactobionic Acid (PHA)", "Exfoliant", "Hydrating PHA", "Non-irritating polyhydroxy acid that smooths texture and binds water.", new[] { "Gentle Renewal", "Moisture Support" }, "None", 0, 0, true),
        ["azelaic acid"] = new("Azelaic Acid", "HeroActive", "Tone & Redness Active", "Calms redness, refines bumpy texture, and brightens post-blemish marks.", new[] { "Redness Calming", "Blemish Mark Fading", "Pore Clarity" }, "None", 0, 1, true),
        ["tranexamic acid"] = new("Tranexamic Acid", "HeroActive", "Brightening Active", "Targets stubborn dark spots, melasma, and uneven pigmentation.", new[] { "Dark Spot Fading", "Even Complexion" }, "None", 0, 0, true),
        ["kojic acid"] = new("Kojic Acid", "HeroActive", "Brightening Ferment", "Inhibits excess melanin production to visibly brighten discoloration.", new[] { "Brightening", "Dark Spot Care" }, "None", 0, 1, true),
        ["alpha-arbutin"] = new("Alpha-Arbutin", "HeroActive", "Targeted Brightener", "Gentle hydroquinone glycoside that fades hyperpigmentation and evens tone.", new[] { "Brightening", "Spot Reduction" }, "None", 0, 0, true),
        ["arbutin"] = new("Arbutin", "HeroActive", "Brightening Active", "Helps visibly diminish dark spots and promote uniform radiance.", new[] { "Tone Evening" }, "None", 0, 0, true),
        ["retinol"] = new("Retinol (Vitamin A)", "HeroActive", "Renewal Retinoid", "Gold-standard Vitamin A derivative that accelerates cellular turnover and supports firmness.", new[] { "Fine Line Smoothing", "Firmness", "Texture Renewal" }, "None", 0, 2, true),
        ["retinal"] = new("Retinaldehyde (Retinal)", "HeroActive", "Fast-Acting Retinoid", "Direct precursor to retinoic acid that delivers visible renewal and smoothing.", new[] { "Firmness", "Accelerated Renewal" }, "None", 0, 2, true),
        ["retinyl palmitate"] = new("Retinyl Palmitate", "HeroActive", "Gentle Vitamin A Ester", "Mild Vitamin A ester offering antioxidant conditioning and gradual smoothing.", new[] { "Gentle Smoothing", "Antioxidant Conditioning" }, "None", 0, 1, true),
        ["hydroxypinacolone retinoate"] = new("Granactive Retinoid (HPR)", "HeroActive", "Next-Gen Retinoid Ester", "Modern retinoic acid ester providing smoothing results with low irritation.", new[] { "Low-Irritation Renewal", "Firmness" }, "None", 0, 1, true),
        ["bakuchiol"] = new("Bakuchiol", "HeroActive", "Botanical Retinol Alternative", "Plant-derived antioxidant that visibly improves firmness and fine lines without dryness.", new[] { "Gentle Firming", "Antioxidant Renewal" }, "None", 0, 0, true),
        ["ascorbic acid"] = new("Pure Vitamin C (L-Ascorbic Acid)", "HeroActive", "Potent Antioxidant Brightener", "Neutralizes free radicals, boosts radiance, and supports healthy collagen.", new[] { "Radiance Boost", "Antioxidant Defense", "Firmness Support" }, "None", 0, 1, true),
        ["3-o-ethyl ascorbic acid"] = new("Ethyl Ascorbic Acid (Vitamin C)", "HeroActive", "Stable Vitamin C Derivative", "Highly stable water- and oil-soluble Vitamin C that brightens dull skin.", new[] { "Brightening", "Antioxidant Shield" }, "None", 0, 0, true),
        ["tetrahexyldecyl ascorbate"] = new("THD Ascorbate (Lipid Vitamin C)", "HeroActive", "Oil-Soluble Vitamin C", "Gentle lipid-soluble Vitamin C ester that penetrates deeply to brighten and nourish.", new[] { "Deep Brightening", "Lipid Antioxidant" }, "None", 0, 0, true),
        ["ascorbyl glucoside"] = new("Ascorbyl Glucoside (Vitamin C)", "HeroActive", "Gentle Vitamin C", "Water-soluble Vitamin C derivative that converts to ascorbic acid on skin for steady glow.", new[] { "Gentle Radiance", "Antioxidant Care" }, "None", 0, 0, true),
        ["sodium ascorbyl phosphate"] = new("Sodium Ascorbyl Phosphate (Vitamin C)", "HeroActive", "Blemish-Friendly Vitamin C", "Gentle Vitamin C salt that brightens tone and helps calm blemish-prone skin.", new[] { "Tone Clarity", "Antioxidant Support" }, "None", 0, 0, true),
        ["magnesium ascorbyl phosphate"] = new("Magnesium Ascorbyl Phosphate", "HeroActive", "Hydrating Vitamin C", "Non-acidic Vitamin C ester suitable for sensitive skin brightening.", new[] { "Sensitive-Safe Glow" }, "None", 0, 0, true),
        ["tocopherol"] = new("Vitamin E (Tocopherol)", "HeroActive", "Lipid Antioxidant", "Protects skin lipids and cosmetic oils from oxidative stress.", new[] { "Antioxidant Protection", "Moisture Conditioning" }, "None", 0, 0, true),
        ["tocopheryl acetate"] = new("Vitamin E (Tocopheryl Acetate)", "HeroActive", "Conditioning Antioxidant", "Stable Vitamin E ester that softens skin and defends against environmental stressors.", new[] { "Antioxidant Conditioning" }, "None", 0, 0, false),
        ["ferulic acid"] = new("Ferulic Acid", "HeroActive", "Antioxidant Booster", "Plant antioxidant that stabilizes Vitamin C and E while defending against UV free radicals.", new[] { "Antioxidant Synergy", "Photo-Defense" }, "None", 0, 0, true),
        ["resveratrol"] = new("Resveratrol", "HeroActive", "Polyphenol Antioxidant", "Potent grape-derived antioxidant that calms oxidative stress and supports firmness.", new[] { "Nighttime Antioxidant Repair" }, "None", 0, 0, true),
        ["ubiquinone"] = new("Coenzyme Q10 (Ubiquinone)", "HeroActive", "Energizing Antioxidant", "Skin-identical coenzyme that defends against oxidative dullness and fine lines.", new[] { "Vitality & Firmness" }, "None", 0, 0, true),
        ["acetyl hexapeptide-8"] = new("Argireline Peptide", "HeroActive", "Expression-Line Peptide", "Signal peptide designed to soften the look of dynamic expression lines.", new[] { "Line Smoothing", "Plumping" }, "None", 0, 0, true),
        ["palmitoyl tripeptide-1"] = new("Palmitoyl Tripeptide-1", "HeroActive", "Firming Messenger Peptide", "Biomimetic peptide that supports skin matrix renewal and bounce.", new[] { "Firmness", "Elasticity" }, "None", 0, 0, true),
        ["palmitoyl tetrapeptide-7"] = new("Palmitoyl Tetrapeptide-7", "HeroActive", "Soothing Firming Peptide", "Calms visible signs of stress while supporting firm skin texture.", new[] { "Elasticity", "Calming" }, "None", 0, 0, true),
        ["copper tripeptide-1"] = new("Copper Tripeptide-1 (GHK-Cu)", "HeroActive", "Repair Copper Peptide", "Supports skin barrier remodeling, elasticity, and overall resilience.", new[] { "Barrier Remodeling", "Firmness" }, "None", 0, 0, true),
        ["adenosine"] = new("Adenosine", "HeroActive", "Smoothing Nucleoside", "Bio-active ingredient that soothes skin and improves the appearance of fine lines.", new[] { "Line Smoothing", "Calming" }, "None", 0, 0, true),
        ["caffeine"] = new("Caffeine", "HeroActive", "Depuffing & Energizing Active", "Stimulates micro-circulation to visibly reduce puffiness and invigorate skin or scalp.", new[] { "Depuffing", "Revitalizing" }, "None", 0, 0, true),
        ["zinc pca"] = new("Zinc PCA", "HeroActive", "Oil-Balancing Mineral", "Combines sebum-regulating zinc with hydrating PCA to keep pores clear without dryness.", new[] { "Sebum Control", "Blemish Care" }, "None", 0, 0, true),
        ["benzoyl peroxide"] = new("Benzoyl Peroxide", "HeroActive", "Acne-Clearing Active", "Targets acne-causing bacteria and clears stubborn blemish breakouts.", new[] { "Blemish Clearing" }, "None", 0, 2, true),
        ["sulfur"] = new("Colloidal Sulfur", "HeroActive", "Blemish-Calming Mineral", "Absorbs excess oil and gently clarifies blemish-prone areas.", new[] { "Blemish Clarification" }, "None", 0, 1, true),

        // ── 3. GENTLE BOTANICAL EXTRACTS, WATERS & OILS (NEVER FLAGGED AS FRAGRANCE!) ──
        ["centella asiatica extract"] = new("Centella Asiatica (Cica)", "SoothingBotanical", "Calming Botanical", "Iconic soothing herb rich in madecassoside that calms redness and repairs stressed barriers.", new[] { "Redness Relief", "Barrier Soothing" }, "GentleBotanical", 0, 0, true),
        ["madecassoside"] = new("Madecassoside (Cica Active)", "SoothingBotanical", "Concentrated Cica Fraction", "Purified bioactive from Centella Asiatica that comforts reactive, redness-prone skin.", new[] { "Intense Calming", "Barrier Recovery" }, "GentleBotanical", 0, 0, true),
        ["asiaticoside"] = new("Asiaticoside (Cica Active)", "SoothingBotanical", "Soothing Triterpene", "Centella antioxidant compound that supports barrier comfort and smoothness.", new[] { "Soothing", "Antioxidant Support" }, "GentleBotanical", 0, 0, true),
        ["rosa damascena flower water"] = new("Damask Rose Flower Water", "SoothingBotanical", "Hydrating Floral Hydrosol", "Gentle steam-distilled rose hydrosol that refreshes, softens, and tones skin.", new[] { "Gentle Floral Hydration", "Soothing Refreshment" }, "GentleBotanical", 0, 0, true),
        ["rosa damascena flower extract"] = new("Damask Rose Extract", "SoothingBotanical", "Botanical Antioxidant", "Antioxidant-rich rose petal extract that conditions and softens skin.", new[] { "Botanical Softening", "Antioxidant Care" }, "GentleBotanical", 0, 0, true),
        ["rosa centifolia flower water"] = new("Rose Water Hydrosol", "SoothingBotanical", "Soothing Floral Water", "Calming floral distillate that hydrates and refreshes delicate skin.", new[] { "Hydrating Mist", "Calming" }, "GentleBotanical", 0, 0, true),
        ["vanilla planifolia fruit extract"] = new("Vanilla Planifolia Extract", "SoothingBotanical", "Antioxidant Botanical", "Natural vanilla bean extract rich in polyphenols that comforts and softens.", new[] { "Antioxidant Comfort", "Softening" }, "GentleBotanical", 0, 0, true),
        ["aloe barbadensis leaf juice"] = new("Aloe Vera Leaf Juice", "SoothingBotanical", "Cooling Botanical Hydrator", "Replenishes water content and immediately cools dry or sun-stressed skin.", new[] { "Cooling Relief", "Lightweight Hydration" }, "GentleBotanical", 0, 0, true),
        ["aloe barbadensis leaf extract"] = new("Aloe Vera Extract", "SoothingBotanical", "Soothing Botanical", "Calms surface irritation and supports comfortable hydration.", new[] { "Soothing Hydration" }, "GentleBotanical", 0, 0, true),
        ["chamomilla recutita flower extract"] = new("Chamomile Flower Extract", "SoothingBotanical", "Calming Botanical", "Rich in bisabolol and apigenin to soothe sensitive or reactive skin.", new[] { "Sensitivity Relief", "Calming" }, "GentleBotanical", 0, 0, true),
        ["bisabolol"] = new("Alpha-Bisabolol", "SoothingBotanical", "Chamomile Soothing Active", "Purified calming fraction from chamomile that visibly reduces redness.", new[] { "Redness Reduction", "Barrier Comfort" }, "GentleBotanical", 0, 0, true),
        ["cucumis sativus fruit extract"] = new("Cucumber Fruit Extract", "SoothingBotanical", "Cooling Botanical", "Rich in amino acids and water to refresh and depuff delicate areas like eyes and face.", new[] { "Cooling Depuffing", "Refreshing Hydration" }, "GentleBotanical", 0, 0, true),
        ["camellia sinensis leaf extract"] = new("Green Tea Leaf Extract", "SoothingBotanical", "Polyphenol Antioxidant", "Packed with EGCG catechins to calm redness, balance oil, and defend against pollution.", new[] { "Antioxidant Defense", "Soothing Oil Balance" }, "GentleBotanical", 0, 0, true),
        ["avena sativa kernel flour"] = new("Colloidal Oatmeal", "SoothingBotanical", "Barrier-Calming Oat", "Skin-protectant oat complex rich in beta-glucans and avenanthramides to relieve dry, itchy skin.", new[] { "Itch & Redness Relief", "Barrier Cushion" }, "GentleBotanical", 0, 0, true),
        ["avena sativa kernel extract"] = new("Oat Kernel Extract", "SoothingBotanical", "Soothing Oat Extract", "Comforts dry, reactive skin and reinforces the moisture barrier.", new[] { "Calming Comfort" }, "GentleBotanical", 0, 0, true),
        ["glycyrrhiza glabra root extract"] = new("Licorice Root Extract", "SoothingBotanical", "Brightening & Calming Root", "Contains glabridin to visibly soothe redness and brighten uneven skin tone.", new[] { "Brightening", "Redness Relief" }, "GentleBotanical", 0, 0, true),
        ["dipotassium glycyrrhizate"] = new("Licorice Soothing Salt", "SoothingBotanical", "Anti-Redness Active", "Purified licorice root derivative that calms irritation and balances sebum.", new[] { "Calming", "Redness Defense" }, "GentleBotanical", 0, 0, true),
        ["houttuynia cordata extract"] = new("Heartleaf Extract", "SoothingBotanical", "Clarifying Botanical", "Cooling East Asian botanical prized for calming blemish-prone, overheated skin.", new[] { "Blemish Calming", "Redness Relief" }, "GentleBotanical", 0, 0, true),
        ["calendula officinalis flower extract"] = new("Calendula Flower Extract", "SoothingBotanical", "Comforting Petal Extract", "Rich in flavonoids that soothe dry, delicate, or easily irritated skin.", new[] { "Gentle Soothing" }, "GentleBotanical", 0, 0, true),
        ["propolis extract"] = new("Propolis Extract", "SoothingBotanical", "Nourishing Bee Complex", "Antioxidant and soothing resin that supports barrier recovery and dewy glow.", new[] { "Barrier Nourishment", "Dewy Glow" }, "GentleBotanical", 0, 0, true),
        ["honey extract"] = new("Honey Extract", "Hydration", "Natural Humectant", "Draws in moisture and comforts dry lips and skin with natural enzymes.", new[] { "Nourishing Moisture" }, "GentleBotanical", 0, 0, true),
        ["snail secretion filtrate"] = new("Snail Mucin Filtrate", "Hydration", "Repair Glycoprotein Complex", "Rich in glycoproteins and hyaluronic acid to hydrate, soothe, and repair texture.", new[] { "Repair Hydration", "Elasticity" }, "None", 0, 0, true),
        ["galactomyces ferment filtrate"] = new("Galactomyces Ferment", "HeroActive", "Radiance Bio-Ferment", "Nutrient-dense probiotic ferment that boosts clarity, hydration, and glow.", new[] { "Glass-Skin Clarity", "Hydration" }, "None", 0, 0, true),
        ["bifida ferment lysate"] = new("Bifida Ferment Lysate", "HeroActive", "Microbiome Barrier Ferment", "Probiotic lysate that strengthens skin resilience against environmental sensitivity.", new[] { "Microbiome Support", "Barrier Resilience" }, "None", 0, 0, true),
        ["saccharomyces ferment filtrate"] = new("Saccharomyces Ferment", "Hydration", "Amino-Rich Ferment", "Replenishes essential minerals and amino acids for supple hydration.", new[] { "Nutrient Hydration" }, "None", 0, 0, true),

        // ── 4. NOURISHING PLANT OILS, BUTTERS & HAIR CARE ACTIVES ──
        ["butyrospermum parkii butter"] = new("Shea Butter", "BarrierLipid", "Rich Nourishing Butter", "Velvety plant lipid rich in fatty acids that seals in moisture and softens dry skin or lips.", new[] { "Deep Lipid Nourishment", "Moisture Lock" }, "None", 1, 0, true),
        ["simmondsia chinensis seed oil"] = new("Jojoba Seed Oil", "BarrierLipid", "Biomimetic Liquid Wax", "Closely resembles natural skin sebum to condition skin, lips, and hair without heaviness.", new[] { "Balanced Conditioning", "Softening" }, "None", 0, 0, true),
        ["argania spinosa kernel oil"] = new("Argan Oil", "BarrierLipid", "Vitamin E Nourishing Oil", "Lightweight Moroccan oil rich in oleic/linoleic acids that boosts shine and softness.", new[] { "Frizz Control & Shine", "Lipid Softening" }, "None", 0, 0, true),
        ["rosa canina fruit oil"] = new("Rosehip Seed Oil", "BarrierLipid", "Regenerating Botanical Oil", "Pressed seed oil rich in essential fatty acids and trans-retinoic precursors for radiant skin.", new[] { "Radiance Nourishment", "Barrier Suppleness" }, "None", 1, 0, true),
        ["marula oil"] = new("Marula Seed Oil", "BarrierLipid", "Antioxidant Luxury Oil", "Fast-absorbing oil rich in oleic acid and antioxidants to cushion dry skin.", new[] { "Silky Nourishment" }, "None", 2, 0, true),
        ["sclerocarya birrea seed oil"] = new("Marula Seed Oil", "BarrierLipid", "Antioxidant Luxury Oil", "Cushions skin and hair with omega fatty acids and antioxidants.", new[] { "Omega Nourishment" }, "None", 2, 0, true),
        ["helianthus annuus seed oil"] = new("Sunflower Seed Oil", "BarrierLipid", "Linoleic Barrier Oil", "Non-comedogenic botanical oil rich in linoleic acid and Vitamin E.", new[] { "Barrier Softening" }, "None", 0, 0, true),
        ["persea gratissima oil"] = new("Avocado Oil", "BarrierLipid", "Deeply Cushioning Oil", "Nutrient-rich oil that softens dry skin, lips, and coarse hair strands.", new[] { "Rich Conditioning" }, "None", 2, 0, true),
        ["cocos nucifera oil"] = new("Coconut Oil", "BarrierLipid", "Rich Conditioning Oil", "Deeply conditions hair fibers and body skin; rich texture for very dry areas.", new[] { "Intense Conditioning" }, "None", 4, 0, true),
        ["prunus amygdalus dulcis oil"] = new("Sweet Almond Oil", "BarrierLipid", "Softening Botanical Oil", "Gentle vitamin-rich oil that smooths dry skin, cuticles, and hair.", new[] { "Silky Softness" }, "None", 2, 0, true),
        ["ricinus communis seed oil"] = new("Castor Seed Oil", "BarrierLipid", "Gloss & Cushion Oil", "Plush, high-shine botanical oil prized in lip treatments and hair conditioning.", new[] { "Plush Lip Gloss", "Moisture Cushion" }, "None", 1, 0, true),
        ["limnanthes alba seed oil"] = new("Meadowfoam Seed Oil", "BarrierLipid", "Velvety Moisture-Lock Oil", "Ultra-stable botanical oil that locks in hydration with a non-greasy cashmere feel.", new[] { "Velvety Moisture Seal" }, "None", 1, 0, true),
        ["theobroma cacao seed butter"] = new("Cocoa Seed Butter", "BarrierLipid", "Protective Rich Butter", "Creates a rich, smoothing cushion on dry body skin and lips.", new[] { "Rich Emollient Cushion" }, "None", 3, 0, true),
        ["mangifera indica seed butter"] = new("Mango Seed Butter", "BarrierLipid", "Plush Tropical Butter", "Melts on contact to soften lips and dry skin without stickiness.", new[] { "Plush Softening" }, "None", 1, 0, true),
        ["hydrolyzed keratin"] = new("Hydrolyzed Keratin", "HairConditioning", "Bond-Smoothing Protein", "Fills microscopic gaps along damaged hair cuticles to reduce breakage and frizz.", new[] { "Cuticle Repair", "Strand Strength" }, "None", 0, 0, true),
        ["hydrolyzed wheat protein"] = new("Hydrolyzed Wheat Protein", "HairConditioning", "Volume & Strength Protein", "Fortifies hair shafts and improves moisture retention.", new[] { "Hair Fortification", "Bounce" }, "None", 0, 0, true),
        ["hydrolyzed silk"] = new("Hydrolyzed Silk Protein", "HairConditioning", "Luminous Silk Amino", "Smooths hair and skin surfaces for a reflective, silky finish.", new[] { "Silky Luminosity" }, "None", 0, 0, true),
        ["biotin"] = new("Biotin (Vitamin B7)", "HairConditioning", "Strand-Support Vitamin", "Supports fuller-looking hair, lashes, and healthier nails.", new[] { "Strand Resilience" }, "None", 0, 0, true),
        ["behentrimonium chloride"] = new("Behentrimonium Chloride", "HairConditioning", "Detangling Conditioner", "Positively charged conditioning agent that smooths static and detangles hair effortlessly.", new[] { "Instant Detangling", "Frizz Smoothing" }, "None", 0, 0, true),
        ["behentrimonium methosulfate"] = new("Behentrimonium Methosulfate", "HairConditioning", "Gentle Rapeseed Detangler", "Sulfate-free conditioning agent derived from colza oil that softens curls and strands.", new[] { "Gentle Detangling" }, "None", 0, 0, true),
        ["cetrimonium chloride"] = new("Cetrimonium Chloride", "HairConditioning", "Anti-Static Conditioner", "Lightweight hair conditioning salt that smooths the cuticle.", new[] { "Cuticle Smoothing" }, "None", 0, 0, false),
        ["polyquaternium-10"] = new("Polyquaternium-10", "HairConditioning", "Anti-Frizz Film Former", "Coats hair fibers in a weightless shield to prevent humidity frizz.", new[] { "Frizz Control" }, "None", 0, 0, false),
        ["amodimethicone"] = new("Amodimethicone", "HairConditioning", "Targeted Damage Silicone", "Smart conditioning silicone that selectively binds to damaged hair sites without buildup.", new[] { "Heat & Frizz Shield" }, "None", 0, 0, true),

        // ── 5. SUN FILTERS ──
        ["zinc oxide"] = new("Zinc Oxide", "SunFilter", "Mineral Broad-Spectrum UV Filter", "Gentle physical UVA/UVB mineral shield that also calms redness-prone skin.", new[] { "Broad-Spectrum UVA/UVB Shield", "Soothing Mineral Filter" }, "None", 0, 0, true),
        ["titanium dioxide"] = new("Titanium Dioxide", "SunFilter", "Mineral UV Filter & Opacifier", "Physical mineral sunscreen filter and luminous mineral pigment.", new[] { "Mineral UV Protection", "Coverage & Brightness" }, "None", 0, 0, true),
        ["avobenzone"] = new("Avobenzone", "SunFilter", "UVA Chemical Filter", "Gold-standard organic UVA filter protecting against photo-aging rays.", new[] { "UVA Photo-Aging Defense" }, "None", 0, 0, true),
        ["homosalate"] = new("Homosalate", "SunFilter", "UVB Sunscreen Filter", "Oil-soluble UVB filter that helps dissolve and stabilize other sunscreen actives.", new[] { "UVB Protection" }, "None", 0, 0, true),
        ["octisalate"] = new("Octisalate", "SunFilter", "UVB Filter & Stabilizer", "Water-resistant UVB filter that gives sunscreens a lightweight skin feel.", new[] { "UVB Support" }, "None", 0, 0, true),
        ["octocrylene"] = new("Octocrylene", "SunFilter", "Photostabilizing UV Filter", "UVB/short-UVA filter that stabilizes avobenzone and boosts water resistance.", new[] { "Photostable UV Shield" }, "None", 0, 1, true),

        // ── 6. SENSORY ESSENTIAL OILS (COOLING / BOTANICAL AROMATICS) ──
        ["mentha piperita oil"] = new("Peppermint Essential Oil", "SensoryEssentialOil", "Cooling & Plumping Oil", "Provides a refreshing cooling tingle and natural mint aroma (often used in lip plumpers and scalp care).", new[] { "Cooling Refreshment", "Invigorating Sensation" }, "SensoryEssentialOil", 0, 1, true),
        ["mentha piperita (peppermint) oil"] = new("Peppermint Essential Oil", "SensoryEssentialOil", "Cooling & Plumping Oil", "Provides a refreshing cooling tingle and natural mint aroma.", new[] { "Cooling Refreshment" }, "SensoryEssentialOil", 0, 1, true),
        ["menthol"] = new("Menthol", "SensoryEssentialOil", "Cooling Sensory Active", "Triggers cold receptors on lips or scalp for an instant cooling, plumping sensation.", new[] { "Instant Cooling" }, "SensoryEssentialOil", 0, 1, true),
        ["menthyl lactate"] = new("Menthyl Lactate", "SensoryEssentialOil", "Gentle Cooling Ester", "Fuses menthol with lactic acid for a milder, long-lasting cooling refresh.", new[] { "Gentle Cooling" }, "SensoryEssentialOil", 0, 0, true),
        ["melaleuca alternifolia leaf oil"] = new("Tea Tree Leaf Oil", "SensoryEssentialOil", "Clarifying Botanical Oil", "Purifying botanical oil used to target blemishes and refresh oily scalps.", new[] { "Blemish & Scalp Purification" }, "SensoryEssentialOil", 0, 1, true),
        ["lavandula angustifolia oil"] = new("Lavender Essential Oil", "SensoryEssentialOil", "Aromatic Botanical Oil", "Calming botanical essential oil providing natural herbal scent.", new[] { "Aromatic Calming" }, "SensoryEssentialOil", 0, 1, false),
        ["citrus aurantium bergamia fruit oil"] = new("Bergamot Fruit Oil", "SensoryEssentialOil", "Citrus Essential Oil", "Bright citrus botanical oil providing fresh top notes.", new[] { "Fresh Citrus Aroma" }, "SensoryEssentialOil", 0, 1, false),
        ["eucalyptus globulus leaf oil"] = new("Eucalyptus Leaf Oil", "SensoryEssentialOil", "Invigorating Botanical Oil", "Refreshing camphoraceous oil often used in scalp, bath, and cleanser formulas.", new[] { "Invigorating Refreshment" }, "SensoryEssentialOil", 0, 1, false),
        ["rosmarinus officinalis leaf oil"] = new("Rosemary Leaf Oil", "SensoryEssentialOil", "Scalp-Stimulating Oil", "Antioxidant herbal oil popular in scalp and hair strengthening rituals.", new[] { "Scalp Revitalization" }, "SensoryEssentialOil", 0, 1, true),

        // ── 7. SYNTHETIC FRAGRANCE & EU 26 FRAGRANCE ALLERGENS ──
        ["parfum"] = new("Fragrance (Parfum)", "FragranceAllergen", "Aromatic Accord", "Perfume scent blend crafted to give the formula its signature olfactory profile.", new[] { "Sensory Scent Profile" }, "SyntheticOrEuAllergen", 0, 1, false),
        ["fragrance"] = new("Fragrance (Parfum)", "FragranceAllergen", "Aromatic Accord", "Perfume scent blend crafted to give the formula its signature olfactory profile.", new[] { "Sensory Scent Profile" }, "SyntheticOrEuAllergen", 0, 1, false),
        ["aroma"] = new("Flavor / Aroma", "FragranceAllergen", "Lip & Oral Flavoring", "Cosmetic flavor/scent accord typically used in lip balms and glosses.", new[] { "Pleasant Lip Flavor" }, "SyntheticOrEuAllergen", 0, 0, false),
        ["limonene"] = new("Limonene", "FragranceAllergen", "Citrus Scent Component", "Naturally occurring citrus terpene disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["linalool"] = new("Linalool", "FragranceAllergen", "Floral Scent Component", "Naturally occurring floral terpene disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["citronellol"] = new("Citronellol", "FragranceAllergen", "Rose Scent Component", "Rose-like aromatic molecule disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["geraniol"] = new("Geraniol", "FragranceAllergen", "Floral Scent Component", "Sweet rose aromatic component disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["citral"] = new("Citral", "FragranceAllergen", "Lemon Scent Component", "Zesty lemon aromatic molecule disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["eugenol"] = new("Eugenol", "FragranceAllergen", "Warm Spice Scent Component", "Spicy clove-like aromatic molecule disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["coumarin"] = new("Coumarin", "FragranceAllergen", "Warm Vanilla/Tonka Component", "Sweet tonka-like aromatic molecule disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["farnesol"] = new("Farnesol", "FragranceAllergen", "Floral Scent Component", "Delicate floral aromatic component disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["benzyl salicylate"] = new("Benzyl Salicylate", "FragranceAllergen", "Fragrance Fixative", "Soft floral fragrance component and UV absorber disclosed on EU labels.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["benzyl benzoate"] = new("Benzyl Benzoate", "FragranceAllergen", "Fragrance Solvent & Fixative", "Balsamic fragrance stabilizer disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["hexyl cinnamal"] = new("Hexyl Cinnamal", "FragranceAllergen", "Jasmine Scent Component", "Fresh jasmine-like fragrance note disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["hydroxycitronellal"] = new("Hydroxycitronellal", "FragranceAllergen", "Muguet Floral Component", "Lily-of-the-valley fragrance note disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),
        ["alpha-isomethyl ionone"] = new("Alpha-Isomethyl Ionone", "FragranceAllergen", "Violet/Iris Scent Component", "Powdery violet fragrance note disclosed under EU allergen labeling standards.", Array.Empty<string>(), "SyntheticOrEuAllergen", 0, 1, false),

        // ── 8. BASE TEXTURE, EMOLLIENTS, SILICONES, SOLVENTS & PRESERVATIVES ──
        ["water"] = new("Purified Water (Aqua)", "BaseTexture", "Hydrating Carrier Base", "Primary solvent that dissolves water-soluble actives and delivers hydration.", Array.Empty<string>(), "None", 0, 0, false),
        ["aqua"] = new("Purified Water (Aqua)", "BaseTexture", "Hydrating Carrier Base", "Primary solvent that dissolves water-soluble actives and delivers hydration.", Array.Empty<string>(), "None", 0, 0, false),
        ["eau"] = new("Purified Water (Eau)", "BaseTexture", "Hydrating Carrier Base", "Primary cosmetic solvent base.", Array.Empty<string>(), "None", 0, 0, false),
        ["alcohol denat"] = new("Alcohol Denat.", "BaseTexture", "Quick-Dry Carrier Solvent", "Creates a weightless, fast-drying finish and serves as the primary carrier in fine fragrances.", Array.Empty<string>(), "None", 0, 1, false),
        ["alcohol denat."] = new("Alcohol Denat.", "BaseTexture", "Quick-Dry Carrier Solvent", "Creates a weightless, fast-drying finish and serves as the primary carrier in fine fragrances.", Array.Empty<string>(), "None", 0, 1, false),
        ["dimethicone"] = new("Dimethicone", "BaseTexture", "Silky Breathable Silicone", "Creates a velvety, non-greasy slip that smooths texture and locks in moisture.", new[] { "Silky Smooth Finish", "Moisture Lock" }, "None", 1, 0, false),
        ["cyclopentasiloxane"] = new("Cyclopentasiloxane", "BaseTexture", "Weightless Volatile Silicone", "Evaporates cleanly after spreading to leave a weightless, silky finish.", Array.Empty<string>(), "None", 0, 0, false),
        ["caprylic/capric triglyceride"] = new("Caprylic/Capric Triglyceride", "BaseTexture", "Coconut-Derived Emollient", "Lightweight fractionated coconut lipid that softens skin without heaviness.", new[] { "Silky Softening" }, "None", 0, 0, false),
        ["diisostearyl malate"] = new("Diisostearyl Malate", "BaseTexture", "Plush Gloss Ester", "Cushiony emollient ester prized in lip glosses and makeup for mirror-like shine and comfort.", new[] { "Plush Cushion & Shine" }, "None", 0, 0, false),
        ["hydrogenated polyisobutene"] = new("Hydrogenated Polyisobutene", "BaseTexture", "Gloss & Moisture Cushion", "Botanical-alternative gloss oil that locks in lip and skin moisture with a smooth glide.", new[] { "Smooth Gloss Glide" }, "None", 0, 0, false),
        ["polybutene"] = new("Polybutene", "BaseTexture", "High-Shine Gloss Binder", "Gives lip glosses and balms a cushiony, long-wearing shine.", Array.Empty<string>(), "None", 0, 0, false),
        ["cetearyl alcohol"] = new("Cetearyl Alcohol (Fatty Alcohol)", "BaseTexture", "Soothing Lipid Emollient", "Non-drying plant-derived fatty alcohol that gives creams a velvety, comforting texture.", new[] { "Velvety Emollient Texture" }, "None", 1, 0, false),
        ["cetyl alcohol"] = new("Cetyl Alcohol (Fatty Alcohol)", "BaseTexture", "Softening Fatty Alcohol", "Skin-friendly lipid thickener (not a drying alcohol) that softens skin and hair.", new[] { "Softening Texture" }, "None", 1, 0, false),
        ["stearyl alcohol"] = new("Stearyl Alcohol (Fatty Alcohol)", "BaseTexture", "Conditioning Fatty Alcohol", "Nourishing lipid alcohol that stabilizes emulsions and smooths hair cuticles.", Array.Empty<string>(), "None", 1, 0, false),
        ["behenyl alcohol"] = new("Behenyl Alcohol (Fatty Alcohol)", "BaseTexture", "Cushioning Fatty Alcohol", "Saturated plant lipid alcohol that thickens creams without greasiness.", Array.Empty<string>(), "None", 0, 0, false),
        ["butylene glycol"] = new("Butylene Glycol", "BaseTexture", "Hydrating Slip Enhancer", "Lightweight humectant solvent that helps active ingredients absorb smoothly.", Array.Empty<string>(), "None", 0, 0, false),
        ["propanediol"] = new("Propanediol", "BaseTexture", "Corn-Derived Humectant Solvent", "Natural glycol alternative that boosts hydration and formula absorption.", Array.Empty<string>(), "None", 0, 0, false),
        ["pentylene glycol"] = new("Pentylene Glycol", "BaseTexture", "Moisture-Binding Solvent", "Silky humectant that hydrates while supporting formula freshness.", Array.Empty<string>(), "None", 0, 0, false),
        ["caprylyl glycol"] = new("Caprylyl Glycol", "BaseTexture", "Conditioning Humectant", "Hair and skin conditioning agent that boosts preservative efficacy.", Array.Empty<string>(), "None", 0, 0, false),
        ["ethylhexylglycerin"] = new("Ethylhexylglycerin", "PreservativeStability", "Deodorizing Skin Conditioner", "Gentle skin-softening agent that supports antimicrobial preservation.", Array.Empty<string>(), "None", 0, 0, false),
        ["phenoxyethanol"] = new("Phenoxyethanol", "PreservativeStability", "Gentle Broad-Spectrum Preservative", "Gold-standard paraben-free preservative that keeps water-based formulas safe from bacteria.", Array.Empty<string>(), "None", 0, 0, false),
        ["sodium benzoate"] = new("Sodium Benzoate", "PreservativeStability", "Food-Grade Preservative", "Gentle preservative salt used in clean beauty formulas to prevent microbial growth.", Array.Empty<string>(), "None", 0, 0, false),
        ["potassium sorbate"] = new("Potassium Sorbate", "PreservativeStability", "Mild Botanical-Safe Preservative", "Gentle sorbic acid salt that protects formulas from mold and yeast.", Array.Empty<string>(), "None", 0, 0, false),
        ["citric acid"] = new("Citric Acid", "PreservativeStability", "pH Balancer", "Adjusts the formula to a skin-friendly pH level.", Array.Empty<string>(), "None", 0, 0, false),
        ["sodium hydroxide"] = new("Sodium Hydroxide", "PreservativeStability", "pH Buffer", "Used in trace amounts to balance formula acidity for optimal skin comfort.", Array.Empty<string>(), "None", 0, 0, false),
        ["disodium edta"] = new("Disodium EDTA", "PreservativeStability", "Chelating Stabilizer", "Binds trace metal ions in water so the formula stays fresh and stable.", Array.Empty<string>(), "None", 0, 0, false),
        ["xanthan gum"] = new("Xanthan Gum", "BaseTexture", "Natural Gel Thickener", "Polysaccharide gum that gives serums and gels a smooth, slip-rich consistency.", Array.Empty<string>(), "None", 0, 0, false),
        ["carbomer"] = new("Carbomer", "BaseTexture", "Gel Matrix Builder", "Creates refreshing, cushiony gel-cream textures that break into water on skin.", Array.Empty<string>(), "None", 0, 0, false),
        ["mica"] = new("Mica", "PigmentColorant", "Luminous Mineral Pearl", "Natural silicate mineral that imparts a soft-focus shimmer or radiant glow.", new[] { "Luminous Finish" }, "None", 0, 0, false),
        ["iron oxides"] = new("Iron Oxides", "PigmentColorant", "Natural Mineral Pigment", "Skin-true mineral colorants that provide complexion coverage and tint.", Array.Empty<string>(), "None", 0, 0, false)
    };

    /// <summary>
    /// Resolves the appropriate Target Care Area from product department and subcategory.
    /// </summary>
    public static string ResolveTargetArea(string? department, string? categoryName)
    {
        var dept = (department ?? "").Trim().ToLowerInvariant();
        var cat = (categoryName ?? "").Trim().ToLowerInvariant();

        if (dept == "tools & brushes" ||
            cat.Contains("tool") || cat.Contains("brush") || cat.Contains("sponge") ||
            cat.Contains("tweezer") || cat.Contains("curler") || cat.Contains("applicator"))
        {
            return "non-cosmetic";
        }

        if (cat.Contains("eye") || cat.Contains("mascara") || cat.Contains("brow"))
            return "eye";

        if (cat.Contains("lip"))
            return "lips";

        if (cat.Contains("nail"))
            return "nails";

        if (dept == "hair" || cat.Contains("hair") || cat.Contains("scalp") || cat.Contains("shampoo") || cat.Contains("conditioner"))
            return "hair";

        if (dept == "fragrance" || cat.Contains("fragrance") || cat.Contains("perfume") || cat.Contains("cologne") || cat.Contains("parfum"))
            return "fragrance";

        if (dept == "bath & body" || cat.Contains("body") || cat.Contains("bath") || cat.Contains("shower") ||
            cat.Contains("hand") || cat.Contains("foot") || cat.Contains("deodorant") || cat.Contains("self tanner"))
        {
            return "body";
        }

        return "face";
    }

    /// <summary>
    /// Expands a user's personal allergy blacklist using cosmetic synonym mapping.
    /// </summary>
    public static IReadOnlyList<string> ExpandAllergyBlacklist(IEnumerable<string>? userAllergies)
    {
        if (userAllergies == null)
            return Array.Empty<string>();

        var expanded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var raw in userAllergies)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            var clean = raw.Trim().ToLowerInvariant();
            expanded.Add(clean);

            if (AllergenSynonyms.TryGetValue(clean, out var synonyms))
            {
                foreach (var syn in synonyms)
                    expanded.Add(syn);
            }
        }

        return expanded.ToList();
    }

    /// <summary>
    /// Checks if a single INCI token matches any user allergen (with synonym expansion and fatty-alcohol protection).
    /// </summary>
    public static string? MatchAllergenInToken(string rawInciToken, IEnumerable<string>? userAllergies)
    {
        if (string.IsNullOrWhiteSpace(rawInciToken) || userAllergies == null)
            return null;

        var tokenLower = rawInciToken.Trim().ToLowerInvariant();
        var tokenNoParens = Regex.Replace(tokenLower, @"\(.*?\)", "").Trim();

        // Protect gentle botanical rose/vanilla/chamomile waters from being false-flagged by generic "fragrance" allergy
        var expanded = ExpandAllergyBlacklist(userAllergies);
        if (expanded.Count == 0)
            return null;

        var isFattyAlcohol = FattyAlcohols.Any(fa => tokenLower.Contains(fa));

        foreach (var allergen in expanded)
        {
            if (isFattyAlcohol && (allergen == "alcohol" || allergen == "drying alcohol" || allergen == "alcohol denat"))
                continue;

            if (tokenLower == allergen || tokenNoParens == allergen || tokenLower.Contains(allergen))
            {
                return rawInciToken.Trim();
            }
        }

        return null;
    }

    /// <summary>
    /// Looks up or classifies an INCI token using the curated knowledge base and intelligent pattern rules.
    /// </summary>
    public static IngredientKnowledgeEntry LookupIngredient(string rawToken, Ingredient? dbIngredient = null)
    {
        var clean = rawToken.Trim();
        var lower = clean.ToLowerInvariant();
        var noParens = Regex.Replace(lower, @"\(.*?\)", "").Trim();

        if (Catalog.TryGetValue(lower, out var exact))
            return exact;

        if (Catalog.TryGetValue(noParens, out var exactNoParens))
            return exactNoParens;

        // Check substring matches in Catalog (longest key first to avoid partial collisions)
        foreach (var kvp in Catalog.OrderByDescending(k => k.Key.Length))
        {
            if (lower.Contains(kvp.Key))
            {
                // Avoid matching "alcohol" inside fatty alcohols
                if (kvp.Key.Contains("alcohol denat") && FattyAlcohols.Any(fa => lower.Contains(fa)))
                    continue;
                return kvp.Value;
            }
        }

        // Check EU 26 Fragrance Allergens
        if (Eu26FragranceAllergens.Any(a => lower.Contains(a)))
        {
            return new IngredientKnowledgeEntry(
                CommonName: clean,
                RoleBucket: "FragranceAllergen",
                RoleLabel: "Aromatic Component",
                Explanation: "Aromatic scent component disclosed on cosmetic packaging under EU transparency rules.",
                Benefits: Array.Empty<string>(),
                ScentTier: "SyntheticOrEuAllergen",
                ComedogenicRating: 0,
                IrritationRating: 1,
                IsHeroCandidate: false
            );
        }

        // Check Pigments & Colorants (CI numbers, Lakes, Dyes, Oxides)
        if (Regex.IsMatch(lower, @"\b(ci\s*\d{5}|red\s*\d+|yellow\s*\d+|blue\s*\d+|green\s*\d+|iron\s*oxides|ultramarines|carmine|bismuth\s*oxychloride|manganese\s*violet|titanium\s*dioxide)\b"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: clean,
                RoleBucket: "PigmentColorant",
                RoleLabel: "Cosmetic Pigment & Tint",
                Explanation: "Provides color payoff, tint, or opacity to the formula.",
                Benefits: Array.Empty<string>(),
                ScentTier: "None",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: false
            );
        }

        // Check Ceramides / Peptides / Hyaluronic variants
        if (lower.Contains("ceramide"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: $"Ceramide Complex ({clean})",
                RoleBucket: "BarrierLipid",
                RoleLabel: "Barrier Ceramide",
                Explanation: "Skin-identical lipid that reinforces the moisture barrier and prevents dryness.",
                Benefits: new[] { "Barrier Repair", "Moisture Lock" },
                ScentTier: "None",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: true
            );
        }

        if (lower.Contains("peptide") || lower.Contains("sh-oligopeptide") || lower.Contains("sh-polypeptide"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: $"Signaling Peptide ({clean})",
                RoleBucket: "HeroActive",
                RoleLabel: "Firming Peptide",
                Explanation: "Biomimetic amino-acid chain that supports skin elasticity, bounce, and smoothness.",
                Benefits: new[] { "Firmness & Elasticity", "Smoothing" },
                ScentTier: "None",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: true
            );
        }

        if (lower.Contains("hyaluron"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: $"Hyaluronic Complex ({clean})",
                RoleBucket: "Hydration",
                RoleLabel: "Multi-Molecular Humectant",
                Explanation: "Draws and binds moisture into the skin or lips for lasting suppleness.",
                Benefits: new[] { "Deep Hydration", "Plumping" },
                ScentTier: "None",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: true
            );
        }

        // Check Gentle Botanical Extracts / Waters / Ferments
        if (lower.Contains("flower water") || lower.Contains("leaf water") || lower.Contains("fruit water") ||
            lower.Contains("extract") || lower.Contains("ferment") || lower.Contains("filtrate") || lower.Contains("juice"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: FormatFriendlyBotanicalName(clean),
                RoleBucket: "SoothingBotanical",
                RoleLabel: "Botanical Phyto-Extract",
                Explanation: dbIngredient?.Description ?? "Plant-derived extract rich in soothing antioxidants and conditioning phytonutrients.",
                Benefits: new[] { "Botanical Conditioning", "Antioxidant Support" },
                ScentTier: "GentleBotanical",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: true
            );
        }

        // Check Nourishing Plant Oils, Butters & Waxes
        if (lower.Contains("seed oil") || lower.Contains("kernel oil") || lower.Contains("fruit oil") ||
            lower.Contains("butter") || lower.Contains("cera alba") || lower.Contains("beeswax") || lower.Contains("wax"))
        {
            var isEssential = lower.Contains("peel oil") || lower.Contains("peppermint") || lower.Contains("lavender") || lower.Contains("eucalyptus") || lower.Contains("bergamot");
            return new IngredientKnowledgeEntry(
                CommonName: FormatFriendlyBotanicalName(clean),
                RoleBucket: isEssential ? "SensoryEssentialOil" : "BarrierLipid",
                RoleLabel: isEssential ? "Aromatic Essential Oil" : "Nourishing Botanical Lipid",
                Explanation: isEssential
                    ? "Botanical essential oil adding natural aromatic or sensory notes."
                    : "Nourishing lipid that softens texture and seals in moisture.",
                Benefits: isEssential ? new[] { "Sensory Botanical Note" } : new[] { "Lipid Nourishment", "Softening" },
                ScentTier: isEssential ? "SensoryEssentialOil" : "None",
                ComedogenicRating: 1,
                IrritationRating: isEssential ? 1 : 0,
                IsHeroCandidate: !isEssential
            );
        }

        // Check Preservatives & Stabilizers
        if (lower.Contains("paraben") || lower.Contains("benzoate") || lower.Contains("sorbate") ||
            lower.Contains("edta") || lower.Contains("chlorphenesin") || lower.Contains("bht") || lower.Contains("tocopherol"))
        {
            return new IngredientKnowledgeEntry(
                CommonName: clean,
                RoleBucket: "PreservativeStability",
                RoleLabel: "Formula Stabilizer & Preservative",
                Explanation: "Maintains formula freshness, pH stability, and microbial safety throughout shelf life.",
                Benefits: Array.Empty<string>(),
                ScentTier: "None",
                ComedogenicRating: 0,
                IrritationRating: 0,
                IsHeroCandidate: false
            );
        }

        // Default: Emollient, Texture, Film Former or Carrier Base
        return new IngredientKnowledgeEntry(
            CommonName: clean,
            RoleBucket: "BaseTexture",
            RoleLabel: "Texture & Carrier Base",
            Explanation: dbIngredient?.Description ?? "Supports smooth application, spreadability, and formula stability.",
            Benefits: Array.Empty<string>(),
            ScentTier: "None",
            ComedogenicRating: dbIngredient?.ComedogenicRating ?? 0,
            IrritationRating: dbIngredient?.IrritationRating ?? 0,
            IsHeroCandidate: dbIngredient?.IsActiveIngredient ?? false
        );
    }

    /// <summary>
    /// Builds the unified 3-Tier Progressive Disclosure breakdown and Suitability Verdict
    /// used across both PDP and Ingredient Analyzer.
    /// </summary>
    public static FormulaBreakdownResult AnalyzeFormula(
        string? rawIngredientsText,
        string? productName,
        string? department,
        string? categoryName,
        string? explicitTargetArea,
        SkinProfile? skinProfile,
        IEnumerable<string>? userAllergies,
        string[]? targetSkinTypes = null,
        IReadOnlyDictionary<string, Ingredient>? dbIngredientMap = null)
    {
        var targetArea = !string.IsNullOrWhiteSpace(explicitTargetArea)
            ? explicitTargetArea.Trim().ToLowerInvariant()
            : ResolveTargetArea(department, categoryName);

        var isTool = string.Equals(department, "Tools & Brushes", StringComparison.OrdinalIgnoreCase) ||
                     targetArea == "non-cosmetic";

        if (isTool)
        {
            return new FormulaBreakdownResult(
                Verdict: "AccessoryTool",
                VerdictLabel: "Accessory / Tool",
                VerdictReason: "Physical beauty tool or accessory — contains no chemical cosmetic ingredients or allergens.",
                HasAllergyWarning: false,
                AllergyMatches: Array.Empty<string>(),
                HasIngredients: false,
                IsNonCosmeticTool: true,
                TargetArea: "non-cosmetic",
                BenefitsTitle: "Tool Care & Hygiene",
                Benefits: new[] { "Zero Chemical Allergens", "Reusable Beauty Tool" },
                KeyIngredients: Array.Empty<KeyIngredientItem>(),
                FunctionalGroups: Array.Empty<FunctionalGroupItem>(),
                Cautions: Array.Empty<FormulaCautionItem>(),
                FragranceDisclosure: null,
                TotalIngredientsCount: 0,
                RawInciTokens: Array.Empty<string>()
            );
        }

        var cleanedRaw = (rawIngredientsText ?? "").Trim();
        if (string.IsNullOrWhiteSpace(cleanedRaw) ||
            string.Equals(cleanedRaw, "No ingredients listed", StringComparison.OrdinalIgnoreCase) ||
            cleanedRaw.Length < 3)
        {
            return new FormulaBreakdownResult(
                Verdict: "InsufficientData",
                VerdictLabel: "Insufficient INCI Data",
                VerdictReason: "Manufacturer has not provided a detailed INCI ingredient list for this product — unable to cross-check against your allergy profile.",
                HasAllergyWarning: false,
                AllergyMatches: Array.Empty<string>(),
                HasIngredients: false,
                IsNonCosmeticTool: false,
                TargetArea: targetArea,
                BenefitsTitle: GetBenefitsTitle(department, targetArea),
                Benefits: Array.Empty<string>(),
                KeyIngredients: Array.Empty<KeyIngredientItem>(),
                FunctionalGroups: Array.Empty<FunctionalGroupItem>(),
                Cautions: Array.Empty<FormulaCautionItem>(),
                FragranceDisclosure: null,
                TotalIngredientsCount: 0,
                RawInciTokens: Array.Empty<string>()
            );
        }

        var rawTokens = SplitInciList(cleanedRaw);
        var prodNameLower = (productName ?? "").ToLowerInvariant();

        var allergyMatches = new List<string>();
        var analyzedItems = new List<(string Token, IngredientKnowledgeEntry Entry, bool FeaturedInName)>();
        var benefitsSet = new List<string>();

        foreach (var token in rawTokens)
        {
            var matchedAllergen = MatchAllergenInToken(token, userAllergies);
            if (matchedAllergen != null && !allergyMatches.Contains(matchedAllergen, StringComparer.OrdinalIgnoreCase))
            {
                allergyMatches.Add(matchedAllergen);
            }

            Ingredient? dbIng = null;
            if (dbIngredientMap != null)
            {
                var key = Regex.Replace(token.ToLowerInvariant(), @"\(.*?\)", "").Trim();
                dbIngredientMap.TryGetValue(token.ToLowerInvariant(), out dbIng);
                if (dbIng == null)
                    dbIngredientMap.TryGetValue(key, out dbIng);
            }

            var entry = LookupIngredient(token, dbIng);

            // Check if ingredient's common name or main word appears in the product title
            var featuredInName = false;
            if (!string.IsNullOrWhiteSpace(prodNameLower))
            {
                var commonWord = entry.CommonName.Split('(')[0].Trim().ToLowerInvariant();
                if (commonWord.Length >= 4 && prodNameLower.Contains(commonWord))
                    featuredInName = true;
                else if (prodNameLower.Contains("rose") && token.Contains("rosa", StringComparison.OrdinalIgnoreCase))
                    featuredInName = true;
                else if (prodNameLower.Contains("vanilla") && token.Contains("vanilla", StringComparison.OrdinalIgnoreCase))
                    featuredInName = true;
                else if (prodNameLower.Contains("hyaluronic") && token.Contains("hyaluron", StringComparison.OrdinalIgnoreCase))
                    featuredInName = true;
                else if (prodNameLower.Contains("peptide") && token.Contains("peptide", StringComparison.OrdinalIgnoreCase))
                    featuredInName = true;
                else if (prodNameLower.Contains("cica") && (token.Contains("centella", StringComparison.OrdinalIgnoreCase) || token.Contains("madecassoside", StringComparison.OrdinalIgnoreCase)))
                    featuredInName = true;
            }

            analyzedItems.Add((token, entry, featuredInName));

            foreach (var b in entry.Benefits)
            {
                if (!benefitsSet.Contains(b, StringComparer.OrdinalIgnoreCase) && benefitsSet.Count < 6)
                    benefitsSet.Add(b);
            }
        }

        // Select 3-6 Key Ingredients (Featured in product name first, then HeroCandidates, then top conditioning/hydrating items)
        var keyCandidates = analyzedItems
            .Where(x => x.FeaturedInName || x.Entry.IsHeroCandidate)
            .OrderByDescending(x => x.FeaturedInName)
            .ToList();

        if (keyCandidates.Count < 3)
        {
            var extras = analyzedItems
                .Except(keyCandidates)
                .Where(x => x.Entry.RoleBucket != "PreservativeStability" && x.Entry.RoleBucket != "PigmentColorant")
                .Take(3 - keyCandidates.Count);
            keyCandidates.AddRange(extras);
        }

        var selectedKeys = keyCandidates
            .GroupBy(x => x.Entry.CommonName, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .Take(6)
            .Select(x => new KeyIngredientItem(
                CommonName: x.Entry.CommonName,
                InciName: x.Token,
                RoleLabel: x.Entry.RoleLabel,
                Explanation: x.Entry.Explanation,
                IsFeaturedInProductName: x.FeaturedInName
            ))
            .ToList();

        var keyTokenSet = new HashSet<string>(selectedKeys.Select(k => k.InciName), StringComparer.OrdinalIgnoreCase);

        // Group ALL ingredients into digestible Functional Role buckets
        var functionalGroups = BuildFunctionalGroups(analyzedItems, keyTokenSet);

        // Build Category-Aware Cautions & Fragrance Disclosure
        var (cautions, fragranceDisclosure, hasProfileNote, profileNoteSummary) = BuildCautionsAndNotes(
            analyzedItems,
            allergyMatches,
            department,
            targetArea,
            skinProfile
        );

        // Ensure default category benefits if few active benefits were found
        if (benefitsSet.Count == 0)
        {
            benefitsSet.AddRange(GetDefaultCategoryBenefits(department, targetArea));
        }

        // Compute unified Verdict
        var (verdict, verdictLabel, verdictReason) = ComputeVerdict(
            allergyMatches,
            skinProfile,
            targetSkinTypes,
            hasProfileNote,
            profileNoteSummary,
            department,
            targetArea
        );

        return new FormulaBreakdownResult(
            Verdict: verdict,
            VerdictLabel: verdictLabel,
            VerdictReason: verdictReason,
            HasAllergyWarning: allergyMatches.Count > 0,
            AllergyMatches: allergyMatches,
            HasIngredients: true,
            IsNonCosmeticTool: false,
            TargetArea: targetArea,
            BenefitsTitle: GetBenefitsTitle(department, targetArea),
            Benefits: benefitsSet,
            KeyIngredients: selectedKeys,
            FunctionalGroups: functionalGroups,
            Cautions: cautions,
            FragranceDisclosure: fragranceDisclosure,
            TotalIngredientsCount: rawTokens.Count,
            RawInciTokens: rawTokens
        );
    }

    private static List<FunctionalGroupItem> BuildFunctionalGroups(
        List<(string Token, IngredientKnowledgeEntry Entry, bool FeaturedInName)> items,
        HashSet<string> keyTokenSet)
    {
        var groups = new List<FunctionalGroupItem>();

        var activesAndHydrators = items
            .Where(x => x.Entry.RoleBucket is "HeroActive" or "Hydration" or "BarrierLipid" or "SoothingBotanical" or "Exfoliant" or "SunFilter" or "HairConditioning")
            .Select(x => x.Token)
            .ToList();

        if (activesAndHydrators.Count > 0)
        {
            groups.Add(new FunctionalGroupItem(
                GroupTitle: "Active, Hydrating & Conditioning Agents",
                PlainExplanation: "Deliver the primary skincare, moisture-binding, soothing, or hair-conditioning performance.",
                Count: activesAndHydrators.Count,
                Ingredients: activesAndHydrators
            ));
        }

        var baseTexture = items
            .Where(x => x.Entry.RoleBucket == "BaseTexture")
            .Select(x => x.Token)
            .ToList();

        if (baseTexture.Count > 0)
        {
            groups.Add(new FunctionalGroupItem(
                GroupTitle: "Emollient, Texture & Carrier Base",
                PlainExplanation: "Create the product's slip, cushion, spreadability, and smooth finish on skin or lips.",
                Count: baseTexture.Count,
                Ingredients: baseTexture
            ));
        }

        var pigments = items
            .Where(x => x.Entry.RoleBucket == "PigmentColorant")
            .Select(x => x.Token)
            .ToList();

        if (pigments.Count > 0)
        {
            groups.Add(new FunctionalGroupItem(
                GroupTitle: "Mineral Pigments, Pearls & Colorants",
                PlainExplanation: "Provide color payoff, tint, shimmer, or optical brightness.",
                Count: pigments.Count,
                Ingredients: pigments
            ));
        }

        var scentItems = items
            .Where(x => x.Entry.RoleBucket is "FragranceAllergen" or "SensoryEssentialOil")
            .Select(x => x.Token)
            .ToList();

        if (scentItems.Count > 0)
        {
            groups.Add(new FunctionalGroupItem(
                GroupTitle: "Scent & Sensory Components",
                PlainExplanation: "Provide aromatic fragrance notes, flavor, or cooling sensory feel.",
                Count: scentItems.Count,
                Ingredients: scentItems
            ));
        }

        var preservatives = items
            .Where(x => x.Entry.RoleBucket == "PreservativeStability")
            .Select(x => x.Token)
            .ToList();

        if (preservatives.Count > 0)
        {
            groups.Add(new FunctionalGroupItem(
                GroupTitle: "Preservatives & pH Stabilizers",
                PlainExplanation: "Keep the formula fresh, pH-balanced, and safe from microbial contamination.",
                Count: preservatives.Count,
                Ingredients: preservatives
            ));
        }

        return groups;
    }

    private static (List<FormulaCautionItem> Cautions, string? FragranceDisclosure, bool HasProfileNote, string? ProfileNoteSummary) BuildCautionsAndNotes(
        List<(string Token, IngredientKnowledgeEntry Entry, bool FeaturedInName)> items,
        List<string> allergyMatches,
        string? department,
        string targetArea,
        SkinProfile? skinProfile)
    {
        var cautions = new List<FormulaCautionItem>();
        string? fragranceDisclosure = null;
        bool hasProfileNote = false;
        string? profileNoteSummary = null;

        var isFragranceDept = string.Equals(department, "Fragrance", StringComparison.OrdinalIgnoreCase) || targetArea == "fragrance";
        var userSkin = skinProfile?.SkinType.ToString() ?? "";

        // 1. Personal Allergy Blacklist Conflict (Hard Alert)
        if (allergyMatches.Count > 0)
        {
            cautions.Add(new FormulaCautionItem(
                Type: "allergy",
                Title: "Personal Allergy Conflict",
                Message: $"Contains ingredients on your personal Allergy Blacklist: {string.Join(", ", allergyMatches)}.",
                IngredientsInvolved: allergyMatches
            ));
        }

        // 2. Fragrance / EU 26 Allergen Handling (Nuanced!)
        var syntheticOrEuScents = items
            .Where(x => x.Entry.ScentTier == "SyntheticOrEuAllergen")
            .Select(x => x.Token)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (syntheticOrEuScents.Count > 0)
        {
            if (isFragranceDept)
            {
                // For perfumes, fragrance + alcohol are the product itself — never treat as a flaw!
                fragranceDisclosure = $"EU Recognised Fragrance Components disclosed on packaging: {string.Join(", ", syntheticOrEuScents)}.";
            }
            else if (string.Equals(userSkin, "Sensitive", StringComparison.OrdinalIgnoreCase) || targetArea == "eye")
            {
                hasProfileNote = true;
                profileNoteSummary = $"Contains fragrance components ({string.Join(", ", syntheticOrEuScents.Take(3))}) — patch-test if your skin is reactive.";
                cautions.Add(new FormulaCautionItem(
                    Type: "sensitive-note",
                    Title: "Fragrance Note for Sensitive Skin",
                    Message: $"Contains aromatic components ({string.Join(", ", syntheticOrEuScents)}) which may be noticeable on reactive skin or delicate eye contours.",
                    IngredientsInvolved: syntheticOrEuScents
                ));
            }
            else
            {
                fragranceDisclosure = $"Contains aromatic scent components: {string.Join(", ", syntheticOrEuScents)}.";
            }
        }

        // 3. Sensory Essential Oils (e.g., Peppermint/Menthol on Lips or Scalp, Citrus on Face)
        var sensoryOils = items
            .Where(x => x.Entry.ScentTier == "SensoryEssentialOil")
            .Select(x => x.Token)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (sensoryOils.Count > 0)
        {
            var hasMint = sensoryOils.Any(s => s.Contains("menth", StringComparison.OrdinalIgnoreCase) || s.Contains("peppermint", StringComparison.OrdinalIgnoreCase));
            if (targetArea == "lips" && hasMint)
            {
                cautions.Add(new FormulaCautionItem(
                    Type: "sensory-note",
                    Title: "Cooling & Plumping Sensory Note",
                    Message: $"Contains cooling mint/menthol ({string.Join(", ", sensoryOils)}) for a refreshing plumping tingle; may feel intense on chapped or cracked lips.",
                    IngredientsInvolved: sensoryOils
                ));
            }
            else if (string.Equals(userSkin, "Sensitive", StringComparison.OrdinalIgnoreCase))
            {
                hasProfileNote = true;
                profileNoteSummary ??= $"Contains botanical essential oils ({string.Join(", ", sensoryOils.Take(2))}).";
                cautions.Add(new FormulaCautionItem(
                    Type: "sensitive-note",
                    Title: "Botanical Essential Oil Note",
                    Message: $"Contains active essential oils ({string.Join(", ", sensoryOils)}) — patch-test recommended for sensitive skin.",
                    IngredientsInvolved: sensoryOils
                ));
            }
        }

        // 4. Drying Alcohol (Alcohol Denat.) outside Fragrance department
        var dryingAlcohols = items
            .Where(x => x.Token.Contains("alcohol denat", StringComparison.OrdinalIgnoreCase) ||
                        x.Token.Contains("sd alcohol", StringComparison.OrdinalIgnoreCase) ||
                        x.Token.Contains("isopropyl alcohol", StringComparison.OrdinalIgnoreCase))
            .Where(x => !FattyAlcohols.Any(fa => x.Token.Contains(fa, StringComparison.OrdinalIgnoreCase)))
            .Select(x => x.Token)
            .ToList();

        if (dryingAlcohols.Count > 0 && !isFragranceDept)
        {
            if (string.Equals(userSkin, "Dry", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(userSkin, "Sensitive", StringComparison.OrdinalIgnoreCase))
            {
                hasProfileNote = true;
                profileNoteSummary ??= "Contains quick-drying Alcohol Denat. — pair with a rich moisturizer on dry/sensitive skin.";
                cautions.Add(new FormulaCautionItem(
                    Type: "profile-note",
                    Title: "Quick-Dry Solvent Note",
                    Message: $"Contains {string.Join(", ", dryingAlcohols)} for a weightless, fast-setting feel. Follow with barrier hydration if your skin is dry or sensitive.",
                    IngredientsInvolved: dryingAlcohols
                ));
            }
        }

        // 5. Potent Resurfacing Actives (AHA / BHA / Retinoids) on Face
        var potentActives = items
            .Where(x => x.Entry.RoleBucket == "Exfoliant" ||
                        x.Token.Contains("retinol", StringComparison.OrdinalIgnoreCase) ||
                        x.Token.Contains("retinal", StringComparison.OrdinalIgnoreCase))
            .Select(x => x.Entry.CommonName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (potentActives.Count > 0 && targetArea == "face")
        {
            cautions.Add(new FormulaCautionItem(
                Type: "usage-tip",
                Title: "Sun Protection & Routine Tip",
                Message: $"Contains resurfacing actives ({string.Join(", ", potentActives)}). Apply broad-spectrum SPF 30+ during the daytime.",
                IngredientsInvolved: potentActives
            ));
        }

        return (cautions, fragranceDisclosure, hasProfileNote, profileNoteSummary);
    }

    private static (string Verdict, string VerdictLabel, string VerdictReason) ComputeVerdict(
        List<string> allergyMatches,
        SkinProfile? skinProfile,
        string[]? targetSkinTypes,
        bool hasProfileNote,
        string? profileNoteSummary,
        string? department,
        string targetArea)
    {
        if (allergyMatches.Count > 0)
        {
            return (
                "AllergyConflict",
                "Not Suitable — Allergy Alert",
                $"Contains {string.Join(", ", allergyMatches)}, which matches your personal Allergy Blacklist."
            );
        }

        if (skinProfile == null)
        {
            return (
                "RequiresSkinId",
                "Complete Skin ID to Check",
                "Set up your 30-second Digital Skin ID (Skin Type & Allergy Blacklist) to see your personalized formula verdict."
            );
        }

        var userSkin = skinProfile.SkinType.ToString();

        if (hasProfileNote && !string.IsNullOrWhiteSpace(profileNoteSummary))
        {
            return (
                "MatchWithNotes",
                "Match with Notes",
                $"Compatible with your allergy list, with a note for {userSkin} skin: {profileNoteSummary}"
            );
        }

        if (targetSkinTypes != null && targetSkinTypes.Length > 0 && targetArea == "face")
        {
            var isDirectMatch = targetSkinTypes.Any(t => string.Equals(t, userSkin, StringComparison.OrdinalIgnoreCase)) ||
                                targetSkinTypes.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));

            if (!isDirectMatch)
            {
                return (
                    "MatchWithNotes",
                    "Match with Notes",
                    $"Zero allergy conflicts for you. Primarily formulated for {string.Join("/", targetSkinTypes)} skin, so adjust layering for your {userSkin} skin."
                );
            }
        }

        return (
            "GoodMatch",
            "Good Match",
            $"Well-suited for your {userSkin} profile with zero personal allergy conflicts."
        );
    }

    private static string GetBenefitsTitle(string? department, string targetArea)
    {
        if (string.Equals(department, "Fragrance", StringComparison.OrdinalIgnoreCase) || targetArea == "fragrance")
            return "Scent Carrier & Skin Contact Profile";
        if (string.Equals(department, "Hair", StringComparison.OrdinalIgnoreCase) || targetArea == "hair")
            return "Hair & Scalp Benefits";
        if (string.Equals(department, "Makeup", StringComparison.OrdinalIgnoreCase))
            return "Formula Feel & Makeup Performance";
        if (targetArea == "lips")
            return "Lip Cushion & Nourishment Benefits";
        if (targetArea == "body")
            return "Body Care & Barrier Benefits";
        return "What It Does for Your Skin";
    }

    private static string[] GetDefaultCategoryBenefits(string? department, string targetArea)
    {
        if (targetArea == "fragrance")
            return new[] { "Aromatic Longevity", "Pulse-Point Diffusion", "Skin-Safe Carrier" };
        if (targetArea == "hair")
            return new[] { "Strand Conditioning", "Cuticle Smoothing", "Manageability & Shine" };
        if (targetArea == "lips")
            return new[] { "Lip Softening Cushion", "Moisture Lock", "Smooth Glide" };
        if (string.Equals(department, "Makeup", StringComparison.OrdinalIgnoreCase))
            return new[] { "Smooth Blendability", "Comfortable Wear", "Skin-Conditioning Base" };
        return new[] { "Moisture Balance", "Skin Conditioning", "Barrier Comfort" };
    }

    public static List<string> SplitInciList(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            return new List<string>();

        // Split by comma, semicolon, or newline while keeping parenthetical expressions intact
        return Regex.Split(rawText, @"[,;\n]+")
            .Select(s => s.Trim().TrimEnd('.'))
            .Where(s => s.Length > 1 && !string.Equals(s, "No ingredients listed", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string FormatFriendlyBotanicalName(string rawInci)
    {
        // E.g. "Rosa Damascena (Rose) Flower Water" -> "Rosa Damascena (Rose) Flower Water"
        return rawInci.Length > 60 ? rawInci[..57] + "..." : rawInci;
    }
}
