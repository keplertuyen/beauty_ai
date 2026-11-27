using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/consultation")]
public class ConsultationController : ControllerBase
{
    private readonly IAdminConsoleRepository _adminConsoleRepository;

    public ConsultationController(IAdminConsoleRepository adminConsoleRepository)
    {
        _adminConsoleRepository = adminConsoleRepository;
    }

    [HttpGet("faq")]
    [AllowAnonymous]
    public IActionResult GetFaq()
    {
        var faqs = new[]
        {
            new
            {
                question = "BeautyAI phân tích bảng thành phần INCI như thế nào?",
                answer = "Hệ thống đối chiếu danh sách thành phần INCI với cơ sở dữ liệu hoạt chất, mức độ gây bít tắc (Comedogenic), khả năng kích ứng và hồ sơ dị ứng cá nhân (Allergy Blacklist) để đưa ra khuyến nghị an toàn cho da."
            },
            new
            {
                question = "Làm sao để kiểm tra xung đột hoạt chất trong chu trình skincare?",
                answer = "Bạn có thể dùng công cụ Ingredient Analyzer hoặc thêm sản phẩm vào giỏ hàng / routine — Smart Conflict Detector sẽ tự động cảnh báo các cặp hoạt chất kỵ nhau (ví dụ Retinol + AHA/BHA) kèm gợi ý tách buổi sáng/tối."
            },
            new
            {
                question = "Tôi có thể thanh toán và theo dõi đơn hàng bằng cách nào?",
                answer = "BeautyAI hỗ trợ thanh toán khi nhận hàng (COD). Sau khi đặt hàng, đội ngũ vận hành sẽ xác nhận, cập nhật mã vận đơn và trạng thái giao hàng trực tiếp trên hệ thống."
            },
            new
            {
                question = "Hồ sơ da và danh sách dị ứng của tôi có được bảo mật không?",
                answer = "Có. Hồ sơ da của bạn được bảo vệ nghiêm ngặt; quản trị viên không thể xem hồ sơ da hay danh sách dị ứng gắn danh tính của bạn."
            }
        };

        return Ok(new { faqs });
    }

    [HttpPost("contact")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitContact(
        [FromBody] CreateSupportTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(claim, out var parsed)) userId = parsed;
            }

            var created = await _adminConsoleRepository.CreateSupportTicketAsync(userId, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new
            {
                ticket_code = created.TicketCode,
                ticket = created,
                message = $"Đã tiếp nhận yêu cầu hỗ trợ ({created.TicketCode}). Đội ngũ BeautyAI sẽ phản hồi sớm nhất!"
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }
}
