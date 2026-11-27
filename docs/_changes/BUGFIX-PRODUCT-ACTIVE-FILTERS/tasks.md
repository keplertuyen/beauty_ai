---
doc: tasks
change_id: BUGFIX-PRODUCT-ACTIVE-FILTERS
status: done
---

# Tasks — BUGFIX-PRODUCT-ACTIVE-FILTERS

- [x] Create change folder and update `docs/api-contract.md`.
- [x] Add `ExpandActiveIngredientTerms` and `ExpandFreeFromTerms` to `CosmeticKnowledgeBase.cs`.
- [x] Wire `active_ingredients`, `free_from`, `highlights_filter` in `ProductDtos.cs`, `ProductsController.cs`, and `ProductRepository.cs`.
- [x] Sync `brand` and `sort` URL query params in `Products.jsx`.
- [x] Improve `Sensitive` skin-type tagging in `scripts/seed_full_database.py` and update Neon DB (`18 -> 898` Sensitive products).
- [x] Add unit tests, run `dotnet test`, build frontend, verify against Neon DB, and update `review.md`.
