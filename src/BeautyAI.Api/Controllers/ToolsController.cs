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
    /// Analyzes an INCI ingredient list pasted or extracted from cosmetic packaging.
    /// </summary>
    [HttpPost("analyze-inci")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(InciAnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AnalyzeInci([FromBody] InciAnalysisRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IngredientsText))
        {
            return BadRequest(new { message = "Ingredients text cannot be empty." });
        }

        var result = await _toolsService.AnalyzeInciAsync(request, cancellationToken);
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
    /// Returns skin type characteristics, recommended and cautionary ingredients.
    /// </summary>
    [HttpGet("skintype-guide")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSkinTypeGuide([FromQuery] string area = "face", CancellationToken cancellationToken = default)
    {
        var result = await _toolsService.GetSkinTypeGuideAsync(area, cancellationToken);
        return Ok(result);
    }
}
