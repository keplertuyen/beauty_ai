using System.Text;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Infrastructure.Persistence;
using BeautyAI.Infrastructure.Persistence.Repositories;
using BeautyAI.Infrastructure.Providers;
using BeautyAI.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Load .env.local / .env files if present (for Neon / Lakebase local execution)
var candidateDirs = new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory, Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "../../")) };
foreach (var dir in candidateDirs)
{
    foreach (var envFile in new[] { Path.Combine(dir, ".env.local"), Path.Combine(dir, ".env") })
    {
        if (File.Exists(envFile))
        {
            foreach (var line in File.ReadAllLines(envFile))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#")) continue;
                var parts = trimmed.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    var val = parts[1].Trim().Trim('"', '\'');
                    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                    {
                        Environment.SetEnvironmentVariable(key, val);
                    }
                    builder.Configuration[key] = val;
                }
            }
        }
    }
}

// 1. Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 2. CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration["CORS_ORIGINS"] ?? "http://localhost:5000,http://localhost:5173";
        policy.WithOrigins(origins.Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. PostgreSQL Database
var rawConnection = builder.Configuration["DATABASE_URL"]
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=beautyai;Username=beautyai;Password=beautyai_dev_secret";

var connectionString = rawConnection;
if (!string.IsNullOrEmpty(rawConnection) && (rawConnection.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || rawConnection.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
{
    try
    {
        var uri = new Uri(rawConnection);
        var userInfo = uri.UserInfo.Split(':');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        connectionString = $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
    catch
    {
        // Fallback to raw connection string
        connectionString = rawConnection;
    }
}

builder.Services.AddDbContext<BeautyAIDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 4. Repositories & Services Registration
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISkinProfileRepository, SkinProfileRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IToolRepository, ToolRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IRoutineRepository, RoutineRepository>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISkinProfileService, SkinProfileService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IToolsService, ToolsService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IRoutineService, RoutineService>();
builder.Services.AddScoped<IAdminProductService, AdminProductService>();
builder.Services.AddScoped<AdminBootstrapper>();
builder.Services.AddHttpClient<IAiSkincareProvider, GeminiSkincareProvider>();

// 5. JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "BeautyAI_SuperSecret_Dermatology_Key_2026_AtLeast32Chars!";
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "beautyai-api";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "beautyai-clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Ensure schema migration & optional env-driven Admin account bootstrap
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("AdminBootstrap");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<BeautyAIDbContext>();
        if (db.Database.IsRelational())
        {
            await db.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_status VARCHAR(20) NOT NULL DEFAULT 'Active';
                ALTER TABLE products ADD COLUMN IF NOT EXISTS department VARCHAR(50) NOT NULL DEFAULT 'Skincare';
                ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL;
                CREATE INDEX IF NOT EXISTS idx_products_selling_status ON products(selling_status);
                CREATE INDEX IF NOT EXISTS idx_products_department ON products(department);
            ");
        }

        var adminEmail = builder.Configuration["ADMIN_EMAIL"];
        var adminPassword = builder.Configuration["ADMIN_PASSWORD"];
        var adminFullName = builder.Configuration["ADMIN_FULL_NAME"];

        var bootstrapper = scope.ServiceProvider.GetRequiredService<AdminBootstrapper>();
        var bootstrapped = await bootstrapper.EnsureAdminUserAsync(adminEmail, adminPassword, adminFullName);
        if (!bootstrapped)
        {
            logger.LogWarning("Admin account bootstrap skipped: set ADMIN_EMAIL and ADMIN_PASSWORD (>= 8 chars) in environment to provision or activate an Admin user.");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database schema ensure or Admin bootstrap skipped during startup.");
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok", "beautyai-api")))
   .Produces<HealthResponse>(StatusCodes.Status200OK);

app.Run();

public record HealthResponse(string status, string service);

namespace BeautyAI.Api
{
    public partial class Program { }
}
