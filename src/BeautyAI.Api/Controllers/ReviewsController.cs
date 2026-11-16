using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IProductService _productService;

    public ReviewsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReview(
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var parsed)) userId = parsed;
        }

        var review = await _productService.AddReviewAsync(userId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, review);
    }
}
