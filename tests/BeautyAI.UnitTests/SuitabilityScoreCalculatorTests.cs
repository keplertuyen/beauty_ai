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
        PriceUsd = 65.00m,
        IngredientListRaw = "Water, Sodium Hyaluronate, Panthenol, Phenoxyethanol",
        TargetSkinTypes = new[] { "Dry", "Normal", "Sensitive" }
    };

    [Fact]
    public void Calculate_WhenAllergenPresentInRawIngredients_ReturnsZeroScoreAndWarning()
    {
        var blacklist = new[] { "Panthenol" };
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Dry,
            SkinConcerns = new List<string> { "Dehydration" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.Equal(0, result.SuitabilityScore);
        Assert.True(result.HasAllergyWarning);
        Assert.Equal("panthenol", result.MatchedAllergen?.ToLower());
    }

    [Fact]
    public void Calculate_WhenNoAllergyAndDirectSkinTypeMatch_ReturnsHighSuitability()
    {
        var blacklist = new[] { "Alcohol Denat" };
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Dry,
            SkinConcerns = new List<string> { "Dehydration" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.True(result.SuitabilityScore >= 90);
        Assert.False(result.HasAllergyWarning);
        Assert.Null(result.MatchedAllergen);
    }

    [Fact]
    public void Calculate_WhenSkinTypeDoesNotMatch_ReturnsLowerScoreWithoutWarning()
    {
        var blacklist = Array.Empty<string>();
        var profile = new SkinProfile
        {
            UserId = 10,
            SkinType = SkinType.Oily,
            SkinConcerns = new List<string> { "Acne" }
        };

        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, profile, blacklist);

        Assert.True(result.SuitabilityScore < 70);
        Assert.False(result.HasAllergyWarning);
    }

    [Fact]
    public void Calculate_WhenNoSkinProfile_ReturnsNeutralScore()
    {
        var result = SuitabilityScoreCalculator.Calculate(_sampleProduct, null, null);

        Assert.Equal(80, result.SuitabilityScore);
        Assert.False(result.HasAllergyWarning);
    }
}
