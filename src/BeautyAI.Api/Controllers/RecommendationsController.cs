using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/recommendations")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;

    public RecommendationsController(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured(
        [FromQuery(Name = "top_k")] int topK = 8,
        CancellationToken cancellationToken = default)
    {
        var items = await _recommendationService.GetFeaturedAsync(topK, GetCurrentUserId(), cancellationToken);
        return Ok(new { featured = items, products = items });
    }

    [HttpGet("trending")]
    public async Task<IActionResult> GetTrending(
        [FromQuery(Name = "top_k")] int topK = 12,
        CancellationToken cancellationToken = default)
    {
        var items = await _recommendationService.GetTrendingAsync(topK, GetCurrentUserId(), cancellationToken);
        return Ok(new { trending = items, products = items });
    }

    [HttpPost("skinquiz")]
    public async Task<IActionResult> GetSkinQuizRecommendations(
        [FromBody] SkinQuizRecommendationRequest? request,
        CancellationToken cancellationToken = default)
    {
        var items = await _recommendationService.GetSkinQuizRecommendationsAsync(request, GetCurrentUserId(), cancellationToken);
        return Ok(new { recommendations = items, total = items.Count });
    }

    private int? GetCurrentUserId()
    {
        var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }
}
