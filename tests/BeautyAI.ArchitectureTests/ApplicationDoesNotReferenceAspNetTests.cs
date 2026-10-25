using BeautyAI.Application.Common;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class ApplicationDoesNotReferenceAspNetTests
{
    [Fact]
    public void ApplicationCsproj_MustNotReferenceAspNetCore()
    {
        var packages = ArchitectureTestHelper.GetPackageReferences("src/BeautyAI.Application/BeautyAI.Application.csproj");

        var aspNetPackages = packages
            .Where(p => p.StartsWith("Microsoft.AspNetCore", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.True(
            aspNetPackages.Count == 0,
            $"BeautyAI.Application must not reference Microsoft.AspNetCore, but found: {string.Join(", ", aspNetPackages)}. Business logic must remain decoupled from HTTP."
        );
    }

    [Fact]
    public void ApplicationAssembly_MustNotReferenceAspNetCoreAssembly()
    {
        var appAssembly = typeof(IApplicationMarker).Assembly;
        var referencedAssemblies = appAssembly.GetReferencedAssemblies();

        var aspNetRef = referencedAssemblies
            .Where(a => a.Name != null && a.Name.StartsWith("Microsoft.AspNetCore", StringComparison.OrdinalIgnoreCase))
            .Select(a => a.Name)
            .ToList();

        Assert.Empty(aspNetRef);
    }

    [Fact]
    public void ApplicationTypes_MustNotUseHttpContext()
    {
        var appAssembly = typeof(IApplicationMarker).Assembly;
        var types = appAssembly.GetTypes();

        foreach (var type in types)
        {
            var methods = type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Static);
            foreach (var method in methods)
            {
                var parameters = method.GetParameters();
                Assert.DoesNotContain(parameters, p => p.ParameterType.FullName != null && p.ParameterType.FullName.Contains("HttpContext", StringComparison.OrdinalIgnoreCase));
            }
        }
    }
}
