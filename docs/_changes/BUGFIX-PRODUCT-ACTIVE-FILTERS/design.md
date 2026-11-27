---
doc: change-design
change_id: BUGFIX-PRODUCT-ACTIVE-FILTERS
status: approved
title: BUGFIX-PRODUCT-ACTIVE-FILTERS — design
precedence: 5
---

# Technical Design — BUGFIX-PRODUCT-ACTIVE-FILTERS

## Backend
- `src/BeautyAI.Domain/Services/CosmeticKnowledgeBase.cs`:
  - Add `ExpandActiveIngredientTerms(string activeKey)` mapping UI keys (`niacinamide`, `bha`, `aha`, `retinol`, `hyaluronic acid`, `vitamin c`, `centella`, `ceramide`, `peptide`, or arbitrary INCI string) to lowercase INCI search terms.
  - Add `ExpandFreeFromTerms(string freeFromKey)` mapping `fragrance_free`, `paraben_free`, `alcohol_free`, `sulfate_free` to lowercase exclusion terms (reusing `AllergenSynonyms`, preserving fatty alcohols).
- `src/BeautyAI.Application/DTOs/ProductDtos.cs`:
  - Extend `ProductFilterParams` with optional `ActiveIngredients`, `FreeFrom`, `HighlightsFilter` (default `null`).
- `src/BeautyAI.Api/Controllers/ProductsController.cs`:
  - Bind `[FromQuery(Name = "active_ingredients")]`, `[FromQuery(Name = "free_from")]`, `[FromQuery(Name = "highlights_filter")]`.
- `src/BeautyAI.Infrastructure/Persistence/Repositories/ProductRepository.cs`:
  - Apply `ActiveIngredients` (AND across keys, OR across synonyms via `Expression.OrElse` on `IngredientListRaw.ToLower().Contains(term)`), `FreeFrom` (NOT contains for all expanded terms), and `HighlightsFilter` (AND on `Description.ToLower().Contains(hl)`).

## Frontend
- `src/frontend/src/pages/Products.jsx`:
  - Add `selectedBrand` state synced with `searchParams.get('brand')`, pass `params.brand`, include in `activeFilterCount`, `resetFilters`, and active filter chips.
  - Sync `sortBy` with `searchParams.get('sort')` (mapping `trending` → `loves`).

## Data / Seeder
- `scripts/seed_full_database.py` + Neon DB update:
  - Evaluate `Sensitive` independently: add `Sensitive` when a Skincare product mentions soothing/sensitive/centella/panthenol/ceramide/allantoin/oat/calming/gentle OR has INCI without synthetic fragrance (`parfum`/`fragrance`) and drying alcohol (`alcohol denat`).
