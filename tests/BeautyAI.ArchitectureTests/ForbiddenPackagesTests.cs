using System.Xml.Linq;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class ForbiddenPackagesTests
{
    private static readonly string[] ForbiddenPackages = new[]
    {
        "AutoMapper",
        "MediatR",
        "Hangfire",
        "Quartz",
        "StackExchange.Redis"
    };

    [Fact]
    public void Projects_MustNotReferenceForbiddenPackages()
    {
        var projectFiles = ArchitectureTestHelper.GetAllSrcProjectFiles();
        var violations = new List<string>();

        foreach (var projectFile in projectFiles)
        {
            var relativeName = Path.GetFileName(projectFile);
            var doc = XDocument.Load(projectFile);
            var packages = doc.Descendants("PackageReference")
                .Select(x => x.Attribute("Include")?.Value)
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(x => x!)
                .ToList();

            foreach (var pkg in packages)
            {
                foreach (var forbidden in ForbiddenPackages)
                {
                    if (pkg.Equals(forbidden, StringComparison.OrdinalIgnoreCase) ||
                        pkg.StartsWith(forbidden + ".", StringComparison.OrdinalIgnoreCase))
                    {
                        violations.Add($"Project '{relativeName}' references forbidden package '{pkg}'. (See docs/tech-stack.md & docs/adr/ADR-009)");
                    }
                }
            }
        }

        Assert.True(
            violations.Count == 0,
            $"Forbidden packages detected in solution:\n{string.Join("\n", violations)}"
        );
    }
}
