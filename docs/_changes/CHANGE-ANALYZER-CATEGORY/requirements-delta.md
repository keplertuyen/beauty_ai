---
doc: requirements-delta-analyzer-category
title: Requirements Delta — CHANGE-ANALYZER-CATEGORY
status: approved
precedence: 3
owner: ba
last_reviewed: 2026-10-28
---

# Requirements Delta

## ADDED Requirements
### FR-ING-05 — Category-Aware 3-Tier Progressive Disclosure INCI & Nuanced Fragrance Classification
- Priority: Must
- Description: Both Product Detail (`PDP`) and `Ingredient Analyzer` must present INCI formulas in a 3-Tier Progressive Disclosure structure (Tier 1: Personal Verdict & Allergy Check; Tier 2: 3–6 Key Ingredients with common names + Functional Role Grouping + Category-tailored Benefits/Cautions; Tier 3: Collapsible full packaging INCI list) and classify scent components into Gentle Botanicals, Sensory Essential Oils, and Synthetic Parfum / EU 26 Allergens.
- Acceptance Criteria:
  - AC-ING-05-01: GIVEN a product with INCI data WHEN rendered on PDP or Ingredient Analyzer THEN Tier 1 shows the text verdict, Tier 2 highlights 3–6 Key Ingredients and groups remaining base/pigment/preservative ingredients by functional role, and Tier 3 collapses the full raw INCI list by default.
  - AC-ING-05-02: GIVEN a product containing gentle botanical waters/extracts (e.g., `Rosa Damascena Flower Water`, `Vanilla Planifolia`) WHEN analyzed for a user not allergic to them THEN the system classifies them as soothing/botanical and does NOT flag them as sensitizing fragrance.

### FR-ING-06 — Two-Tier Missing INCI Handling (Tools vs Unverified Cosmetics)
- Priority: Must
- Description: Products without INCI strings must be split into Group A (`Tools & Brushes` physical accessories) and Group B (cosmetic products missing manufacturer INCI).
- Acceptance Criteria:
  - AC-ING-06-01: GIVEN a Group A product (`Department == "Tools & Brushes"`) WHEN viewed on PDP THEN the INCI Ingredients tab and "Deep Formula Analysis" button are hidden; WHEN `"Safe for me"` filter is enabled in Catalog THEN Group A remains visible as a non-chemical accessory.
  - AC-ING-06-02: GIVEN a Group B product (cosmetic department with empty `IngredientListRaw`) WHEN viewed on PDP THEN the "Deep Formula Analysis" button is hidden and the Ingredients tab displays an `"Insufficient INCI Data"` notice; WHEN `"Safe for me"` filter is enabled in Catalog THEN Group B is excluded so unverified cosmetics never bypass allergy filtering.

## MODIFIED Requirements
### FR-ING-01 — INCI Formula Analysis & Skin Type Guide Authentication Gate
- Current behavior: `POST /api/v1/tools/analyze-inci` and `GET /api/v1/tools/skintype-guide` allow anonymous access (`ALL`) and return numeric `safety_score` (`/5`) and a 30-card `identified_ingredients` list.
- New behavior: Both endpoints require authentication (`CUSTOMER`/`ADMIN`). If the authenticated user has not yet configured their Digital Skin ID, the analyzer prompts them via a Quick Skin ID Setup Modal. Numeric `safety_score` and numeric `%` suitability scores are replaced everywhere with text-based verdicts (`GoodMatch`, `MatchWithNotes`, `AllergyConflict`, `InsufficientData`, `AccessoryTool`, `RequiresSkinId`).
- Acceptance Criteria changes:
  - AC-ING-01-01: GIVEN an unauthenticated user WHEN clicking "Deep Formula Analysis" or visiting `/ingredient-analyzer` THEN the user is prompted to sign in before accessing analysis or the Skin Type Guide.
  - AC-ING-01-02: GIVEN an authenticated user WHEN analyzing a formula THEN the response contains zero `safety_score` fields (`INV-01`) and returns a text verdict cross-checked against their personal Skin ID and expanded Allergy Synonym Blacklist.

## REMOVED Requirements
None.

## DEPRECATED Requirements
None.

## Non-functional impact
| NFR | Impact | Test / Evidence |
|---|---|---|
| Security | Endpoints `/api/v1/tools/analyze-inci` and `/api/v1/tools/skintype-guide` require JWT `[Authorize]` | Unit & Architecture tests |
| Performance | In-memory `CosmeticKnowledgeBase` dictionary lookup (<2ms per product/formula) | `dotnet test` |
| Observability | Standard structured logging | API logs |
| Privacy | User Skin ID read strictly from authenticated JWT claim (`NameIdentifier`) | `ToolsController` |
