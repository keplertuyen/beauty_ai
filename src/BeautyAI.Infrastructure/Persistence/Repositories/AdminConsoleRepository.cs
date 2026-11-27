using BeautyAI.Application.DTOs;
using BeautyAI.Application.Interfaces.Repositories;
using BeautyAI.Domain.Entities;
using BeautyAI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BeautyAI.Infrastructure.Persistence.Repositories;

public class AdminConsoleRepository : IAdminConsoleRepository
{
    private static readonly char[] CodeChars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".ToCharArray();
    private readonly BeautyAIDbContext _context;

    public AdminConsoleRepository(BeautyAIDbContext context)
    {
        _context = context;
    }

    public async Task<(int TotalUsers, int ActiveUsers, int OpenTickets, int LowStockProducts)> GetSummaryCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive, cancellationToken);
        var openTickets = await _context.SupportTickets.CountAsync(t => t.Status != "Resolved", cancellationToken);
        var lowStock = await _context.Products.CountAsync(
            p => p.SellingStatus == "Active" && p.StockQuantity <= 10,
            cancellationToken);

        return (totalUsers, activeUsers, openTickets, lowStock);
    }

    public async Task<IReadOnlyList<SupportTicketDto>> GetRecentSupportTicketsAsync(
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        return await _context.SupportTickets
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(limit)
            .Select(t => new SupportTicketDto(
                t.Id,
                t.TicketCode,
                t.UserId,
                t.Name,
                t.Email,
                t.Subject,
                t.Message,
                t.Status,
                t.AdminReply,
                t.CreatedAtUtc,
                t.UpdatedAtUtc
            ))
            .ToListAsync(cancellationToken);
    }

    // ── USERS (Privacy-safe: zero SkinProfile / UserAllergy projection per NFR-PRIV-08) ──
    public async Task<PagedResultDto<AdminUserDto>> GetUsersAsync(
        string? query,
        string? role,
        bool? isActive,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(u =>
                u.FullName.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                (u.Phone != null && u.Phone.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role.Trim(), true, out var parsedRole))
        {
            q = q.Where(u => u.Role == parsedRole);
        }

        if (isActive.HasValue)
        {
            q = q.Where(u => u.IsActive == isActive.Value);
        }

        var total = await q.CountAsync(cancellationToken);
        var users = await q
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.Phone,
                Role = u.Role.ToString(),
                u.IsActive,
                u.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();
        var orderStats = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId.HasValue && userIds.Contains(o.UserId.Value))
            .GroupBy(o => o.UserId!.Value)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                Spent = g.Where(o => o.OrderStatus != "Cancelled").Sum(o => o.TotalAmountUsd)
            })
            .ToDictionaryAsync(x => x.UserId, cancellationToken);

        var items = users.Select(u =>
        {
            orderStats.TryGetValue(u.Id, out var stat);
            return new AdminUserDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Phone,
                u.Role,
                u.IsActive,
                stat?.Count ?? 0,
                Math.Round(stat?.Spent ?? 0m, 2),
                u.CreatedAtUtc
            );
        }).ToList();

        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        return new PagedResultDto<AdminUserDto>(items, total, page, pageSize, pages);
    }

    public async Task<AdminUserDto?> UpdateUserStatusAsync(int userId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return null;

        user.IsActive = isActive;
        await _context.SaveChangesAsync(cancellationToken);
        return await ProjectSingleUserAsync(user, cancellationToken);
    }

    public async Task<AdminUserDto?> UpdateUserRoleAsync(int userId, string role, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<UserRole>(role.Trim(), true, out var parsedRole))
            throw new ArgumentException($"Invalid role '{role}'. Must be Customer or Admin.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return null;

        user.Role = parsedRole;
        await _context.SaveChangesAsync(cancellationToken);
        return await ProjectSingleUserAsync(user, cancellationToken);
    }

    private async Task<AdminUserDto> ProjectSingleUserAsync(User user, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == user.Id)
            .Select(o => new { o.OrderStatus, o.TotalAmountUsd })
            .ToListAsync(cancellationToken);

        return new AdminUserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role.ToString(),
            user.IsActive,
            orders.Count,
            Math.Round(orders.Where(o => o.OrderStatus != "Cancelled").Sum(o => o.TotalAmountUsd), 2),
            user.CreatedAtUtc
        );
    }

    // ── REVIEWS MODERATION ──
    public async Task<PagedResultDto<AdminReviewDto>> GetReviewsAsync(
        string? query,
        int? rating,
        string? status,
        int? productId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _context.Reviews
            .Include(r => r.Product)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(r =>
                r.AuthorName.ToLower().Contains(term) ||
                (r.Content != null && r.Content.ToLower().Contains(term)) ||
                (r.Product != null && (r.Product.Name.ToLower().Contains(term) || r.Product.Code.ToLower().Contains(term))));
        }

        if (rating.HasValue && rating.Value >= 1 && rating.Value <= 5)
        {
            q = q.Where(r => r.Rating == rating.Value);
        }

        if (productId.HasValue)
        {
            q = q.Where(r => r.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (string.Equals(status.Trim(), "Hidden", StringComparison.OrdinalIgnoreCase))
                q = q.Where(r => r.IsHidden);
            else if (string.Equals(status.Trim(), "Visible", StringComparison.OrdinalIgnoreCase))
                q = q.Where(r => !r.IsHidden);
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AdminReviewDto(
                r.Id,
                r.ProductId,
                r.Product != null ? r.Product.Code : r.ProductCode,
                r.Product != null ? r.Product.Name : "Product",
                r.Product != null ? r.Product.ImageUrl : null,
                r.UserId,
                r.AuthorName,
                r.Rating,
                r.SkinType,
                r.Content,
                r.IsHidden,
                r.ModerationReason,
                r.CreatedAtUtc
            ))
            .ToListAsync(cancellationToken);

        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        return new PagedResultDto<AdminReviewDto>(items, total, page, pageSize, pages);
    }

    public async Task<AdminReviewDto?> UpdateReviewVisibilityAsync(
        long reviewId,
        bool isHidden,
        string? moderationReason,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review == null) return null;

        review.IsHidden = isHidden;
        review.ModerationReason = isHidden ? moderationReason?.Trim() : null;
        await _context.SaveChangesAsync(cancellationToken);

        await RecalculateProductRatingAsync(review.ProductId, cancellationToken);

        return new AdminReviewDto(
            review.Id,
            review.ProductId,
            review.Product?.Code ?? review.ProductCode,
            review.Product?.Name ?? "Product",
            review.Product?.ImageUrl,
            review.UserId,
            review.AuthorName,
            review.Rating,
            review.SkinType,
            review.Content,
            review.IsHidden,
            review.ModerationReason,
            review.CreatedAtUtc
        );
    }

    public async Task<bool> DeleteReviewAsync(long reviewId, CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review == null) return false;

        var productId = review.ProductId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);

        await RecalculateProductRatingAsync(productId, cancellationToken);
        return true;
    }

    private async Task RecalculateProductRatingAsync(int productId, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product == null) return;

        var visibleStats = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && !r.IsHidden)
            .GroupBy(r => r.ProductId)
            .Select(g => new
            {
                Count = g.Count(),
                Avg = g.Average(r => (decimal)r.Rating)
            })
            .FirstOrDefaultAsync(cancellationToken);

        product.ReviewsCount = visibleStats?.Count ?? 0;
        product.AvgRating = visibleStats != null ? Math.Round(visibleStats.Avg, 1) : null;
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ── SUPPORT TICKETS / FEEDBACK ──
    public async Task<SupportTicketDto> CreateSupportTicketAsync(
        int? userId,
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.");
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Subject))
            throw new ArgumentException("Subject is required.");
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message is required.");

        var ticket = new SupportTicket
        {
            TicketCode = GenerateTicketCode(),
            UserId = userId,
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
            Status = "New",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync(cancellationToken);

        return new SupportTicketDto(
            ticket.Id,
            ticket.TicketCode,
            ticket.UserId,
            ticket.Name,
            ticket.Email,
            ticket.Subject,
            ticket.Message,
            ticket.Status,
            ticket.AdminReply,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc
        );
    }

    public async Task<PagedResultDto<SupportTicketDto>> GetSupportTicketsAsync(
        string? query,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _context.SupportTickets.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(t =>
                t.TicketCode.ToLower().Contains(term) ||
                t.Name.ToLower().Contains(term) ||
                t.Email.ToLower().Contains(term) ||
                t.Subject.ToLower().Contains(term) ||
                t.Message.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim();
            q = q.Where(t => t.Status.ToLower() == st.ToLower());
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new SupportTicketDto(
                t.Id,
                t.TicketCode,
                t.UserId,
                t.Name,
                t.Email,
                t.Subject,
                t.Message,
                t.Status,
                t.AdminReply,
                t.CreatedAtUtc,
                t.UpdatedAtUtc
            ))
            .ToListAsync(cancellationToken);

        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        return new PagedResultDto<SupportTicketDto>(items, total, page, pageSize, pages);
    }

    public async Task<SupportTicketDto?> UpdateSupportTicketAsync(
        int id,
        string status,
        string? adminReply,
        CancellationToken cancellationToken = default)
    {
        var valid = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "New", "InProgress", "Resolved" };
        if (string.IsNullOrWhiteSpace(status) || !valid.Contains(status.Trim()))
            throw new ArgumentException("Invalid status. Must be New, InProgress, or Resolved.");

        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (ticket == null) return null;

        ticket.Status = status.Trim() switch
        {
            var s when s.Equals("New", StringComparison.OrdinalIgnoreCase) => "New",
            var s when s.Equals("InProgress", StringComparison.OrdinalIgnoreCase) => "InProgress",
            _ => "Resolved"
        };

        if (adminReply != null)
        {
            ticket.AdminReply = adminReply.Trim();
        }
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new SupportTicketDto(
            ticket.Id,
            ticket.TicketCode,
            ticket.UserId,
            ticket.Name,
            ticket.Email,
            ticket.Subject,
            ticket.Message,
            ticket.Status,
            ticket.AdminReply,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc
        );
    }

    private static string GenerateTicketCode()
    {
        var chars = new char[4];
        for (int i = 0; i < 4; i++)
        {
            chars[i] = CodeChars[Random.Shared.Next(CodeChars.Length)];
        }
        return $"SP-{new string(chars)}";
    }

    // ── INGREDIENTS DICTIONARY ──
    public async Task<PagedResultDto<AdminIngredientDto>> GetIngredientsAsync(
        string? query,
        string? group,
        bool? activeOnly,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _context.Ingredients.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(i =>
                i.InciName.ToLower().Contains(term) ||
                i.FunctionGroup.ToLower().Contains(term) ||
                (i.Description != null && i.Description.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(group))
        {
            var g = group.Trim().ToLower();
            q = q.Where(i => i.FunctionGroup.ToLower() == g);
        }

        if (activeOnly == true)
        {
            q = q.Where(i => i.IsActiveIngredient);
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(i => i.IsActiveIngredient)
            .ThenBy(i => i.InciName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new AdminIngredientDto(
                i.Id,
                i.InciName,
                i.FunctionGroup,
                i.Description,
                i.IsActiveIngredient,
                i.ComedogenicRating,
                i.IrritationRating,
                i.ProductIngredients.Count
            ))
            .ToListAsync(cancellationToken);

        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        return new PagedResultDto<AdminIngredientDto>(items, total, page, pageSize, pages);
    }

    public async Task<AdminIngredientDto> CreateIngredientAsync(
        UpsertIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateIngredient(request);

        var normalized = request.InciName.Trim();
        var exists = await _context.Ingredients.AnyAsync(
            i => i.InciName.ToLower() == normalized.ToLower(),
            cancellationToken);
        if (exists)
            throw new ArgumentException($"Ingredient '{normalized}' already exists.");

        var entity = new Ingredient
        {
            InciName = normalized,
            FunctionGroup = string.IsNullOrWhiteSpace(request.FunctionGroup) ? "Other" : request.FunctionGroup.Trim(),
            Description = request.Description?.Trim(),
            IsActiveIngredient = request.IsActiveIngredient,
            ComedogenicRating = request.ComedogenicRating,
            IrritationRating = request.IrritationRating
        };

        _context.Ingredients.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new AdminIngredientDto(
            entity.Id,
            entity.InciName,
            entity.FunctionGroup,
            entity.Description,
            entity.IsActiveIngredient,
            entity.ComedogenicRating,
            entity.IrritationRating,
            0
        );
    }

    public async Task<AdminIngredientDto?> UpdateIngredientAsync(
        int id,
        UpsertIngredientRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateIngredient(request);

        var entity = await _context.Ingredients
            .Include(i => i.ProductIngredients)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (entity == null) return null;

        entity.InciName = request.InciName.Trim();
        entity.FunctionGroup = string.IsNullOrWhiteSpace(request.FunctionGroup) ? "Other" : request.FunctionGroup.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActiveIngredient = request.IsActiveIngredient;
        entity.ComedogenicRating = request.ComedogenicRating;
        entity.IrritationRating = request.IrritationRating;

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminIngredientDto(
            entity.Id,
            entity.InciName,
            entity.FunctionGroup,
            entity.Description,
            entity.IsActiveIngredient,
            entity.ComedogenicRating,
            entity.IrritationRating,
            entity.ProductIngredients.Count
        );
    }

    public async Task<bool> DeleteIngredientAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Ingredients
            .Include(i => i.ProductIngredients)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (entity == null) return false;

        if (entity.ProductIngredients.Count > 0)
            throw new InvalidOperationException(
                $"Không thể xóa thành phần '{entity.InciName}' vì đang được liên kết với {entity.ProductIngredients.Count} sản phẩm.");

        _context.Ingredients.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void ValidateIngredient(UpsertIngredientRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InciName))
            throw new ArgumentException("INCI name is required.");
        if (request.ComedogenicRating.HasValue && (request.ComedogenicRating < 0 || request.ComedogenicRating > 5))
            throw new ArgumentException("Comedogenic rating must be between 0 and 5.");
        if (request.IrritationRating.HasValue && (request.IrritationRating < 0 || request.IrritationRating > 5))
            throw new ArgumentException("Irritation rating must be between 0 and 5.");
    }

    // ── CONFLICT RULES ──
    public async Task<IReadOnlyList<AdminConflictRuleDto>> GetConflictRulesAsync(
        string? query,
        string? severity,
        CancellationToken cancellationToken = default)
    {
        var q = _context.ConflictRules.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(c =>
                c.ActiveIngredientA.ToLower().Contains(term) ||
                c.ActiveIngredientB.ToLower().Contains(term) ||
                c.Reason.ToLower().Contains(term) ||
                c.Recommendation.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(severity))
        {
            var sev = severity.Trim().ToLower();
            q = q.Where(c => c.Severity.ToLower() == sev);
        }

        return await q
            .OrderByDescending(c => c.Id)
            .Select(c => new AdminConflictRuleDto(
                c.Id,
                c.ActiveIngredientA,
                c.ActiveIngredientB,
                c.Severity,
                c.Reason,
                c.Recommendation
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminConflictRuleDto> CreateConflictRuleAsync(
        UpsertConflictRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateConflictRule(request);

        var entity = new ConflictRule
        {
            ActiveIngredientA = request.ActiveIngredientA.Trim(),
            ActiveIngredientB = request.ActiveIngredientB.Trim(),
            Severity = string.IsNullOrWhiteSpace(request.Severity) ? "Warning" : request.Severity.Trim(),
            Reason = request.Reason.Trim(),
            Recommendation = request.Recommendation.Trim()
        };

        _context.ConflictRules.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new AdminConflictRuleDto(
            entity.Id,
            entity.ActiveIngredientA,
            entity.ActiveIngredientB,
            entity.Severity,
            entity.Reason,
            entity.Recommendation
        );
    }

    public async Task<AdminConflictRuleDto?> UpdateConflictRuleAsync(
        int id,
        UpsertConflictRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateConflictRule(request);

        var entity = await _context.ConflictRules.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (entity == null) return null;

        entity.ActiveIngredientA = request.ActiveIngredientA.Trim();
        entity.ActiveIngredientB = request.ActiveIngredientB.Trim();
        entity.Severity = string.IsNullOrWhiteSpace(request.Severity) ? "Warning" : request.Severity.Trim();
        entity.Reason = request.Reason.Trim();
        entity.Recommendation = request.Recommendation.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminConflictRuleDto(
            entity.Id,
            entity.ActiveIngredientA,
            entity.ActiveIngredientB,
            entity.Severity,
            entity.Reason,
            entity.Recommendation
        );
    }

    public async Task<bool> DeleteConflictRuleAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.ConflictRules.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (entity == null) return false;

        _context.ConflictRules.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void ValidateConflictRule(UpsertConflictRuleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ActiveIngredientA) || string.IsNullOrWhiteSpace(request.ActiveIngredientB))
            throw new ArgumentException("Both active ingredients are required.");
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("Reason is required.");
        if (string.IsNullOrWhiteSpace(request.Recommendation))
            throw new ArgumentException("Recommendation is required.");
    }

    // ── BRANDS CRUD ──
    public async Task<IReadOnlyList<AdminBrandDto>> GetBrandsAsync(
        string? query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.Brands.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(b =>
                b.Name.ToLower().Contains(term) ||
                b.Slug.ToLower().Contains(term) ||
                (b.OriginCountry != null && b.OriginCountry.ToLower().Contains(term)));
        }

        return await q
            .OrderByDescending(b => b.Products.Count)
            .ThenBy(b => b.Name)
            .Select(b => new AdminBrandDto(
                b.Id,
                b.Name,
                b.Slug,
                b.OriginCountry,
                b.Products.Count
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminBrandDto> CreateBrandAsync(
        UpsertBrandRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên thương hiệu là bắt buộc.");

        var name = request.Name.Trim();
        var exists = await _context.Brands.AnyAsync(b => b.Name.ToLower() == name.ToLower(), cancellationToken);
        if (exists)
            throw new ArgumentException($"Thương hiệu '{name}' đã tồn tại.");

        var slug = await EnsureUniqueSlugAsync(ToSlug(name), isBrand: true, excludeId: null, cancellationToken);
        var entity = new Brand
        {
            Name = name,
            Slug = slug,
            OriginCountry = string.IsNullOrWhiteSpace(request.OriginCountry) ? null : request.OriginCountry.Trim()
        };

        _context.Brands.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new AdminBrandDto(entity.Id, entity.Name, entity.Slug, entity.OriginCountry, 0);
    }

    public async Task<AdminBrandDto?> UpdateBrandAsync(
        int id,
        UpsertBrandRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên thương hiệu là bắt buộc.");

        var entity = await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (entity == null) return null;

        var name = request.Name.Trim();
        var duplicate = await _context.Brands.AnyAsync(
            b => b.Id != id && b.Name.ToLower() == name.ToLower(),
            cancellationToken);
        if (duplicate)
            throw new ArgumentException($"Thương hiệu '{name}' đã tồn tại.");

        entity.Name = name;
        entity.Slug = await EnsureUniqueSlugAsync(ToSlug(name), isBrand: true, excludeId: id, cancellationToken);
        entity.OriginCountry = string.IsNullOrWhiteSpace(request.OriginCountry) ? null : request.OriginCountry.Trim();

        await _context.SaveChangesAsync(cancellationToken);
        return new AdminBrandDto(entity.Id, entity.Name, entity.Slug, entity.OriginCountry, entity.Products.Count);
    }

    public async Task<bool> DeleteBrandAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (entity == null) return false;

        if (entity.Products.Count > 0)
            throw new InvalidOperationException(
                $"Không thể xóa thương hiệu '{entity.Name}' vì đang có {entity.Products.Count} sản phẩm. Hãy chuyển sản phẩm sang thương hiệu khác trước.");

        _context.Brands.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ── CATEGORIES CRUD ──
    public async Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(
        string? query,
        CancellationToken cancellationToken = default)
    {
        var q = _context.Categories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            q = q.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.Slug.ToLower().Contains(term) ||
                (c.Parent != null && c.Parent.Name.ToLower().Contains(term)));
        }

        return await q
            .OrderByDescending(c => c.Products.Count)
            .ThenBy(c => c.Name)
            .Select(c => new AdminCategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                c.ParentId,
                c.Parent != null ? c.Parent.Name : null,
                c.Products.Count,
                c.SubCategories.Count
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminCategoryDto> CreateCategoryAsync(
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên danh mục là bắt buộc.");

        var name = request.Name.Trim();
        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower(), cancellationToken);
        if (exists)
            throw new ArgumentException($"Danh mục '{name}' đã tồn tại.");

        string? parentName = null;
        if (request.ParentId.HasValue)
        {
            var parent = await _context.Categories.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.ParentId.Value, cancellationToken);
            if (parent == null)
                throw new ArgumentException("Danh mục cha không tồn tại.");
            parentName = parent.Name;
        }

        var slug = await EnsureUniqueSlugAsync(ToSlug(name), isBrand: false, excludeId: null, cancellationToken);
        var entity = new Category
        {
            Name = name,
            Slug = slug,
            ParentId = request.ParentId
        };

        _context.Categories.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new AdminCategoryDto(entity.Id, entity.Name, entity.Slug, entity.ParentId, parentName, 0, 0);
    }

    public async Task<AdminCategoryDto?> UpdateCategoryAsync(
        int id,
        UpsertCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên danh mục là bắt buộc.");

        if (request.ParentId == id)
            throw new ArgumentException("Danh mục không thể là danh mục cha của chính nó.");

        var entity = await _context.Categories
            .Include(c => c.Products)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (entity == null) return null;

        var name = request.Name.Trim();
        var duplicate = await _context.Categories.AnyAsync(
            c => c.Id != id && c.Name.ToLower() == name.ToLower(),
            cancellationToken);
        if (duplicate)
            throw new ArgumentException($"Danh mục '{name}' đã tồn tại.");

        string? parentName = null;
        if (request.ParentId.HasValue)
        {
            var parent = await _context.Categories.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.ParentId.Value, cancellationToken);
            if (parent == null)
                throw new ArgumentException("Danh mục cha không tồn tại.");
            parentName = parent.Name;
        }

        entity.Name = name;
        entity.Slug = await EnsureUniqueSlugAsync(ToSlug(name), isBrand: false, excludeId: id, cancellationToken);
        entity.ParentId = request.ParentId;

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminCategoryDto(
            entity.Id,
            entity.Name,
            entity.Slug,
            entity.ParentId,
            parentName,
            entity.Products.Count,
            entity.SubCategories.Count
        );
    }

    public async Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Categories
            .Include(c => c.Products)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (entity == null) return false;

        if (entity.Products.Count > 0)
            throw new InvalidOperationException(
                $"Không thể xóa danh mục '{entity.Name}' vì đang có {entity.Products.Count} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.");

        if (entity.SubCategories.Count > 0)
            throw new InvalidOperationException(
                $"Không thể xóa danh mục '{entity.Name}' vì vẫn còn {entity.SubCategories.Count} danh mục con.");

        _context.Categories.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string ToSlug(string input)
    {
        var lower = input.Trim().ToLowerInvariant();
        var chars = lower.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray();
        var slug = System.Text.RegularExpressions.Regex.Replace(new string(chars), "-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? $"item-{Random.Shared.Next(1000, 9999)}" : slug;
    }

    private async Task<string> EnsureUniqueSlugAsync(string baseSlug, bool isBrand, int? excludeId, CancellationToken cancellationToken)
    {
        var slug = baseSlug;
        int suffix = 1;
        while (true)
        {
            var taken = isBrand
                ? await _context.Brands.AnyAsync(b => b.Slug == slug && (!excludeId.HasValue || b.Id != excludeId.Value), cancellationToken)
                : await _context.Categories.AnyAsync(c => c.Slug == slug && (!excludeId.HasValue || c.Id != excludeId.Value), cancellationToken);
            if (!taken) return slug;
            slug = $"{baseSlug}-{suffix++}";
        }
    }
}
