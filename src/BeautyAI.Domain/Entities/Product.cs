namespace BeautyAI.Domain.Entities;

public class Product : BaseEntity<int>
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int BrandId { get; set; }
    public int CategoryId { get; set; }
    public string Department { get; set; } = "Skincare";
    public decimal PriceUsd { get; set; }
    /// <summary>
    /// DEPRECATED (2026-11-26): integer column, lossy (7.5 mL stored as 8). Not used in any
    /// calculation; display must use <see cref="SizeDisplay"/>. Kept only for backward
    /// compatibility of existing DTOs/admin form. Do not build new logic on it — if per-mL
    /// pricing is ever needed, migrate to numeric(8,2) via ADR first.
    /// </summary>
    public int? VolumeMl { get; set; }
    public string? SizeDisplay { get; set; }
    public int LovesCount { get; set; }
    public decimal? AvgRating { get; set; }
    public int ReviewsCount { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public required string IngredientListRaw { get; set; }
    public string[] TargetSkinTypes { get; set; } = Array.Empty<string>();
    public int StockQuantity { get; set; } = 100;
    public string SellingStatus { get; set; } = "Active";

    // Navigation properties
    public Brand? Brand { get; set; }
    public Category? Category { get; set; }
    public ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
