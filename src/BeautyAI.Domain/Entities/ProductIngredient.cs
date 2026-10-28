namespace BeautyAI.Domain.Entities;

public class ProductIngredient
{
    public int ProductId { get; set; }
    public int IngredientId { get; set; }
    public int PositionOrder { get; set; }

    // Navigation properties
    public Product? Product { get; set; }
    public Ingredient? Ingredient { get; set; }
}
