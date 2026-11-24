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

    private static readonly string[] MedicalGuardrailKeywords =
    [
        "eczema", "psoriasis", "fungal", "ringworm", "infection", "infected",
        "corticoid", "corticosteroid", "steroid", "isotretinoin", "prescription",
        "melanoma", "skin cancer", "anaphylaxis", "severe swelling", "shortness of breath",
        "pregnant", "pregnancy", "breastfeeding",
        "viem da", "vay nen", "kem tron", "mung mu", "nhiem trung", "di ung nang", "mang thai"
    ];

    [HttpPost("consult")]
    public async Task<IActionResult> Consult(
        [FromBody] AiConsultRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Message))
            return BadRequest(new { detail = "User message cannot be empty." });

        // Stage 1: Deterministic Medical Guardrail (NO LLM call, NO product recommendation — BR-AI-03 / GC-10)
        if (IsMedicalBoundaryTopic(request.Message))
        {
            return Ok(new AiConsultResponse(
                Reply: "Your question involves a medical or clinical dermatology concern that falls outside cosmetic skincare guidance. BeautyAI Assistant is not a doctor and cannot diagnose conditions or recommend products for active medical symptoms. Please consult a board-certified dermatologist or connect with our specialist via Zalo for safe guidance.",
                RecommendedProducts: new List<ProductSummaryDto>(),
                IsPathology: true,
                ZaloDeepLink: "https://zalo.me/0908123456",
                SuggestedAction: "Stop applying new active skincare products and seek in-person evaluation from a licensed dermatologist."
            ));
        }

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

        var filter = new ProductFilterParams(PageSize: 120);
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

        // Stage 6: Match products mentioned in reply against real DB catalog (Code -> Name -> Brand)
        var recommended = productSummaries
            .Where(p =>
                (!string.IsNullOrWhiteSpace(p.Code) && reply.Contains(p.Code, StringComparison.OrdinalIgnoreCase)) ||
                reply.Contains(p.Name, StringComparison.OrdinalIgnoreCase))
            .Take(3)
            .ToList();

        if (recommended.Count == 0)
        {
            recommended = productSummaries
                .Where(p => p.BrandName.Length > 3 && reply.Contains(p.BrandName, StringComparison.OrdinalIgnoreCase))
                .Take(3)
                .ToList();
        }

        if (recommended.Count == 0 && productSummaries.Count > 0)
        {
            recommended = productSummaries.Take(2).ToList();
        }

        return Ok(new AiConsultResponse(
            Reply: reply,
            RecommendedProducts: recommended
        ));
    }

    private static bool IsMedicalBoundaryTopic(string message)
    {
        var normalized = message.Trim().ToLowerInvariant()
            .Replace('đ', 'd')
            .Normalize(System.Text.NormalizationForm.FormD);

        var sb = new System.Text.StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var ascii = sb.ToString();
        return MedicalGuardrailKeywords.Any(kw => ascii.Contains(kw, StringComparison.Ordinal));
    }
}
