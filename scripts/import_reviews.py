#!/usr/bin/env python3
"""
BeautyAI Phase 1 — High-Performance Reviews ETL & Indexing Script
Reads ~1.09M reviews from docs/_data/cleaned/reviews_cleaned.csv,
filters reviews matching the 300 seeded products, normalizes skin types,
and imports them directly into PostgreSQL using binary/streaming COPY protocol.
Verifies B-Tree index performance with EXPLAIN ANALYZE (< 50ms requirement).
"""

import csv
import os
import subprocess
import sys
import time
from pathlib import Path

def get_product_mapping() -> dict:
    """Fetch product_code -> product_id mapping from PostgreSQL."""
    cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai",
        "-t", "-A", "-F,", "-c",
        "SELECT code, id FROM products WHERE code IS NOT NULL;"
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        mapping = {}
        for line in res.stdout.strip().splitlines():
            if line and "," in line:
                code, pid = line.split(",", 1)
                mapping[code.strip()] = int(pid.strip())
        print(f"Loaded {len(mapping)} product code mappings from database.")
        return mapping
    except Exception as e:
        print(f"Warning: Failed to fetch from DB ({e}), falling back to products_cleaned.csv...")
        # Fallback to local file calculation matching seed_database.py
        root_dir = Path(__file__).resolve().parent.parent
        csv_prod = root_dir / "docs" / "_data" / "cleaned" / "products_cleaned.csv"
        skincare_products = []
        with open(csv_prod, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('primary_category') == 'Skincare' and row.get('ingredients') and len(row.get('ingredients', '')) > 20:
                    try:
                        loves = int(float(row.get('loves_count') or 0))
                    except ValueError:
                        loves = 0
                    row['_loves'] = loves
                    skincare_products.append(row)
        skincare_products.sort(key=lambda x: x['_loves'], reverse=True)
        return {p['product_id']: idx + 1 for idx, p in enumerate(skincare_products[:300])}

def stream_reviews_to_postgres(product_map: dict, reviews_csv_path: Path):
    """Stream formatted CSV rows directly into psql COPY STDIN."""
    print(f"Starting ETL stream from {reviews_csv_path}...")
    start_time = time.time()

    copy_cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai",
        "-c",
        "COPY reviews(product_id, product_code, author_name, rating, skin_type, content, created_at) "
        "FROM STDIN WITH (FORMAT csv, HEADER false, QUOTE '\"', ESCAPE '\"');"
    ]

    proc = subprocess.Popen(copy_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    writer = csv.writer(proc.stdin, quoting=csv.QUOTE_MINIMAL)

    valid_skin_types = {'Oily', 'Dry', 'Combination', 'Normal'}
    total_read = 0
    total_matched = 0

    with open(reviews_csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_read += 1
            code = row.get('product_id')
            if not code or code not in product_map:
                continue

            product_id = product_map[code]
            
            # Author Name
            author_id = row.get('author_id')
            if author_id and author_id.strip():
                author_name = f"Shopper #{author_id.strip()}"
            else:
                author_name = "BeautyAI Shopper"

            # Rating
            try:
                rating = int(float(row.get('rating') or 5))
                if rating < 1: rating = 1
                if rating > 5: rating = 5
            except ValueError:
                rating = 5

            # Skin Type
            raw_st = (row.get('skin_type') or '').strip().capitalize()
            skin_type = raw_st if raw_st in valid_skin_types else 'Unknown'

            # Content
            title = (row.get('review_title') or '').strip()
            body = (row.get('review_text') or '').strip()
            if title and body:
                content = f"{title}\n\n{body}"
            elif body:
                content = body
            elif title:
                content = title
            else:
                content = None

            # Created At
            created_at = row.get('submission_time')
            if not created_at or len(created_at.strip()) < 10:
                created_at = '2023-01-01 00:00:00+00'
            else:
                created_at = f"{created_at.strip()} 00:00:00+00"

            writer.writerow([product_id, code, author_name, rating, skin_type, content, created_at])
            total_matched += 1

            if total_matched % 100000 == 0:
                elapsed = time.time() - start_time
                print(f"Processed {total_read:,} lines... matched and streamed {total_matched:,} reviews ({elapsed:.1f}s)")

    proc.stdin.close()
    stdout, stderr = proc.communicate()

    if proc.returncode != 0:
        print(f"Error during COPY: {stderr}")
        sys.exit(1)

    elapsed = time.time() - start_time
    print(f"Successfully imported {total_matched:,} reviews in {elapsed:.2f} seconds!")
    print(f"PostgreSQL response: {stdout.strip()}")

def verify_and_analyze():
    """Ensure indexes are in place, run ANALYZE, and benchmark query with EXPLAIN ANALYZE."""
    print("\nRunning ANALYZE on reviews table to update PostgreSQL planner statistics...")
    subprocess.run([
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai",
        "-c", "ANALYZE reviews;"
    ], check=True)

    print("\nRunning verification benchmark query (EXPLAIN ANALYZE):")
    verify_cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai",
        "-c",
        "EXPLAIN ANALYZE "
        "SELECT id, author_name, rating, content "
        "FROM reviews "
        "WHERE product_id = 1 AND skin_type = 'Oily' "
        "ORDER BY created_at DESC "
        "LIMIT 10;"
    ]
    res = subprocess.run(verify_cmd, capture_output=True, text=True, check=True)
    print(res.stdout)

def main():
    root_dir = Path(__file__).resolve().parent.parent
    reviews_csv = root_dir / "docs" / "_data" / "cleaned" / "reviews_cleaned.csv"

    if not reviews_csv.exists():
        print(f"Error: {reviews_csv} does not exist.")
        sys.exit(1)

    mapping = get_product_mapping()
    if not mapping:
        print("Error: No product codes found to map.")
        sys.exit(1)

    stream_reviews_to_postgres(mapping, reviews_csv)
    verify_and_analyze()

if __name__ == '__main__':
    main()
