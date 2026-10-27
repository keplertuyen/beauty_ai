using BeautyAI.Domain.Enums;

namespace BeautyAI.Domain.Entities;

public class User : BaseEntity<int>
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public string? Phone { get; set; }
    public string? ShippingAddress { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public SkinProfile? SkinProfile { get; set; }
    public List<UserAllergy> Allergies { get; set; } = new();
}
