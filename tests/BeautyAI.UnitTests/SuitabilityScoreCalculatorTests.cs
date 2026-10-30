using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using BeautyAI.Domain.Services;
using Xunit;

namespace BeautyAI.UnitTests;

public class SuitabilityScoreCalculatorTests
{
    private readonly Product _sampleProduct = new()
    {
        Id = 1,
        Code = "P1001",
        Name = "Hydrating B5 Gel",
        Slug = "hydrating-b5-gel",
        BrandId = 1,
        CategoryId = 1,
        Department = "Skincare",
        PriceUsd = 65.00m,
        IngredientListRaw = "Water, Sodium Hyaluronate, Panthenol, Phenoxyethanol",
        TargetSkinTypes = new[] { "Dry", "Normal", "Sensitive" }
    };

    [Fact]
    public void Calculate_WhenAllergenPresentInRawIngredients_ReturnsAllergyConflictAndWarning()
    {
        var blacklist = new[] { "Panthenol" };
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Dry,
            SkinConcerns = new List<string> { "Dehydration" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.Equal("AllergyConflict", result.Verdict);
        Assert.True(result.HasAllergyWarning);
        Assert.Equal("panthenol", result.MatchedAllergen?.ToLower());
    }

    [Fact]
    public void Calculate_WhenNoAllergyAndDirectSkinTypeMatch_ReturnsGoodMatchVerdict()
    {
        var blacklist = new[] { "Alcohol Denat" };
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Dry,
            SkinConcerns = new List<string> { "Dehydration" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.Equal("GoodMatch", result.Verdict);
        Assert.Equal("Good Match", result.VerdictLabel);
        Assert.False(result.HasAllergyWarning);
        Assert.Null(result.MatchedAllergen);
    }

    [Fact]
    public void Calculate_WhenSkinTypeDoesNotMatch_ReturnsMatchWithNotesWithoutAllergyWarning()
    {
        var blacklist = Array.Empty<string>();
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Oily,
            SkinConcerns = new List<string> { "Acne" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.Equal("MatchWithNotes", result.Verdict);
        Assert.False(result.HasAllergyWarning);
    }

    [Fact]
    public void Calculate_WhenNoSkinProfile_ReturnsRequiresSkinIdVerdict()
    {
        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, null, null);

        Assert.Equal("RequiresSkinId", result.Verdict);
        Assert.False(result.HasAllergyWarning);
    }

    [Fact]
    public void Calculate_WhenToolsAndBrushes_ReturnsAccessoryToolVerdict()
    {
        var toolProduct = new Product
        {
            Id = 2,
            Code = "P2002",
            Name = "Pro Foundation Brush",
            Slug = "pro-foundation-brush",
            Department = "Tools & Brushes",
            IngredientListRaw = ""
        };

        var result = SuitabilityScoreCalculator.Calculate(toolProduct, null, new[] { "Fragrance" });

        Assert.Equal("AccessoryTool", result.Verdict);
        Assert.True(result.IsNonCosmeticTool);
        Assert.False(result.HasIngredients);
        Assert.False(result.HasAllergyWarning);
    }

    [Fact]
    public void Calculate_WhenCosmeticMissingInci_ReturnsInsufficientDataVerdict()
    {
        var missingInciProduct = new Product
        {
            Id = 3,
            Code = "P3003",
            Name = "Mystery Lipstick",
            Slug = "mystery-lipstick",
            Department = "Makeup",
            IngredientListRaw = ""
        };

        var result = SuitabilityScoreCalculator.Calculate(missingInciProduct, null, null);

        Assert.Equal("InsufficientData", result.Verdict);
        Assert.False(result.HasIngredients);
        Assert.False(result.IsNonCosmeticTool);
    }

    [Fact]
    public void CosmeticKnowledgeBase_GentleRoseWaterAndFattyAlcohol_AreNotFalseFlaggedAsFragranceOrDryingAlcohol()
    {
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Sensitive,
            SkinConcerns = new List<string> { "Redness" }
        };

        var breakdown = CosmeticKnowledgeBase.AnalyzeFormula(
            rawIngredientsText: "Water, Rosa Damascena Flower Water, Cetearyl Alcohol, Glycerin, Panthenol",
            productName: "Rose Hydrating Cream",
            department: "Skincare",
            categoryName: "Moisturizers",
            explicitTargetArea: "face",
            skinProfile: profile,
            userAllergies: new[] { "Fragrance", "Alcohol" }
        );

        Assert.Equal("GoodMatch", breakdown.Verdict);
        Assert.False(breakdown.HasAllergyWarning);
        Assert.Empty(breakdown.AllergyMatches);
        Assert.Contains(breakdown.KeyIngredients, k => k.CommonName.Contains("Rose", StringComparison.OrdinalIgnoreCase));
    }
}
