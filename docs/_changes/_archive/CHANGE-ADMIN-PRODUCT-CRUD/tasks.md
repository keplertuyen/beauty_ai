---
doc: change-tasks
title: CHANGE-ADMIN-PRODUCT-CRUD — Tasks
status: done
precedence: 5
owner: pm-dev-lead
last_reviewed: 2026-11-20
---

# Change Tasks — CHANGE-ADMIN-PRODUCT-CRUD

| Task ID | Description | Owner | Depends On | Requirement / AC | Status |
|---|---|---|---|---|---|
| T1 | QA test design (`test-plan.md` + xUnit acceptance tests for Admin CRUD, Authz, Bootstrap) | QA | — | FR-ADM-02, FR-ADM-17, NFR-SEC-02 | Done |
| T2 | Backend domain, DTOs, `AdminProductService`, `AdminBootstrapper`, `ProductRepository`, `AdminController`, SQL migration | Dev | T1 | AC-ADM-02-05..12, AC-SEC-ADM-01..03, AC-ADM-17-01..05 | Done |
| T3 | Frontend Admin Product CRUD UI (`AdminProductSection`, `ProductFormModal`, `AdminDashboard`, `api.js`) `[P]` | Dev | T2 | AC-ADM-02-05..11 | Done |
| T4 | Update docs/contracts/traceability & run quality/test gates | QA/TA | T2, T3 | FR-ADM-02, FR-ADM-17 | Done |

## Worklog
| Date | Actor | Change | Evidence |
|---|---|---|---|
| 2026-11-20 | BA/TA/QA | Created proposal, requirements-delta, ADR-014, design, test-plan, and tasks | `docs/_changes/CHANGE-ADMIN-PRODUCT-CRUD/` |
| 2026-11-20 | QA/Dev/Reviewer | Implemented Admin Product CRUD, soft delete (`SellingStatus`), INCI sync, `[Authorize(Roles = "Admin")]`, `AdminBootstrapper`, React CRUD table + modal, and passed all 58 xUnit tests + frontend build | `tests/BeautyAI.UnitTests/AdminProductServiceTests.cs`, `AdminBootstrapperTests.cs`, `AdminAuthorizationTests.cs` |
