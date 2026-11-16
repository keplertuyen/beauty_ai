---
doc: bugfix-tasks
title: BUGFIX-PRODUCT-IMAGES Tasks
status: draft
precedence: 5
owner: dev-lead
last_reviewed: 2026-11-06
---

# Bugfix Tasks

| Task ID | Description | Owner | Depends On | Requirement / AC | Status |
|---|---|---|---|---|---|
| T1 | Write failing tests TC-BUG-001..004 (`tests/test_product_images.py`) | QA | | TC-BUG-* | Done |
| T2 | `scripts/images/` package: `ImageSource` interface, matcher, manifest writer, rate-limit/retry | Dev | T1 | TC-UNIT-001,002,005,006 | Done |
| T3 | Adapter: Sephora P-code page (Playwright) `[P]` | Dev | T2 | TC-UNIT-003 | Done |
| T4 | Adapter: Open Beauty Facts `[P]` | Dev | T2 | TC-UNIT-004 | Done |
| T5 | Adapter: image search API (only if key provided) `[P]` | Dev | T2 | Q1 | Deferred |
| T6 | Neutral category placeholders in `public/images/placeholders/` `[P]` | Dev | | TC-REG-001 | Done |
| T7 | Delete 397 old images; remove guessed SKUs + Unsplash pools from `productImages.js` / `sync_image_data.py`; retire `crawl_product_images.py` | Dev | T2 | TC-BUG-002,003 | Done |
| T8 | Run pipeline in batches of 500 (`scripts/harvest_images.py --batch N --size 500`) → manifest; regenerate CSV + SQL from manifest | Dev | T3,T4,T6,T7 | TC-BUG-001 | In Progress |
| T9 | Regression + manual spot-check 30 images; quality gate | QA/TA | T8 | TC-REG-* | Draft |

## Worklog
| Date | Actor | Change | Evidence |
|---|---|---|---|
| 2026-11-06 | Agent | Spec drafted; Option D approved by owner | chat |
| 2026-11-06 | Owner | Spec approved; threshold 0.85; tier 3 skipped (no API key) — T5 deferred | chat |
| 2026-11-06 | Agent | T1 done: `tests/test_product_images.py` — 6 FAIL as expected (TC-BUG-001..004, TC-UNIT-001/002), TC-REG-001 PASS | `python3 -m unittest tests/test_product_images.py` |
| 2026-11-06 | Agent | T2 done: `scripts/images/{base,matcher,manifest,pipeline}.py`; TC-BUG-004, TC-UNIT-001/002/005/006 + blocked/rejected cases PASS (12 tests, 3 data tests still FAIL pending T7/T8) | same command |
| 2026-11-06 | Agent | T3+T4 done: `source_sephora.py` (linkStore JSON, productId check, logo filter), `source_obf.py`, `download.py`, `requirements.txt`, venv `scripts/images/.venv`. 22 tests, 19 PASS, 3 data tests pending T7/T8. Live smoke OK (see bugfix.md). | same command + scratch smoke |
| 2026-11-06 | Agent | Added strict rename cross-checks in `matcher.py` (bundle/refill/tool guard, primary product form conflict check, numeric/concentration check, recall >= 0.70 + Dice >= 0.65). Completed T6 (`placeholders.py` + 10 neutral SVGs) & T7 (purged 397 unverified WebPs, cleaned `productImages.js` & `sync_image_data.py`, added `harvest_images.py`). All 22 tests PASS. | `python3 -m unittest tests/test_product_images.py` |
| 2026-11-06 | Agent | T8 Batch 1 (500 top products by `loves_count`, `--skip-obf`): 256 verified, 244 not_found (82 rejected by strict cross-checks, 162 discontinued on Sephora), 0 errors. Synced CSVs, `productImages.js`, and `update_images_db.sql`. Visual spot-check 100% accurate. All 22 tests PASS. | `scripts/harvest_images.py --batch 1 --size 500 --skip-obf` |
