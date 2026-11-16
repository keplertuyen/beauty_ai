---
doc: bugfix-spec
title: BUGFIX-PRODUCT-IMAGES — Product images wrong / unverified
status: draft
precedence: 3
owner: qa-dev-lead
last_reviewed: 2026-11-06
---

# Bugfix Spec

## Bug ID
BUGFIX-PRODUCT-IMAGES

## Severity & impact
| Severity | Affected users / systems | Frequency | Workaround |
|---|---|---|---|
| Sev-2 | Catalog, product detail, cart, checkout, analyzer UI; seed DB `products.image_url` | Every page showing product images | None — users see wrong product photos |

## Behavior analysis
| Aspect | Description | Evidence |
|---|---|---|
| Current (buggy) behavior | 397 local WebP images were fetched via hand-entered/guessed Sephora SKUs; some show a different product (e.g. `P97989778` Soft Pinch Liquid Blush → "Violet Faves" gift set; `P2855` NARS Blush → NARS concealer). 14 files have IDs not in the dataset. 8,111/8,494 products use 23 shared Unsplash photos that look like real products. | `scripts/crawl_product_images.py`, `src/frontend/public/images/products/`, `products_ready.csv` stats |
| Expected behavior | Every displayed product image is either (a) verified to belong to that product with a recorded source, or (b) a neutral, clearly-generic placeholder. | This spec, TC-BUG-001..004 |
| Unchanged behavior (must NOT regress) | `image_url` column/field name & API shape; frontend renders an image for every product (no broken `<img>`); seed scripts still run. | TC-REG-001..003 |

## Root cause
1. Dataset (Kaggle Sephora 2023) has **no SKU column**; `crawl_product_images.py` requires `--pid` + `--sku` supplied manually → SKUs were guessed. A wrong SKU still returns a valid Sephora image (HTTP 200).
2. No verification step (name/brand match) and no provenance log.
3. One SKU = one variant (mini/set/shade), so even correct-family SKUs can yield non-canonical images.
4. Original P-code approach (`docs/_data/photos/fetch_images.py`) failed (`no_image` ×5) and was replaced by guessing instead of being fixed.
5. `sync_image_data.py` fallback assigns realistic Unsplash photos by hash → misleading.

## Fix approach (Option D — hybrid, approved by owner 2026-11-06)
Tiered, verified pipeline, offline script only (no runtime dependency):

| Tier | Scope | Source | Acceptance rule |
|---|---|---|---|
| 1 | Top ~500 by `loves_count` | Sephora product page by P-code (`/product/{pid}`) via real browser (Playwright, headed allowed), `og:image` / JSON-LD | Page title/JSON-LD brand + name fuzzy-match dataset ≥ threshold; redirect to other product/404 → reject |
| 2 | Remaining | Open Beauty Facts search API (free, no key) | Brand exact (normalized) + name fuzzy ≥ threshold |
| 3 | Remaining (optional) | Image search API (Google CSE / Bing) — **only if owner provides key** | Same rule as tier 2 on result title/page |
| 4 | Still missing | Neutral category placeholder (generated SVG/WebP with category icon), no photo | Always |

- Each source is an adapter behind one `ImageSource` interface (timeout, retry, rate-limit, normalized result) — honors `.agents/rules/provider-abstraction.md` intent.
- Output manifest `docs/_data/images/manifest.csv`: `product_id, tier, source, source_url, matched_title, match_score, status, fetched_at`.
- Delete all 397 existing images in the same change; regenerate CSV + SQL from manifest only.
- Politeness: delay 2–5 s, low concurrency, resume support; **no** anti-bot circumvention (no CAPTCHA solving, proxy rotation, stealth plugins). If blocked → stop tier, log, continue with next tier.

**Blast radius:** image files, `products_*.csv` `image_url`, `scripts/update_images_db.sql`, `productImages.js` (remove guessed `TOP_PRODUCT_IMAGES` + Unsplash pools), placeholder asset. No API/DB schema change.
**Rollback:** `git revert` restores previous images/CSV.

## Regression guard
- Reproduction tests (fail before fix): TC-BUG-001..004.
- Regression: TC-REG-001..003.

## Open questions
- Q1: Tier 3 API key available? → **No** (owner 2026-11-06). Tier 3 deferred; Bing API retired 08/2025; Brave Search free key is a later option.
- Q2: Match threshold 0.85 → **approved**.
- Q3 (approved with strict cross-check, 2026-11-06): **ID-anchored rename cross-check.** Tier 1 reads the page's own state JSON and requires `productId == pid`. Even when `productId == pid`, if standard Dice < 0.85, the candidate must pass **all** cross-checks in `scripts/images/matcher.py`:
  1. **Brand match** (mandatory).
  2. **Bundle / Refill / Tool guard**: rejects any candidate introducing `set`, `kit`, `trio`, `mini`, `refill`, `refillable`, `brush`, `sponge`, `applicator`, `case`, `compact`, `bag`, etc. not in the dataset name (prevents "Soft Pinch Blush Brush" or "Powder Blush Refill" from matching a blush).
  3. **Primary product form check (`PRIMARY_FORMS`)**: rejects if the candidate introduces a different product form (`bronzer`, `concealer`, `foundation`, `cleanser`, `toner`, `mask`, `lipstick`, etc.) or drops the dataset's primary form.
  4. **Numeric / concentration check**: any numbers or percentages in the dataset name (e.g. `10%`, `1%`, `SPF 50`) must match exactly in the candidate name.
  5. **Token overlap**: either 100% of dataset tokens are present in the candidate name, OR (token recall ≥ 0.70 AND Dice ≥ 0.65).
  Search-based tiers (Tier 2 OBF) require both strict Dice ≥ 0.85 and no form/number conflict.

## Live smoke evidence (2026-11-06)
| pid | Source | Result | Visual |
|---|---|---|---|
| P97989778 | sephora_page | Soft Pinch Liquid Blush, s2911741 | ✅ correct (old image was a gift set) |
| P2855 | sephora_page | Talc-Free Powder Blush, s2756351 | ✅ correct (old image was a concealer) |
| P2855 | open_beauty_facts | NARS Blush | ✅ correct |
| P427417 | sephora_page | score 0.75 → accepted under Q3 | — |
| P427417, P97989778 | open_beauty_facts | not found | — (expected: low OBF coverage) |
Sephora served pages normally (HTTP 200, no challenge) in headed mode.

## Approval
| Role | Name | Decision | Date |
|---|---|---|---|
| Owner | | Option D approved | 2026-11-06 |
| Owner | | Spec approval | |
