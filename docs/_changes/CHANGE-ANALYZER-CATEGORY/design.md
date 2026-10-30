---
doc: change-design-analyzer-category
title: Change Design — CHANGE-ANALYZER-CATEGORY
status: approved
precedence: 2
owner: ta-sa
last_reviewed: 2026-10-28
---

# Change Design

## Technical approach
1. **Database & Seeder Hygiene (`products.ingredient_list_raw`):**
   - Replace placeholder `"No ingredients listed"` with `""` in PostgreSQL and `scripts/seed_full_database.py` (`FORCE_NOT_NULL (ingredient_list_raw)`).
2. **Domain Intelligence (`CosmeticKnowledgeBase.cs` & `SuitabilityScoreCalculator.cs`):**
   - Create `CosmeticKnowledgeBase` in `BeautyAI.Domain/Services/` containing:
     - 180+ curated cosmetic ingredients with common friendly names, functional group, plain-English explanations, target-area relevance, and scent tier.
     - Allergen Synonym Expander (e.g., `"Fragrance"` expands to `parfum`, `fragrance`, `aroma`, and EU 26 fragrance allergens; `"BHA"` expands to `salicylic acid`, `betaine salicylate`; `"AHA"` expands to `glycolic acid`, `lactic acid`, `mandelic acid`).
     - Category-to-Target-Area resolver (`face`, `eye`, `lips`, `body`, `hair`, `fragrance`, `nails`, `non-cosmetic`).
     - 3-Tier Formula Breakdown builder (`KeyIngredients`, `FunctionalGroups`, `Benefits`, `Cautions`, `FragranceDisclosure`) shared by both PDP (`ProductService`) and Analyzer (`ToolsService`).
3. **API & DTO Updates (`ProductDtos.cs`, `ToolDtos.cs`, `ToolsController.cs`):**
   - Enforce `[Authorize]` on `POST /api/v1/tools/analyze-inci` and `GET /api/v1/tools/skintype-guide`.
   - Remove `FormulaRating` / `safety_score` from `InciAnalysisResponse` (`INV-01`).
   - Add `SuitabilityVerdict`, `SuitabilityLabel`, `SuitabilityReason`, `HasIngredients`, and `FormulaBreakdown` to `ProductDetailDto` and verdict fields to `ProductSummaryDto`.
4. **Frontend Updates (`ProductCard.jsx`, `ProductDetail.jsx`, `IngredientAnalyzer.jsx`, `Compare.jsx`):**
   - Replace `%` badges with text verdict badges (`Good Match`, `Match with Notes`, `Allergy Alert`, `Accessory / Tool`).
   - Hide Ingredients tab and "Deep Formula Analysis" button for `Tools & Brushes`; hide "Deep Formula Analysis" button and show `"Insufficient INCI Data"` notice for cosmetics missing INCI.
   - Render 3-Tier Progressive Disclosure INCI breakdown on PDP and Ingredient Analyzer, with an interactive Skin ID Quick Setup Modal when `requires_skin_id` is true.

## Alternatives considered
| Option | Pros | Cons | Decision |
|---|---|---|---|
| A: Shared Domain `CosmeticKnowledgeBase` used by both PDP and Analyzer | Zero duplication, instant <2ms breakdown on PDP and Analyzer, consistent verdicts everywhere | Requires updating both `ProductDetailDto` and `InciAnalysisResponse` | Selected |
| B: Frontend-only INCI parsing | No backend DTO change | Duplicates domain logic in JS, violates Clean Architecture | Rejected |

## Affected components
- Frontend: `ProductCard.jsx`, `ProductDetail.jsx`, `IngredientAnalyzer.jsx`, `Compare.jsx`, `services/api.js`
- Backend: `CosmeticKnowledgeBase.cs`, `SuitabilityScoreCalculator.cs`, `ProductDtos.cs`, `ToolDtos.cs`, `ProductService.cs`, `ToolsService.cs`, `ProductRepository.cs`, `ToolsController.cs`
- Database: `products.ingredient_list_raw` cleanup
- Security/auth: `[Authorize]` on `ToolsController` (`analyze-inci`, `skintype-guide`)

## Data/API changes
- Updated `docs/api-contract.md` and `docs/api/BeautyAI.Api.json`.

## Migration / rollout
- Migration steps: Run SQL update on `products` to clear `"No ingredients listed"`, rebuild backend, run tests.
- Rollback steps: `git revert` commit.
- Feature flags: None.

## ADR required?
- [x] No (reinforces existing `ADR-001` / `INV-01` No Safety Score invariant)
- [ ] Yes — ADR link:
