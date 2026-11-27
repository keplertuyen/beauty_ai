using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(int userId, CreateOrderRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderDto>> GetMyOrdersAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus, string? trackingNumber = null, string? adminNotes = null, CancellationToken cancellationToken = default);
}
