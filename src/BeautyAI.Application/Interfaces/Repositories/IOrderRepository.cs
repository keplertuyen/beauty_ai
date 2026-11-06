using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IOrderRepository
{
    Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetOrdersByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetProductsByIdsForUpdateAsync(IReadOnlyList<int> productIds, CancellationToken cancellationToken = default);
}
