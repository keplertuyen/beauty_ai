---
doc: test-plan
change_id: BUGFIX-SEED-REVIEWS
status: approved
---

# Test Plan — BUGFIX-SEED-REVIEWS

## Acceptance Criteria
1. `scripts/seed_full_database.py` passes Python syntax compilation (`py_compile`) and imports cleanly.
2. On the live Neon database:
   - `reviews` has 95,851 rows across 2,351 products.
   - `products.reviews_count` equals `COUNT(reviews)` for every product (0 mismatches across all 8,494 products).
   - `products.avg_rating` equals `ROUND(AVG(rating), 1)` for reviewed products and `NULL` for unreviewed products (0 mismatches).
   - Database size remains well under Neon Free 0.5 GB cap.
3. Review selection helper correctly enforces the per-product cap and normalizes `skin_type` and `rating`.
