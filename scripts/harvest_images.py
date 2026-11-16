#!/usr/bin/env python3
"""Batch CLI for the verified product-image pipeline (BUGFIX-PRODUCT-IMAGES).

Usage:
  scripts/images/.venv/bin/python scripts/harvest_images.py --batch 1 --size 500
  scripts/images/.venv/bin/python scripts/harvest_images.py --batch 1 --size 500 --limit 10
"""
from __future__ import annotations

import argparse
import csv
import logging
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from images.base import ProductRef, RateLimiter
from images.download import make_downloader
from images.pipeline import run
from images.source_obf import OpenBeautyFactsSource
from images.source_sephora import SephoraPageSource
import sync_image_data

csv.field_size_limit(sys.maxsize)

PRODUCTS_CSV = REPO / "docs" / "_data" / "processed" / "products_ready.csv"
MANIFEST_PATH = REPO / "docs" / "_data" / "images" / "manifest.csv"
IMAGES_DIR = REPO / "src" / "frontend" / "public" / "images" / "products"


def load_sorted_products(csv_path: Path) -> list[ProductRef]:
    rows = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            pid = (r.get("product_id") or "").strip()
            if not pid:
                continue
            try:
                loves = float(r.get("loves_count") or 0)
            except ValueError:
                loves = 0.0
            rows.append((
                -loves,
                pid,
                ProductRef(
                    product_id=pid,
                    brand=(r.get("brand_name") or "").strip(),
                    name=(r.get("product_name") or "").strip(),
                    category=(r.get("primary_category") or "").strip(),
                ),
            ))
    rows.sort(key=lambda t: (t[0], t[1]))
    return [t[2] for t in rows]


def main() -> int:
    parser = argparse.ArgumentParser(description="Harvest verified product images in batches")
    parser.add_argument("--batch", type=int, default=1, help="1-indexed batch number (1..17)")
    parser.add_argument("--size", type=int, default=500, help="Batch size (default: 500)")
    parser.add_argument("--limit", type=int, default=None, help="Optional cap within the batch for quick runs")
    parser.add_argument("--headless", action="store_true", help="Run Chromium headless (default is headed)")
    parser.add_argument("--skip-obf", action="store_true", help="Skip Tier 2 Open Beauty Facts fallback")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

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
    seph_rl = RateLimiter(3.0, 6.0)
    obf_rl = RateLimiter(6.0, 8.0)

    with SephoraPageSource(headed=not args.headless, rate_limiter=seph_rl) as seph:
        tiers = [(1, seph)]
        if not args.skip_obf:
            tiers.append((2, OpenBeautyFactsSource(rate_limiter=obf_rl)))
        stats = run(batch_items, tiers, MANIFEST_PATH, downloader)

    print(
        f"=== Batch {args.batch} summary: verified={stats['verified']} "
        f"not_found={stats['not_found']} error={stats['error']} skipped={stats['skipped']} ==="
    )
    sync_image_data.sync()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
