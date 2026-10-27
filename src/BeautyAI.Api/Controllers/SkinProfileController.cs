using System.Security.Claims;
using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeautyAI.Api.Controllers;

[ApiController]
[Route("api/v1/skin-profile")]
[Authorize]
public class SkinProfileController : ControllerBase
{
    private readonly ISkinProfileService _skinProfileService;

    public SkinProfileController(ISkinProfileService skinProfileService)
    {
        _skinProfileService = skinProfileService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(DigitalSkinIdDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid user token." });

        try
        {
            var profile = await _skinProfileService.GetSkinProfileAsync(userId.Value, ct);
            return Ok(profile);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "User not found." });
        }
    }

    [HttpPut]
    [ProducesResponseType(typeof(DigitalSkinIdDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateDigitalSkinIdRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid user token." });

        try
        {
            var updated = await _skinProfileService.UpdateSkinProfileAsync(userId.Value, request, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "User not found." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("allergies")]
    [ProducesResponseType(typeof(AllergyItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddAllergy([FromBody] AddAllergyRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid user token." });

        try
        {
            var created = await _skinProfileService.AddAllergyAsync(userId.Value, request, ct);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "User not found." });
        }
    }

    [HttpDelete("allergies/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveAllergy([FromRoute] int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid user token." });

        var success = await _skinProfileService.RemoveAllergyAsync(userId.Value, id, ct);
        if (!success)
            return NotFound(new { message = $"Allergy with ID {id} not found." });

        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(claim, out int userId))
            return userId;
        return null;
    }
}
