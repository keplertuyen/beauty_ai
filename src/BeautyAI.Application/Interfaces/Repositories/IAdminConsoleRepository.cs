using BeautyAI.Application.DTOs;
using BeautyAI.Domain.Entities;

namespace BeautyAI.Application.Interfaces.Repositories;

public interface IAdminConsoleRepository
{
    // Dashboard summary counts
    Task<(int TotalUsers, int ActiveUsers, int OpenTickets, int LowStockProducts)> GetSummaryCountsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SupportTicketDto>> GetRecentSupportTicketsAsync(int limit = 5, CancellationToken cancellationToken = default);

    // Users (Strictly excludes SkinProfile & UserAllergy per NFR-PRIV-08)
    Task<PagedResultDto<AdminUserDto>> GetUsersAsync(string? query, string? role, bool? isActive, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> UpdateUserStatusAsync(int userId, bool isActive, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> UpdateUserRoleAsync(int userId, string role, CancellationToken cancellationToken = default);

    // Reviews moderation (recalculates product avg_rating & reviews_count)
    Task<PagedResultDto<AdminReviewDto>> GetReviewsAsync(string? query, int? rating, string? status, int? productId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminReviewDto?> UpdateReviewVisibilityAsync(long reviewId, bool isHidden, string? moderationReason, CancellationToken cancellationToken = default);
    Task<bool> DeleteReviewAsync(long reviewId, CancellationToken cancellationToken = default);

    // Support Tickets / Feedback
    Task<SupportTicketDto> CreateSupportTicketAsync(int? userId, CreateSupportTicketRequest request, CancellationToken cancellationToken = default);
    Task<PagedResultDto<SupportTicketDto>> GetSupportTicketsAsync(string? query, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<SupportTicketDto?> UpdateSupportTicketAsync(int id, string status, string? adminReply, CancellationToken cancellationToken = default);

    // Ingredients dictionary
    Task<PagedResultDto<AdminIngredientDto>> GetIngredientsAsync(string? query, string? group, bool? activeOnly, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminIngredientDto> CreateIngredientAsync(UpsertIngredientRequest request, CancellationToken cancellationToken = default);
    Task<AdminIngredientDto?> UpdateIngredientAsync(int id, UpsertIngredientRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteIngredientAsync(int id, CancellationToken cancellationToken = default);

    // Conflict rules
    Task<IReadOnlyList<AdminConflictRuleDto>> GetConflictRulesAsync(string? query, string? severity, CancellationToken cancellationToken = default);
    Task<AdminConflictRuleDto> CreateConflictRuleAsync(UpsertConflictRuleRequest request, CancellationToken cancellationToken = default);
    Task<AdminConflictRuleDto?> UpdateConflictRuleAsync(int id, UpsertConflictRuleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteConflictRuleAsync(int id, CancellationToken cancellationToken = default);

    // Brands & Categories
    Task<IReadOnlyList<AdminBrandDto>> GetBrandsAsync(string? query, CancellationToken cancellationToken = default);
    Task<AdminBrandDto> CreateBrandAsync(UpsertBrandRequest request, CancellationToken cancellationToken = default);
    Task<AdminBrandDto?> UpdateBrandAsync(int id, UpsertBrandRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteBrandAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(string? query, CancellationToken cancellationToken = default);
    Task<AdminCategoryDto> CreateCategoryAsync(UpsertCategoryRequest request, CancellationToken cancellationToken = default);
    Task<AdminCategoryDto?> UpdateCategoryAsync(int id, UpsertCategoryRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(int id, CancellationToken cancellationToken = default);
}
