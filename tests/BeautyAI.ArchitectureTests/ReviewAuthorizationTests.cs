using System.Reflection;
using System.Text.Json;
using BeautyAI.Api.Controllers;
using BeautyAI.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class ReviewAuthorizationTests
{
    [Fact]
    public void ReviewSubmissionEndpoints_MustRequireAuthorization()
    {
        var endpoints = new[]
        {
            typeof(ReviewsController).GetMethod(nameof(ReviewsController.CreateReview)),
            typeof(ProductsController).GetMethod(nameof(ProductsController.AddReview))
        };

        foreach (var method in endpoints)
        {
            Assert.NotNull(method);
            var hasAuthorize = method!.GetCustomAttribute<AuthorizeAttribute>() != null
                || method.DeclaringType?.GetCustomAttribute<AuthorizeAttribute>() != null;
            var hasAllowAnonymous = method.GetCustomAttribute<AllowAnonymousAttribute>() != null;

            Assert.True(hasAuthorize, $"{method.DeclaringType?.Name}.{method.Name} must require [Authorize].");
            Assert.False(hasAllowAnonymous, $"{method.DeclaringType?.Name}.{method.Name} must not allow anonymous review submission.");
        }
    }

    [Fact]
    public void CreateReviewRequest_DeserializesSnakeCaseFrontendPayload()
    {
        const string json = """
            {
              "product_id": "42",
              "author_id": "7",
              "author_name": "Jane Doe",
              "rating": 5,
              "review_text": "Gentle and effective!",
              "skin_type": "Oily",
              "is_recommended": 1
            }
            """;

        var req = JsonSerializer.Deserialize<CreateReviewRequest>(json);

        Assert.NotNull(req);
        Assert.Equal("42", req!.ProductId);
        Assert.Equal("7", req.AuthorId);
        Assert.Equal("Jane Doe", req.AuthorName);
        Assert.Equal(5, req.Rating);
        Assert.Equal("Gentle and effective!", req.ReviewText);
        Assert.Equal("Oily", req.SkinType);
        Assert.Equal(1, req.IsRecommended);
    }
}
