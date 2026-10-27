namespace BeautyAI.Application.DTOs;

public record AllergyItemDto(
    int Id,
    string IngredientName,
    string? Note
);

public record DigitalSkinIdDto(
    int UserId,
    string FullName,
    string SkinType,                 // 1. Baseline Physiology
    List<AllergyItemDto> Allergies,  // 2. Safety Boundaries (Allergy Blacklist)
    List<string> SkinConcerns,       // 3. Targeted Goals: Skin Concerns
    string PrimaryGoal,              // 3. Primary Goal
    string BudgetLevel               // 3. Budget Level
);

public record UpdateDigitalSkinIdRequest(
    string SkinType,
    List<string> AllergyNames,
    List<string> SkinConcerns,
    string PrimaryGoal,
    string BudgetLevel
);

public record AddAllergyRequest(
    string IngredientName,
    string? Note
);
