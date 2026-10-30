---
doc: change-proposal-analyzer-category
title: Category-Aware Ingredient Analyzer & 3-Tier INCI Display Redesign
status: approved
precedence: 3
owner: pm-ba
last_reviewed: 2026-10-28
---

# Change Proposal

## Change ID
CHANGE-ANALYZER-CATEGORY

## Summary
Redesign the Ingredient Analyzer (`IngredientAnalyzer.jsx`, `ToolsService.cs`) and Product INCI display (`ProductDetail.jsx`, `ProductCard.jsx`, `SuitabilityScoreCalculator.cs`) to eliminate numeric suitability/safety scores (`%` and `/5`), require authentication + Skin ID completion for personalized verdicts, introduce category-aware Target Care Areas across all 9 departments, implement a human-friendly 3-Tier Progressive Disclosure INCI layout, and enforce two-tier handling of products missing INCI data.

## Business reason
1. **Strict Compliance with `INV-01`:** Eliminate the remaining `/5` safety score ring and numeric `%` scores in favor of clear, non-alarmist text verdicts (`Good Match`, `Match with Notes`, `Not Suitable — Allergy Conflict`, `Insufficient INCI Data`, `Accessory / Tool`).
2. **Safety Loophole Closure:** 890 cosmetic products lacking manufacturer INCI strings previously passed the `"Safe for me"` filter because they were seeded with `"No ingredients listed"`. Group B cosmetics without INCI data must be excluded from `"Safe for me"`.
3. **Human-Centered Readability:** Replace overwhelming 30-row raw chemical tables with a 3-Tier layout (Verdict Banner → 3–6 Key Ingredients + Functional Role Groups → Collapsible Raw INCI List).
4. **Nuanced Fragrance & Category Context:** Distinguish gentle botanicals from sensory essential oils and EU 26 fragrance allergens, and tailor target care areas and cautions to the product's actual department (Skincare, Makeup, Hair, Fragrance, Bath & Body, Men, Tools & Brushes).

## Scope
### In scope
- Require authentication (`CUSTOMER`/`ADMIN`) on `/api/v1/tools/analyze-inci` and `/api/v1/tools/skintype-guide`, and prompt Skin ID setup popup when profile is incomplete.
- Replace numeric suitability `%` and `safety_score` with text-based verdicts across Backend DTOs, `ProductCard`, `ProductDetail`, and `IngredientAnalyzer`.
- Clean `"No ingredients listed"` in PostgreSQL `products.ingredient_list_raw` and `scripts/seed_full_database.py`, separating Group A (`Tools & Brushes`) from Group B (cosmetics missing INCI).
- Implement `CosmeticKnowledgeBase` (180+ ingredients, allergen synonym dictionary, 3-tier fragrance classification, category target area resolver).
- Implement 3-Tier Progressive Disclosure INCI UI on PDP and Ingredient Analyzer.

### Out of scope
- Marketing Claim Check verification (deferred to future phase).

## Affected users / systems
- Storefront customers browsing Catalog, PDP, and Ingredient Analyzer.
- Backend `.NET 10` (`BeautyAI.Domain`, `BeautyAI.Application`, `BeautyAI.Infrastructure`, `BeautyAI.Api`).
- React Frontend (`ProductCard.jsx`, `ProductDetail.jsx`, `IngredientAnalyzer.jsx`, `Compare.jsx`).

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| OpenAPI / Contract drift | Medium | Update `docs/api-contract.md` and regenerate `docs/api/BeautyAI.Api.json` in the same build. |
| False-positive fragrance warnings on botanicals | Medium | Separate Gentle Botanicals from Synthetic Parfum & EU 26 Fragrance Allergens in `CosmeticKnowledgeBase`. |

## Approval
| Role | Name | Status | Date |
|---|---|---|---|
| PM | Owner | Approved | 2026-10-28 |
| BA | AI BA | Approved | 2026-10-28 |
| TA/SA | AI SA | Approved | 2026-10-28 |
| QA Lead | AI QA | Approved | 2026-10-28 |
