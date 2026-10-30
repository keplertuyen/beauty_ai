#!/usr/bin/env python3
"""
BeautyAI Phase 1 — Global High-Performance Database Seeder & ETL Script (English & USD)
Seeds all 8,494 products across 9 Primary Categories and 62 Subcategories.
Seeds 304 Brands, INCI Ingredients, Conflict Rules, Demo Users, and Digital Skin ID.
Uses psql streaming COPY protocol for sub-minute loading.
"""

import csv
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

CATEGORY_IMAGES = {
    'Skincare': [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
        "https://images.unsplash.com/photo-1608248597359-5975e523f669?w=500&q=80",
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80",
    ],
    'Makeup': [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80",
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
    ],
    'Fragrance': [
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80",
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80",
    ],
    'Hair': [
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&q=80",
    ],
    'Bath & Body': [
        "https://images.unsplash.com/photo-1556228722-d0b7197b1202?w=500&q=80",
        "https://images.unsplash.com/photo-1608248597359-5975e523f669?w=500&q=80",
    ],
    'Tools & Brushes': [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
    ],
    'Men': [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
    ],
}
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80"

KNOWN_ACTIVE_INGREDIENTS = {
    'salicylic acid': ('Exfoliating', 'Penetrates deep into pores to dissolve excess sebum and clear acne lesions', True, 0, 1),
    'glycolic acid': ('Exfoliating', 'Alpha hydroxy acid that loosens dead surface cells to reveal radiant skin', True, 0, 2),
    'lactic acid': ('Exfoliating', 'Gentle alpha hydroxy acid providing mild exfoliation with natural hydration', True, 0, 1),
    'niacinamide': ('Active', 'Vitamin B3 that strengthens lipid barrier, minimizes pore appearance, and balances oil', True, 0, 0),
    'retinol': ('Active', 'Gold-standard vitamin A derivative promoting cellular turnover and collagen synthesis', True, 0, 2),
    'ascorbic acid': ('Antioxidant', 'Pure L-ascorbic acid providing powerful environmental defense and hyperpigmentation fading', True, 0, 2),
    'sodium hyaluronate': ('Hydrating', 'Multi-molecular hyaluronic acid holding up to 1000x its weight in water', False, 0, 0),
    'ceramide np': ('Hydrating', 'Essential skin-identical lipid that locks in moisture and reinforces barrier defense', False, 0, 0),
    'centella asiatica extract': ('Soothing', 'Botanical extract rich in madecassoside that calms redness and repairs compromised skin', False, 0, 0),
    'panthenol': ('Soothing', 'Pro-vitamin B5 delivering instant soothing relief and wound healing acceleration', False, 0, 0),
    'benzoyl peroxide': ('Active', 'Antimicrobial agent that eradicates acne-causing bacteria deep within pores', True, 0, 2),
    'alcohol denat': ('Other', 'Drying solvent used for quick-dry feel, potential irritant for dry/sensitive barriers', False, 0, 2),
    'parfum': ('Other', 'Synthetic fragrance blend, common sensitizing agent for reactive skin', False, 0, 2),
    'fragrance': ('Other', 'Synthetic fragrance blend, common sensitizing agent for reactive skin', False, 0, 2)
}

def slugify(text: str) -> str:
    text = (text or '').lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-') or 'unknown'

def run_psql(sql: str) -> str:
    cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai", "-c", sql
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return res.stdout

def run_psql_copy(sql_copy: str, rows_generator):
    cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "beautyai", "-d", "beautyai", "-c", sql_copy
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    writer = csv.writer(proc.stdin, quoting=csv.QUOTE_MINIMAL)
    for row in rows_generator:
        writer.writerow(row)
    proc.stdin.close()
    out, err = proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"psql COPY failed: {err}")
    return out

