using System.Reflection;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class NoSafetyScoreAnywhereTests
{
    private static readonly string[] ForbiddenTerms = new[]
    {
        "SafetyScore",
        "SafetyRating",
        "HazardScore",
        "DangerLevel",
        "ToxicityScore",
        "SafetyLevel"
    };

    private const string InvariantViolationMessage =
        "INV-01: BeautyAI KHÔNG chấm điểm an toàn/nguy hiểm (xem docs/adr/ và BRD §4.3 G-01). Dùng SuitabilityScore (phù hợp với hồ sơ da) thay thế.";

    [Fact]
    public void Assemblies_MustNotContainForbiddenSafetyScoreTerms()
    {
        var assemblies = ArchitectureTestHelper.GetAllSolutionAssemblies();
        var violations = new List<string>();

        foreach (var assembly in assemblies)
        {
            var types = assembly.GetTypes();
            foreach (var type in types)
            {
                // Check type name
                foreach (var term in ForbiddenTerms)
                {
                    if (type.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                    {
                        violations.Add($"Type: {type.FullName} violates INV-01 with forbidden term '{term}'.");
                    }
                }

                // Check properties
                var properties = type.GetProperties(
                    BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly
                );
                foreach (var prop in properties)
                {
                    foreach (var term in ForbiddenTerms)
                    {
                        if (prop.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                        {
                            violations.Add($"Property: {type.FullName}.{prop.Name} violates INV-01 with forbidden term '{term}'.");
                        }
                    }
                }

                // Check fields
                var fields = type.GetFields(
                    BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly
                );
                foreach (var field in fields)
                {
                    // Skip compiler-generated backing fields if the property was already caught
                    if (field.Name.StartsWith("<") && field.Name.Contains(">k__BackingField"))
                    {
                        continue;
                    }

                    foreach (var term in ForbiddenTerms)
                    {
                        if (field.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                        {
                            violations.Add($"Field: {type.FullName}.{field.Name} violates INV-01 with forbidden term '{term}'.");
                        }
                    }
                }

                // Check methods
                var methods = type.GetMethods(
                    BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly
                );
                foreach (var method in methods)
                {
                    // Skip property getters and setters
                    if (method.IsSpecialName && (method.Name.StartsWith("get_") || method.Name.StartsWith("set_")))
                    {
                        continue;
                    }

                    foreach (var term in ForbiddenTerms)
                    {
                        if (method.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                        {
                            violations.Add($"Method: {type.FullName}.{method.Name} violates INV-01 with forbidden term '{term}'.");
                        }
                    }
                }
            }
        }

        Assert.True(
            violations.Count == 0,
            $"{InvariantViolationMessage}\nViolations found:\n{string.Join("\n", violations)}"
        );
    }
}
