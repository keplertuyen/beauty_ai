using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;

namespace BeautyAI.Application.Services;

public class SkinProfileService : ISkinProfileService
{
    private readonly ISkinProfileRepository _skinProfileRepository;
    private readonly IUserRepository _userRepository;

    public SkinProfileService(
        ISkinProfileRepository skinProfileRepository,
        IUserRepository userRepository)
    {
        _skinProfileRepository = skinProfileRepository;
        _userRepository = userRepository;
    }

    public async Task<DigitalSkinIdDto> GetSkinProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found.");

        var profile = await _skinProfileRepository.GetByUserIdAsync(userId, ct);
        if (profile == null)
        {
            // Auto-initialize if missing
            profile = new SkinProfile
            {
                Id = 0,
                UserId = userId,
                SkinType = SkinType.Combination,
                SkinConcerns = new List<string>(),
                PrimaryGoal = "Maintain Healthy Skin",
                BudgetLevel = BudgetLevel.Medium
            };
            profile = await _skinProfileRepository.CreateAsync(profile, ct);
        }

        var allergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(userId, ct);

        return new DigitalSkinIdDto(
            userId,
            user.FullName,
            profile.SkinType.ToString(),
            allergies.Select(a => new AllergyItemDto(a.Id, a.IngredientName, a.Note)).ToList(),
            profile.SkinConcerns,
            profile.PrimaryGoal ?? "Maintain Healthy Skin",
            profile.BudgetLevel.ToString()
        );
    }

    public async Task<DigitalSkinIdDto> UpdateSkinProfileAsync(int userId, UpdateDigitalSkinIdRequest request, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found.");

        if (!Enum.TryParse<SkinType>(request.SkinType, true, out var parsedSkinType))
        {
            parsedSkinType = SkinType.Combination;
        }

        if (!Enum.TryParse<BudgetLevel>(request.BudgetLevel, true, out var parsedBudget))
        {
            parsedBudget = BudgetLevel.Medium;
        }

        var profile = await _skinProfileRepository.GetByUserIdAsync(userId, ct);
        if (profile == null)
        {
            profile = new SkinProfile
            {
                Id = 0,
                UserId = userId,
                SkinType = parsedSkinType,
                SkinConcerns = request.SkinConcerns ?? new List<string>(),
                PrimaryGoal = request.PrimaryGoal?.Trim() ?? "Maintain Healthy Skin",
                BudgetLevel = parsedBudget
            };
            await _skinProfileRepository.CreateAsync(profile, ct);
        }
        else
        {
            profile.SkinType = parsedSkinType;
            profile.SkinConcerns = request.SkinConcerns ?? new List<string>();
            profile.PrimaryGoal = request.PrimaryGoal?.Trim() ?? "Maintain Healthy Skin";
            profile.BudgetLevel = parsedBudget;
            await _skinProfileRepository.UpdateAsync(profile, ct);
        }

        // Sync blacklist allergies
        if (request.AllergyNames != null)
        {
            await _skinProfileRepository.SyncAllergiesAsync(userId, request.AllergyNames, ct);
        }

        var updatedAllergies = await _skinProfileRepository.GetAllergiesByUserIdAsync(userId, ct);

        return new DigitalSkinIdDto(
            userId,
            user.FullName,
            profile.SkinType.ToString(),
            updatedAllergies.Select(a => new AllergyItemDto(a.Id, a.IngredientName, a.Note)).ToList(),
            profile.SkinConcerns,
            profile.PrimaryGoal,
            profile.BudgetLevel.ToString()
        );
    }

    public async Task<AllergyItemDto> AddAllergyAsync(int userId, AddAllergyRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.IngredientName))
            throw new ArgumentException("Ingredient name is required.", nameof(request.IngredientName));

        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found.");

        var existing = await _skinProfileRepository.GetAllergiesByUserIdAsync(userId, ct);
        var trimmedName = request.IngredientName.Trim();

        var match = existing.FirstOrDefault(a => a.IngredientName.Equals(trimmedName, StringComparison.OrdinalIgnoreCase));
        if (match != null)
        {
            return new AllergyItemDto(match.Id, match.IngredientName, match.Note);
        }

        var newAllergy = new UserAllergy
        {
            Id = 0,
            UserId = userId,
            IngredientName = trimmedName,
            Note = request.Note?.Trim()
        };

        var created = await _skinProfileRepository.AddAllergyAsync(newAllergy, ct);
        return new AllergyItemDto(created.Id, created.IngredientName, created.Note);
    }

    public async Task<bool> RemoveAllergyAsync(int userId, int allergyId, CancellationToken ct = default)
    {
        return await _skinProfileRepository.RemoveAllergyAsync(allergyId, userId, ct);
    }
}
