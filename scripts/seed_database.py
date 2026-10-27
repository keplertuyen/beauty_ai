#!/usr/bin/env python3
"""
BeautyAI Phase 1 — Global Database Seeder & ETL Script (English & USD)
Extracts Brands, Categories, Products, and INCI Ingredients from products_cleaned.csv.
Seeds 12 Medical Conflict Rules, Demo Users, and Unified Digital Skin ID in English & USD.
"""

import csv
import re
import sys
from pathlib import Path

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def escape_sql(text: str) -> str:
    if text is None:
        return "NULL"
    clean = text.replace("'", "''")
    return f"'{clean}'"

def main():
    root_dir = Path(__file__).resolve().parent.parent
    csv_path = root_dir / "docs" / "_data" / "cleaned" / "products_cleaned.csv"
    output_sql_path = root_dir / "docs" / "db-schema" / "seed_data.sql"

    print(f"Reading products from {csv_path}...")
    if not csv_path.exists():
        print(f"Error: {csv_path} not found!")
        sys.exit(1)

    skincare_products = []
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('primary_category') == 'Skincare' and row.get('ingredients') and len(row.get('ingredients', '')) > 20:
                try:
                    loves = int(float(row.get('loves_count') or 0))
                except ValueError:
                    loves = 0
                row['_loves'] = loves
                skincare_products.append(row)

    # Sort by popularity (loves_count) and select top 300 Skincare products
    skincare_products.sort(key=lambda x: x['_loves'], reverse=True)
    selected_products = skincare_products[:300]
    print(f"Selected top {len(selected_products)} Skincare products.")

    # Unique Brands
    brands = {}
    for p in selected_products:
        b_name = p.get('brand_name', '').strip()
        if b_name and b_name not in brands:
            brands[b_name] = {
                'name': b_name,
                'slug': slugify(b_name),
                'origin_country': 'United States'
            }

    # Unique Categories
    categories = {}
    for p in selected_products:
        sec = p.get('secondary_category', '').strip() or 'Skincare'
        if sec not in categories:
            categories[sec] = {
                'name': sec,
                'slug': slugify(sec)
            }

    sql_lines = []
    sql_lines.append("-- ============================================================================")
    sql_lines.append("-- BEAUTYAI PHASE 1 SEED DATA (GLOBAL ENGLISH & USD)")
    sql_lines.append("-- ============================================================================\n")

    # 1. Brands
    sql_lines.append("-- 1. BRANDS")
    for b_name, b_info in brands.items():
        sql_lines.append(
            f"INSERT INTO brands (name, slug, origin_country) VALUES "
            f"({escape_sql(b_info['name'])}, {escape_sql(b_info['slug'])}, {escape_sql(b_info['origin_country'])}) "
            f"ON CONFLICT (slug) DO NOTHING;"
        )
    sql_lines.append("")

    # 2. Categories
    sql_lines.append("-- 2. CATEGORIES")
    for c_name, c_info in categories.items():
        sql_lines.append(
            f"INSERT INTO categories (name, slug) VALUES "
            f"({escape_sql(c_info['name'])}, {escape_sql(c_info['slug'])}) "
            f"ON CONFLICT (slug) DO NOTHING;"
        )
    sql_lines.append("")

    # 3. Active Ingredient Conflict Rules (12 Standard Medical Rules in English)
    sql_lines.append("-- 3. CONFLICT RULES")
    rules = [
        ("Retinol", "Salicylic Acid (BHA)", "Warning",
         "Disrupts skin barrier, causing severe flaking, redness, and irritation.",
         "Use BHA on Mon-Wed-Fri evenings, and Retinol on Tue-Thu-Sat evenings."),
        ("Retinol", "Glycolic Acid (AHA)", "Warning",
         "Excessive exfoliation leading to micro-tears and compromised moisture barrier.",
         "Use AHA in the morning or alternate nights with Retinol."),
        ("Benzoyl Peroxide", "Retinol", "Contraindication",
         "Benzoyl Peroxide oxidizes Retinol, neutralizing the efficacy of both actives.",
         "Apply Benzoyl Peroxide in the morning and Retinol in the evening."),
        ("Vitamin C (L-Ascorbic Acid)", "Salicylic Acid (BHA)", "Warning",
         "Cumulative low pH overload causes skin flushing, stinging, and redness.",
         "Use Vitamin C in the morning before sunscreen; apply BHA in the evening."),
        ("Vitamin C (L-Ascorbic Acid)", "Glycolic Acid (AHA)", "Warning",
         "Strong acid combination destabilizes sensitive skin barrier.",
         "Apply Vitamin C in the morning and AHA in the evening."),
        ("Vitamin C (L-Ascorbic Acid)", "Niacinamide", "Warning",
         "High-concentration pure ascorbic acid may interact with niacinamide causing temporary facial flushing.",
         "Wait 20 minutes between applications or split: Vitamin C in AM, Niacinamide in PM."),
        ("Benzoyl Peroxide", "Vitamin C (L-Ascorbic Acid)", "Contraindication",
         "Strong oxidizing agent Benzoyl Peroxide rapidly degrades Vitamin C.",
         "Use Vitamin C in the morning and Benzoyl Peroxide in the evening."),
        ("Retinol", "Vitamin C (L-Ascorbic Acid)", "Warning",
         "Simultaneous application of potent actives with divergent pH triggers irritation.",
         "Use Vitamin C in the morning for antioxidant protection; apply Retinol at night."),
        ("Glycolic Acid (AHA)", "Salicylic Acid (BHA)", "Warning",
         "Over-exfoliation hazard if combined at high percentages.",
         "Do not layer together if prone to sensitivity; alternate on different days."),
        ("Hydroquinone", "Benzoyl Peroxide", "Contraindication",
         "May produce temporary dark staining on the skin due to chemical oxidation.",
         "Do not use together in the same skincare routine."),
        ("Copper Peptides", "Vitamin C (L-Ascorbic Acid)", "Warning",
         "Copper ions oxidize ascorbic acid, rendering both ingredients inactive.",
         "Use Copper Peptides in AM and Vitamin C in PM (or vice versa)."),
        ("Retinol", "Scrub", "Warning",
         "Physical micro-tears combined with cellular turnover cause severe contact dermatitis.",
         "Avoid physical facial scrubs while using topical retinoids.")
    ]
    for r in rules:
        sql_lines.append(
            f"INSERT INTO conflict_rules (active_ingredient_a, active_ingredient_b, severity, reason, recommendation) VALUES "
            f"({escape_sql(r[0])}, {escape_sql(r[1])}, {escape_sql(r[2])}, {escape_sql(r[3])}, {escape_sql(r[4])});"
        )
    sql_lines.append("")

    # 4. Demo Users & Unified Digital Skin ID (1. Skin Type -> 2. Allergy Blacklist -> 3. Concerns & Goals)
    sql_lines.append("-- 4. DEMO USERS & UNIFIED DIGITAL SKIN ID")
    sql_lines.append(
        "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES "
        "('admin@beautyai.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'System Administrator', '+1-555-0199', 'Admin'), "
        "('trang.nguyen@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Thu Trang Nguyen', '+1-555-0101', 'Customer'), "
        "('maianh.tran@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Mai Anh Tran', '+1-555-0102', 'Customer'), "
        "('long.le@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Hoang Long Le', '+1-555-0103', 'Customer') "
        "ON CONFLICT (email) DO NOTHING;"
    )

    # Persona 1: Oily/Acne-prone skin, Allergic to Alcohol Denat
    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Oily', ARRAY['Acne', 'Pores'], 'Blemish reduction and sebum control', 'Medium' "
        "FROM users WHERE email = 'trang.nguyen@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append(
        "INSERT INTO user_allergies (user_id, ingredient_name, note) "
        "SELECT id, 'Alcohol Denat', 'Causes severe dryness and skin barrier tightness' "
        "FROM users WHERE email = 'trang.nguyen@example.com';"
    )

    # Persona 2: Dry/Sensitive skin, Allergic to Fragrance/Parfum
    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Dry', ARRAY['Sensitivity', 'Dehydration'], 'Barrier repair and calming irritation', 'High' "
        "FROM users WHERE email = 'maianh.tran@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append(
        "INSERT INTO user_allergies (user_id, ingredient_name, note) "
        "SELECT id, 'Fragrance/Parfum', 'Synthetic fragrance triggers contact dermatitis and redness' "
        "FROM users WHERE email = 'maianh.tran@example.com';"
    )

    # Persona 3: Combination/Aging skin
    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Combination', ARRAY['Aging', 'DarkSpots'], 'Anti-aging and dark spot brightening in T-zone', 'Medium' "
        "FROM users WHERE email = 'long.le@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append("")

    # 5. Products & INCI Ingredients
    sql_lines.append("-- 5. PRODUCTS & INGREDIENTS")

    known_active_ingredients = {
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

    ingredient_map = {}

    for p in selected_products:
        code = p.get('product_id', '').strip()
        name = p.get('product_name', '').strip()
        slug = slugify(f"{name}-{code}")
        b_name = p.get('brand_name', '').strip()
        c_name = p.get('secondary_category', '').strip() or 'Skincare'
        
        try:
            price_usd = float(p.get('price_usd') or 0)
        except ValueError:
            price_usd = 28.0
        if price_usd <= 0:
            price_usd = 25.0

        desc = p.get('highlights', '').strip() or f"Authentic {name} from {b_name}."
        img_url = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80"
        raw_ingredients = p.get('ingredients', '').strip()

        # Target skin types determination
        skin_types = "ARRAY['Oily', 'Combination', 'Normal', 'Dry']"
        lower_desc = (name + " " + desc + " " + raw_ingredients).lower()
        if 'oil' in lower_desc or 'acne' in lower_desc or 'salicylic' in lower_desc:
            skin_types = "ARRAY['Oily', 'Combination']"
        elif 'dry' in lower_desc or 'ceramide' in lower_desc or 'rich cream' in lower_desc:
            skin_types = "ARRAY['Dry', 'Normal']"
        elif 'soothing' in lower_desc or 'sensitive' in lower_desc or 'centella' in lower_desc:
            skin_types = "ARRAY['Dry', 'Sensitive', 'Normal']"

        sql_lines.append(
            f"INSERT INTO products (code, name, slug, brand_id, category_id, price_usd, volume_ml, description, image_url, ingredient_list_raw, target_skin_types, stock_quantity) "
            f"VALUES ("
            f"{escape_sql(code)}, "
            f"{escape_sql(name)}, "
            f"{escape_sql(slug)}, "
            f"(SELECT id FROM brands WHERE name = {escape_sql(b_name)} LIMIT 1), "
            f"(SELECT id FROM categories WHERE name = {escape_sql(c_name)} LIMIT 1), "
            f"{price_usd:.2f}, 50, {escape_sql(desc)}, {escape_sql(img_url)}, {escape_sql(raw_ingredients)}, "
            f"{skin_types}, 100"
            f") ON CONFLICT (code) DO UPDATE SET price_usd = EXCLUDED.price_usd;"
        )

        # Parse individual ingredients
        raw_list = [i.strip() for i in re.split(r'[,.]', raw_ingredients) if len(i.strip()) > 1]
        for pos, ing_raw in enumerate(raw_list[:40]):
            ing_clean = ing_raw.lower()
            ing_clean = re.sub(r'\(.*?\)', '', ing_clean).strip()
            if not ing_clean or len(ing_clean) < 2:
                continue

            if ing_clean not in ingredient_map:
                active_info = None
                for key, val in known_active_ingredients.items():
                    if key in ing_clean:
                        active_info = val
                        break
                
                if active_info:
                    ingredient_map[ing_clean] = {
                        'inci': ing_clean,
                        'function_group': active_info[0],
                        'description': active_info[1],
                        'is_active': active_info[2],
                        'comedo': active_info[3],
                        'irritation': active_info[4]
                    }
                else:
                    ingredient_map[ing_clean] = {
                        'inci': ing_clean,
                        'function_group': 'Other',
                        'description': 'Formulation stabilizing, texturizing, or emollient compound.',
                        'is_active': False,
                        'comedo': 0,
                        'irritation': 0
                    }

            sql_lines.append(
                f"INSERT INTO ingredients (inci_name, function_group, description, is_active_ingredient, comedogenic_rating, irritation_rating) "
                f"VALUES ({escape_sql(ingredient_map[ing_clean]['inci'])}, {escape_sql(ingredient_map[ing_clean]['function_group'])}, {escape_sql(ingredient_map[ing_clean]['description'])}, "
                f"{ingredient_map[ing_clean]['is_active']}, {ingredient_map[ing_clean]['comedo']}, {ingredient_map[ing_clean]['irritation']}) "
                f"ON CONFLICT (inci_name) DO NOTHING;"
            )

            sql_lines.append(
                f"INSERT INTO product_ingredients (product_id, ingredient_id, position_order) "
                f"SELECT p.id, i.id, {pos + 1} "
                f"FROM products p, ingredients i "
                f"WHERE p.code = {escape_sql(code)} AND i.inci_name = {escape_sql(ingredient_map[ing_clean]['inci'])} "
                f"ON CONFLICT (product_id, ingredient_id) DO NOTHING;"
            )

    sql_content = "\n".join(sql_lines)
    with open(output_sql_path, mode='w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"Generated {len(sql_lines)} SQL lines into {output_sql_path}.")
    print(f"Total Unique Ingredients: {len(ingredient_map)}")
    print(f"Total Brands: {len(brands)}")
    print(f"Total Categories: {len(categories)}")

if __name__ == "__main__":
    main()
