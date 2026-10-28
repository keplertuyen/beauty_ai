namespace BeautyAI.Domain.Entities;

public class Brand : BaseEntity<int>
{
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? OriginCountry { get; set; }

    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
