using System.Reflection;
using BeautyAI.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace BeautyAI.ArchitectureTests;

public class AdminAuthorizationTests
{
    [Fact]
    public void AdminController_MustRequireAdminRoleAuthorization()
    {
        // TC-ADM-SEC-01 (AC-SEC-ADM-01..03, NFR-SEC-02)
        var controllerType = typeof(AdminController);
        var authorizeAttr = controllerType.GetCustomAttribute<AuthorizeAttribute>(inherit: true);

        Assert.NotNull(authorizeAttr);
        Assert.Equal("Admin", authorizeAttr!.Roles);

        var publicActions = controllerType.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        foreach (var action in publicActions)
        {
            var allowAnon = action.GetCustomAttribute<AllowAnonymousAttribute>();
            Assert.Null(allowAnon);
        }
    }
}
