using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;

namespace BeautyAI.Application.Services;

public class AdminBootstrapper
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public AdminBootstrapper(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<bool> EnsureAdminUserAsync(
        string? email,
        string? password,
        string? fullName = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return false;

        var trimmedPassword = password.Trim();
        if (trimmedPassword.Length < 8)
            return false;

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existing = await _userRepository.GetByEmailAsync(normalizedEmail, ct);

        if (existing == null)
        {
            var adminUser = new User
            {
                Email = normalizedEmail,
                PasswordHash = _passwordHasher.HashPassword(trimmedPassword),
                FullName = string.IsNullOrWhiteSpace(fullName) ? "System Administrator" : fullName.Trim(),
                Role = UserRole.Admin,
                IsActive = true
            };
            await _userRepository.CreateAsync(adminUser, ct);
            return true;
        }

        existing.Role = UserRole.Admin;
        existing.IsActive = true;

        // If the existing row still has a legacy bcrypt hash from seed_data.sql ('$2a$' / '$2b$'),
        // upgrade it to a valid PBKDF2 hash so the admin account can authenticate.
        if (string.IsNullOrWhiteSpace(existing.PasswordHash) ||
            existing.PasswordHash.StartsWith("$2", StringComparison.Ordinal))
        {
            existing.PasswordHash = _passwordHasher.HashPassword(trimmedPassword);
        }

        await _userRepository.UpdateAsync(existing, ct);
        return true;
    }
}
