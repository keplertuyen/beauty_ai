using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly BeautyAIDbContext _context;

    public OrderRepository(BeautyAIDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Product>> GetProductsByIdsForUpdateAsync(
        IReadOnlyList<int> productIds,
        CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.Brand)
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);
        return order;
    }

    public async Task<IReadOnlyList<Order>> GetOrdersByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p!.Brand)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetAllOrdersAsync(
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Order?> GetOrderByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string newStatus, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (order == null) return false;
        order.OrderStatus = newStatus;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
