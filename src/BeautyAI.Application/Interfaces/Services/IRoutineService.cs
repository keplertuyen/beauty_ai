using BeautyAI.Application.DTOs;

namespace BeautyAI.Application.Interfaces.Services;

public interface IRoutineService
{
    Task<RoutineResultDto> GenerateRoutineAsync(
        int? userId,
        GenerateRoutineRequest request,
        CancellationToken cancellationToken = default);

    Task<SavedRoutineDto> SaveRoutineAsync(
        int userId,
        SaveRoutineRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SavedRoutineDto>> GetUserSavedRoutinesAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteSavedRoutineAsync(
        int userId,
        int routineId,
        CancellationToken cancellationToken = default);
}
