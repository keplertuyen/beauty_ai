---
doc: change-proposal
change_id: BUGFIX-PRODUCT-ACTIVE-FILTERS
title: Wire Active Ingredients, Free-From, Clean Claims, URL Filters & Sensitive Skin Tagging
status: approved
owner: tech-lead
created: 2026-11-27
precedence: 5
---

# Proposal — BUGFIX-PRODUCT-ACTIVE-FILTERS

## 1. Problem Statement
1. `Products.jsx` sends `active_ingredients`, `free_from`, and `highlights_filter` to `GET /api/v1/products`, but the backend ignores all three query parameters and returns the unfiltered catalog (including non-cosmetic tools like *Facial Cleansing Tool*).
2. `Products.jsx` ignores `?brand=...` (linked from `ProductDetail.jsx`) and `?sort=trending` (linked from `Home.jsx`).
3. `seed_full_database.py` assigns `target_skin_types` with mutually exclusive `if/elif` branches, leaving only 18/8,494 products tagged `Sensitive`.

## 2. Scope (Gói 3 — Full)
- Add `active_ingredients`, `free_from`, and `highlights_filter` query params to `GET /api/v1/products`, `ProductFilterParams`, and `ProductRepository.GetProductsAsync`, backed by INCI synonym expansion in `CosmeticKnowledgeBase`.
- Multiple `active_ingredients` use AND semantics; both `active_ingredients` and `free_from` exclude products without INCI data.
- Read `brand` and `sort` URL query params in `Products.jsx` (mapping `trending` → `loves`), render brand filter chip, and pass `brand` to `getProducts`.
- Update `target_skin_types` tagging in `scripts/seed_full_database.py` and sync existing Neon DB so gentle / fragrance-free / soothing products include `Sensitive`.
- Update `docs/api-contract.md` and add unit tests.
