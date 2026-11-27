using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] string? brand = null,
        [FromQuery] string? skinType = null,
        [FromQuery(Name = "min_price")] decimal? minPrice = null,
        [FromQuery(Name = "max_price")] decimal? maxPrice = null,
        [FromQuery(Name = "min_rating")] decimal? minRating = null,
        [FromQuery(Name = "sort_by")] string? sortBy = "rating",
        [FromQuery(Name = "safe_for_me")] bool safeForMe = false,
        [FromQuery(Name = "active_ingredients")] string? activeIngredients = null,
        [FromQuery(Name = "free_from")] string? freeFrom = null,
        [FromQuery(Name = "highlights_filter")] string? highlightsFilter = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 20,
        CancellationToken cancellationToken = default)
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var filter = new ProductFilterParams(
            Query: query,
            Category: category,
            Brand: brand,
            SkinType: skinType,
            MinPrice: minPrice,
            MaxPrice: maxPrice,
            MinRating: minRating,
            SortBy: sortBy,
            SafeForMe: safeForMe,
            Page: page,
            PageSize: perPage,
            ActiveIngredients: activeIngredients,
            FreeFrom: freeFrom,
            HighlightsFilter: highlightsFilter
        );

        var result = await _productService.GetCatalogAsync(filter, currentUserId, cancellationToken);

        return Ok(new
        {
            products = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(string id, CancellationToken cancellationToken = default)
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var product = await _productService.GetProductDetailAsync(id, currentUserId, cancellationToken);
        if (product == null)
        {
            return NotFound(new { message = $"Product with identifier '{id}' not found." });
        }

        return Ok(product);
    }

    [HttpGet("{id}/similar")]
    public async Task<IActionResult> GetSimilar(string id, [FromQuery] int limit = 8, CancellationToken cancellationToken = default)
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var recommendations = await _productService.GetSimilarProductsAsync(id, currentUserId, limit, cancellationToken);
        return Ok(new { recommendations });
    }

    [HttpGet("{id}/qrcode")]
    public async Task<IActionResult> GetQrCode(string id, CancellationToken cancellationToken = default)
    {
        var product = await _productService.GetProductDetailAsync(id, null, cancellationToken);
        var sku = product?.Code ?? id;
        var qrSvg = GenerateDeterministicQrSvg(sku);
        var barcodeSvg = GenerateDeterministicBarcodeSvg(sku);

        return Ok(new
        {
            product_id = product?.Id.ToString() ?? id,
            code = sku,
            product_name = product?.Name ?? "BeautyAI Product",
            brand_name = product?.BrandName ?? "BeautyAI",
            qr_code_svg = $"data:image/svg+xml;utf8,{Uri.EscapeDataString(qrSvg)}",
            barcode_svg = $"data:image/svg+xml;utf8,{Uri.EscapeDataString(barcodeSvg)}"
        });
    }

    private static string GenerateDeterministicQrSvg(string text)
    {
        const int grid = 21;
        const int cell = 8;
        const int pad = 16;
        const int size = grid * cell + pad * 2;
        var sb = new System.Text.StringBuilder();
        sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {size} {size}' width='{size}' height='{size}'>");
        sb.Append($"<rect width='{size}' height='{size}' rx='12' fill='#FFFFFF'/>");

        bool IsFinder(int r, int c) =>
            (r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7);

        void DrawFinder(int r0, int c0)
        {
            int x = pad + c0 * cell;
            int y = pad + r0 * cell;
            sb.Append($"<rect x='{x}' y='{y}' width='{7 * cell}' height='{7 * cell}' rx='4' fill='#2C2018'/>");
            sb.Append($"<rect x='{x + cell}' y='{y + cell}' width='{5 * cell}' height='{5 * cell}' rx='2' fill='#FFFFFF'/>");
            sb.Append($"<rect x='{x + 2 * cell}' y='{y + 2 * cell}' width='{3 * cell}' height='{3 * cell}' rx='1' fill='#2C2018'/>");
        }

        DrawFinder(0, 0);
        DrawFinder(0, grid - 7);
        DrawFinder(grid - 7, 0);

        int seed = 17;
        foreach (var ch in text ?? "BEAUTYAI")
            seed = unchecked(seed * 31 + ch);

        for (int r = 0; r < grid; r++)
        {
            for (int c = 0; c < grid; c++)
            {
                if (IsFinder(r, c)) continue;
                int hash = unchecked((r * 37 + c * 73 + seed) ^ (seed >> ((r + c) % 16)));
                if ((hash & 1) == 0)
                {
                    int x = pad + c * cell;
                    int y = pad + r * cell;
                    sb.Append($"<rect x='{x}' y='{y}' width='{cell - 1}' height='{cell - 1}' rx='1.5' fill='#2C2018'/>");
                }
            }
        }

        sb.Append("</svg>");
        return sb.ToString();
    }

    private static string GenerateDeterministicBarcodeSvg(string sku)
    {
        const int width = 260;
        const int height = 64;
        var sb = new System.Text.StringBuilder();
        sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {width} {height}' width='{width}' height='{height}'>");
        sb.Append($"<rect width='{width}' height='{height}' fill='#FFFFFF'/>");
        int x = 18;
        int seed = 23;
        foreach (var ch in sku ?? "P0000")
            seed = unchecked(seed * 33 + ch);

        int idx = 0;
        while (x < width - 22)
        {
            int w = ((Math.Abs(unchecked(seed + idx * 41)) % 3) + 1) * 2;
            int gap = ((Math.Abs(unchecked(seed >> (idx % 12)) + idx * 19) % 2) + 1) * 2;
            if (x + w < width - 18)
            {
                sb.Append($"<rect x='{x}' y='8' width='{w}' height='48' fill='#2C2018'/>");
            }
            x += w + gap;
            idx++;
        }
        sb.Append("</svg>");
        return sb.ToString();
    }

    [HttpGet("{id}/reviews")]
    public async Task<IActionResult> GetReviews(
        string id,
        [FromQuery(Name = "skin_type")] string? skinType = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _productService.GetProductReviewsAsync(id, skinType, page, perPage, cancellationToken);
        return Ok(new
        {
            reviews = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpPost("{id}/reviews")]
    public async Task<IActionResult> AddReview(
        string id,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var parsed)) userId = parsed;
        }

        var reqWithId = request with { ProductId = string.IsNullOrWhiteSpace(request.ProductId) ? id : request.ProductId };
        var review = await _productService.AddReviewAsync(userId, reqWithId, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, review);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken = default)
    {
        var categories = await _productService.GetCategoriesAsync(cancellationToken);
        return Ok(new { categories });
    }

    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands(CancellationToken cancellationToken = default)
    {
        var brands = await _productService.GetBrandsAsync(cancellationToken);
        return Ok(new { brands });
    }
}
