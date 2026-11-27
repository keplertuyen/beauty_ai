namespace BeautyAI.Domain.Entities;

public class Order : BaseEntity<int>
{
    public int? UserId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "COD";
    public string PaymentStatus { get; set; } = "Pending";
    public string OrderStatus { get; set; } = "Pending";
    public decimal TotalAmountUsd { get; set; }
    public bool ConflictAcknowledged { get; set; }
    public string? TrackingNumber { get; set; }
    public string? AdminNotes { get; set; }

    public User? User { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
