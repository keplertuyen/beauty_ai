using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/routines")]
public class RoutinesController : ControllerBase
{
    private readonly IRoutineService _routineService;

    public RoutinesController(IRoutineService routineService)
    {
        _routineService = routineService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateRoutine(
        [FromBody] GenerateRoutineRequest request,
        CancellationToken cancellationToken = default)
    {
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out var parsed)) userId = parsed;
        }

        var result = await _routineService.GenerateRoutineAsync(userId, request, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("save")]
    public async Task<IActionResult> SaveRoutine(
        [FromBody] SaveRoutineRequest request,
        CancellationToken cancellationToken = default)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out var userId))
            return Unauthorized();

        var saved = await _routineService.SaveRoutineAsync(userId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, saved);
    }

    [Authorize]
    [HttpGet("my-routines")]
    public async Task<IActionResult> GetMyRoutines(CancellationToken cancellationToken = default)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out var userId))
            return Unauthorized();

        var list = await _routineService.GetUserSavedRoutinesAsync(userId, cancellationToken);
        return Ok(list);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoutine(int id, CancellationToken cancellationToken = default)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out var userId))
            return Unauthorized();

        var deleted = await _routineService.DeleteSavedRoutineAsync(userId, id, cancellationToken);
        if (!deleted) return NotFound();

        return NoContent();
    }
}
