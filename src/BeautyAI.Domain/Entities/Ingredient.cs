namespace BeautyAI.Domain.Entities;

public class Ingredient : BaseEntity<int>
{
    public required string InciName { get; set; }
    public string FunctionGroup { get; set; } = "Other";
    public string? Description { get; set; }
    public bool IsActiveIngredient { get; set; }
    public int? ComedogenicRating { get; set; }
    public int? IrritationRating { get; set; }

    // Navigation properties
    public ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
}
