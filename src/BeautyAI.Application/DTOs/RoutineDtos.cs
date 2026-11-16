namespace BeautyAI.Application.DTOs;

public record GenerateRoutineRequest(
    string? SkinType = null,
    string? BudgetLevel = null,
    List<string>? SkinConcerns = null,
    string? PrimaryGoal = null
);

public record RoutineStepDto(
    int StepOrder,
    string StepName,
    string Timing, // "AM" or "PM"
    string Description,
    ProductSummaryDto Product
);

public record RoutineResultDto(
    List<ProductSummaryDto> AmRoutine,
    List<ProductSummaryDto> PmRoutine,
    List<RoutineStepDto> DetailedSteps,
    decimal TotalCostUsd,
    List<ConflictDetailDto> InternalConflicts
);

public record SaveRoutineRequest(
    string RoutineName,
    string RoutineType, // "Morning", "Night", "Treatment"
    List<int> ProductIds,
    string? Notes = null
);

public record SavedRoutineDto(
    int Id,
    int? UserId,
    string RoutineName,
    string RoutineType,
    List<ProductSummaryDto> Products,
    string? Notes,
    DateTime CreatedAtUtc
);
