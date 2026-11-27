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
                question = "How does BeautyAI analyze INCI ingredient lists?",
                answer = "Our system cross-references every INCI ingredient against active ingredient roles, comedogenic and irritation reference data, and your personal Allergy Blacklist to deliver a personalized suitability verdict."
            },
            new
            {
                question = "How can I check for active ingredient conflicts in my skincare routine?",
                answer = "Use the Ingredient Analyzer or add products to your Shopping Bag or Routine Builder — our Smart Conflict Detector automatically flags incompatible active pairs (such as Retinol + AHA/BHA) and suggests how to alternate AM/PM schedules."
            },
            new
            {
                question = "How do I pay for and track my order?",
                answer = "BeautyAI currently supports Cash on Delivery (COD) in USD. Once your order is placed, our operations team confirms fulfillment, adds a tracking number, and updates delivery status directly in your order history."
            },
            new
            {
                question = "Are my Digital Skin ID and Allergy Blacklist kept private?",
                answer = "Yes. Your Digital Skin ID is strictly protected; administrators cannot view your personal skin profile or identifiable allergy list."
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
                message = $"Your support request ({created.TicketCode}) has been received. The BeautyAI team will respond as soon as possible."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }
}
