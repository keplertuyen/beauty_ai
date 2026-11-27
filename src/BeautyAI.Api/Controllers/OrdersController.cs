using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Places a new Cash on Delivery (COD) order for the authenticated customer.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (User.IsInRole("Admin"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Tài khoản Quản trị viên không được phép đặt hàng. Vui lòng sử dụng tài khoản Khách hàng.",
                detail = "Admin accounts cannot place orders. Please use a Customer account."
            });
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Authentication required to place an order." });
        }

        try
        {
            var created = await _orderService.CreateOrderAsync(userId.Value, request, cancellationToken);
            return Created($"/api/v1/orders/{created.OrderId}", created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves the authenticated customer's order history.
    /// </summary>
    [HttpGet("my-orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyOrders(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Authentication required." });
        }

        var orders = await _orderService.GetMyOrdersAsync(userId.Value, cancellationToken);
        return Ok(new { orders });
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(claim, out int userId))
            return userId;
        return null;
    }
}
