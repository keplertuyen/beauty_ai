using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Xunit;

namespace BeautyAI.UnitTests;

public class AdminBootstrapperTests
{
    private class FakeUserRepository : IUserRepository
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

        public Task<User> UpdateAsync(User user, CancellationToken ct = default) =>
            Task.FromResult(user);
    }

    private class FakePasswordHasher : IPasswordHasher
    {
        public string HashPassword(string plainPassword) => $"pbkdf2:{plainPassword}";
        public bool VerifyPassword(string plainPassword, string passwordHash) => passwordHash == $"pbkdf2:{plainPassword}";
    }

    [Fact]
    public async Task EnsureAdminAsync_WhenValidCredentialsAndUserMissing_CreatesAdminUser()
    {
        // AC-ADM-17-01
        var userRepo = new FakeUserRepository();
        var hasher = new FakePasswordHasher();
        var bootstrapper = new AdminBootstrapper(userRepo, hasher);

        var created = await bootstrapper.EnsureAdminUserAsync("Admin@BeautyAI.com", "StrongAdminPass123!", "Chief Admin");

        Assert.True(created);
        Assert.Single(userRepo.Users);
        Assert.Equal("admin@beautyai.com", userRepo.Users[0].Email);
        Assert.Equal(UserRole.Admin, userRepo.Users[0].Role);
        Assert.True(userRepo.Users[0].IsActive);
        Assert.Equal("pbkdf2:StrongAdminPass123!", userRepo.Users[0].PasswordHash);
    }

    [Fact]
    public async Task EnsureAdminAsync_WhenUserAlreadyExists_PromotesToAdminAndPreservesCustomPassword()
    {
        // AC-ADM-17-02
        var userRepo = new FakeUserRepository();
        var hasher = new FakePasswordHasher();
        await userRepo.CreateAsync(new User
        {
            Email = "admin@beautyai.com",
            FullName = "Existing Admin",
            PasswordHash = "pbkdf2:ExistingCustomPass!",
            Role = UserRole.Customer,
            IsActive = false
        });

        var bootstrapper = new AdminBootstrapper(userRepo, hasher);
        var updated = await bootstrapper.EnsureAdminUserAsync("admin@beautyai.com", "NewEnvPass123!");

        Assert.True(updated);
        Assert.Equal(UserRole.Admin, userRepo.Users[0].Role);
        Assert.True(userRepo.Users[0].IsActive);
        Assert.Equal("pbkdf2:ExistingCustomPass!", userRepo.Users[0].PasswordHash);
    }

    [Fact]
    public async Task EnsureAdminAsync_WhenExistingUserHasLegacyBcryptHash_UpgradesToPbkdf2Hash()
    {
        // Repairs legacy seed_data.sql bcrypt row ('$2a$11$...') so the seeded admin can actually log in
        var userRepo = new FakeUserRepository();
        var hasher = new FakePasswordHasher();
        await userRepo.CreateAsync(new User
        {
            Email = "admin@beautyai.com",
            FullName = "System Administrator",
            PasswordHash = "$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2",
            Role = UserRole.Admin,
            IsActive = true
        });

        var bootstrapper = new AdminBootstrapper(userRepo, hasher);
        var updated = await bootstrapper.EnsureAdminUserAsync("admin@beautyai.com", "StrongAdminPass123!");

        Assert.True(updated);
        Assert.Equal("pbkdf2:StrongAdminPass123!", userRepo.Users[0].PasswordHash);
    }

    [Theory]
    [InlineData(null, "StrongAdminPass123!")]
    [InlineData("", "StrongAdminPass123!")]
    [InlineData("admin@beautyai.com", null)]
    [InlineData("admin@beautyai.com", "short")]
    public async Task EnsureAdminAsync_WhenMissingOrShortPassword_SkipsAndReturnsFalse(string? email, string? password)
    {
        // AC-ADM-17-03 & AC-ADM-17-04
        var userRepo = new FakeUserRepository();
        var hasher = new FakePasswordHasher();
        var bootstrapper = new AdminBootstrapper(userRepo, hasher);

        var result = await bootstrapper.EnsureAdminUserAsync(email, password);

        Assert.False(result);
        Assert.Empty(userRepo.Users);
    }
}
