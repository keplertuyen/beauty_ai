using System.Security.Cryptography;
using BeautyAI.Application.Interfaces.Security;

namespace BeautyAI.Infrastructure.Security;

public class Pbkdf2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128 bit
    private const int KeySize = 32;  // 256 bit
    private const int Iterations = 600_000; // OWASP recommendation for HMAC-SHA256

    public string HashPassword(string plainPassword)
    {
        if (string.IsNullOrWhiteSpace(plainPassword))
            throw new ArgumentException("Password cannot be empty.", nameof(plainPassword));

        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(
            plainPassword,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize
        );

        return $"pbkdf2:sha256:{Iterations}:{Convert.ToBase64String(salt)}:{Convert.ToBase64String(key)}";
    }

    public bool VerifyPassword(string plainPassword, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(plainPassword) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        // Check if format matches pbkdf2:sha256:<iterations>:<salt>:<hash>
        var parts = passwordHash.Split(':');
        if (parts.Length == 5 && parts[0] == "pbkdf2" && parts[1] == "sha256")
        {
            if (!int.TryParse(parts[2], out int iterations))
                return false;

            byte[] salt;
            byte[] expectedKey;
            try
            {
                salt = Convert.FromBase64String(parts[3]);
                expectedKey = Convert.FromBase64String(parts[4]);
            }
            catch (FormatException)
            {
                return false;
            }

            byte[] actualKey = Rfc2898DeriveBytes.Pbkdf2(
                plainPassword,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedKey.Length
            );

            return CryptographicOperations.FixedTimeEquals(actualKey, expectedKey);
        }

        // Fallback for demo seed accounts if plain text or bcrypt format
        if (passwordHash == plainPassword)
        {
            return true;
        }

        return false;
    }
}
