---
doc: test-plan
change_id: BUGFIX-PRODUCT-ACTIVE-FILTERS
status: approved
title: BUGFIX-PRODUCT-ACTIVE-FILTERS — test-plan
precedence: 5
---

# Test Plan — BUGFIX-PRODUCT-ACTIVE-FILTERS

## Acceptance Criteria
1. Unit tests verify `CosmeticKnowledgeBase.ExpandActiveIngredientTerms` for all 9 UI active keys + fallback custom term.
2. Unit tests verify `CosmeticKnowledgeBase.ExpandFreeFromTerms` for all 4 free-from keys (and confirm fatty alcohols like `cetyl alcohol` are NOT in `alcohol_free` exclusions).
3. `dotnet test` (both `BeautyAI.UnitTests` and `BeautyAI.ArchitectureTests`) passes with 0 failures.
4. Frontend `npm run build` passes with 0 errors.
5. Neon DB verification confirms `Sensitive` product count increased from 18 to a realistic Skincare subset and `niacinamide` filter matches only products with Niacinamide/Nicotinamide in `ingredient_list_raw` (0 tools / 0 missing-INCI products).
