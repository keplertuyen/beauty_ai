using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence;

public class BeautyAIDbContext : DbContext
{
    public BeautyAIDbContext(DbContextOptions<BeautyAIDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<SkinProfile> SkinProfiles => Set<SkinProfile>();
    public DbSet<UserAllergy> UserAllergies => Set<UserAllergy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
            entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
            entity.Property(e => e.Role)
                .HasColumnName("role")
                .HasConversion(
                    v => v.ToString(),
                    v => (UserRole)Enum.Parse(typeof(UserRole), v)
                )
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.UpdatedAtUtc);
            entity.Ignore(e => e.ShippingAddress); // Currently not in users table schema, stored in memory/order

            entity.HasOne(e => e.SkinProfile)
                .WithOne(p => p.User)
                .HasForeignKey<SkinProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Allergies)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. SkinProfile
        modelBuilder.Entity<SkinProfile>(entity =>
        {
            entity.ToTable("skin_profiles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.Property(e => e.SkinType)
                .HasColumnName("skin_type")
                .HasConversion(
                    v => v.ToString(),
                    v => (SkinType)Enum.Parse(typeof(SkinType), v)
                )
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.SkinConcerns)
                .HasColumnName("skin_concerns")
                .HasColumnType("text[]");

            entity.Property(e => e.PrimaryGoal).HasColumnName("primary_goal").HasMaxLength(255);

            entity.Property(e => e.BudgetLevel)
                .HasColumnName("budget_level")
                .HasConversion(
                    v => v.ToString(),
                    v => (BudgetLevel)Enum.Parse(typeof(BudgetLevel), v)
                )
                .HasMaxLength(50)
                .HasDefaultValue(BudgetLevel.Medium);

            entity.Property(e => e.UpdatedAtUtc).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.CreatedAtUtc);
        });

        // 3. UserAllergy
        modelBuilder.Entity<UserAllergy>(entity =>
        {
            entity.ToTable("user_allergies");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.IngredientName).HasColumnName("ingredient_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Note).HasColumnName("note").HasMaxLength(500);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.UpdatedAtUtc);
        });
    }
}
