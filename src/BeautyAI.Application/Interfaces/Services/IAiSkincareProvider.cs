using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IAiSkincareProvider
{
    Task<string> ConsultAsync(
        string userMessage,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> availableProducts,
        CancellationToken cancellationToken = default);
}
