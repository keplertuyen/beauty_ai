#!/usr/bin/env python3
"""Synchronize product image paths across CSV datasets, frontend, and SQL from
the verified provenance manifest (docs/_data/images/manifest.csv).

Rules (BUGFIX-PRODUCT-IMAGES):
  - Only products with status == 'verified' in manifest.csv AND an existing
    local WebP file in src/frontend/public/images/products/{pid}.webp receive
    `/images/products/{pid}.webp`.
  - Any WebP file in public/images/products/ not backed by a verified manifest
    row for a real dataset product_id is removed (zero orphan/unverified files).
  - Products without a verified local image receive a neutral category SVG
    placeholder (`/images/placeholders/<slug>.svg`).
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from images import manifest as mf
from images import placeholders as ph

csv.field_size_limit(sys.maxsize)

MANIFEST_PATH = REPO / "docs" / "_data" / "images" / "manifest.csv"
PRODUCTS_DIR = REPO / "src" / "frontend" / "public" / "images" / "products"
PLACEHOLDERS_DIR = REPO / "src" / "frontend" / "public" / "images" / "placeholders"
PRODUCT_IMAGES_JS = REPO / "src" / "frontend" / "src" / "utils" / "productImages.js"
SQL_OUT = REPO / "scripts" / "update_images_db.sql"
CSV_PATHS = [
    REPO / "docs" / "_data" / "cleaned" / "products_cleaned.csv",
    REPO / "docs" / "_data" / "processed" / "products_ready.csv",
]


def load_dataset_ids(csv_path: Path) -> set[str]:
    if not csv_path.exists():
        return set()
    with csv_path.open(encoding="utf-8", newline="") as f:
        return {(r.get("product_id") or "").strip() for r in csv.DictReader(f) if r.get("product_id")}


def ensure_empty_manifest(path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        csv.DictWriter(f, fieldnames=mf.FIELDS).writeheader()


def sync() -> dict[str, int]:
    # 1. Ensure neutral SVG placeholders exist and manifest file exists
    ph.write_all(PLACEHOLDERS_DIR)
    ensure_empty_manifest(MANIFEST_PATH)
    PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

    dataset_ids = load_dataset_ids(CSV_PATHS[1]) | load_dataset_ids(CSV_PATHS[0])
    manifest_rows = mf.load(MANIFEST_PATH)

    # 2. Determine verified product IDs and purge any unverified/orphan WebP files
    verified_ids: set[str] = set()
    removed = 0
    for webp in sorted(PRODUCTS_DIR.glob("*.webp")):
        pid = webp.stem
        row = manifest_rows.get(pid)
        if pid in dataset_ids and row and row.get("status") == mf.VERIFIED:
            verified_ids.add(pid)
        else:
            webp.unlink()
            removed += 1

    # 3. Update CSV datasets
    sql_map: dict[str, str] = {}
    for csv_path in CSV_PATHS:
        if not csv_path.exists():
            continue
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            fields = list(reader.fieldnames or [])
            rows = list(reader)
        if "image_url" not in fields:
            fields.append("image_url")
        for r in rows:
            pid = (r.get("product_id") or "").strip()
            if pid in verified_ids:
                url = f"/images/products/{pid}.webp"
            else:
                url = ph.resolve_placeholder(
                    r.get("primary_category", ""),
                    r.get("secondary_category", ""),
                    r.get("tertiary_category", ""),
                    r.get("product_name", ""),
                )
            r["image_url"] = url
            if pid:
                sql_map[pid] = url
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)

    # 4. Update LOCAL_PRODUCT_IMAGES in productImages.js
    if PRODUCT_IMAGES_JS.exists():
        js = PRODUCT_IMAGES_JS.read_text(encoding="utf-8")
        items = ", ".join(f"'{p}'" for p in sorted(verified_ids))
        block = (
            "// BEGIN_VERIFIED_SET\n"
            f"export const LOCAL_PRODUCT_IMAGES = new Set([{items}]);\n"
            "// END_VERIFIED_SET"
        )
        js = re.sub(r"// BEGIN_VERIFIED_SET.*?// END_VERIFIED_SET", block, js, flags=re.S)
        PRODUCT_IMAGES_JS.write_text(js, encoding="utf-8")

    # 5. Write SQL update script
    sql_lines = []
    for pid, url in sorted(sql_map.items()):
        ep = pid.replace("'", "''")
        eu = url.replace("'", "''")
        sql_lines.append(f"UPDATE products SET image_url = '{eu}' WHERE code = '{ep}';")
    SQL_OUT.write_text("\n".join(sql_lines) + ("\n" if sql_lines else ""), encoding="utf-8")

    stats = {
        "verified_local": len(verified_ids),
        "placeholders": len(sql_map) - len(verified_ids),
        "removed_unverified_files": removed,
    }
    print(
        f"[sync_image_data] verified={stats['verified_local']} "
        f"placeholders={stats['placeholders']} "
        f"removed_unverified={stats['removed_unverified_files']}"
    )
    return stats


if __name__ == "__main__":
    sync()
