using BeautyAI.Domain.Enums;

namespace BeautyAI.Domain.Entities;

public class SkinProfile : BaseEntity<int>
{
    public int UserId { get; set; }
    public SkinType SkinType { get; set; } = SkinType.Combination;
    public List<string> SkinConcerns { get; set; } = new();
    public string? PrimaryGoal { get; set; }
    public BudgetLevel BudgetLevel { get; set; } = BudgetLevel.Medium;

    // Navigation property
    public User? User { get; set; }
}
