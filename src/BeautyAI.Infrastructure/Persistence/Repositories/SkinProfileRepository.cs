using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class SkinProfileRepository : ISkinProfileRepository
{
    private readonly BeautyAIDbContext _dbContext;

    public SkinProfileRepository(BeautyAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SkinProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default)
    {
        return await _dbContext.SkinProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
    }

    public async Task<SkinProfile> CreateAsync(SkinProfile profile, CancellationToken ct = default)
    {
        _dbContext.SkinProfiles.Add(profile);
        await _dbContext.SaveChangesAsync(ct);
        return profile;
    }

    public async Task<SkinProfile> UpdateAsync(SkinProfile profile, CancellationToken ct = default)
    {
        profile.UpdatedAtUtc = DateTime.UtcNow;
        _dbContext.SkinProfiles.Update(profile);
        await _dbContext.SaveChangesAsync(ct);
        return profile;
    }

    public async Task<List<UserAllergy>> GetAllergiesByUserIdAsync(int userId, CancellationToken ct = default)
    {
        return await _dbContext.UserAllergies
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Id)
            .ToListAsync(ct);
    }

    public async Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default)
    {
        _dbContext.UserAllergies.Add(allergy);
        await _dbContext.SaveChangesAsync(ct);
        return allergy;
    }

    public async Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default)
    {
        var existing = await _dbContext.UserAllergies
            .FirstOrDefaultAsync(a => a.Id == allergyId && a.UserId == userId, ct);

        if (existing == null)
            return false;

        _dbContext.UserAllergies.Remove(existing);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default)
    {
        var current = await _dbContext.UserAllergies
            .Where(a => a.UserId == userId)
            .ToListAsync(ct);

        var targetNames = allergyNames
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Remove ones not in target
        var toRemove = current.Where(a => !targetNames.Contains(a.IngredientName)).ToList();
        if (toRemove.Count > 0)
        {
            _dbContext.UserAllergies.RemoveRange(toRemove);
        }

        // Add new ones
        var currentNames = current.Select(a => a.IngredientName).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toAdd = targetNames
            .Where(name => !currentNames.Contains(name))
            .Select(name => new UserAllergy
            {
                Id = 0,
                UserId = userId,
                IngredientName = name
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            _dbContext.UserAllergies.AddRange(toAdd);
        }

        await _dbContext.SaveChangesAsync(ct);
    }
}
