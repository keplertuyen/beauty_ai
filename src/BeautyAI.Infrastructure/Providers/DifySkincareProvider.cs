using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BeautyAI.Infrastructure.Providers;

/// <summary>
/// Adapter for Dify Cloud / Self-Hosted RAG Chatbot API (POST /v1/chat-messages).
/// Enforces de-identification (no PII sent to external LLM) and graceful degradation.
/// </summary>
public partial class DifySkincareProvider : IAiSkincareProvider
{
    private const string DefaultBaseUrl = "https://api.dify.ai/v1";
    private const string AnonymousDifyUser = "beautyai-anon-session";
    private const int DefaultTimeoutSeconds = 45;

    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string? _apiKey;
    private readonly ILogger<DifySkincareProvider>? _logger;

    public DifySkincareProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<DifySkincareProvider>? logger = null)
    {
        _httpClient = httpClient;

        var timeoutRaw =
            configuration["DIFY_TIMEOUT_SECONDS"]
            ?? configuration["Dify:TimeoutSeconds"]
            ?? Environment.GetEnvironmentVariable("DIFY_TIMEOUT_SECONDS");
        var timeoutSeconds = int.TryParse(timeoutRaw, out var parsed) && parsed >= 5 && parsed <= 120
            ? parsed
            : DefaultTimeoutSeconds;
        _httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);

        _baseUrl = (
            configuration["DIFY_API_URL"]
            ?? configuration["Dify:ApiUrl"]
            ?? Environment.GetEnvironmentVariable("DIFY_API_URL")
            ?? DefaultBaseUrl
        ).TrimEnd('/');

        _apiKey =
            configuration["DIFY_API_KEY"]
            ?? configuration["Dify:ApiKey"]
            ?? Environment.GetEnvironmentVariable("DIFY_API_KEY");

        _logger = logger;
    }

    public async Task<string> ConsultAsync(
        string userMessage,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> availableProducts,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger?.LogWarning("DIFY_API_KEY is not configured. Falling back to rule-based skincare guidance.");
            return BuildRuleBasedFallback(userMessage, skinId, availableProducts);
        }

        try
        {
            var query = BuildDeIdentifiedQuery(userMessage, skinId);
            var endpoint = $"{_baseUrl}/chat-messages";

            var payload = new
            {
                inputs = new Dictionary<string, object>(),
                query,
                response_mode = "blocking",
                conversation_id = string.Empty,
                user = AnonymousDifyUser
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(payload);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                if (json.TryGetProperty("answer", out var answerElem))
                {
                    var answer = answerElem.GetString();
                    if (!string.IsNullOrWhiteSpace(answer))
                    {
                        return answer.Trim();
                    }
                }

                _logger?.LogWarning("Dify API returned 200 OK without a non-empty 'answer' field.");
            }
            else
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger?.LogWarning(
                    "Dify API request failed with status {StatusCode}: {ErrorBody}",
                    (int)response.StatusCode,
                    errorBody);
            }
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger?.LogWarning(ex, "Dify API request timed out after {TimeoutSeconds}s. Falling back to rule-based guidance.", _httpClient.Timeout.TotalSeconds);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Exception calling Dify API. Falling back to rule-based guidance.");
        }

        return BuildRuleBasedFallback(userMessage, skinId, availableProducts);
    }

    /// <summary>
    /// Builds a de-identified prompt query containing ONLY non-PII skin attributes (INV-04 / BR-AI-16).
    /// Never includes userId, email, name, phone, address, or order IDs.
    /// </summary>
    internal static string BuildDeIdentifiedQuery(string userMessage, DigitalSkinIdDto? skinId)
    {
        if (skinId is null)
        {
            return userMessage.Trim();
        }

        var skinType = string.IsNullOrWhiteSpace(skinId.SkinType) ? "Unspecified" : skinId.SkinType;
        var concerns = skinId.SkinConcerns is { Count: > 0 }
            ? string.Join(", ", skinId.SkinConcerns)
            : "General skincare";
        var allergies = skinId.Allergies is { Count: > 0 }
            ? string.Join(", ", skinId.Allergies.Select(a => a.IngredientName).Where(n => !string.IsNullOrWhiteSpace(n)))
            : "None";
        var budget = string.IsNullOrWhiteSpace(skinId.BudgetLevel) ? "Medium" : skinId.BudgetLevel;

        return $"""
[Anonymized Skin Profile]
- Skin Type: {skinType}
- Concerns: {concerns}
- Ingredients to Strictly Avoid (Allergies): {allergies}
- Budget Preference: {budget}

[User Question]
{userMessage.Trim()}
""";
    }

    [GeneratedRegex(@"(?:under|below|less than|<=?)\s*\$?\s*(\d+(?:\.\d{1,2})?)", RegexOptions.IgnoreCase)]
    private static partial Regex BudgetRegex();

    internal static string BuildRuleBasedFallback(
        string userMessage,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> products)
    {
        var lowerMsg = (userMessage ?? string.Empty).ToLowerInvariant();
        var skinType = skinId?.SkinType
            ?? (lowerMsg.Contains("oily") ? "Oily"
                : lowerMsg.Contains("dry") ? "Dry"
                : lowerMsg.Contains("sensitive") ? "Sensitive"
                : "Combination");

        decimal? maxBudget = null;
        var budgetMatch = BudgetRegex().Match(lowerMsg);
        if (budgetMatch.Success && decimal.TryParse(budgetMatch.Groups[1].Value, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsedBudget))
        {
            maxBudget = parsedBudget;
        }

        var requestedKeywords = new List<string>();
        if (lowerMsg.Contains("cleanser") || lowerMsg.Contains("wash")) requestedKeywords.Add("cleans");
        if (lowerMsg.Contains("serum") || lowerMsg.Contains("treatment") || lowerMsg.Contains("acne")) requestedKeywords.Add("serum");
        if (lowerMsg.Contains("moisturizer") || lowerMsg.Contains("cream") || lowerMsg.Contains("lotion")) requestedKeywords.Add("moistur");
        if (lowerMsg.Contains("sunscreen") || lowerMsg.Contains("spf")) requestedKeywords.Add("sunscreen");
        if (lowerMsg.Contains("toner") || lowerMsg.Contains("exfoliat")) requestedKeywords.Add("ton");

        var candidates = products
            .Where(p => p.PriceUsd > 0)
            .Where(p => !maxBudget.HasValue || p.PriceUsd <= maxBudget.Value)
            .ToList();

        List<ProductSummaryDto> matching;
        if (requestedKeywords.Count > 0)
        {
            matching = candidates
                .Where(p =>
                {
                    var text = $"{p.CategoryName} {p.Name}".ToLowerInvariant();
                    return requestedKeywords.Any(kw => text.Contains(kw, StringComparison.Ordinal));
                })
                .OrderByDescending(p => p.Rating)
                .Take(3)
                .ToList();
        }
        else
        {
            matching = [];
        }

        if (matching.Count == 0)
        {
            matching = candidates
                .Where(p => !p.CategoryName.Contains("Lip", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(p => p.Rating)
                .Take(3)
                .ToList();
        }

        var productListStr = matching.Count > 0
            ? string.Join("\n", matching.Select(p => $"• **{p.BrandName}** — {p.Name} ({p.Code}) — ${p.PriceUsd:F2}"))
            : "Explore our Skincare catalog for gentle cleansers, hydrators, and broad-spectrum SPF 30+ sunscreen.";

        return $"""
Hello! Based on your skincare profile ({skinType} skin), here is evidence-based skincare guidance:

1. **Foundational Barrier Care:** Use a gentle pH-balanced cleanser morning and night, followed by a moisturizer suited to {skinType} skin and daily broad-spectrum SPF 30+ sunscreen.
2. **Active Ingredient Sequencing:** Introduce one active ingredient at a time (2–3 evenings per week) to minimize barrier irritation.

**Recommended in-stock options from BeautyAI:**
{productListStr}

*Disclaimer: BeautyAI Assistant provides cosmetic skincare guidance only and is not a substitute for professional dermatological advice.*
""";
    }
}
