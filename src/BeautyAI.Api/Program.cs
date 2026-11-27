using System.Text;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Infrastructure.Caching;
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

// Bind to Cloud hosting PORT if injected (e.g. Render, Railway, Cloud Run)
var cloudPort = Environment.GetEnvironmentVariable("PORT") ?? builder.Configuration["PORT"];
if (!string.IsNullOrEmpty(cloudPort))
{
    builder.WebHost.UseUrls($"http://+:{cloudPort}");
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
        connectionString = $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;Keepalive=30;Connection Idle Lifetime=60;Command Timeout=60";
    }
    catch
    {
        // Fallback to raw connection string
        connectionString = rawConnection;
    }
}

builder.Services.AddDbContext<BeautyAIDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(3),
            errorCodesToAdd: null);
    });
});

// 4. Repositories & Services Registration
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISkinProfileRepository, SkinProfileRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IToolRepository, ToolRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IRoutineRepository, RoutineRepository>();
builder.Services.AddScoped<IAdminConsoleRepository, AdminConsoleRepository>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISkinProfileService, SkinProfileService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IProductCache, MemoryProductCache>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IToolsService, ToolsService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IRoutineService, RoutineService>();
builder.Services.AddScoped<IAdminProductService, AdminProductService>();
builder.Services.AddScoped<AdminBootstrapper>();
var aiProviderChoice = (builder.Configuration["AI_PROVIDER"] ?? Environment.GetEnvironmentVariable("AI_PROVIDER") ?? string.Empty).Trim().ToLowerInvariant();
var hasDifyKey = !string.IsNullOrWhiteSpace(builder.Configuration["DIFY_API_KEY"] ?? builder.Configuration["Dify:ApiKey"] ?? Environment.GetEnvironmentVariable("DIFY_API_KEY"));
if (aiProviderChoice == "dify" || (string.IsNullOrEmpty(aiProviderChoice) && hasDifyKey))
{
    builder.Services.AddHttpClient<IAiSkincareProvider, DifySkincareProvider>();
}
else
{
    builder.Services.AddHttpClient<IAiSkincareProvider, GeminiSkincareProvider>();
}

// 5. JWT Authentication
var isOpenApiDocGen = string.Equals(
    System.Reflection.Assembly.GetEntryAssembly()?.GetName().Name,
    "GetDocument.Insider",
    StringComparison.OrdinalIgnoreCase);
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
{
    if (!builder.Environment.IsDevelopment() && !isOpenApiDocGen)
    {
        throw new InvalidOperationException(
            "JWT_SECRET must be set via environment/secret store and be at least 32 characters long in Production.");
    }

    // Ephemeral per-process key for local Development (when not set in .env / user-secrets) or build-time OpenAPI generation
    jwtSecret = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    builder.Configuration["JWT_SECRET"] = jwtSecret;
}
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

