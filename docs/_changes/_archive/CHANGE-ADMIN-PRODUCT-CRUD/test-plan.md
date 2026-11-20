---
doc: change-test-plan
title: CHANGE-ADMIN-PRODUCT-CRUD — Test Plan
status: approved
precedence: 2
owner: qa-lead
last_reviewed: 2026-11-20
---

# Change Test Plan — CHANGE-ADMIN-PRODUCT-CRUD

## Requirement coverage
| Requirement / Delta | AC | Test Case | Layer | Automation | Owner | Status |
|---|---|---|---|---|---|---|
| FR-ADM-02 | AC-ADM-02-05 | `TC-ADM-CRUD-01`: Admin list returns all statuses (Active, Draft, Discontinued) and filters by query, brand, category, status with pagination | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-06 | `TC-ADM-CRUD-02`: Create product with valid payload creates unique code & slug, sets status Active, syncs ingredients | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-07 | `TC-ADM-CRUD-03`: Create/Update rejects empty name, price <= 0, stock < 0, empty INCI, invalid skin type, or unknown brand/category (no silent fallback) | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-08 | `TC-ADM-CRUD-04`: Update product modifies fields, sets `UpdatedAtUtc`, preserves historical `OrderItem.UnitPriceUsd` | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-09 | `TC-ADM-CRUD-05`: Updating `IngredientListRaw` triggers `SyncProductIngredientsAsync` with new tokens; unchanged INCI skips rebuild | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-10 | `TC-ADM-CRUD-06`: Discontinue (DELETE) sets `SellingStatus = Discontinued`; customer catalog/detail/order excludes discontinued product while reviews remain intact | Unit | Automated (`AdminProductServiceTests`, `OrderServiceDiscontinuedTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-11 | `TC-ADM-CRUD-07`: Restore sets `SellingStatus = Active` preserving product ID | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| FR-ADM-02 | AC-ADM-02-12 | `TC-ADM-CRUD-08`: Get/Update/Delete/Restore non-existent product ID returns null/false (404 at controller) | Unit | Automated (`AdminProductServiceTests`) | QA | Designed |
| NFR-SEC-02 | AC-SEC-ADM-01..03 | `TC-ADM-SEC-01`: `AdminController` has `[Authorize(Roles = "Admin")]` attribute enforced | Unit/Arch | Automated (`AdminAuthorizationTests`) | QA | Designed |
| FR-ADM-17 | AC-ADM-17-01..05 | `TC-ADM-BOOT-01`: `AdminBootstrapper` creates admin when env vars set, promotes existing user without overwriting password, skips when env missing or password < 8 chars | Unit | Automated (`AdminBootstrapperTests`) | QA | Designed |

## Regression scope
- Existing `ProductServiceTests`, `AuthServiceTests`, `SkinProfileServiceTests`, `SuitabilityScoreCalculatorTests`, `BeautyAI.ArchitectureTests`.
- Frontend production build (`npm run build` in `src/frontend`).

## Test data
- Fixture: In-memory `FakeProductRepository`, `FakeUserRepository`, `FakeOrderRepository` following existing `ProductServiceTests` conventions.
- Mock: `Pbkdf2PasswordHasher` for bootstrap tests.
- External dependency handling: No external network or DB required for unit/architecture tests.

## Exit criteria
- [x] Must AC covered.
- [x] Relevant tests automated before Dev implementation.
- [x] Regression tests pass.
- [x] Traceability updated.
- [x] QA sign-off recorded.
