namespace BeautyAI.Domain.Entities;

public class UserAllergy : BaseEntity<int>
{
    public int UserId { get; set; }
    public required string IngredientName { get; set; }
    public string? Note { get; set; }

    // Navigation property
    public User? User { get; set; }
}
