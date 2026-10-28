namespace BeautyAI.Domain.Entities;

public class ConflictRule : BaseEntity<int>
{
    public required string ActiveIngredientA { get; set; }
    public required string ActiveIngredientB { get; set; }
    public string Severity { get; set; } = "Warning";
    public required string Reason { get; set; }
    public required string Recommendation { get; set; }
}
