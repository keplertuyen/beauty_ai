using BeautyAI.Domain.Entities;
using Xunit;

namespace BeautyAI.UnitTests;

public class DomainTests
{
    private class TestEntity : BaseEntity<string>
    {
    }

    [Fact]
    public void BaseEntity_WhenInitialized_HasUtcTimestamp()
    {
        var entity = new TestEntity { Id = "test-1" };
        Assert.Equal("test-1", entity.Id);
        Assert.True(entity.CreatedAtUtc <= DateTime.UtcNow);
        Assert.Null(entity.UpdatedAtUtc);
    }
}
