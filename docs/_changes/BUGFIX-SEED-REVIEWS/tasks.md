---
doc: tasks
change_id: BUGFIX-SEED-REVIEWS
status: done
---

# Tasks — BUGFIX-SEED-REVIEWS

- [x] Import up to 50 newest reviews/product from `reviews_cleaned.csv` into Neon DB (95,851 rows / 2,351 products).
- [x] Recalculate `products.avg_rating` and `products.reviews_count` on Neon DB from `reviews` (0 mismatches across 8,494 products).
- [x] Add `seed_reviews()` and `sync_product_review_stats()` to `scripts/seed_full_database.py`.
- [x] Verify script syntax, unit behavior, and zero DB mismatches; update `review.md`.
