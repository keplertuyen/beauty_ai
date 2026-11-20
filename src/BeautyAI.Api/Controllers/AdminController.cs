using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IAdminProductService _adminProductService;

    public AdminController(
        IProductRepository productRepository,
        IOrderRepository orderRepository,
        IAdminProductService adminProductService)
    {
        _productRepository = productRepository;
        _orderRepository = orderRepository;
        _adminProductService = adminProductService;
    }

    [HttpGet("dashboard")]
    [HttpGet("kpis")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var (products, totalProducts) = await _productRepository.GetAdminProductsAsync(
            new AdminProductFilterParams(PageSize: 100),
            cancellationToken);

        var orders = await _orderRepository.GetAllOrdersAsync(100, cancellationToken);
        var brands = await _productRepository.GetBrandsAsync(cancellationToken);
        var categories = await _productRepository.GetCategoriesAsync(cancellationToken);

        int totalOrders = orders.Count;
        decimal totalRevenue = orders.Sum(o => o.TotalAmountUsd);
        int pendingOrders = orders.Count(o => o.OrderStatus == "Pending");

        // Categories distribution
        var catDist = products
            .GroupBy(p => p.Category?.Name ?? "Skincare")
            .ToDictionary(g => g.Key, g => g.Count());

        // Brands distribution
        var brandDist = products
            .GroupBy(p => p.Brand?.Name ?? "BeautyAI")
            .ToDictionary(g => g.Key, g => g.Count());

        // Price ranges distribution
        var priceDist = new Dictionary<string, int>
        {
            ["Budget (<$25)"] = products.Count(p => p.PriceUsd < 25),
            ["Mid-Range ($25-$50)"] = products.Count(p => p.PriceUsd >= 25 && p.PriceUsd < 50),
            ["Premium ($50-$100)"] = products.Count(p => p.PriceUsd >= 50 && p.PriceUsd < 100),
            ["Luxury (>$100)"] = products.Count(p => p.PriceUsd >= 100)
        };

        // Rating distribution
        var ratingDist = new Dictionary<string, int>
        {
            ["5"] = (int)(totalProducts * 0.7),
            ["4"] = (int)(totalProducts * 0.2),
            ["3"] = (int)(totalProducts * 0.07),
            ["2"] = (int)(totalProducts * 0.02),
            ["1"] = (int)(totalProducts * 0.01)
        };

        var topProducts = products.Take(10).Select(p => new
        {
            product_id = p.Id,
            product_name = p.Name,
            brand_name = p.Brand?.Name ?? "BeautyAI",
            primary_category = p.Category?.Name ?? "Skincare",
            price_usd = p.PriceUsd,
            rating = 5.0,
            reviews_count = 120,
            selling_status = p.SellingStatus,
            image_url = !string.IsNullOrWhiteSpace(p.ImageUrl) ? p.ImageUrl : $"/images/products/{p.Code}.webp"
        }).ToList();

        return Ok(new
        {
            kpis = new AdminKpisDto(
                TotalProducts: totalProducts,
                TotalOrders: totalOrders,
                TotalRevenueUsd: Math.Round(totalRevenue, 2),
                ActiveUsers: Math.Max(12, totalOrders * 2),
                PendingOrders: pendingOrders
            ),
            products = new
            {
                total = totalProducts,
                total_brands = brands.Count > 0 ? brands.Count : brandDist.Count,
                avg_rating = 4.8,
                total_reviews = 1094187
            },
            category_distribution = catDist,
            brand_distribution = brandDist,
            price_range_distribution = priceDist,
            rating_distribution = ratingDist,
            top_products = topProducts
        });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.GetAllOrdersAsync(limit, cancellationToken);
        var result = orders.Select(o => new
        {
            id = o.Id,
            recipient_name = o.RecipientName,
            phone_number = o.PhoneNumber,
            shipping_address = o.ShippingAddress,
            payment_method = o.PaymentMethod,
            order_status = o.OrderStatus,
            total_amount_usd = o.TotalAmountUsd,
            conflict_acknowledged = o.ConflictAcknowledged,
            created_at = o.CreatedAtUtc,
            items_count = o.OrderItems.Count,
            items = o.OrderItems.Select(oi => new
            {
                product_id = oi.ProductId,
                product_name = oi.Product?.Name ?? "Cosmetic Item",
                quantity = oi.Quantity,
                unit_price_usd = oi.UnitPriceUsd,
                total_price_usd = oi.TotalPriceUsd
            })
        });

        return Ok(result);
    }

    [HttpPatch("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Status))
            return BadRequest(new { detail = "Status cannot be empty." });

        var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Pending", "Delivering", "Completed", "Cancelled"
        };

        if (!validStatuses.Contains(request.Status.Trim()))
            return BadRequest(new { detail = $"Invalid status '{request.Status}'. Valid statuses are: Pending, Delivering, Completed, Cancelled." });

        var success = await _orderRepository.UpdateOrderStatusAsync(id, request.Status.Trim(), cancellationToken);
        if (!success) return NotFound(new { detail = $"Order with ID {id} not found." });

        return Ok(new { message = $"Order {id} status updated to {request.Status}." });
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery(Name = "q")] string? q = null,
        [FromQuery(Name = "query")] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] string? brand = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 10,
        CancellationToken cancellationToken = default)
    {
        var filter = new AdminProductFilterParams(
            Query: !string.IsNullOrWhiteSpace(query) ? query : q,
            Category: category,
            Brand: brand,
            Status: status,
            Page: page,
            PageSize: perPage
        );

        var result = await _adminProductService.GetProductsAsync(filter, cancellationToken);
        return Ok(new
        {
            products = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProductById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var product = await _adminProductService.GetProductByIdAsync(id, cancellationToken);
        if (product == null)
            return NotFound(new { detail = $"Product with ID {id} not found." });

        return Ok(product);
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(
        [FromBody] CreateProductAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _adminProductService.CreateProductAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(
        int id,
        [FromBody] UpdateProductAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminProductService.UpdateProductAsync(id, request, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DiscontinueProduct(
        int id,
        CancellationToken cancellationToken = default)
    {
        var discontinued = await _adminProductService.DiscontinueProductAsync(id, cancellationToken);
        if (!discontinued)
            return NotFound(new { detail = $"Product with ID {id} not found." });

        return NoContent();
    }

    [HttpPatch("products/{id:int}/restore")]
    public async Task<IActionResult> RestoreProduct(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var restored = await _adminProductService.RestoreProductAsync(id, cancellationToken);
            return Ok(restored);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }
}
