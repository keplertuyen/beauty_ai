using System.Reflection;
using BeautyAI.Domain.Entities;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class DomainHasNoDependenciesTests
{
    [Fact]
    public void DomainCsproj_MustHaveNoPackageReferences()
    {
        // BeautyAI.Domain must remain pure C# with no external NuGet packages
        var packages = ArchitectureTestHelper.GetPackageReferences("src/BeautyAI.Domain/BeautyAI.Domain.csproj");

        Assert.True(
            packages.Count == 0,
            $"BeautyAI.Domain.csproj must not have any PackageReference, but found: {string.Join(", ", packages)}. Domain must be pure C#."
        );
    }

    [Fact]
    public void DomainAssembly_MustNotReferenceExternalAssemblies()
    {
        var domainAssembly = typeof(BaseEntity<>).Assembly;
        var referencedAssemblies = domainAssembly.GetReferencedAssemblies();

        var nonSystemReferences = referencedAssemblies
            .Where(a => !a.Name!.StartsWith("System") && !a.Name.StartsWith("Microsoft.VisualBasic"))
            .Select(a => a.Name)
            .ToList();

        Assert.Empty(nonSystemReferences);
    }
}
