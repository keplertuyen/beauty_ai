---
doc: adr-014
title: "ADR-014: Product Soft Delete via SellingStatus and Env-Driven Admin Bootstrap"
status: accepted
precedence: 2
owner: ta-sa
last_reviewed: 2026-11-20
---

# ADR-014: Product Soft Delete via SellingStatus and Env-Driven Admin Bootstrap

## 1. Context
1. **Product Deletion & Lifecycle (`FR-ADM-02`)**: Hard-deleting a row from `products` triggers `ON DELETE CASCADE` on `reviews` and `product_ingredients`, and compromises historical order references (`order_items`). E-commerce catalog administration requires safe discontinuing ("logical delete") with the ability to restore a product without losing reviews, ratings, or order history.
2. **Admin Authorization & Bootstrap (`NFR-SEC-02`, `FR-ADM-17`)**: `AdminController` lacked `[Authorize(Roles = "Admin")]`. Furthermore, `seed_data.sql` contained a legacy bcrypt hash incompatible with `Pbkdf2PasswordHasher` (ADR-004), leaving no valid Admin account out of the box without hardcoding plaintext credentials in source control.

## 2. Decision
1. **Product `SellingStatus` & `UpdatedAtUtc`**:
   - Add `selling_status VARCHAR(20) NOT NULL DEFAULT 'Active'` (`Active` | `Draft` | `Discontinued`) and `updated_at TIMESTAMPTZ NULL` to `products`.
   - `DELETE /api/v1/admin/products/{id}` performs a logical delete by setting `SellingStatus = "Discontinued"` and `UpdatedAtUtc = DateTime.UtcNow`.
   - `PATCH /api/v1/admin/products/{id}/restore` restores a discontinued product to `SellingStatus = "Active"`.
   - Customer-facing catalog queries (`GetProductsAsync`, `GetProductByIdAsync`, `GetProductByCodeOrSlugAsync`, `GetSimilarProductsAsync`) and order placement (`OrderService.CreateOrderAsync`) only expose or accept products where `SellingStatus == "Active"`.
   - Admin queries (`GetAdminProductsAsync`, `GetAdminProductByIdAsync`) return products across all statuses with optional status filtering.
2. **INCI Synchronization on Create/Update**:
   - Creating or updating a product's `IngredientListRaw` re-tokenizes the INCI string via `CosmeticKnowledgeBase.SplitInciList` and rebuilds `product_ingredients` links against known `ingredients` entries in positional order.
3. **Role Authorization & Environment Admin Bootstrap**:
   - Decorate `AdminController` with `[Authorize(Roles = "Admin")]`.
   - Provide `IAdminBootstrapper` / `AdminBootstrapper` invoked at startup (and idempotent schema migration guard) that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` (optional `ADMIN_FULL_NAME`). If configured and valid (password >= 8 chars), it creates the Admin user with PBKDF2 hash or promotes/activates the existing account without overwriting an existing password unless `ADMIN_FORCE_PASSWORD_RESET=true` is explicitly set.

## 3. Rationale
- Preserves referential integrity for `reviews` and `order_items` (ADR-010).
- Aligns `products` table in Phase 1 with the target schema (`docs/db-schema/schema.sql` already envisioned `selling_status`).
- Obeys `.agents/rules/safety.md`: no hardcoded plaintext passwords in code or committed config; secrets come from environment variables.

## 4. Consequences
- Positive: Zero data loss on delete; instant restore; Admin endpoints protected by JWT role claims; INCI analysis stays accurate after product edits.
- Negative: Customer queries must filter by `SellingStatus == "Active"`.
- Remediation / exit path: An idempotent SQL migration (`docs/db-schema/migrations/2026-11-20_product_selling_status.sql`) and startup column ensure step keep existing local PostgreSQL volumes working seamlessly.
