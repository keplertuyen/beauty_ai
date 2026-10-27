using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Xunit;

namespace BeautyAI.UnitTests;

public class SkinProfileServiceTests
{
    private class InMemoryUserRepository : IUserRepository
    {
        public readonly List<User> Users = new();
        public Task<User?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(Users.FirstOrDefault(u => u.Id == id));
        public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
            Task.FromResult(Users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)));
        public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default) =>
            Task.FromResult(Users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)));
        public Task<User> CreateAsync(User user, CancellationToken ct = default)
        {
            user.Id = Users.Count + 1;
            Users.Add(user);
            return Task.FromResult(user);
        }
        public Task<User> UpdateAsync(User user, CancellationToken ct = default) => Task.FromResult(user);
    }

    private class InMemorySkinProfileRepository : ISkinProfileRepository
    {
        public readonly List<SkinProfile> Profiles = new();
        public readonly List<UserAllergy> Allergies = new();

        public Task<SkinProfile?> GetByUserIdAsync(int userId, CancellationToken ct = default) =>
            Task.FromResult(Profiles.FirstOrDefault(p => p.UserId == userId));
        public Task<SkinProfile> CreateAsync(SkinProfile profile, CancellationToken ct = default)
        {
            profile.Id = Profiles.Count + 1;
            Profiles.Add(profile);
            return Task.FromResult(profile);
        }
        public Task<SkinProfile> UpdateAsync(SkinProfile profile, CancellationToken ct = default) => Task.FromResult(profile);
        public Task<List<UserAllergy>> GetAllergiesByUserIdAsync(int userId, CancellationToken ct = default) =>
            Task.FromResult(Allergies.Where(a => a.UserId == userId).ToList());
        public Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default)
        {
            allergy.Id = Allergies.Count + 1;
            Allergies.Add(allergy);
            return Task.FromResult(allergy);
        }
        public Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default)
        {
            var item = Allergies.FirstOrDefault(a => a.Id == allergyId && a.UserId == userId);
            if (item != null)
            {
                Allergies.Remove(item);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
        public Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default)
        {
            Allergies.RemoveAll(a => a.UserId == userId);
            foreach (var name in allergyNames)
            {
                Allergies.Add(new UserAllergy { Id = Allergies.Count + 1, UserId = userId, IngredientName = name });
            }
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task GetSkinProfileAsync_ReturnsUnifiedDigitalSkinId()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();

        var user = await userRepo.CreateAsync(new User
        {
            Id = 1,
            Email = "jane@example.com",
            FullName = "Jane Doe",
            PasswordHash = "hash123",
            Role = UserRole.Customer
        });

        await skinRepo.CreateAsync(new SkinProfile
        {
            Id = 1,
            UserId = user.Id,
            SkinType = SkinType.Sensitive,
            SkinConcerns = new List<string> { "Acne", "Redness" },
            PrimaryGoal = "Soothe Skin Barrier",
            BudgetLevel = BudgetLevel.High
        });

        await skinRepo.AddAllergyAsync(new UserAllergy
        {
            Id = 1,
            UserId = user.Id,
            IngredientName = "Fragrance / Parfum",
            Note = "Contact dermatitis"
        });

        var service = new SkinProfileService(skinRepo, userRepo);
        var profileDto = await service.GetSkinProfileAsync(user.Id);

        Assert.Equal(user.Id, profileDto.UserId);
        Assert.Equal("Jane Doe", profileDto.FullName);
        Assert.Equal("Sensitive", profileDto.SkinType);
        Assert.Single(profileDto.Allergies);
        Assert.Equal("Fragrance / Parfum", profileDto.Allergies[0].IngredientName);
        Assert.Equal(2, profileDto.SkinConcerns.Count);
        Assert.Equal("Soothe Skin Barrier", profileDto.PrimaryGoal);
        Assert.Equal("High", profileDto.BudgetLevel);
    }

    [Fact]
    public async Task UpdateSkinProfileAsync_UpdatesProfileAndSyncsAllergies()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();

        var user = await userRepo.CreateAsync(new User
        {
            Id = 1,
            Email = "alex@example.com",
            FullName = "Alex Smith",
            PasswordHash = "hash123",
            Role = UserRole.Customer
        });

        var service = new SkinProfileService(skinRepo, userRepo);

        var updateRequest = new UpdateDigitalSkinIdRequest(
            SkinType: "Oily",
            AllergyNames: new List<string> { "Alcohol Denat", "Linalool" },
            SkinConcerns: new List<string> { "Pores", "Excess Oil" },
            PrimaryGoal: "Oil Control & Pore Minimizing",
            BudgetLevel: "Medium"
        );

        var updated = await service.UpdateSkinProfileAsync(user.Id, updateRequest);

        Assert.Equal("Oily", updated.SkinType);
        Assert.Equal(2, updated.Allergies.Count);
        Assert.Contains(updated.Allergies, a => a.IngredientName == "Alcohol Denat");
        Assert.Contains(updated.Allergies, a => a.IngredientName == "Linalool");
        Assert.Equal("Oil Control & Pore Minimizing", updated.PrimaryGoal);
    }
}
