---
doc: change-design
title: CHANGE-ADMIN-PRODUCT-CRUD — Technical Design
status: approved
precedence: 2
owner: ta-sa
last_reviewed: 2026-11-20
---

# Change Design — CHANGE-ADMIN-PRODUCT-CRUD

## Technical approach
1. **Domain & Schema (`Product`)**:
   - Add `SellingStatus` (`string`, default `"Active"`, allowed: `"Active"`, `"Draft"`, `"Discontinued"`) and `UpdatedAtUtc` (`DateTime?`, already on `BaseEntity<int>`, un-ignore in `BeautyAIDbContext` and map to `updated_at`) to `Product`.
   - Add idempotent migration `docs/db-schema/migrations/2026-11-20_product_selling_status.sql` and update `docs/db-schema/schema_phase_1.sql`.
2. **Application Layer (`IAdminProductService` / `AdminProductService`)**:
   - Extract product admin business logic out of `AdminController` into `AdminProductService`:
     - `GetProductsAsync(AdminProductFilterParams filter, CancellationToken ct)` -> `PagedResult<AdminProductDto>`
     - `GetProductByIdAsync(int id, CancellationToken ct)` -> `AdminProductDto?`
     - `CreateProductAsync(CreateProductAdminRequest request, CancellationToken ct)` -> `AdminProductDto`
     - `UpdateProductAsync(int id, UpdateProductAdminRequest request, CancellationToken ct)` -> `AdminProductDto`
     - `DiscontinueProductAsync(int id, CancellationToken ct)` -> `bool`
     - `RestoreProductAsync(int id, CancellationToken ct)` -> `AdminProductDto`
   - Validation rules:
     - `Name`: required, 1..255 chars.
     - `PriceUsd`: > 0 and <= 10000.
     - `StockQuantity`: >= 0.
     - `VolumeMl`: null or > 0.
     - `IngredientListRaw`: required, non-empty.
     - `BrandId` or `BrandName`: must match an existing brand (no silent fallback to first brand; throws `ArgumentException` -> 400).
     - `CategoryId` or `CategoryName`: must match an existing category (no silent fallback; throws `ArgumentException` -> 400).
     - `TargetSkinTypes`: each entry must be in `{ "All", "Oily", "Dry", "Combination", "Sensitive", "Normal" }`.
     - `SellingStatus`: `"Active"`, `"Draft"`, or `"Discontinued"` (defaults to `"Active"`).
     - Unique slug generation: if slug collides with another product, append `-2`, `-3`, or code suffix.
   - INCI sync: when `IngredientListRaw` is set/changed, repository syncs `product_ingredients` against known `ingredients` by case-insensitive `InciName`.
3. **Customer Catalog & Order Protection**:
   - `ProductRepository.GetProductsAsync`, `GetProductByIdAsync`, `GetProductByCodeOrSlugAsync`, `GetSimilarProductsAsync` filter `p.SellingStatus == "Active"`.
   - `OrderService.CreateOrderAsync` rejects any product with `SellingStatus != "Active"` with `InvalidOperationException`.
4. **Security & Admin Bootstrap**:
   - `[Authorize(Roles = "Admin")]` on `AdminController`.
   - `AdminBootstrapper` checks `ADMIN_EMAIL` and `ADMIN_PASSWORD` on startup (and ensures `selling_status` / `updated_at` columns exist in PostgreSQL), creating or activating the Admin user via `IUserRepository` and `IPasswordHasher`.
5. **Frontend (`AdminDashboard.jsx` + modular admin components)**:
   - Extract `src/frontend/src/components/admin/AdminProductSection.jsx` and `ProductFormModal.jsx`.
   - Full product table with search, brand filter, category filter, status filter (`All` / `Active` / `Draft` / `Discontinued`), pagination, Edit button, Discontinue/Delete confirmation, and Restore button.
   - Unified Create/Edit modal loading real brands and categories from `/api/v1/products/brands` and `/api/v1/products/categories`.
   - Clear 401/403 state in `AdminDashboard` prompting Admin login when unauthenticated or logged in as Customer.

## Alternatives considered
| Option | Pros | Cons | Decision |
|---|---|---|---|
| A: Hard delete product row | No schema change | Cascades delete on reviews, breaks order history, cannot undo | Rejected |
| B: Soft delete via `selling_status` (`Active`/`Draft`/`Discontinued`) + Restore | Preserves reviews & orders, supports Draft & Restore, aligns with target schema | Requires column addition & filtering in public queries | **Selected** |

## Affected components
- Frontend: `src/frontend/src/services/api.js`, `src/frontend/src/pages/AdminDashboard.jsx`, `src/frontend/src/components/admin/AdminProductSection.jsx`, `src/frontend/src/components/admin/ProductFormModal.jsx`
- Backend: `src/BeautyAI.Domain/Entities/Product.cs`, `src/BeautyAI.Application/DTOs/AdminDtos.cs`, `src/BeautyAI.Application/Interfaces/Repositories/IProductRepository.cs`, `src/BeautyAI.Application/Interfaces/Services/IAdminProductService.cs`, `src/BeautyAI.Application/Services/AdminProductService.cs`, `src/BeautyAI.Application/Services/AdminBootstrapper.cs`, `src/BeautyAI.Application/Services/OrderService.cs`, `src/BeautyAI.Infrastructure/Persistence/BeautyAIDbContext.cs`, `src/BeautyAI.Infrastructure/Persistence/Repositories/ProductRepository.cs`, `src/BeautyAI.Api/Controllers/AdminController.cs`, `src/BeautyAI.Api/Program.cs`
- Database: `docs/db-schema/schema_phase_1.sql`, `docs/db-schema/migrations/2026-11-20_product_selling_status.sql`
- Security/auth: `[Authorize(Roles = "Admin")]` on `AdminController`, env-based `AdminBootstrapper`

## Data/API changes
- `GET /api/v1/admin/products?query=&brand=&category=&status=&page=1&per_page=10`
- `GET /api/v1/admin/products/{id}`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/{id}`
- `DELETE /api/v1/admin/products/{id}`
- `PATCH /api/v1/admin/products/{id}/restore`
- Documented in `docs/api-contract.md`, `docs/data-contracts.md`, and `docs/adr/ADR-014-product-soft-delete-and-admin-bootstrap.md`.

## Migration / rollout
- Migration steps: Apply `ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_status VARCHAR(20) NOT NULL DEFAULT 'Active'; ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL;` (also executed idempotently at API startup when using relational DB).
- Rollback steps: Revert commit; column defaults do not break older code.
- Feature flags: None.

## ADR required?
- [ ] No
- [x] Yes — ADR link: `docs/adr/ADR-014-product-soft-delete-and-admin-bootstrap.md`
