using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IToolsService
{
    Task<InciAnalysisResponse> AnalyzeInciAsync(InciAnalysisRequest request, CancellationToken cancellationToken = default);
    Task<ConflictCheckResponse> CheckCartConflictsAsync(ConflictCheckRequest request, CancellationToken cancellationToken = default);
    Task<object> GetSkinTypeGuideAsync(string area = "face", CancellationToken cancellationToken = default);
}
