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
        var analytics = await _productRepository.GetAdminAnalyticsAsync(cancellationToken);
        var orders = await _orderRepository.GetAllOrdersAsync(500, cancellationToken);

        int totalOrders = orders.Count;
        decimal totalRevenue = orders.Sum(o => o.TotalAmountUsd);
        int pendingOrders = orders.Count(o => o.OrderStatus == "Pending");

        var topProducts = analytics.TopProducts.Select(p => new
        {
            product_id = p.ProductId,
            code = p.Code,
            product_name = p.ProductName,
            brand_name = p.BrandName,
            primary_category = p.PrimaryCategory,
            price_usd = p.PriceUsd,
            rating = p.Rating,
            reviews_count = p.ReviewsCount,
            selling_status = p.SellingStatus,
            image_url = p.ImageUrl
        }).ToList();

        return Ok(new
        {
            kpis = new AdminKpisDto(
                TotalProducts: analytics.TotalProducts,
                TotalOrders: totalOrders,
                TotalRevenueUsd: Math.Round(totalRevenue, 2),
                ActiveUsers: Math.Max(1, totalOrders),
                PendingOrders: pendingOrders
            ),
            products = new
            {
                total = analytics.TotalProducts,
                total_brands = analytics.TotalBrands,
                avg_rating = analytics.AverageRating,
                total_reviews = analytics.TotalReviews
            },
            category_distribution = analytics.CategoryDistribution,
            brand_distribution = analytics.BrandDistribution,
            price_range_distribution = analytics.PriceRangeDistribution,
            rating_distribution = analytics.RatingDistribution,
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
