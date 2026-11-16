using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class RoutineRepository : IRoutineRepository
{
    private readonly BeautyAIDbContext _context;

    public RoutineRepository(BeautyAIDbContext context)
    {
        _context = context;
    }

    public async Task<SavedRoutine> CreateAsync(SavedRoutine routine, CancellationToken cancellationToken = default)
    {
        _context.SavedRoutines.Add(routine);
        await _context.SaveChangesAsync(cancellationToken);
        return routine;
    }

    public async Task<SavedRoutine?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.SavedRoutines
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<SavedRoutine>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.SavedRoutines
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var routine = await _context.SavedRoutines
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, cancellationToken);

        if (routine == null) return false;

        _context.SavedRoutines.Remove(routine);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
