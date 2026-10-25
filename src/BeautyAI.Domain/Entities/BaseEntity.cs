namespace BeautyAI.Domain.Entities;

public abstract class BaseEntity<TId>
{
    public required TId Id { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}
