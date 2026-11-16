using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IRoutineRepository
{
    Task<SavedRoutine> CreateAsync(SavedRoutine routine, CancellationToken cancellationToken = default);
    Task<SavedRoutine?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SavedRoutine>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default);
}
