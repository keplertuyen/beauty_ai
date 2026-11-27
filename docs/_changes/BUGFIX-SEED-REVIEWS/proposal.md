---
doc: change-proposal
change_id: BUGFIX-SEED-REVIEWS
title: Preserve & Sync Product Reviews in Database Seeder
status: approved
owner: tech-lead
created: 2026-11-26
---

# Proposal — BUGFIX-SEED-REVIEWS

## 1. Problem Statement
`scripts/seed_full_database.py` executes `TRUNCATE ... reviews ... RESTART IDENTITY CASCADE;` on every run, wiping all product reviews without re-importing them from `docs/_data/cleaned/reviews_cleaned.csv`. Meanwhile, `scripts/import_reviews.py` only targets local Docker Postgres (`docker compose exec postgres psql`), leaving Neon deployments with 0 reviews and stale `products.avg_rating` / `products.reviews_count`.

## 2. Scope
- Add Step 7 to `scripts/seed_full_database.py` to import up to `N` newest reviews per product (default `50`, configurable via `SEED_REVIEWS_PER_PRODUCT`) from `docs/_data/cleaned/reviews_cleaned.csv` via `run_psql_copy` (compatible with both Neon `DATABASE_URL` and local Docker Postgres).
- Recalculate `products.avg_rating` (rounded to 1 decimal, `NULL` when 0 reviews — matching `ProductRepository.GetProductReviewStatsAsync`) and `products.reviews_count` from `reviews` after seeding.
- Run the recalculation immediately on the active Neon database.

## 3. Risks & Trade-offs
- **Neon Free 0.5 GB storage cap**: Full 1.09M reviews (~382 MB text + indexes) would exceed 0.5 GB. Capping at 50 newest reviews/product keeps total rows ~95.8k (~52 MB delta, total DB ~99 MB).
- **Non-Skincare products**: `reviews_cleaned.csv` only contains Skincare reviews (2,351 products). Other categories will legitimately have `reviews_count = 0` and `avg_rating = NULL`.
