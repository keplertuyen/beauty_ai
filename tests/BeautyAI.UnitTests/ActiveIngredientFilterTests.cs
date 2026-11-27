using BeautyAI.Domain.Services;
using Xunit;

namespace BeautyAI.UnitTests;

public class ActiveIngredientFilterTests
{
    [Theory]
    [InlineData("niacinamide", "niacinamide", "nicotinamide")]
    [InlineData("bha", "salicylic acid", "betaine salicylate")]
    [InlineData("aha", "glycolic acid", "lactic acid")]
    [InlineData("retinol", "retinol", "hydroxypinacolone retinoate")]
    [InlineData("hyaluronic acid", "hyaluronic acid", "sodium hyaluronate")]
    [InlineData("vitamin c", "ascorbic acid", "ascorbyl glucoside")]
    [InlineData("centella", "centella asiatica", "madecassoside")]
    [InlineData("ceramide", "ceramide", "ceramide")]
    [InlineData("peptide", "peptide", "peptide")]
    public void ExpandActiveIngredientTerms_KnownKeys_ReturnExpectedInciSynonyms(
        string key,
        string expectedFirst,
        string expectedSecond)
    {
        var terms = CosmeticKnowledgeBase.ExpandActiveIngredientTerms(key);

        Assert.Contains(expectedFirst, terms);
        Assert.Contains(expectedSecond, terms);
    }

    [Fact]
    public void ExpandActiveIngredientTerms_UnknownKey_FallsBackToNormalizedKey()
    {
        var terms = CosmeticKnowledgeBase.ExpandActiveIngredientTerms("  Azelaic Acid  ");

        Assert.Single(terms);
        Assert.Equal("azelaic acid", terms[0]);
    }

    [Fact]
    public void ExpandActiveIngredientTerms_Empty_ReturnsEmpty()
    {
        Assert.Empty(CosmeticKnowledgeBase.ExpandActiveIngredientTerms("   "));
    }

    [Fact]
    public void ExpandFreeFromTerms_AlcoholFree_ExcludesDryingAlcoholsButNotFattyAlcohols()
    {
        var terms = CosmeticKnowledgeBase.ExpandFreeFromTerms("alcohol_free");

        Assert.Contains("alcohol denat", terms);
        Assert.Contains("sd alcohol", terms);
        Assert.DoesNotContain("cetyl alcohol", terms);
        Assert.DoesNotContain("cetearyl alcohol", terms);
    }

    [Theory]
    [InlineData("fragrance_free", "parfum")]
    [InlineData("paraben_free", "methylparaben")]
    [InlineData("sulfate_free", "sodium lauryl sulfate")]
    public void ExpandFreeFromTerms_KnownClaims_ReturnExpectedExclusions(string claim, string expectedTerm)
    {
        var terms = CosmeticKnowledgeBase.ExpandFreeFromTerms(claim);

        Assert.Contains(expectedTerm, terms);
    }

    [Fact]
    public void ExpandFreeFromTerms_UnknownClaim_ReturnsEmpty()
    {
        Assert.Empty(CosmeticKnowledgeBase.ExpandFreeFromTerms("nonexistent_claim"));
    }
}
