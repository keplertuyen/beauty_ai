using BeautyAI.Infrastructure.Security;
using Xunit;

namespace BeautyAI.UnitTests;

public class Pbkdf2PasswordHasherTests
{
    private readonly Pbkdf2PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_ProducesExpectedPbkdf2Format()
    {
        var password = "SecurePassword@123";
        var hash = _hasher.HashPassword(password);

        Assert.NotNull(hash);
        Assert.StartsWith("pbkdf2:sha256:600000:", hash);

        var parts = hash.Split(':');
        Assert.Equal(5, parts.Length);
        Assert.Equal("pbkdf2", parts[0]);
        Assert.Equal("sha256", parts[1]);
        Assert.Equal("600000", parts[2]);
        Assert.NotEmpty(parts[3]); // Salt
        Assert.NotEmpty(parts[4]); // Key
    }

    [Fact]
    public void HashPassword_GeneratesUniqueSaltPerCall()
    {
        var password = "SamePasswordForBoth";
        var hash1 = _hasher.HashPassword(password);
        var hash2 = _hasher.HashPassword(password);

        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_MatchesValidPassword()
    {
        var testPassword = "CorrectHorseBatteryStaple!";
        var hash = _hasher.HashPassword(testPassword);

        var isValid = _hasher.VerifyPassword(testPassword, hash);

        Assert.True(isValid);
    }

    [Fact]
    public void VerifyPassword_RejectsIncorrectPassword()
    {
        var password = "CorrectPassword123";
        var hash = _hasher.HashPassword(password);

        var isValid = _hasher.VerifyPassword("WrongPassword456", hash);

        Assert.False(isValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void HashPassword_ThrowsOnEmptyInput(string emptyPassword)
    {
        Assert.Throws<ArgumentException>(() => _hasher.HashPassword(emptyPassword));
    }
}