def main():
    root_dir = Path(__file__).resolve().parent.parent
    csv_path = root_dir / "docs" / "_data" / "cleaned" / "products_cleaned.csv"
    print(f"Reading products from {csv_path}...")
    if not csv_path.exists():
        print(f"Error: {csv_path} not found!")
        sys.exit(1)

    all_products = []
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            all_products.append(row)

    print(f"Total products to seed: {len(all_products)}")

    # 1. Truncate existing product data cleanly
    print("Clearing existing product & review data...")
    run_psql("""
        TRUNCATE reviews, product_ingredients, products, brands, categories, ingredients RESTART IDENTITY CASCADE;
    """)

    # 2. Seed Brands
    print("Seeding Brands...")
    unique_brands = {}
    for p in all_products:
        b_name = p.get('brand_name', '').strip()
        if b_name and b_name not in unique_brands:
            unique_brands[b_name] = slugify(b_name)

    # Insert brands in batches
    brand_values = []
    for b_name, b_slug in unique_brands.items():
        clean_name = b_name.replace("'", "''")
        brand_values.append(f"('{clean_name}', '{b_slug}', 'United States')")

    chunk_size = 100
    for i in range(0, len(brand_values), chunk_size):
        chunk = brand_values[i:i+chunk_size]
        run_psql(f"INSERT INTO brands (name, slug, origin_country) VALUES {','.join(chunk)} ON CONFLICT (slug) DO NOTHING;")

    # Load brand mapping: name -> id
    res_b = run_psql("SELECT name, id FROM brands;")
    brand_map = {}
    for line in res_b.splitlines():
        if "|" in line:
            parts = line.split("|")
            b_name = parts[0].strip()
            if b_name and parts[1].strip().isdigit():
                brand_map[b_name] = int(parts[1].strip())
    print(f"Seeded {len(brand_map)} Brands.")

    # 3. Seed Root & Sub Categories
    print("Seeding Categories hierarchy...")
    root_categories = [
        'Skincare', 'Makeup', 'Hair', 'Fragrance', 'Bath & Body', 'Tools & Brushes', 'Men', 'Mini Size', 'Gifts'
    ]
    for root in root_categories:
        r_slug = slugify(root)
        run_psql(f"INSERT INTO categories (name, slug, parent_id) VALUES ('{root}', '{r_slug}', NULL) ON CONFLICT (slug) DO NOTHING;")

    # Load root category IDs
    res_roots = run_psql("SELECT name, id FROM categories WHERE parent_id IS NULL;")
    root_map = {}
    for line in res_roots.splitlines():
        if "|" in line:
            parts = line.split("|")
            r_name = parts[0].strip()
            if r_name and parts[1].strip().isdigit():
                root_map[r_name] = int(parts[1].strip())

    # Collect Subcategories
    sub_pairs = set()
    for p in all_products:
        prim = (p.get('primary_category') or 'Skincare').strip()
        sec = (p.get('secondary_category') or '').strip()
        if prim and sec:
            sub_pairs.add((prim, sec))

    sub_values = []
    for prim, sec in sub_pairs:
        parent_id = root_map.get(prim)
        if not parent_id:
            continue
        sub_slug = f"{slugify(prim)}-{slugify(sec)}"
        clean_sec = sec.replace("'", "''")
        sub_values.append(f"('{clean_sec}', '{sub_slug}', {parent_id})")

    for i in range(0, len(sub_values), chunk_size):
        chunk = sub_values[i:i+chunk_size]
        run_psql(f"INSERT INTO categories (name, slug, parent_id) VALUES {','.join(chunk)} ON CONFLICT (slug) DO NOTHING;")

    # Load full category map: (primary, secondary) -> id
    res_cats = run_psql("SELECT c.name, p.name, c.id FROM categories c LEFT JOIN categories p ON c.parent_id = p.id WHERE c.parent_id IS NOT NULL;")
    cat_map = {}
    for line in res_cats.splitlines():
        if "|" in line:
            parts = [x.strip() for x in line.split("|")]
            if len(parts) >= 3 and parts[2].isdigit():
                sub_name = parts[0]
                prim_name = parts[1]
                cid = int(parts[2])
                cat_map[(prim_name, sub_name)] = cid
    print(f"Seeded Categories. Mapped {len(cat_map)} subcategory pairs.")

    # 4. Stream Products into PostgreSQL
    print("Streaming 8,494 Products into PostgreSQL...")
    def product_row_generator():
        for idx, p in enumerate(all_products):
            code = p.get('product_id', '').strip()
            name = p.get('product_name', '').strip()
            slug = f"{slugify(name)}-{code.lower()}"
            b_name = p.get('brand_name', '').strip()
            brand_id = brand_map.get(b_name)
            
            prim = (p.get('primary_category') or 'Skincare').strip()
            sec = (p.get('secondary_category') or '').strip()
            category_id = cat_map.get((prim, sec)) or root_map.get(prim, 1)

            try:
                price = float(p.get('price_usd') or 0)
            except ValueError:
                price = 28.0
            if price <= 0:
                price = 25.0

            desc = p.get('highlights', '').strip() or f"Authentic {name} from {b_name}."
            
            # Select category-curated image
            img_pool = CATEGORY_IMAGES.get(prim, [DEFAULT_IMAGE])
            img_url = img_pool[idx % len(img_pool)]

            raw_ingredients = (p.get('ingredients') or '').strip()

            # Target skin types
            if prim == 'Skincare':
                lower_text = (name + " " + desc + " " + raw_ingredients).lower()
                if 'oil' in lower_text or 'acne' in lower_text or 'salicylic' in lower_text:
                    skin_types = "{Oily,Combination}"
                elif 'dry' in lower_text or 'ceramide' in lower_text or 'rich cream' in lower_text:
                    skin_types = "{Dry,Normal}"
                elif 'soothing' in lower_text or 'sensitive' in lower_text or 'centella' in lower_text:
                    skin_types = "{Dry,Sensitive,Normal}"
                else:
                    skin_types = "{Oily,Combination,Normal,Dry}"
            else:
                skin_types = "{Normal,Combination,Oily,Dry}"

            yield [
                code,
                name,
                slug,
                brand_id,
                category_id,
                prim,  # department
                f"{price:.2f}",
                50,    # volume_ml
                desc,
                img_url,
                raw_ingredients,
                skin_types,
                100    # stock_quantity
            ]

    sql_copy_products = (
        "COPY products(code, name, slug, brand_id, category_id, department, price_usd, volume_ml, description, image_url, ingredient_list_raw, target_skin_types, stock_quantity) "
        "FROM STDIN WITH (FORMAT csv, HEADER false, QUOTE '\"', ESCAPE '\"', FORCE_NOT_NULL (ingredient_list_raw));"
    )
    run_psql_copy(sql_copy_products, product_row_generator())

    res_count = run_psql("SELECT COUNT(*) FROM products;")
    print(f"Products seeded: {res_count.strip()}")

    # 5. Extract & Seed INCI Ingredients
    print("Parsing INCI Ingredients and building relationships...")
    res_prods = run_psql("SELECT code, id FROM products;")
    prod_code_to_id = {}
    for line in res_prods.splitlines():
        if "|" in line:
            parts = [x.strip() for x in line.split("|")]
            if len(parts) >= 2 and parts[1].isdigit():
                prod_code_to_id[parts[0]] = int(parts[1])

    unique_ingredients = {}
    prod_ing_pairs = []

    for p in all_products:
        code = p.get('product_id', '').strip()
        pid = prod_code_to_id.get(code)
        if not pid:
            continue
        raw_ing = (p.get('ingredients') or '').strip()
        if not raw_ing or len(raw_ing) < 5:
            continue

        raw_list = [i.strip() for i in re.split(r'[,.]', raw_ing) if len(i.strip()) > 1]
        for pos, ing_raw in enumerate(raw_list[:30]):
            ing_clean = ing_raw.lower()
            ing_clean = re.sub(r'\(.*?\)', '', ing_clean).strip()
            if not ing_clean or len(ing_clean) < 2 or len(ing_clean) > 200:
                continue

            if ing_clean not in unique_ingredients:
                active_info = None
                for key, val in KNOWN_ACTIVE_INGREDIENTS.items():
                    if key in ing_clean:
                        active_info = val
                        break
                
                if active_info:
                    unique_ingredients[ing_clean] = {
                        'inci': ing_clean,
                        'function': active_info[0],
                        'desc': active_info[1],
                        'is_active': active_info[2],
                        'comedo': active_info[3],
                        'irritation': active_info[4]
                    }
                else:
                    unique_ingredients[ing_clean] = {
                        'inci': ing_clean,
                        'function': 'Other',
                        'desc': 'Formulation stabilizing, texturizing, or emollient compound.',
                        'is_active': False,
                        'comedo': 0,
                        'irritation': 0
                    }

            prod_ing_pairs.append((pid, ing_clean, pos + 1))

    print(f"Found {len(unique_ingredients)} unique INCI ingredients. Streaming to DB...")
    def ingredient_row_generator():
        for ing in unique_ingredients.values():
            yield [
                ing['inci'],
                ing['function'],
                ing['desc'],
                ing['is_active'],
                ing['comedo'],
                ing['irritation']
            ]

    sql_copy_ingredients = (
        "COPY ingredients(inci_name, function_group, description, is_active_ingredient, comedogenic_rating, irritation_rating) "
        "FROM STDIN WITH (FORMAT csv, HEADER false, QUOTE '\"', ESCAPE '\"');"
    )
    run_psql_copy(sql_copy_ingredients, ingredient_row_generator())

    # Load ingredient ID map
    res_ings = run_psql("SELECT inci_name, id FROM ingredients;")
    ing_map = {}
    for line in res_ings.splitlines():
        if "|" in line:
            parts = [x.strip() for x in line.split("|")]
            if len(parts) >= 2 and parts[1].isdigit():
                ing_map[parts[0]] = int(parts[1])

    print(f"Mapped {len(ing_map)} ingredients. Streaming product_ingredients relationships...")
    def prod_ing_row_generator():
        seen = set()
        for pid, ing_clean, pos in prod_ing_pairs:
            iid = ing_map.get(ing_clean)
            if iid and (pid, iid) not in seen:
                seen.add((pid, iid))
                yield [pid, iid, pos]

    sql_copy_prod_ing = (
        "COPY product_ingredients(product_id, ingredient_id, position_order) "
        "FROM STDIN WITH (FORMAT csv, HEADER false, QUOTE '\"', ESCAPE '\"');"
    )
    run_psql_copy(sql_copy_prod_ing, prod_ing_row_generator())
    res_pi_count = run_psql("SELECT COUNT(*) FROM product_ingredients;")
    print(f"product_ingredients seeded: {res_pi_count.strip()}")

    # 6. Seed Conflict Rules, Demo Users, and Digital Skin ID
    print("Seeding Conflict Rules, Demo Users & Unified Digital Skin ID...")
    run_psql("""
        INSERT INTO conflict_rules (active_ingredient_a, active_ingredient_b, severity, reason, recommendation) VALUES
        ('Retinol', 'Salicylic Acid (BHA)', 'Warning', 'Disrupts skin barrier, causing severe flaking, redness, and irritation.', 'Use BHA on Mon-Wed-Fri evenings, and Retinol on Tue-Thu-Sat evenings.'),
        ('Retinol', 'Glycolic Acid (AHA)', 'Warning', 'Excessive exfoliation leading to micro-tears and compromised moisture barrier.', 'Use AHA in the morning or alternate nights with Retinol.'),
        ('Benzoyl Peroxide', 'Retinol', 'Contraindication', 'Benzoyl Peroxide oxidizes Retinol, neutralizing the efficacy of both actives.', 'Apply Benzoyl Peroxide in the morning and Retinol in the evening.'),
        ('Vitamin C (L-Ascorbic Acid)', 'Salicylic Acid (BHA)', 'Warning', 'Cumulative low pH overload causes skin flushing, stinging, and redness.', 'Use Vitamin C in the morning before sunscreen; apply BHA in the evening.'),
        ('Vitamin C (L-Ascorbic Acid)', 'Glycolic Acid (AHA)', 'Warning', 'Strong acid combination destabilizes sensitive skin barrier.', 'Apply Vitamin C in the morning and AHA in the evening.'),
        ('Vitamin C (L-Ascorbic Acid)', 'Niacinamide', 'Warning', 'High-concentration pure ascorbic acid may interact with niacinamide causing temporary facial flushing.', 'Wait 20 minutes between applications or split: Vitamin C in AM, Niacinamide in PM.'),
        ('Benzoyl Peroxide', 'Vitamin C (L-Ascorbic Acid)', 'Contraindication', 'Strong oxidizing agent Benzoyl Peroxide rapidly degrades Vitamin C.', 'Use Vitamin C in the morning and Benzoyl Peroxide in the evening.'),
        ('Retinol', 'Vitamin C (L-Ascorbic Acid)', 'Warning', 'Simultaneous application of potent actives with divergent pH triggers irritation.', 'Use Vitamin C in the morning for antioxidant protection; apply Retinol at night.'),
        ('Glycolic Acid (AHA)', 'Salicylic Acid (BHA)', 'Warning', 'Over-exfoliation hazard if combined at high percentages.', 'Do not layer together if prone to sensitivity; alternate on different days.'),
        ('Hydroquinone', 'Benzoyl Peroxide', 'Contraindication', 'May produce temporary dark staining on the skin due to chemical oxidation.', 'Do not use together in the same skincare routine.'),
        ('Copper Peptides', 'Vitamin C (L-Ascorbic Acid)', 'Warning', 'Copper ions oxidize ascorbic acid, rendering both ingredients inactive.', 'Use Copper Peptides in AM and Vitamin C in PM (or vice versa).'),
        ('Retinol', 'Scrub', 'Warning', 'Physical micro-tears combined with cellular turnover cause severe contact dermatitis.', 'Avoid physical facial scrubs while using topical retinoids.');

        INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
        ('admin@beautyai.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'System Administrator', '+1-555-0199', 'Admin'),
        ('trang.nguyen@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Thu Trang Nguyen', '+1-555-0101', 'Customer'),
        ('maianh.tran@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Mai Anh Tran', '+1-555-0102', 'Customer'),
        ('long.le@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Hoang Long Le', '+1-555-0103', 'Customer')
        ON CONFLICT (email) DO NOTHING;

        INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level)
        SELECT id, 'Oily', ARRAY['Acne', 'Pores'], 'Blemish reduction and sebum control', 'Medium'
        FROM users WHERE email = 'trang.nguyen@example.com' ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO user_allergies (user_id, ingredient_name, note)
        SELECT id, 'Alcohol Denat', 'Causes severe dryness and skin barrier tightness'
        FROM users WHERE email = 'trang.nguyen@example.com';

        INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level)
        SELECT id, 'Dry', ARRAY['Sensitivity', 'Dehydration'], 'Barrier repair and calming irritation', 'High'
        FROM users WHERE email = 'maianh.tran@example.com' ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO user_allergies (user_id, ingredient_name, note)
        SELECT id, 'Fragrance/Parfum', 'Synthetic fragrance triggers contact dermatitis and redness'
        FROM users WHERE email = 'maianh.tran@example.com';

        INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level)
        SELECT id, 'Combination', ARRAY['Aging', 'DarkSpots'], 'Anti-aging and dark spot brightening in T-zone', 'Medium'
        FROM users WHERE email = 'long.le@example.com' ON CONFLICT (user_id) DO NOTHING;
    """)

    print("Step 2 Seeding completed successfully!")

if __name__ == "__main__":
    main()
