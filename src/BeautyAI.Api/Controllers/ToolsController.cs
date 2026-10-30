using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/tools")]
public class ToolsController : ControllerBase
{
    private readonly IToolsService _toolsService;

    public ToolsController(IToolsService toolsService)
    {
        _toolsService = toolsService;
    }

    /// <summary>
    /// Analyzes an INCI ingredient list against the authenticated user's Digital Skin ID and target care area.
    /// </summary>
    [HttpPost("analyze-inci")]
    [Authorize]
    [ProducesResponseType(typeof(InciAnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AnalyzeInci([FromBody] InciAnalysisRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IngredientsText))
        {
            return BadRequest(new { message = "Ingredients text cannot be empty." });
        }

        var userId = GetCurrentUserId();
        var result = await _toolsService.AnalyzeInciAsync(request, userId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Checks for mutual ingredient conflicts in a list of product IDs.
    /// </summary>
    [HttpPost("check-conflict")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ConflictCheckResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckConflict([FromBody] ConflictCheckRequest request, CancellationToken cancellationToken)
    {
        var result = await _toolsService.CheckCartConflictsAsync(request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns skin type characteristics, recommended and cautionary ingredients for authenticated members.
    /// </summary>
    [HttpGet("skintype-guide")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSkinTypeGuide([FromQuery] string area = "face", CancellationToken cancellationToken = default)
    {
        var result = await _toolsService.GetSkinTypeGuideAsync(area, cancellationToken);
        return Ok(result);
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(claim, out int userId))
            return userId;
        return null;
    }
}
