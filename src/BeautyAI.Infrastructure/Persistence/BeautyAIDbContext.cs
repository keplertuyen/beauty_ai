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
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<ProductIngredient> ProductIngredients => Set<ProductIngredient>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ConflictRule> ConflictRules => Set<ConflictRule>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<SavedRoutine> SavedRoutines => Set<SavedRoutine>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

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
            entity.Property(e => e.ShippingAddress).HasColumnName("shipping_address");
            entity.Ignore(e => e.UpdatedAtUtc);

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

        // 4. Brand
        modelBuilder.Entity<Brand>(entity =>
        {
            entity.ToTable("brands");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(255).IsRequired();
            entity.Property(e => e.OriginCountry).HasColumnName("origin_country").HasMaxLength(100);
            entity.Ignore(e => e.CreatedAtUtc);
            entity.Ignore(e => e.UpdatedAtUtc);
        });

        // 5. Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(255).IsRequired();
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Ignore(e => e.CreatedAtUtc);
            entity.Ignore(e => e.UpdatedAtUtc);

            entity.HasOne(e => e.Parent)
                .WithMany(p => p.SubCategories)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 6. Ingredient
        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.ToTable("ingredients");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.InciName).HasColumnName("inci_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FunctionGroup).HasColumnName("function_group").HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsActiveIngredient).HasColumnName("is_active_ingredient");
            entity.Property(e => e.ComedogenicRating).HasColumnName("comedogenic_rating");
            entity.Property(e => e.IrritationRating).HasColumnName("irritation_rating");
            entity.Ignore(e => e.CreatedAtUtc);
            entity.Ignore(e => e.UpdatedAtUtc);
        });

        // 7. Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(255).IsRequired();
            entity.Property(e => e.BrandId).HasColumnName("brand_id").IsRequired();
            entity.Property(e => e.CategoryId).HasColumnName("category_id").IsRequired();
            entity.Property(e => e.Department).HasColumnName("department").HasMaxLength(50).HasDefaultValue("Skincare");
            entity.Property(e => e.PriceUsd).HasColumnName("price_usd").HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.VolumeMl).HasColumnName("volume_ml");
            entity.Property(e => e.SizeDisplay).HasColumnName("size_display").HasMaxLength(100);
            entity.Property(e => e.LovesCount).HasColumnName("loves_count").HasDefaultValue(0);
            entity.Property(e => e.AvgRating).HasColumnName("avg_rating").HasPrecision(3, 2);
            entity.Property(e => e.ReviewsCount).HasColumnName("reviews_count").HasDefaultValue(0);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(e => e.IngredientListRaw).HasColumnName("ingredient_list_raw").IsRequired();
            entity.Property(e => e.TargetSkinTypes).HasColumnName("target_skin_types").HasColumnType("varchar(50)[]");
            entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity").HasDefaultValue(100);
            entity.Property(e => e.SellingStatus).HasColumnName("selling_status").HasMaxLength(20).HasDefaultValue("Active").IsRequired();
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAtUtc).HasColumnName("updated_at");

            entity.HasOne(e => e.Brand)
                .WithMany(b => b.Products)
                .HasForeignKey(e => e.BrandId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 8. ProductIngredient
        modelBuilder.Entity<ProductIngredient>(entity =>
        {
            entity.ToTable("product_ingredients");
            entity.HasKey(e => new { e.ProductId, e.IngredientId });
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.IngredientId).HasColumnName("ingredient_id");
            entity.Property(e => e.PositionOrder).HasColumnName("position_order");

            entity.HasOne(e => e.Product)
                .WithMany(p => p.ProductIngredients)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ingredient)
                .WithMany(i => i.ProductIngredients)
                .HasForeignKey(e => e.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 9. Review
        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("reviews");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductCode).HasColumnName("product_code").HasMaxLength(50);
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AuthorName).HasColumnName("author_name").HasMaxLength(255);
            entity.Property(e => e.Rating).HasColumnName("rating").IsRequired();
            entity.Property(e => e.SkinType).HasColumnName("skin_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.SkinConcerns).HasColumnName("skin_concerns").HasMaxLength(255);
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.IsHidden).HasColumnName("is_hidden").HasDefaultValue(false);
            entity.Property(e => e.ModerationReason).HasColumnName("moderation_reason").HasMaxLength(500);
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.UpdatedAtUtc);

            entity.HasOne(e => e.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 10. ConflictRule
        modelBuilder.Entity<ConflictRule>(entity =>
        {
            entity.ToTable("conflict_rules");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActiveIngredientA).HasColumnName("active_ingredient_a").HasMaxLength(255).IsRequired();
            entity.Property(e => e.ActiveIngredientB).HasColumnName("active_ingredient_b").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Severity).HasColumnName("severity").HasMaxLength(50).HasDefaultValue("Warning");
            entity.Property(e => e.Reason).HasColumnName("reason").IsRequired();
            entity.Property(e => e.Recommendation).HasColumnName("recommendation").IsRequired();
            entity.Ignore(e => e.CreatedAtUtc);
            entity.Ignore(e => e.UpdatedAtUtc);
        });

        // 11. Order & OrderItem (Table 9 in Phase 1 Schema)
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RecipientName).HasColumnName("recipient_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
            entity.Property(e => e.ShippingAddress).HasColumnName("shipping_address").IsRequired();
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasMaxLength(50).HasDefaultValue("COD");
            entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(e => e.OrderStatus).HasColumnName("order_status").HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(e => e.TotalAmountUsd).HasColumnName("total_amount_usd").HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.ConflictAcknowledged).HasColumnName("conflict_acknowledged").HasDefaultValue(false);
            entity.Property(e => e.TrackingNumber).HasColumnName("tracking_number").HasMaxLength(100);
            entity.Property(e => e.AdminNotes).HasColumnName("admin_notes");
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.UpdatedAtUtc);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderId).HasColumnName("order_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.Quantity).HasColumnName("quantity").IsRequired();
            entity.Property(e => e.UnitPriceUsd).HasColumnName("unit_price_usd").HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.TotalPriceUsd).HasColumnName("total_price_usd").HasPrecision(10, 2).IsRequired();

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SavedRoutine>(entity =>
        {
            entity.ToTable("saved_routines");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoutineName).HasColumnName("routine_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.RoutineType).HasColumnName("routine_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ItemsJson).HasColumnName("items").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.UpdatedAtUtc);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 13. SupportTicket
        modelBuilder.Entity<SupportTicket>(entity =>
        {
            entity.ToTable("support_tickets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TicketCode).HasColumnName("ticket_code").HasMaxLength(32).IsRequired();
            entity.HasIndex(e => e.TicketCode).IsUnique();
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Subject).HasColumnName("subject").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Message).HasColumnName("message").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(32).HasDefaultValue("New").IsRequired();
            entity.Property(e => e.AdminReply).HasColumnName("admin_reply");
            entity.Property(e => e.CreatedAtUtc).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAtUtc).HasColumnName("updated_at");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
