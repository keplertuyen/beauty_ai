using System.Net;
using System.Text;
using System.Text.Json;
using BeautyAI.Application.DTOs;
using BeautyAI.Infrastructure.Providers;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace BeautyAI.UnitTests;

public class DifySkincareProviderTests
{
    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastRequestBody { get; private set; }

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            if (request.Content is not null)
            {
                LastRequestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            }
            return _responder(request);
        }
    }

    private sealed class StubConfiguration : IConfiguration
    {
        private readonly Dictionary<string, string?> _values;

        public StubConfiguration(Dictionary<string, string?> values) => _values = values;

        public string? this[string key]
        {
            get => _values.TryGetValue(key, out var val) ? val : null;
            set => _values[key] = value;
        }

        public IEnumerable<IConfigurationSection> GetChildren() => [];
        public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken() => throw new NotSupportedException();
        public IConfigurationSection GetSection(string key) => throw new NotSupportedException();
    }

    private static IConfiguration BuildConfig(string? apiKey, string? apiUrl = "https://api.dify.ai/v1")
    {
        var dict = new Dictionary<string, string?>();
        if (apiKey is not null) dict["DIFY_API_KEY"] = apiKey;
        if (apiUrl is not null) dict["DIFY_API_URL"] = apiUrl;
        return new StubConfiguration(dict);
    }

    private static List<ProductSummaryDto> SampleProducts() =>
    [
        new ProductSummaryDto(
            Id: 1,
            Code: "P427406",
            Name: "Glycolic Acid 7% Exfoliating Toning Solution",
            Slug: "glycolic-acid-7-toning-solution",
            BrandName: "The Ordinary",
            CategoryName: "Cleansers",
            PriceUsd: 13.00m,
            VolumeMl: 240,
            ImageUrl: "/images/products/P427406.webp",
            Rating: 4.8m,
            ReviewsCount: 1200,
            TargetSkinTypes: ["Oily", "Combination"],
            SuitabilityVerdict: "Safe",
            SuitabilityLabel: "Compatible",
            HasAllergyWarning: false,
            Department: "Skincare")
    ];

    [Fact]
    public async Task ConsultAsync_WhenDifyReturnsAnswer_ReturnsAnswerAndUsesBearerAuth()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { answer = "Try The Ordinary Glycolic Acid 7% ($13.00)." }),
                    Encoding.UTF8,
                    "application/json")
            });

        using var httpClient = new HttpClient(handler);
        var provider = new DifySkincareProvider(httpClient, BuildConfig("app-demo-test-key"));

        var reply = await provider.ConsultAsync("Best toner for oily skin?", null, SampleProducts());

        Assert.Equal("Try The Ordinary Glycolic Acid 7% ($13.00).", reply);
        Assert.NotNull(handler.LastRequest);
        Assert.Equal("https://api.dify.ai/v1/chat-messages", handler.LastRequest!.RequestUri?.ToString());
        Assert.Equal("Bearer", handler.LastRequest.Headers.Authorization?.Scheme);
        Assert.Equal("app-demo-test-key", handler.LastRequest.Headers.Authorization?.Parameter);
        Assert.Contains("beautyai-anon-session", handler.LastRequestBody ?? string.Empty);
    }

    [Fact]
    public async Task ConsultAsync_WhenApiKeyMissing_FallsBackGracefullyWithoutThrowing()
    {
        var handler = new StubHttpMessageHandler(_ => throw new InvalidOperationException("Should not call HTTP when key is missing"));
        using var httpClient = new HttpClient(handler);
        var provider = new DifySkincareProvider(httpClient, BuildConfig(apiKey: string.Empty));

        var reply = await provider.ConsultAsync("Recommend a cleanser", null, SampleProducts());

        Assert.Contains("The Ordinary", reply);
        Assert.Contains("Disclaimer:", reply);
    }

    [Fact]
    public async Task ConsultAsync_WhenDifyReturns500_FallsBackWithoutLeakingTechnicalError()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("{\"code\":\"internal_error\",\"message\":\"upstream 500\"}", Encoding.UTF8, "application/json")
            });

        using var httpClient = new HttpClient(handler);
        var provider = new DifySkincareProvider(httpClient, BuildConfig("app-demo-test-key"));

        var reply = await provider.ConsultAsync("What moisturizer should I use?", null, SampleProducts());

        Assert.DoesNotContain("500", reply);
        Assert.DoesNotContain("internal_error", reply);
        Assert.Contains("Disclaimer:", reply);
    }
}
