namespace BeautyAI.Domain.Entities;

public class SupportTicket : BaseEntity<int>
{
    public required string TicketCode { get; set; }
    public int? UserId { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Subject { get; set; }
    public required string Message { get; set; }
    public string Status { get; set; } = "New"; // New | InProgress | Resolved
    public string? AdminReply { get; set; }

    public User? User { get; set; }
}
