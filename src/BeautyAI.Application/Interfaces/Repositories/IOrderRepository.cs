using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IOrderRepository
{
    Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetOrdersByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetProductsByIdsForUpdateAsync(IReadOnlyList<int> productIds, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetAllOrdersAsync(int limit = 50, CancellationToken cancellationToken = default);
    Task<Order?> GetOrderByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> UpdateOrderStatusAsync(int id, string newStatus, string? trackingNumber = null, string? adminNotes = null, CancellationToken cancellationToken = default);
}
