---
doc: bugfix-test-plan
title: BUGFIX-PRODUCT-IMAGES Test Plan
status: draft
precedence: 3
owner: qa
last_reviewed: 2026-11-06
---

# Bugfix Test Plan

## Reproduction tests (write first — must FAIL before the fix)
| Test ID | Steps | Expected (post-fix) | Currently |
|---|---|---|---|
| TC-BUG-001 | For every `image_url` starting `/images/products/`, look up manifest row | Row exists, `status=verified`, `match_score ≥ threshold`, `source_url` non-empty | failing (no manifest) |
| TC-BUG-002 | Every file in `public/images/products/` | `product_id` exists in dataset and in manifest | failing (14 orphans) |
| TC-BUG-003 | Scan CSV + `productImages.js` | No `images.unsplash.com` URLs and no hard-coded guessed Sephora SKU URLs | failing |
| TC-BUG-004 | Unit: matcher with fixtures (`Soft Pinch Liquid Blush` vs `Violet Faves Mini Cheek & Lip Trio`; `Blush` vs `Radiant Creamy Concealer`) | Rejected | failing (no matcher) |

## Unit tests (pipeline)
| Test ID | Behavior |
|---|---|
| TC-UNIT-001 | Matcher accepts correct brand + name variants (case, ™/®, size suffix) |
| TC-UNIT-002 | Brand mismatch always rejects regardless of name score |
| TC-UNIT-003 | Sephora adapter: redirect to different P-code / 404 → `not_found` (mocked HTML) |
| TC-UNIT-004 | OBF adapter parses response → normalized result (fixture JSON) |
| TC-UNIT-005 | Timeout/retry: transient error retried N times then `error`, pipeline continues |
| TC-UNIT-006 | Resume: products already in manifest are skipped |

## Regression tests (must STAY green)
| Test ID | Behavior protected | Linked to "unchanged behavior" row |
|---|---|---|
| TC-REG-001 | Every product in CSV has non-empty `image_url` (photo or placeholder) | renders image for every product |
| TC-REG-002 | `image_url` field/API shape unchanged; existing backend tests green | API shape |
| TC-REG-003 | Seed scripts + `update_images_db.sql` run against local Postgres | seed still runs |

## Manual check
- Spot-check 30 random verified images (visual) → 0 wrong-product allowed; record result in `review.md`.

## Exit criteria
- All TC-BUG and TC-UNIT pass; TC-REG green; spot-check 30/30.
