---
doc: change-design
change_id: BUGFIX-SEED-REVIEWS
status: approved
---

# Technical Design — BUGFIX-SEED-REVIEWS

## File Changes
- `scripts/seed_full_database.py`:
  - Import `heapq` and set `csv.field_size_limit(10**9)`.
  - Add `seed_reviews(root_dir: Path, prod_code_to_id: dict[str, int])`:
    - Reads `SEED_REVIEWS_PER_PRODUCT` (default `50`).
    - Streams `docs/_data/cleaned/reviews_cleaned.csv`, keeping the `CAP` newest reviews per `product_id` via min-heap `(submission_time, seq, row)`.
    - Normalizes `skin_type` against `{'Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'}` (fallback `'Unknown'`), clamps `rating` to `[1, 5]`, combines `review_title` + `review_text`.
    - Streams into `reviews(product_id, product_code, author_name, rating, skin_type, content, created_at)` using `run_psql_copy`.
    - Runs `ANALYZE reviews;`.
  - Add `sync_product_review_stats()`:
    - Runs a single `UPDATE products` joining aggregated `reviews` (`ROUND(AVG(LEAST(5, GREATEST(1, r.rating)))::numeric, 1)` and `COUNT(r.id)::int`) so `avg_rating` and `reviews_count` match `ProductRepository.GetProductReviewStatsAsync`.
  - Call `seed_reviews` + `sync_product_review_stats` as Step 7 at the end of `main()`.
