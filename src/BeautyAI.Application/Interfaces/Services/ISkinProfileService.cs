using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface ISkinProfileService
{
    Task<DigitalSkinIdDto> GetSkinProfileAsync(int userId, CancellationToken ct = default);
    Task<DigitalSkinIdDto> UpdateSkinProfileAsync(int userId, UpdateDigitalSkinIdRequest request, CancellationToken ct = default);
    Task<AllergyItemDto> AddAllergyAsync(int userId, AddAllergyRequest request, CancellationToken ct = default);
    Task<bool> RemoveAllergyAsync(int userId, int allergyId, CancellationToken ct = default);
}
