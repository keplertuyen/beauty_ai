using System.Text;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Application.Interfaces.Security;
using BeautyAI.Application.Interfaces.Services;
using BeautyAI.Application.Services;
using BeautyAI.Infrastructure.Persistence;
using BeautyAI.Infrastructure.Persistence.Repositories;
using BeautyAI.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"]
    ?? "Host=localhost;Port=5432;Database=beautyai;Username=beautyai;Password=beautyai_dev_secret";

builder.Services.AddDbContext<BeautyAIDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 4. Repositories & Services Registration
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISkinProfileRepository, SkinProfileRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IToolRepository, ToolRepository>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISkinProfileService, SkinProfileService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IToolsService, ToolsService>();

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
