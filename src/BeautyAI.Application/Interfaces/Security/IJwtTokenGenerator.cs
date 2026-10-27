using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
