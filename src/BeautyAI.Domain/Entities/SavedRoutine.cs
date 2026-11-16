namespace BeautyAI.Domain.Entities;

public class SavedRoutine : BaseEntity<int>
{
    public int? UserId { get; set; }
    public string RoutineName { get; set; } = string.Empty;
    public string RoutineType { get; set; } = "Morning"; // 'Morning', 'Night', 'Treatment'
    public string ItemsJson { get; set; } = "[]";
    public string? Notes { get; set; }

    // Navigation property
    public User? User { get; set; }
}
