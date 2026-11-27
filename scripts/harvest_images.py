#!/usr/bin/env python3
"""Batch & Demo-Pack CLI for the verified product-image pipeline (BUGFIX-PRODUCT-IMAGES).

Usage:
  scripts/images/.venv/bin/python scripts/harvest_images.py --batch 1 --size 500 --skip-obf
  scripts/images/.venv/bin/python scripts/harvest_images.py --demo-pack --size 420 --skip-obf
"""
from __future__ import annotations

import argparse
import collections
import csv
import logging
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from images import manifest as mf
from images.base import ProductRef, RateLimiter
from images.download import make_downloader
from images.matcher import score
from images.pipeline import run
from images.source_obf import OpenBeautyFactsSource
from images.source_sephora import SephoraPageSource
import sync_image_data

csv.field_size_limit(sys.maxsize)

PRODUCTS_CSV = REPO / "docs" / "_data" / "processed" / "products_ready.csv"
MANIFEST_PATH = REPO / "docs" / "_data" / "images" / "manifest.csv"
IMAGES_DIR = REPO / "src" / "frontend" / "public" / "images" / "products"


def load_all_rows(csv_path: Path) -> list[dict]:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        return [r for r in csv.DictReader(f) if (r.get("product_id") or "").strip()]


def to_ref(r: dict) -> ProductRef:
    return ProductRef(
        product_id=(r.get("product_id") or "").strip(),
        brand=(r.get("brand_name") or "").strip(),
        name=(r.get("product_name") or "").strip(),
        category=(r.get("primary_category") or "").strip(),
    )


def _loves(r: dict) -> float:
    try:
        return float(r.get("loves_count") or 0)
    except ValueError:
        return 0.0


def load_sorted_products(csv_path: Path) -> list[ProductRef]:
    rows = load_all_rows(csv_path)
    rows.sort(key=lambda r: (-_loves(r), (r.get("product_id") or "").strip()))
    return [to_ref(r) for r in rows]


