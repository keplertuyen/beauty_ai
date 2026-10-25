using System.Reflection;
using BeautyAI.Application.Common;
using BeautyAI.Domain.Entities;
using BeautyAI.Infrastructure.Providers;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class ProviderLibrariesOnlyInAdapterLayerTests
{
    [Fact]
    public void DomainAndApplication_MustNotReferenceHttpClient()
    {
        var assemblies = new[]
        {
            typeof(BaseEntity<>).Assembly,
            typeof(IApplicationMarker).Assembly
        };

        foreach (var assembly in assemblies)
        {
            foreach (var type in assembly.GetTypes())
            {
                // Check constructors & methods
                var constructors = type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                foreach (var ctor in constructors)
                {
                    var parameters = ctor.GetParameters();
                    Assert.DoesNotContain(
                        parameters,
                        p => p.ParameterType.FullName != null && p.ParameterType.FullName.Contains("HttpClient", StringComparison.OrdinalIgnoreCase)
                    );
                }

                // Check properties
                var properties = type.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                Assert.DoesNotContain(
                    properties,
                    p => p.PropertyType.FullName != null && p.PropertyType.FullName.Contains("HttpClient", StringComparison.OrdinalIgnoreCase)
                );
            }
        }
    }

    [Fact]
    public void Infrastructure_TypesUsingHttpClient_MustBeInProvidersNamespace()
    {
        var infraAssembly = typeof(IProviderMarker).Assembly;
        var types = infraAssembly.GetTypes();

        foreach (var type in types)
        {
            bool usesHttpClient = false;

            // Check constructors
            foreach (var ctor in type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance))
            {
                if (ctor.GetParameters().Any(p => p.ParameterType.FullName != null && p.ParameterType.FullName.Contains("HttpClient", StringComparison.OrdinalIgnoreCase)))
                {
                    usesHttpClient = true;
                    break;
                }
            }

            // Check fields and properties
            if (!usesHttpClient)
            {
                var fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                if (fields.Any(f => f.FieldType.FullName != null && f.FieldType.FullName.Contains("HttpClient", StringComparison.OrdinalIgnoreCase)))
                {
                    usesHttpClient = true;
                }
            }

            if (usesHttpClient)
            {
                Assert.True(
                    type.Namespace != null && type.Namespace.StartsWith("BeautyAI.Infrastructure.Providers", StringComparison.Ordinal),
                    $"Type '{type.FullName}' uses HttpClient but is not inside 'BeautyAI.Infrastructure.Providers'. External providers must sit behind adapter layer (.agents/rules/provider-abstraction.md)."
                );
            }
        }
    }
}
