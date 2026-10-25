using System.Reflection;
using System.Xml.Linq;
using BeautyAI.Api;
using BeautyAI.Application.Common;
using BeautyAI.Domain.Entities;
using BeautyAI.Infrastructure.Providers;

namespace BeautyAI.ArchitectureTests;

public static class ArchitectureTestHelper
{
    public static string FindSolutionRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "BeautyAI.slnx")))
        {
            dir = dir.Parent;
        }

        if (dir == null)
        {
            throw new InvalidOperationException("Could not find solution root containing BeautyAI.slnx");
        }

        return dir.FullName;
    }

    public static IReadOnlyList<Assembly> GetAllSolutionAssemblies()
    {
        return new[]
        {
            typeof(BaseEntity<>).Assembly,
            typeof(IApplicationMarker).Assembly,
            typeof(IProviderMarker).Assembly,
            typeof(Program).Assembly
        };
    }

    public static List<string> GetPackageReferences(string projectRelativePath)
    {
        var solutionRoot = FindSolutionRoot();
        var csprojPath = Path.Combine(solutionRoot, projectRelativePath);

        if (!File.Exists(csprojPath))
        {
            throw new FileNotFoundException($"Project file not found: {csprojPath}");
        }

        var doc = XDocument.Load(csprojPath);
        return doc.Descendants("PackageReference")
            .Select(x => x.Attribute("Include")?.Value)
            .Where(x => !string.IsNullOrEmpty(x))
            .Select(x => x!)
            .ToList();
    }

    public static List<string> GetAllSrcProjectFiles()
    {
        var solutionRoot = FindSolutionRoot();
        var srcDir = Path.Combine(solutionRoot, "src");
        return Directory.GetFiles(srcDir, "*.csproj", SearchOption.AllDirectories).ToList();
    }
}