def build_demo_pack(csv_path: Path, manifest_path: Path, target_candidates: int) -> list[ProductRef]:
    """Selects a category-balanced queue of un-attempted (or newly recoverable)
    products so that Catalog, Categories, Search, Routine Generator, and AI
    Chatbox all have rich verified product imagery."""
    all_rows = load_all_rows(csv_path)
    all_rows.sort(key=lambda r: (-_loves(r), (r.get("product_id") or "").strip()))
    by_id = {(r["product_id"]).strip(): r for r in all_rows}

    # 1. Identify previously rejected items that now pass our refined matcher
    recoverable_ids: set[str] = set()
    if manifest_path.exists():
        with manifest_path.open("r", encoding="utf-8", newline="") as f:
            raw_manifest = list(csv.DictReader(f))
        for m in raw_manifest:
            pid = m.get("product_id", "")
            if m.get("status") == mf.REJECTED and pid in by_id:
                p = by_id[pid]
                s = score(p["brand_name"], p["product_name"], m.get("matched_brand", ""), m.get("matched_name", ""), id_anchored=True)
                if s >= 0.85:
                    recoverable_ids.add(pid)
        if recoverable_ids:
            # Remove old rejected/not_found entries for recoverable_ids so pipeline re-processes them
            cleaned = [
                m for m in raw_manifest
                if not (m.get("product_id") in recoverable_ids and m.get("status") in (mf.REJECTED, mf.NOT_FOUND))
            ]
            with manifest_path.open("w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=mf.FIELDS, extrasaction="ignore")
                w.writeheader()
                w.writerows(cleaned)

    done = {
        pid for pid, r in mf.load(manifest_path).items()
        if r.get("status") in (mf.VERIFIED, mf.NOT_FOUND)
    }

    selected: list[ProductRef] = []
    seen: set[str] = set(done)

    def add(r: dict) -> bool:
        pid = (r.get("product_id") or "").strip()
        if not pid or pid in seen:
            return False
        seen.add(pid)
        selected.append(to_ref(r))
        return True

    # Priority A: Recoverable bestsellers from Batch 1
    for pid in sorted(recoverable_ids, key=lambda x: -_loves(by_id[x])):
        add(by_id[pid])

    # Priority B: Top products per Skincare subcategory (needed for Routine Generator & Analyzer & Chatbox)
    by_subcat: dict[str, list[dict]] = collections.defaultdict(list)
    by_prim: dict[str, list[dict]] = collections.defaultdict(list)
    for r in all_rows:
        prim = (r.get("primary_category") or "").strip()
        sec = (r.get("secondary_category") or "").strip()
        by_prim[prim].append(r)
        if prim == "Skincare" and sec:
            by_subcat[sec].append(r)

    for sec, items in sorted(by_subcat.items()):
        count = 0
        for r in items:
            if add(r):
                count += 1
                if count >= 18 or len(selected) >= target_candidates:
                    break

    # Priority C: Balanced quotas across every primary department
    quotas = [
        ("Skincare", 90),
        ("Hair", 60),
        ("Fragrance", 55),
        ("Bath & Body", 45),
        ("Tools & Brushes", 30),
        ("Mini Size", 30),
        ("Men", 25),
        ("Gifts", 4),
        ("Makeup", 60),
    ]
    for prim, quota in quotas:
        count = 0
        for r in by_prim.get(prim, []):
            if add(r):
                count += 1
                if count >= quota or len(selected) >= target_candidates:
                    break

    # Priority D: Fill any remaining slots by global popularity (loves_count)
    for r in all_rows:
        if len(selected) >= target_candidates:
            break
        add(r)

    return selected[:target_candidates]


def main() -> int:
    parser = argparse.ArgumentParser(description="Harvest verified product images in batches")
    parser.add_argument("--batch", type=int, default=1, help="1-indexed batch number (1..17)")
    parser.add_argument("--size", type=int, default=500, help="Batch/pack size (default: 500)")
    parser.add_argument("--limit", type=int, default=None, help="Optional cap within the batch for quick runs")
    parser.add_argument("--demo-pack", action="store_true", help="Run category-balanced demo pack across all departments")
    parser.add_argument("--headless", action="store_true", help="Run Chromium headless (default is headed)")
    parser.add_argument("--skip-obf", action="store_true", help="Skip Tier 2 Open Beauty Facts fallback")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    if args.demo_pack:
        batch_items = build_demo_pack(PRODUCTS_CSV, MANIFEST_PATH, args.size)
        if args.limit is not None:
            batch_items = batch_items[:args.limit]
        print(f"=== Category-Balanced Demo Pack (running {len(batch_items)} candidate items) ===")
    else:
        all_products = load_sorted_products(PRODUCTS_CSV)
        total_batches = math.ceil(len(all_products) / args.size)
        if args.batch < 1 or args.batch > total_batches:
            print(f"Batch must be between 1 and {total_batches} (total products: {len(all_products)})")
            return 1
        start = (args.batch - 1) * args.size
        end = min(args.batch * args.size, len(all_products))
        batch_items = all_products[start:end]
        if args.limit is not None:
            batch_items = batch_items[:args.limit]
        print(
            f"=== Batch {args.batch}/{total_batches} (items {start + 1}..{end} of {len(all_products)}, "
            f"running {len(batch_items)} items) ==="
        )

    downloader = make_downloader(IMAGES_DIR)
    seph_rl = RateLimiter(3.0, 5.5)
    obf_rl = RateLimiter(6.0, 8.0)

    with SephoraPageSource(headed=not args.headless, rate_limiter=seph_rl) as seph:
        tiers = [(1, seph)]
        if not args.skip_obf:
            tiers.append((2, OpenBeautyFactsSource(rate_limiter=obf_rl)))
        stats = run(batch_items, tiers, MANIFEST_PATH, downloader)

    print(
        f"=== Run summary: verified={stats['verified']} "
        f"not_found={stats['not_found']} error={stats['error']} skipped={stats['skipped']} ==="
    )
    sync_image_data.sync()
    if stats["verified"] > 0:
        import seed_full_database
        seed_full_database.main()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
