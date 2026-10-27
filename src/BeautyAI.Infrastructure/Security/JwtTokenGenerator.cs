using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BeautyAI.Infrastructure.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationDays;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _secret = configuration["JWT_SECRET"] ?? "BeautyAI_SuperSecret_Dermatology_Key_2026_AtLeast32Chars!";
        _issuer = configuration["JWT_ISSUER"] ?? "beautyai-api";
        _audience = configuration["JWT_AUDIENCE"] ?? "beautyai-clients";
        _expirationDays = int.TryParse(configuration["JWT_EXPIRATION_DAYS"], out int days) ? days : 7;
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(_expirationDays),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
