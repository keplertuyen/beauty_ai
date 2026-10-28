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
            PageSize: perPage
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
