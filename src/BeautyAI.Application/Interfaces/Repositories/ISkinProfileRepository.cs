using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface ISkinProfileRepository
{
    Task<SkinProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<SkinProfile> CreateAsync(SkinProfile profile, CancellationToken ct = default);
    Task<SkinProfile> UpdateAsync(SkinProfile profile, CancellationToken ct = default);

    Task<List<UserAllergy>> GetAllergiesByUserIdAsync(int userId, CancellationToken ct = default);
    Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default);
    Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default);
    Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default);
}
