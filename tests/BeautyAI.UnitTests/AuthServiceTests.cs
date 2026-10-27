using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Xunit;

namespace BeautyAI.UnitTests;

public class AuthServiceTests
{
    private class DummyTokenGenerator : IJwtTokenGenerator
    {
        public string GenerateToken(User user) => $"test-jwt-token-for-{user.Email}";
    }

    private class SimplePasswordHasher : IPasswordHasher
    {
        public string HashPassword(string plainPassword) => $"hashed:{plainPassword}";
        public bool VerifyPassword(string plainPassword, string passwordHash) => passwordHash == $"hashed:{plainPassword}";
    }

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
        public Task<UserAllergy> AddAllergyAsync(UserAllergy allergy, CancellationToken ct = default) => Task.FromResult(allergy);
        public Task<bool> RemoveAllergyAsync(int allergyId, int userId, CancellationToken ct = default) => Task.FromResult(true);
        public Task SyncAllergiesAsync(int userId, IEnumerable<string> allergyNames, CancellationToken ct = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task RegisterAsync_CreatesUserAndInitializesSkinProfile()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();
        var hasher = new SimplePasswordHasher();
        var jwt = new DummyTokenGenerator();
        var skinService = new SkinProfileService(skinRepo, userRepo);
        var authService = new AuthService(userRepo, skinRepo, hasher, jwt, skinService);

        var request = new RegisterRequest("newuser@beautyai.vn", "Password123!", "New User", "0901234567");
        var response = await authService.RegisterAsync(request);

        Assert.NotNull(response.Token);
        Assert.Equal("newuser@beautyai.vn", response.Email);
        Assert.Equal("New User", response.FullName);
        Assert.Equal("Customer", response.Role);

        // Verify skin profile initialized
        Assert.Single(userRepo.Users);
        Assert.Single(skinRepo.Profiles);
        Assert.Equal(userRepo.Users[0].Id, skinRepo.Profiles[0].UserId);
    }

    [Fact]
    public async Task RegisterAsync_ThrowsWhenEmailAlreadyExists()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();
        var hasher = new SimplePasswordHasher();
        var jwt = new DummyTokenGenerator();
        var skinService = new SkinProfileService(skinRepo, userRepo);
        var authService = new AuthService(userRepo, skinRepo, hasher, jwt, skinService);

        await userRepo.CreateAsync(new User
        {
            Id = 1,
            Email = "existing@beautyai.vn",
            FullName = "Existing User",
            PasswordHash = "hashed:Pass",
            Role = UserRole.Customer
        });

        var request = new RegisterRequest("existing@beautyai.vn", "Password123!", "Duplicate", null);
        await Assert.ThrowsAsync<InvalidOperationException>(() => authService.RegisterAsync(request));
    }

    [Fact]
    public async Task LoginAsync_ReturnsTokenForValidCredentials()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();
        var hasher = new SimplePasswordHasher();
        var jwt = new DummyTokenGenerator();
        var skinService = new SkinProfileService(skinRepo, userRepo);
        var authService = new AuthService(userRepo, skinRepo, hasher, jwt, skinService);

        await userRepo.CreateAsync(new User
        {
            Id = 1,
            Email = "valid@beautyai.vn",
            FullName = "Valid User",
            PasswordHash = hasher.HashPassword("MySecretPass!"),
            Role = UserRole.Customer
        });

        var loginResponse = await authService.LoginAsync(new LoginRequest("valid@beautyai.vn", "MySecretPass!"));

        Assert.NotNull(loginResponse.Token);
        Assert.Equal("valid@beautyai.vn", loginResponse.Email);
    }

    [Fact]
    public async Task LoginAsync_ThrowsOnInvalidPassword()
    {
        var userRepo = new InMemoryUserRepository();
        var skinRepo = new InMemorySkinProfileRepository();
        var hasher = new SimplePasswordHasher();
        var jwt = new DummyTokenGenerator();
        var skinService = new SkinProfileService(skinRepo, userRepo);
        var authService = new AuthService(userRepo, skinRepo, hasher, jwt, skinService);

        await userRepo.CreateAsync(new User
        {
            Id = 1,
            Email = "valid@beautyai.vn",
            FullName = "Valid User",
            PasswordHash = hasher.HashPassword("MySecretPass!"),
            Role = UserRole.Customer
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.LoginAsync(new LoginRequest("valid@beautyai.vn", "WrongPassword!")));
    }
}
