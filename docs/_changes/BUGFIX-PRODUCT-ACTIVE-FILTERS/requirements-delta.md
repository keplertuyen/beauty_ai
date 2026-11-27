---
doc: requirements-delta
change_id: BUGFIX-PRODUCT-ACTIVE-FILTERS
status: approved
---

# Requirements Delta — BUGFIX-PRODUCT-ACTIVE-FILTERS

## MODIFIED
- **FR-CAT-01 (`GET /api/v1/products`)**:
  - MUST accept optional comma-separated query params `active_ingredients`, `free_from`, and `highlights_filter`.
  - `active_ingredients`: AND across selected actives; each active matches any curated INCI synonym in `CosmeticKnowledgeBase`; excludes products without INCI data.
  - `free_from`: excludes products containing any forbidden INCI synonym for the selected claim (`fragrance_free`, `paraben_free`, `alcohol_free`, `sulfate_free`) and excludes products without INCI data.
  - `highlights_filter`: AND across selected claims matched case-insensitively in `products.description`.
- **Catalog URL Navigation (`Products.jsx`)**:
  - MUST read `brand` and `sort` query parameters from the URL and apply them on initial load and URL changes.
- **Seed Data (`scripts/seed_full_database.py`)**:
  - `Sensitive` skin type tagging MUST be evaluated independently of `Oily`/`Dry` branches so soothing/gentle products are discoverable under the Sensitive filter.
