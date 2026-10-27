using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;

namespace BeautyAI.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ISkinProfileRepository _skinProfileRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ISkinProfileService _skinProfileService;

    public AuthService(
        IUserRepository userRepository,
        ISkinProfileRepository skinProfileRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ISkinProfileService skinProfileService)
    {
        _userRepository = userRepository;
        _skinProfileRepository = skinProfileRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _skinProfileService = skinProfileService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.", nameof(request.Email));
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.", nameof(request.Password));
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request.FullName));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _userRepository.ExistsByEmailAsync(normalizedEmail, ct))
            throw new InvalidOperationException($"User with email '{normalizedEmail}' already exists.");

        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var user = new User
        {
            Id = 0,
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            FullName = request.FullName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Role = UserRole.Customer,
            IsActive = true
        };

        var createdUser = await _userRepository.CreateAsync(user, ct);

        // Automatically initialize blank baseline skin profile
        var defaultProfile = new SkinProfile
        {
            Id = 0,
            UserId = createdUser.Id,
            SkinType = SkinType.Combination,
            SkinConcerns = new List<string>(),
            PrimaryGoal = "Maintain Healthy Skin",
            BudgetLevel = BudgetLevel.Medium
        };
        await _skinProfileRepository.CreateAsync(defaultProfile, ct);

        var jwtToken = _jwtTokenGenerator.GenerateToken(createdUser);

        return new AuthResponse(
            jwtToken,
            createdUser.Email,
            createdUser.FullName,
            createdUser.Role.ToString()
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Email and password are required.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail, ct);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("User account is inactive.");

        var jwtToken = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse(
            jwtToken,
            user.Email,
            user.FullName,
            user.Role.ToString()
        );
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found.");

        var skinId = await _skinProfileService.GetSkinProfileAsync(userId, ct);

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.ShippingAddress,
            skinId
        );
    }

    public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {userId} not found.");

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(request.FullName));

        user.FullName = request.FullName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        user.ShippingAddress = string.IsNullOrWhiteSpace(request.ShippingAddress) ? null : request.ShippingAddress.Trim();

        var updated = await _userRepository.UpdateAsync(user, ct);
        var skinId = await _skinProfileService.GetSkinProfileAsync(userId, ct);

        return new UserProfileDto(
            updated.Id,
            updated.Email,
            updated.FullName,
            updated.Phone,
            updated.ShippingAddress,
            skinId
        );
    }
}
