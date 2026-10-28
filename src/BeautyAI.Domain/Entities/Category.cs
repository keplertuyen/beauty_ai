namespace BeautyAI.Domain.Entities;

public class Category : BaseEntity<int>
{
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int? ParentId { get; set; }

    // Navigation properties
    public Category? Parent { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
