using System.Net.Http.Json;
using System.Text.Json;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautyAI.Infrastructure.Providers;

public class GeminiSkincareProvider : IAiSkincareProvider
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly ILogger<GeminiSkincareProvider>? _logger;

    public GeminiSkincareProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiSkincareProvider>? logger = null)
    {
        _httpClient = httpClient;
        _apiKey = configuration["GEMINI_API_KEY"] ?? configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        _logger = logger;
    }

    public async Task<string> ConsultAsync(
        string userMessage,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> availableProducts,
        CancellationToken cancellationToken = default)
    {
        // 1. Build System Instruction with Grounding & Guardrails
        var systemPrompt = BuildSystemPrompt(skinId, availableProducts);
        var fullPrompt = $"{systemPrompt}\n\n[USER INQUIRY]\n{userMessage}";

        // 2. If API Key is present, call Gemini API
        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";
                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new[] { new { text = fullPrompt } }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.4,
                        maxOutputTokens = 1024
                    }
                };

                using var response = await _httpClient.PostAsJsonAsync(url, payload, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                    if (responseJson.TryGetProperty("candidates", out var candidates) &&
                        candidates.GetArrayLength() > 0 &&
                        candidates[0].TryGetProperty("content", out var content) &&
                        content.TryGetProperty("parts", out var parts) &&
                        parts.GetArrayLength() > 0 &&
                        parts[0].TryGetProperty("text", out var textElem))
                    {
                        var reply = textElem.GetString();
                        if (!string.IsNullOrWhiteSpace(reply))
                        {
                            return reply;
                        }
                    }
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger?.LogWarning("Gemini API call failed with status {StatusCode}: {ErrorBody}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Exception calling Gemini API. Falling back to scientific rule-based consultation.");
            }
        }

        // 3. Robust Scientific Rule-Based Fallback (Grounding + Guardrails)
        return GenerateRuleBasedFallback(userMessage, skinId, availableProducts);
    }

    private static string BuildSystemPrompt(DigitalSkinIdDto? skinId, IReadOnlyList<ProductSummaryDto> products)
    {
        var skinType = skinId?.SkinType ?? "Combination";
        var allergies = skinId?.Allergies?.Select(a => a.IngredientName).ToList() ?? new List<string>();
        var concerns = skinId?.SkinConcerns != null && skinId.SkinConcerns.Count > 0 ? string.Join(", ", skinId.SkinConcerns) : "General maintenance";
        var goal = skinId?.PrimaryGoal ?? "Healthy skin barrier";
        var budget = skinId?.BudgetLevel ?? "Medium";

        var productCatalogue = products.Take(15).Select(p => new
        {
            name = p.Name,
            brand = p.BrandName,
            category = p.CategoryName,
            price_usd = p.PriceUsd,
            skin_types = p.TargetSkinTypes
        });

        var catalogJson = JsonSerializer.Serialize(productCatalogue);

        return $"""
You are Lumi, the AI Dermatology & Skincare Advisor for the BeautyAI platform.
Your mission is to provide evidence-based skincare routine guidance and product recommendations.

[USER DIGITAL SKIN ID]
- Skin Type: {skinType}
- Safety Blacklist (STRICT ALLERGEN PROHIBITION): {(allergies.Count > 0 ? string.Join(", ", allergies) : "None")}
- Primary Concerns: {concerns}
- Primary Skincare Goal: {goal}
- Budget Preference: {budget}

[AVAILABLE IN-STOCK PRODUCT CATALOG]
{catalogJson}

[STRICT CLINICAL & ETHICAL GUARDRAILS]
1. ZERO-ALLERGY TOLERANCE: Absolutely NEVER recommend any product containing ingredients listed in the user's Allergy Blacklist.
2. MEDICAL BOUNDARY: Never diagnose or prescribe treatments for severe clinical dermatological conditions (cystic acne conglobata, infected eczema, psoriasis, fungal infections). Advise consulting a board-certified dermatologist when encountering clinical pathology.
3. GROUNDING CONSTRAINT: ONLY recommend products from the [AVAILABLE IN-STOCK PRODUCT CATALOG] above, displaying the exact product name and price in USD ($).
4. Tone: Empathetic, scientific, objective, and clear.
""";
    }

    private static string GenerateRuleBasedFallback(
        string message,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> products)
    {
        var skinType = skinId?.SkinType ?? "Combination";
        var lowerMsg = message.ToLowerInvariant();

        // Medical Guardrail: Severe conditions check
        if (lowerMsg.Contains("eczema") || lowerMsg.Contains("psoriasis") ||
            lowerMsg.Contains("fungal") || lowerMsg.Contains("cyst") || lowerMsg.Contains("infection"))
        {
            return "Based on clinical safety standards, severe dermatological conditions (such as active eczema flares, psoriasis plaques, or cystic infections) require an in-person clinical diagnosis by a board-certified dermatologist. Cosmetic skincare can support skin barrier health, but cannot replace medical prescription therapy. Please consult a dermatologist for prescription treatment.";
        }

        var matching = products
            .Where(p => p.PriceUsd > 0)
            .OrderByDescending(p => p.Rating)
            .Take(3)
            .ToList();

        var productListStr = matching.Count > 0
            ? string.Join("\n", matching.Select(p => $"• **{p.BrandName}** - {p.Name} (${p.PriceUsd:F2}): Ideal for {skinType} skin."))
            : "Explore our catalog for cleansers, hydrators, and broad-spectrum sunscreen.";

        return $"""
Hello! Based on your Digital Skin ID profile ({skinType} skin), here is evidence-based skincare guidance tailored for your concerns:

1. **Foundational Barrier Care:** Maintain a gentle pH-balanced cleanse in the morning and evening, followed by daily broad-spectrum SPF 30+ sun protection.
2. **Active Ingredient Sequencing:** Introduce active ingredients gradually to prevent transepidermal water loss and barrier irritation.

**Recommended in-stock options for your profile:**
{productListStr}

Would you like advice on sequencing these into an AM/PM routine or checking active ingredient compatibility?
""";
    }
}
