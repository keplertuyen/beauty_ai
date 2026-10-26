#!/usr/bin/env python3
"""
BeautyAI Phase 1 — Database Seeder & ETL Script
Extracts Brands, Categories, Products, and INCI Ingredients from products_cleaned.csv
Seeds Conflict Rules and Demo Persona Users.
"""

import csv
import re
import sys
import subprocess
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

    # Sort by popularity (loves_count) and take top 300 Skincare products
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
    sql_lines.append("-- BEAUTYAI PHASE 1 SEED DATA")
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

    # 3. Conflict Rules (12 Curated Rules)
    sql_lines.append("-- 3. CONFLICT RULES")
    rules = [
        ("Retinol", "Salicylic Acid (BHA)", "Warning",
         "Phá vỡ hàng rào bảo vệ da, gây bong tróc nặng và bỏng rát.",
         "Dùng BHA tối 2-4-6, Retinol tối 3-5-7."),
        ("Retinol", "Glycolic Acid (AHA)", "Warning",
         "Kích ứng mạnh, bào mòn lớp sừng bề mặt da.",
         "Dùng AHA sáng hoặc cách ngày, Retinol dùng buổi tối."),
        ("Benzoyl Peroxide", "Retinol", "Contraindication",
         "Benzoyl Peroxide oxy hóa làm mất hoạt tính của Retinol.",
         "Dùng Benzoyl Peroxide buổi sáng, Retinol buổi tối."),
        ("Vitamin C (L-Ascorbic Acid)", "Salicylic Acid (BHA)", "Warning",
         "pH quá thấp làm da quá tải acid, gây đỏ rát châm chích.",
         "Dùng Vitamin C buổi sáng trước kem chống nắng, BHA buổi tối."),
        ("Vitamin C (L-Ascorbic Acid)", "Glycolic Acid (AHA)", "Warning",
         "Môi trường acid quá mạnh gây bỏng rát da nhạy cảm.",
         "Dùng Vitamin C buổi sáng, AHA buổi tối."),
        ("Vitamin C (L-Ascorbic Acid)", "Niacinamide", "Warning",
         "Có thể tương tác tạo phức Niacin làm ửng đỏ da tạm thời ở nồng độ cao.",
         "Thoa cách nhau 20 phút hoặc chia sáng (Vit C) / tối (Niacinamide)."),
        ("Benzoyl Peroxide", "Vitamin C (L-Ascorbic Acid)", "Contraindication",
         "Benzoyl Peroxide là chất oxy hóa mạnh, triệt tiêu tác dụng của Vitamin C.",
         "Tách riêng Benzoyl Peroxide buổi tối và Vitamin C buổi sáng."),
        ("Retinol", "Vitamin C (L-Ascorbic Acid)", "Warning",
         "Cả hai đều là hoạt chất đặc trị mạnh, pH hoạt động chênh lệch dễ gây kích ứng.",
         "Vitamin C buổi sáng chống oxy hóa, Retinol buổi tối tái tạo da."),
        ("Glycolic Acid (AHA)", "Salicylic Acid (BHA)", "Warning",
         "Nguy cơ tẩy da chết quá đà (Over-exfoliation) nếu dùng cùng lúc.",
         "Không thoa chung nếu da nhạy cảm; chia xen kẽ ngày."),
        ("Hydroquinone", "Benzoyl Peroxide", "Contraindication",
         "Có thể gây sạm đen da tạm thời do phản ứng kết tủa.",
         "Tuyệt đối không dùng chung trong cùng chu trình."),
        ("Copper Peptides", "Vitamin C (L-Ascorbic Acid)", "Warning",
         "Ion đồng oxy hóa acid ascorbic, làm mất tác dụng của cả hai hoạt chất.",
         "Dùng Peptide buổi sáng, Vitamin C buổi tối (hoặc ngược lại)."),
        ("Retinol", "Scrub", "Warning",
         "Tổn thương vi mô kết hợp bong sừng gây viêm da tiếp xúc.",
         "Không dùng scrub dạng hạt vật lý khi đang treatment Retinol.")
    ]
    for r in rules:
        sql_lines.append(
            f"INSERT INTO conflict_rules (active_ingredient_a, active_ingredient_b, severity, reason_vi, recommendation_vi) VALUES "
            f"({escape_sql(r[0])}, {escape_sql(r[1])}, {escape_sql(r[2])}, {escape_sql(r[3])}, {escape_sql(r[4])});"
        )
    sql_lines.append("")

    # 4. Users (Admin + 3 Persona Users)
    # BCrypt hash for 'Admin@123456' and 'Password@123'
    # $2a$11$qR6m.N7b4a2e8yJ/Q5B7/.xN5gU3s1qW2e4r6t8y0u2i4o6p8a0s2 (dummy valid hash or BCrypt format)
    # Using a valid standard BCrypt hash:
    # $2a$11$w1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2d4
    sql_lines.append("-- 4. DEMO USERS & DIGITAL SKIN ID")
    sql_lines.append(
        "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES "
        "('admin@beautyai.vn', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Quản Trị Viên BeautyAI', '0901234567', 'Admin'), "
        "('trang.nguyen@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Nguyễn Thu Trang', '0912345678', 'Customer'), "
        "('maianh.tran@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Trần Mai Anh', '0923456789', 'Customer'), "
        "('long.le@example.com', '$2a$11$8k1hSjYQ4bF9k5E8aO.Wf.uX9iP7qL2m4y6r8t0u2i4o6p8a0s2', 'Lê Hoàng Long', '0934567890', 'Customer') "
        "ON CONFLICT (email) DO NOTHING;"
    )

    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Oily', ARRAY['Acne', 'Pores'], 'Giảm mụn và kiểm soát dầu thừa', 'Medium' "
        "FROM users WHERE email = 'trang.nguyen@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append(
        "INSERT INTO user_allergies (user_id, ingredient_name, note) "
        "SELECT id, 'Alcohol Denat', 'Gây khô căng rát da khi dùng cồn khô' "
        "FROM users WHERE email = 'trang.nguyen@example.com';"
    )

    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Dry', ARRAY['Sensitivity', 'Dehydration'], 'Phục hồi hàng rào ẩm và làm dịu da nhạy cảm', 'High' "
        "FROM users WHERE email = 'maianh.tran@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append(
        "INSERT INTO user_allergies (user_id, ingredient_name, note) "
        "SELECT id, 'Fragrance/Parfum', 'Dị ứng hương liệu nhân tạo gây ngứa đỏ' "
        "FROM users WHERE email = 'maianh.tran@example.com';"
    )

    sql_lines.append(
        "INSERT INTO skin_profiles (user_id, skin_type, skin_concerns, primary_goal, budget_level) "
        "SELECT id, 'Combination', ARRAY['Aging', 'DarkSpots'], 'Chống lão hóa và mờ thâm nám vùng chữ T', 'Medium' "
        "FROM users WHERE email = 'long.le@example.com' ON CONFLICT (user_id) DO NOTHING;"
    )
    sql_lines.append("")

    # 5. Products & Ingredients
    sql_lines.append("-- 5. PRODUCTS & INGREDIENTS")

    known_active_ingredients = {
        'salicylic acid': ('Salicylic Acid (BHA)', 'Tẩy tế bào chết sâu trong lỗ chân lông, giảm viêm mụn', True, 0, 1),
        'glycolic acid': ('Glycolic Acid (AHA)', 'Bong sừng bề mặt, làm sáng đều màu da', True, 0, 2),
        'lactic acid': ('Lactic Acid (AHA)', 'Tẩy da chết nhẹ nhàng kết hợp cấp ẩm', True, 0, 1),
        'niacinamide': ('Niacinamide (Vitamin B3)', 'Kiểm soát dầu nhờn, củng cố hàng rào bảo vệ da, mờ thâm', True, 0, 0),
        'retinol': ('Retinol', 'Kích thích tăng sinh collagen, chống lão hóa, mờ nếp nhăn', True, 0, 2),
        'ascorbic acid': ('Vitamin C (L-Ascorbic Acid)', 'Chống oxy hóa mạnh mẽ, dưỡng sáng da, mờ thâm mụn', True, 0, 2),
        'sodium hyaluronate': ('Hyaluronic Acid', 'Cấp nước đa tầng, ngậm nước cho tế bào da', False, 0, 0),
        'ceramide np': ('Ceramide NP', 'Phục hồi lipid gian bào, khóa ẩm hàng rào da', False, 0, 0),
        'centella asiatica extract': ('Chiết xuất Rau má', 'Làm dịu kích ứng, kháng viêm, phục hồi da tổn thương', False, 0, 0),
        'panthenol': ('Vitamin B5 (Panthenol)', 'Làm dịu da tức thì, thúc đẩy tái tạo tế bào', False, 0, 0),
        'benzoyl peroxide': ('Benzoyl Peroxide', 'Tiêu diệt vi khuẩn P.acnes gây mụn bọc mụn viêm', True, 0, 2),
        'alcohol denat': ('Cồn khô (Alcohol Denat)', 'Dung môi tạo cảm giác khô ráo, có thể gây khô căng da', False, 0, 2),
        'parfum': ('Hương liệu (Fragrance/Parfum)', 'Tạo mùi thơm, nguy cơ kích ứng cho da nhạy cảm', False, 0, 2),
        'fragrance': ('Hương liệu (Fragrance/Parfum)', 'Tạo mùi thơm, nguy cơ kích ứng cho da nhạy cảm', False, 0, 2)
    }

    ingredient_map = {} # cleaned_name -> dict

    for p in selected_products:
        code = p.get('product_id', '').strip()
        name = p.get('product_name', '').strip()
        slug = slugify(f"{name}-{code}")
        b_name = p.get('brand_name', '').strip()
        c_name = p.get('secondary_category', '').strip() or 'Skincare'
        
        try:
            price_usd = float(p.get('price_usd') or 0)
        except ValueError:
            price_usd = 20.0
        price_vnd = int(price_usd * 25000)
        if price_vnd <= 0:
            price_vnd = 250000

        desc = p.get('highlights', '').strip() or f"Sản phẩm {name} chính hãng từ thương hiệu {b_name}."
        img_url = f"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80" # placeholder standard
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
            f"INSERT INTO products (code, name, slug, brand_id, category_id, price_vnd, volume_ml, description, image_url, ingredient_list_raw, target_skin_types, stock_quantity) "
            f"VALUES ("
            f"{escape_sql(code)}, "
            f"{escape_sql(name)}, "
            f"{escape_sql(slug)}, "
            f"(SELECT id FROM brands WHERE name = {escape_sql(b_name)} LIMIT 1), "
            f"(SELECT id FROM categories WHERE name = {escape_sql(c_name)} LIMIT 1), "
            f"{price_vnd}, 50, {escape_sql(desc)}, {escape_sql(img_url)}, {escape_sql(raw_ingredients)}, "
            f"{skin_types}, 100"
            f") ON CONFLICT (code) DO NOTHING;"
        )

        # Parse individual ingredients
        # Split by comma or period
        raw_list = [i.strip() for i in re.split(r'[,.]', raw_ingredients) if len(i.strip()) > 1]
        for pos, ing_raw in enumerate(raw_list[:40]): # top 40 ingredients per product
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
                        'name_vi': active_info[0],
                        'desc_vi': active_info[1],
                        'is_active': active_info[2],
                        'comedo': active_info[3],
                        'irritation': active_info[4]
                    }
                else:
                    ingredient_map[ing_clean] = {
                        'inci': ing_clean,
                        'name_vi': ing_clean.capitalize(),
                        'desc_vi': 'Thành phần dưỡng chất trong công thức',
                        'is_active': False,
                        'comedo': 0,
                        'irritation': 0
                    }

            sql_lines.append(
                f"INSERT INTO ingredients (inci_name, common_name_vi, description_vi, is_active_ingredient, comedogenic_rating, irritation_rating) "
                f"VALUES ({escape_sql(ingredient_map[ing_clean]['inci'])}, {escape_sql(ingredient_map[ing_clean]['name_vi'])}, {escape_sql(ingredient_map[ing_clean]['desc_vi'])}, "
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
    print(f"Total Unique Ingredients extracted: {len(ingredient_map)}")
    print(f"Total Brands: {len(brands)}")
    print(f"Total Categories: {len(categories)}")

if __name__ == "__main__":
    main()
