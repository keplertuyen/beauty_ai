namespace BeautyAI.Application.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? Phone
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    string Email,
    string FullName,
    string Role
);

public record UserProfileDto(
    int Id,
    string Email,
    string FullName,
    string? Phone,
    string? ShippingAddress,
    DigitalSkinIdDto? SkinProfile
);

public record UpdateProfileRequest(
    string FullName,
    string? Phone,
    string? ShippingAddress
);
