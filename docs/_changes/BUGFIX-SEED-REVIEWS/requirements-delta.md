---
doc: requirements-delta
change_id: BUGFIX-SEED-REVIEWS
status: approved
title: BUGFIX-SEED-REVIEWS — requirements-delta
precedence: 5
---

# Requirements Delta — BUGFIX-SEED-REVIEWS

## MODIFIED
- **Data Seeding (`scripts/seed_full_database.py`)**:
  - After seeding products, ingredients, conflict rules, and demo users, the seeder MUST re-import product reviews from `docs/_data/cleaned/reviews_cleaned.csv` when the file exists, capped by `SEED_REVIEWS_PER_PRODUCT` (default `50`, `0` = unlimited, `< 0` = skip).
  - After importing reviews, the seeder MUST synchronize `products.avg_rating` (`ROUND(AVG(rating), 1)` or `NULL` if 0 reviews) and `products.reviews_count` (`COUNT(reviews)`) so catalog cards and detail pages match actual review rows.
