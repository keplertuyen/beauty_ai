using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IToolRepository
{
    Task<IReadOnlyList<Ingredient>> GetAllIngredientsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ConflictRule>> GetAllConflictRulesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetProductsForConflictCheckAsync(IReadOnlyList<int> productIds, CancellationToken cancellationToken = default);
}
