using System.Security.Claims;
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
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxUploadSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderService _orderService;
    private readonly IAdminProductService _adminProductService;
    private readonly IAdminConsoleRepository _adminConsoleRepository;
    private readonly IWebHostEnvironment _env;
    private readonly IProductCache _productCache;

    public AdminController(
        IProductRepository productRepository,
        IOrderRepository orderRepository,
        IOrderService orderService,
        IAdminProductService adminProductService,
        IAdminConsoleRepository adminConsoleRepository,
        IWebHostEnvironment env,
        IProductCache productCache)
    {
        _productRepository = productRepository;
        _orderRepository = orderRepository;
        _orderService = orderService;
        _adminProductService = adminProductService;
        _adminConsoleRepository = adminConsoleRepository;
        _env = env;
        _productCache = productCache;
    }

    // ── DASHBOARD OVERVIEW ─────────────────────────────────────────
    [HttpGet("dashboard")]
    [HttpGet("kpis")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var analytics = await _productRepository.GetAdminAnalyticsAsync(cancellationToken);
        var orders = await _orderRepository.GetAllOrdersAsync(500, cancellationToken);
        var summary = await _adminConsoleRepository.GetSummaryCountsAsync(cancellationToken);
        var recentTickets = await _adminConsoleRepository.GetRecentSupportTicketsAsync(5, cancellationToken);

        int totalOrders = orders.Count;
        decimal totalRevenue = orders.Where(o => o.OrderStatus != "Cancelled").Sum(o => o.TotalAmountUsd);
        int pendingOrders = orders.Count(o => o.OrderStatus == "Pending");
        int deliveringOrders = orders.Count(o => o.OrderStatus == "Delivering");
        int completedOrders = orders.Count(o => o.OrderStatus == "Completed");
        int cancelledOrders = orders.Count(o => o.OrderStatus == "Cancelled");

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

        var recentOrders = orders.Take(5).Select(o => new
        {
            id = o.Id,
            recipient_name = o.RecipientName,
            order_status = o.OrderStatus,
            total_amount_usd = o.TotalAmountUsd,
            items_count = o.OrderItems.Count,
            created_at = o.CreatedAtUtc
        }).ToList();

        return Ok(new
        {
            kpis = new
            {
                total_products = analytics.TotalProducts,
                low_stock_products = summary.LowStockProducts,
                total_orders = totalOrders,
                total_revenue_usd = Math.Round(totalRevenue, 2),
                active_users = summary.ActiveUsers,
                total_users = summary.TotalUsers,
                pending_orders = pendingOrders,
                open_tickets = summary.OpenTickets
            },
            order_status_breakdown = new
            {
                pending = pendingOrders,
                delivering = deliveringOrders,
                completed = completedOrders,
                cancelled = cancelledOrders
            },
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
            top_products = topProducts,
            recent_orders = recentOrders,
            recent_tickets = recentTickets
        });
    }

    // ── PRODUCT IMAGE UPLOAD ───────────────────────────────────────
    [HttpPost("upload/product-image")]
    [RequestSizeLimit(MaxUploadSizeBytes)]
    public async Task<IActionResult> UploadProductImage(
        IFormFile? file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { detail = "Vui lòng chọn tệp ảnh để tải lên." });

        if (file.Length > MaxUploadSizeBytes)
            return BadRequest(new { detail = "Kích thước ảnh tối đa là 5MB." });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedImageExtensions.Contains(ext))
            return BadRequest(new { detail = "Chỉ hỗ trợ ảnh định dạng .jpg, .jpeg, .png, .webp." });

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { detail = "Loại tệp không hợp lệ. Vui lòng chọn tệp ảnh." });

        var webRoot = string.IsNullOrWhiteSpace(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;

        var uploadDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadDir, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var url = $"/uploads/products/{fileName}";
        return Ok(new { url, file_name = fileName });
    }

    // ── ORDERS MANAGEMENT ──────────────────────────────────────────
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] string? status = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.GetAllOrdersAsync(Math.Clamp(limit, 1, 500), cancellationToken);

        IEnumerable<BeautyAI.Domain.Entities.Order> filtered = orders;
        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLowerInvariant();
            filtered = filtered.Where(o =>
                o.Id.ToString().Contains(term) ||
                o.RecipientName.ToLowerInvariant().Contains(term) ||
                o.PhoneNumber.ToLowerInvariant().Contains(term) ||
                o.ShippingAddress.ToLowerInvariant().Contains(term) ||
                (o.TrackingNumber != null && o.TrackingNumber.ToLowerInvariant().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            filtered = filtered.Where(o => string.Equals(o.OrderStatus, st, StringComparison.OrdinalIgnoreCase));
        }

        var result = filtered.Select(o => new
        {
            id = o.Id,
            user_id = o.UserId,
            recipient_name = o.RecipientName,
            phone_number = o.PhoneNumber,
            shipping_address = o.ShippingAddress,
            payment_method = o.PaymentMethod,
            payment_status = o.PaymentStatus,
            order_status = o.OrderStatus,
            total_amount_usd = o.TotalAmountUsd,
            conflict_acknowledged = o.ConflictAcknowledged,
            tracking_number = o.TrackingNumber,
            admin_notes = o.AdminNotes,
            created_at = o.CreatedAtUtc,
            items_count = o.OrderItems.Count,
            items = o.OrderItems.Select(oi => new
            {
                product_id = oi.ProductId,
                product_code = oi.Product?.Code,
                product_name = oi.Product?.Name ?? "Cosmetic Item",
                image_url = oi.Product?.ImageUrl,
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

        var normalizedStatus = request.Status.Trim() switch
        {
            var s when s.Equals("Pending", StringComparison.OrdinalIgnoreCase) => "Pending",
            var s when s.Equals("Delivering", StringComparison.OrdinalIgnoreCase) => "Delivering",
            var s when s.Equals("Completed", StringComparison.OrdinalIgnoreCase) => "Completed",
            _ => "Cancelled"
        };

        try
        {
            var success = await _orderService.UpdateOrderStatusAsync(
                id,
                normalizedStatus,
                request.TrackingNumber,
                request.AdminNotes,
                cancellationToken);

            if (!success) return NotFound(new { detail = $"Order with ID {id} not found." });

            return Ok(new
            {
                message = $"Order {id} updated to {normalizedStatus}.",
                order_status = normalizedStatus,
                tracking_number = request.TrackingNumber,
                admin_notes = request.AdminNotes
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    // ── PRODUCTS CRUD ──────────────────────────────────────────────
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

    // ── REVIEWS MODERATION ─────────────────────────────────────────
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] int? rating = null,
        [FromQuery] string? status = null,
        [FromQuery] int? productId = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 15,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminConsoleRepository.GetReviewsAsync(query, rating, status, productId, page, perPage, cancellationToken);
        return Ok(new
        {
            reviews = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpPatch("reviews/{id:long}/visibility")]
    public async Task<IActionResult> UpdateReviewVisibility(
        long id,
        [FromBody] UpdateReviewVisibilityRequest request,
        CancellationToken cancellationToken = default)
    {
        var updated = await _adminConsoleRepository.UpdateReviewVisibilityAsync(id, request.IsHidden, request.ModerationReason, cancellationToken);
        if (updated == null) return NotFound(new { detail = $"Review with ID {id} not found." });
        return Ok(updated);
    }

    [HttpDelete("reviews/{id:long}")]
    public async Task<IActionResult> DeleteReview(
        long id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await _adminConsoleRepository.DeleteReviewAsync(id, cancellationToken);
        if (!deleted) return NotFound(new { detail = $"Review with ID {id} not found." });
        return NoContent();
    }

    // ── USERS MANAGEMENT (Privacy-safe per NFR-PRIV-08) ────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] string? role = null,
        [FromQuery(Name = "is_active")] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 15,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminConsoleRepository.GetUsersAsync(query, role, isActive, page, perPage, cancellationToken);
        return Ok(new
        {
            users = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpPatch("users/{id:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(
        int id,
        [FromBody] UpdateUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentAdminId = GetCurrentUserId();
        if (currentAdminId == id && !request.IsActive)
            return BadRequest(new { detail = "Không thể tự khóa tài khoản quản trị viên đang đăng nhập." });

        var updated = await _adminConsoleRepository.UpdateUserStatusAsync(id, request.IsActive, cancellationToken);
        if (updated == null) return NotFound(new { detail = $"User with ID {id} not found." });
        return Ok(updated);
    }

    [HttpPatch("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(
        int id,
        [FromBody] UpdateUserRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentAdminId = GetCurrentUserId();
        if (currentAdminId == id && !string.Equals(request.Role?.Trim(), "Admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { detail = "Không thể tự hạ quyền tài khoản quản trị viên đang đăng nhập." });

        try
        {
            var updated = await _adminConsoleRepository.UpdateUserRoleAsync(id, request.Role ?? "", cancellationToken);
            if (updated == null) return NotFound(new { detail = $"User with ID {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    // ── SUPPORT TICKETS / FEEDBACK INBOX ───────────────────────────
    [HttpGet("support")]
    public async Task<IActionResult> GetSupportTickets(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 15,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminConsoleRepository.GetSupportTicketsAsync(query, status, page, perPage, cancellationToken);
        return Ok(new
        {
            tickets = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpPatch("support/{id:int}")]
    public async Task<IActionResult> UpdateSupportTicket(
        int id,
        [FromBody] UpdateSupportTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminConsoleRepository.UpdateSupportTicketAsync(id, request.Status, request.AdminReply, cancellationToken);
            if (updated == null) return NotFound(new { detail = $"Support ticket with ID {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    // ── INGREDIENTS DICTIONARY CRUD ────────────────────────────────
    [HttpGet("ingredients")]
    public async Task<IActionResult> GetIngredients(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] string? group = null,
        [FromQuery(Name = "active_only")] bool? activeOnly = null,
        [FromQuery] int page = 1,
        [FromQuery(Name = "per_page")] int perPage = 15,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminConsoleRepository.GetIngredientsAsync(query, group, activeOnly, page, perPage, cancellationToken);
        return Ok(new
        {
            ingredients = result.Items,
            total = result.Total,
            page = result.Page,
            per_page = result.PageSize,
            pages = result.Pages
        });
    }

    [HttpPost("ingredients")]
    public async Task<IActionResult> CreateIngredient(
        [FromBody] UpsertIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _adminConsoleRepository.CreateIngredientAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("ingredients/{id:int}")]
    public async Task<IActionResult> UpdateIngredient(
        int id,
        [FromBody] UpsertIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminConsoleRepository.UpdateIngredientAsync(id, request, cancellationToken);
            if (updated == null) return NotFound(new { detail = $"Ingredient with ID {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("ingredients/{id:int}")]
    public async Task<IActionResult> DeleteIngredient(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _adminConsoleRepository.DeleteIngredientAsync(id, cancellationToken);
            if (!deleted) return NotFound(new { detail = $"Ingredient with ID {id} not found." });
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    // ── CONFLICT RULES CRUD ────────────────────────────────────────
    [HttpGet("conflicts")]
    public async Task<IActionResult> GetConflictRules(
        [FromQuery(Name = "q")] string? query = null,
        [FromQuery] string? severity = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _adminConsoleRepository.GetConflictRulesAsync(query, severity, cancellationToken);
        return Ok(new { conflicts = items, total = items.Count });
    }

    [HttpPost("conflicts")]
    public async Task<IActionResult> CreateConflictRule(
        [FromBody] UpsertConflictRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _adminConsoleRepository.CreateConflictRuleAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("conflicts/{id:int}")]
    public async Task<IActionResult> UpdateConflictRule(
        int id,
        [FromBody] UpsertConflictRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminConsoleRepository.UpdateConflictRuleAsync(id, request, cancellationToken);
            if (updated == null) return NotFound(new { detail = $"Conflict rule with ID {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("conflicts/{id:int}")]
    public async Task<IActionResult> DeleteConflictRule(
        int id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await _adminConsoleRepository.DeleteConflictRuleAsync(id, cancellationToken);
        if (!deleted) return NotFound(new { detail = $"Conflict rule with ID {id} not found." });
        return NoContent();
    }

    // ── BRANDS CRUD ────────────────────────────────────────────────
    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands(
        [FromQuery(Name = "q")] string? query = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _adminConsoleRepository.GetBrandsAsync(query, cancellationToken);
        return Ok(new { brands = items, total = items.Count });
    }

    [HttpPost("brands")]
    public async Task<IActionResult> CreateBrand(
        [FromBody] UpsertBrandRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _adminConsoleRepository.CreateBrandAsync(request, cancellationToken);
            _productCache.InvalidateBrands();
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("brands/{id:int}")]
    public async Task<IActionResult> UpdateBrand(
        int id,
        [FromBody] UpsertBrandRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminConsoleRepository.UpdateBrandAsync(id, request, cancellationToken);
            if (updated == null) return NotFound(new { detail = $"Brand with ID {id} not found." });
            _productCache.InvalidateBrands();
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("brands/{id:int}")]
    public async Task<IActionResult> DeleteBrand(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _adminConsoleRepository.DeleteBrandAsync(id, cancellationToken);
            if (!deleted) return NotFound(new { detail = $"Brand with ID {id} not found." });
            _productCache.InvalidateBrands();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    // ── CATEGORIES CRUD ────────────────────────────────────────────
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(
        [FromQuery(Name = "q")] string? query = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _adminConsoleRepository.GetCategoriesAsync(query, cancellationToken);
        return Ok(new { categories = items, total = items.Count });
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(
        [FromBody] UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _adminConsoleRepository.CreateCategoryAsync(request, cancellationToken);
            _productCache.InvalidateCategories();
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(
        int id,
        [FromBody] UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var updated = await _adminConsoleRepository.UpdateCategoryAsync(id, request, cancellationToken);
            if (updated == null) return NotFound(new { detail = $"Category with ID {id} not found." });
            _productCache.InvalidateCategories();
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _adminConsoleRepository.DeleteCategoryAsync(id, cancellationToken);
            if (!deleted) return NotFound(new { detail = $"Category with ID {id} not found." });
            _productCache.InvalidateCategories();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }
}
