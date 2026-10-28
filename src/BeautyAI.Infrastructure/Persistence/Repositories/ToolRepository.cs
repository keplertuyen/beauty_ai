using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class ToolRepository : IToolRepository
{
    private readonly BeautyAIDbContext _context;

    public ToolRepository(BeautyAIDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Ingredient>> GetAllIngredientsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Ingredients
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ConflictRule>> GetAllConflictRulesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ConflictRules
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetProductsForConflictCheckAsync(IReadOnlyList<int> productIds, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .Where(p => productIds.Contains(p.Id))
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
