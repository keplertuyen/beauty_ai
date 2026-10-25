using BeautyAI.Application.Common;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class ApplicationDoesNotReferenceEfCoreTests
{
    [Fact]
    public void ApplicationCsproj_MustNotReferenceEfCore()
    {
        var packages = ArchitectureTestHelper.GetPackageReferences("src/BeautyAI.Application/BeautyAI.Application.csproj");

        var efCorePackages = packages
            .Where(p => p.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.True(
            efCorePackages.Count == 0,
            $"BeautyAI.Application must not reference Microsoft.EntityFrameworkCore, but found: {string.Join(", ", efCorePackages)}. Application must only depend on repository abstractions."
        );
    }

    [Fact]
    public void ApplicationAssembly_MustNotReferenceEfCoreAssembly()
    {
        var appAssembly = typeof(IApplicationMarker).Assembly;
        var referencedAssemblies = appAssembly.GetReferencedAssemblies();

        var efCoreRef = referencedAssemblies
            .Where(a => a.Name != null && a.Name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.OrdinalIgnoreCase))
            .Select(a => a.Name)
            .ToList();

        Assert.Empty(efCoreRef);
    }
}
