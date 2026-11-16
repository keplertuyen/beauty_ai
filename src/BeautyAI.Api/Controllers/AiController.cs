using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/ai")]
public class AiController : ControllerBase
{
    private readonly IAiSkincareProvider _aiProvider;
    private readonly ISkinProfileService _skinProfileService;
    private readonly IProductRepository _productRepository;

    public AiController(
        IAiSkincareProvider aiProvider,
        ISkinProfileService skinProfileService,
        IProductRepository productRepository)
    {
        _aiProvider = aiProvider;
        _skinProfileService = skinProfileService;
        _productRepository = productRepository;
    }

    [HttpPost("consult")]
    public async Task<IActionResult> Consult(
        [FromBody] AiConsultRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Message))
            return BadRequest(new { detail = "User message cannot be empty." });

        DigitalSkinIdDto? skinId = null;
        List<string> userAllergies = new();

        if (User.Identity?.IsAuthenticated == true)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var userId))
            {
                skinId = await _skinProfileService.GetSkinProfileAsync(userId, cancellationToken);
                if (skinId?.Allergies != null)
                {
                    userAllergies = skinId.Allergies.Select(a => a.IngredientName).ToList();
                }
            }
        }

        var filter = new ProductFilterParams(PageSize: 30);
        var (products, _) = await _productRepository.GetProductsAsync(filter, userAllergies, cancellationToken);

        var productSummaries = products.Select(p => new ProductSummaryDto(
            Id: p.Id,
            Code: p.Code,
            Name: p.Name,
            Slug: p.Slug,
            BrandName: p.Brand?.Name ?? "BeautyAI Brand",
            CategoryName: p.Category?.Name ?? "Skincare",
            PriceUsd: p.PriceUsd,
            VolumeMl: p.VolumeMl,
            ImageUrl: !string.IsNullOrWhiteSpace(p.ImageUrl) ? p.ImageUrl : $"/images/products/{p.Code}.webp",
            Rating: 5.0m,
            ReviewsCount: 0,
            TargetSkinTypes: p.TargetSkinTypes ?? Array.Empty<string>(),
            SuitabilityVerdict: "Safe",
            SuitabilityLabel: "Compatible",
            HasAllergyWarning: false,
            Department: p.Department ?? "Skincare"
        )).ToList();

        var reply = await _aiProvider.ConsultAsync(request.Message, skinId, productSummaries, cancellationToken);

        // Find products mentioned in reply for UI action cards
        var recommended = productSummaries
            .Where(p => reply.Contains(p.Name, StringComparison.OrdinalIgnoreCase) ||
                        (p.BrandName.Length > 3 && reply.Contains(p.BrandName, StringComparison.OrdinalIgnoreCase)))
            .Take(3)
            .ToList();

        if (recommended.Count == 0 && productSummaries.Count > 0)
        {
            recommended = productSummaries.Take(2).ToList();
        }

        return Ok(new AiConsultResponse(
            Reply: reply,
            RecommendedProducts: recommended
        ));
    }
}
