namespace BeautyAI.Domain.Entities;

public class Product : BaseEntity<int>
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int BrandId { get; set; }
    public int CategoryId { get; set; }
    public decimal PriceUsd { get; set; }
    public int? VolumeMl { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public required string IngredientListRaw { get; set; }
    public string[] TargetSkinTypes { get; set; } = Array.Empty<string>();
    public int StockQuantity { get; set; } = 100;

    // Navigation properties
    public Brand? Brand { get; set; }
    public Category? Category { get; set; }
    public ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
