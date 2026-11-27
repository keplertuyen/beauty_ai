using System.Reflection;
using BeautyAI.Api.Controllers;
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
}
