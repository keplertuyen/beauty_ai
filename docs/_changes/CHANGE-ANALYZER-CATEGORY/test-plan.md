---
doc: change-test-plan-analyzer-category
title: Change Test Plan — CHANGE-ANALYZER-CATEGORY
status: approved
precedence: 2
owner: qa-lead
last_reviewed: 2026-10-28
---

# Change Test Plan

## Requirement coverage
| Requirement / Delta | AC | Test Case | Layer | Automation | Owner | Status |
|---|---|---|---|---|---|---|
| FR-ING-01 | AC-ING-01-01, AC-ING-01-02 | `NoSafetyScoreAnywhereTests`, `SuitabilityScoreCalculatorTests` | Architecture & Unit | Automated | QA | Approved |
| FR-ING-05 | AC-ING-05-01, AC-ING-05-02 | `CosmeticKnowledgeBaseTests` (3-tier breakdown & botanical vs allergen fragrance) | Unit | Automated | QA | Approved |
| FR-ING-06 | AC-ING-06-01, AC-ING-06-02 | `ProductServiceTests` (Group A tools vs Group B missing INCI exclusion on `SafeForMe`) | Unit | Automated | QA | Approved |

## Regression scope
- `tests/BeautyAI.ArchitectureTests/NoSafetyScoreAnywhereTests.cs` (enhanced to also inspect `[JsonPropertyName]` attributes for `safety_score`).
- `tests/BeautyAI.UnitTests/SuitabilityScoreCalculatorTests.cs`
- `tests/BeautyAI.UnitTests/ProductServiceTests.cs`
- Frontend production build (`npm --prefix src/frontend run build`).

## Test data
- Fixture: In-memory `Product`, `SkinProfile`, and `UserAllergy` fixtures covering Skincare, Makeup, Fragrance, Tools & Brushes, and missing INCI products.
- Mock: `FakeProductRepository`, `FakeSkinProfileRepository`.
- External dependency handling: None required for unit tests.

## Exit criteria
- [x] Must AC covered.
- [x] Relevant tests automated or exception approved.
- [x] Regression tests pass.
- [ ] Traceability updated.
- [ ] QA sign-off recorded.
