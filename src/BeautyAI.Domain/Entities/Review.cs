namespace BeautyAI.Domain.Entities;

public class Review : BaseEntity<long>
{
    public int ProductId { get; set; }
    public string? ProductCode { get; set; }
    public int? UserId { get; set; }
    public string AuthorName { get; set; } = "BeautyAI Shopper";
    public int Rating { get; set; }
    public string SkinType { get; set; } = "Unknown";
    public string? SkinConcerns { get; set; }
    public string? Content { get; set; }

    // Navigation properties
    public Product? Product { get; set; }
    public User? User { get; set; }
}