// Ensure schema migration & optional env-driven Admin account bootstrap (skip during build-time OpenAPI doc generation)
if (!isOpenApiDocGen)
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
                ALTER TABLE products ADD COLUMN IF NOT EXISTS size_display VARCHAR(100) NULL;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS loves_count INT NOT NULL DEFAULT 0;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NULL;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0;
                CREATE INDEX IF NOT EXISTS idx_products_selling_status ON products(selling_status);
                CREATE INDEX IF NOT EXISTS idx_products_department ON products(department);
                CREATE INDEX IF NOT EXISTS idx_products_sorting ON products(reviews_count DESC, avg_rating DESC NULLS LAST, loves_count DESC);

                ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT NULL;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) NULL;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_reason VARCHAR(500) NULL;

                CREATE TABLE IF NOT EXISTS support_tickets (
                    id SERIAL PRIMARY KEY,
                    ticket_code VARCHAR(32) NOT NULL UNIQUE,
                    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'New',
                    admin_reply TEXT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NULL
                );
                CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
                CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden ON reviews(is_hidden);

                UPDATE products p
                SET avg_rating = ROUND(s.avg_r, 1),
                    reviews_count = s.cnt
                FROM (
                    SELECT product_id, AVG(rating)::numeric AS avg_r, COUNT(*)::int AS cnt
                    FROM reviews
                    WHERE COALESCE(is_hidden, FALSE) = FALSE
                    GROUP BY product_id
                ) s
                WHERE p.id = s.product_id AND (p.reviews_count != s.cnt OR p.avg_rating IS DISTINCT FROM ROUND(s.avg_r, 1));
            ");

            // One-time backfill of size_display, volume_ml, and loves_count from products_cleaned.csv if not yet populated
            var hasSizeDisplay = await db.Products.AnyAsync(p => p.SizeDisplay != null);
            if (!hasSizeDisplay)
            {
                foreach (var dir in candidateDirs)
                {
                    var csvPath = Path.Combine(dir, "docs", "_data", "cleaned", "products_cleaned.csv");
                    if (File.Exists(csvPath))
                    {
                        logger.LogInformation("Backfilling size_display, volume_ml, and loves_count from {CsvPath}...", csvPath);
                        var codes = new List<string>();
                        var sizes = new List<string?>();
                        var vols = new List<int?>();
                        var lovesList = new List<int>();

                        using var reader = new StreamReader(csvPath, Encoding.UTF8);
                        var headerLine = await reader.ReadLineAsync();
                        if (headerLine != null)
                        {
                            var headers = ParseCsvRow(headerLine);
                            int codeIdx = Array.IndexOf(headers, "product_id");
                            int sizeIdx = Array.IndexOf(headers, "size");
                            int lovesIdx = Array.IndexOf(headers, "loves_count");

                            string? rowLine;
                            var mlRegex = new System.Text.RegularExpressions.Regex(@"(\d+(?:\.\d+)?)\s*m[lL]\b");
                            while ((rowLine = await reader.ReadLineAsync()) != null)
                            {
                                var cols = ParseCsvRow(rowLine);
                                if (codeIdx < 0 || codeIdx >= cols.Length) continue;
                                var code = cols[codeIdx].Trim();
                                if (string.IsNullOrEmpty(code)) continue;

                                var rawSz = (sizeIdx >= 0 && sizeIdx < cols.Length) ? cols[sizeIdx].Trim() : "";
                                string? szDisp = (string.IsNullOrEmpty(rawSz) || string.Equals(rawSz, "N/A", StringComparison.OrdinalIgnoreCase))
                                    ? null
                                    : (rawSz.Length > 100 ? rawSz[..100] : rawSz);

                                int? volMl = null;
                                if (szDisp != null)
                                {
                                    var m = mlRegex.Match(szDisp);
                                    if (m.Success && double.TryParse(m.Groups[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedMl))
                                    {
                                        volMl = (int)Math.Round(parsedMl);
                                    }
                                }

                                int lv = 0;
                                if (lovesIdx >= 0 && lovesIdx < cols.Length && double.TryParse(cols[lovesIdx].Trim(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedLv))
                                {
                                    lv = (int)parsedLv;
                                }

                                codes.Add(code);
                                sizes.Add(szDisp);
                                vols.Add(volMl);
                                lovesList.Add(lv);
                            }

                            if (codes.Count > 0)
                            {
                                var conn = (Npgsql.NpgsqlConnection)db.Database.GetDbConnection();
                                if (conn.State != System.Data.ConnectionState.Open)
                                    await conn.OpenAsync();
                                await using var cmd = new Npgsql.NpgsqlCommand(@"
                                    UPDATE products p
                                    SET size_display = u.sz,
                                        volume_ml = u.vol,
                                        loves_count = u.lv
                                    FROM UNNEST(@codes, @sizes, @vols, @loves) AS u(code, sz, vol, lv)
                                    WHERE p.code = u.code;
                                ", conn);
                                cmd.Parameters.AddWithValue("codes", codes.ToArray());
                                cmd.Parameters.AddWithValue("sizes", sizes.ToArray());
                                cmd.Parameters.AddWithValue("vols", vols.ToArray());
                                cmd.Parameters.AddWithValue("loves", lovesList.ToArray());
                                var updated = await cmd.ExecuteNonQueryAsync();
                                logger.LogInformation("Backfilled {Updated} products with real size_display, volume_ml, and loves_count.", updated);
                            }
                        }
                        break;
                    }
                }
            }
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
        logger.LogError(ex, "Database schema ensure or Admin bootstrap failed during startup.");
        if (!app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

var webRootDir = string.IsNullOrWhiteSpace(app.Environment.WebRootPath)
    ? Path.Combine(app.Environment.ContentRootPath, "wwwroot")
    : app.Environment.WebRootPath;
var uploadsRoot = Path.Combine(webRootDir, "uploads", "products");
Directory.CreateDirectory(uploadsRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRootDir),
    RequestPath = ""
});
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new HealthResponse("ok", "beautyai-api")))
   .Produces<HealthResponse>(StatusCodes.Status200OK);

static string[] ParseCsvRow(string line)
{
    var list = new List<string>();
    var sb = new StringBuilder();
    bool inQuotes = false;
    for (int i = 0; i < line.Length; i++)
    {
        char c = line[i];
        if (c == '"')
        {
            if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
            {
                sb.Append('"');
                i++;
            }
            else
            {
                inQuotes = !inQuotes;
            }
        }
        else if (c == ',' && !inQuotes)
        {
            list.Add(sb.ToString());
            sb.Clear();
        }
        else
        {
            sb.Append(c);
        }
    }
    list.Add(sb.ToString());
    return list.ToArray();
}

app.Run();

public record HealthResponse(string status, string service);

namespace BeautyAI.Api
{
    public partial class Program { }
}
