using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly BeautyAIDbContext _dbContext;

    public UserRepository(BeautyAIDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.Users
            .Include(u => u.SkinProfile)
            .Include(u => u.Allergies)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _dbContext.Users
            .Include(u => u.SkinProfile)
            .Include(u => u.Allergies)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), ct);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _dbContext.Users
            .AnyAsync(u => u.Email.ToLower() == email.ToLower(), ct);
    }

    public async Task<User> CreateAsync(User user, CancellationToken ct = default)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);
        return user;
    }

    public async Task<User> UpdateAsync(User user, CancellationToken ct = default)
    {
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync(ct);
        return user;
    }
}
