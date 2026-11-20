using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IAdminProductService
{
    Task<PagedResult<AdminProductDto>> GetProductsAsync(
        AdminProductFilterParams filter,
        CancellationToken cancellationToken = default);

    Task<AdminProductDto?> GetProductByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<AdminProductDto> CreateProductAsync(
        CreateProductAdminRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminProductDto> UpdateProductAsync(
        int id,
        UpdateProductAdminRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DiscontinueProductAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<AdminProductDto> RestoreProductAsync(
        int id,
        CancellationToken cancellationToken = default);
}
