import csv
import os
import re
import subprocess

# 1. Discover all local downloaded WebP files
LOCAL_PRODUCTS_DIR = 'src/frontend/public/images/products'
local_files = [f.split('.')[0] for f in os.listdir(LOCAL_PRODUCTS_DIR) if f.endswith('.webp')]
LOCAL_SET = set(local_files)

# 2. Load TOP_PRODUCT_IMAGES from productImages.js
with open('src/frontend/src/utils/productImages.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

top_matches = re.findall(r"(P[0-9]+):\s*'([^']+)'", js_content)
TOP_MAP = dict(top_matches)

print(f"Loaded {len(LOCAL_SET)} local product WebP files and {len(TOP_MAP)} top products.")

# Curated Category Studio fallbacks (100% cosmetic / skincare product studio shots, NO oranges, NO spa faces)
CATEGORY_IMAGES = {
    'Moisturizers': [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=85',
    ],
    'Serums & Essences': [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&q=85',
    ],
    'Makeup': [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&q=85',
    ],
    'Fragrance': [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=85',
    ],
    'Hair': [
        'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    ],
    'Bath & Body': [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1608248597359-5975e523f669?auto=format&fit=crop&q=85',
    ]
}

def get_product_image_url(pid, name, brand, cat):
    pid = (pid or '').strip()
    if pid in LOCAL_SET:
        return f"/images/products/{pid}.webp"
    if pid in TOP_MAP:
        return TOP_MAP[pid]
    
    # Category fallback with hash
    pool = CATEGORY_IMAGES.get(cat) or CATEGORY_IMAGES.get('Moisturizers')
    h = 0
    seed = f"{pid}_{name}_{brand}"
    for ch in seed:
        h = (h * 31 + ord(ch)) & 0xFFFFFFF
    return pool[h % len(pool)]

def update_csv(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping missing file: {file_path}")
        return
    print(f"Updating {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        rows = list(reader)

    has_img = 'image_url' in fields
    if not has_img:
        fields = fields + ['image_url']

    updated_rows = []
    for r in rows:
        pid = r.get('product_id', '')
        name = r.get('product_name', '')
        brand = r.get('brand_name', '')
        cat = r.get('primary_category', '')
        r['image_url'] = get_product_image_url(pid, name, brand, cat)
        updated_rows.append(r)

    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(updated_rows)
    print(f"Successfully updated {len(updated_rows)} rows in {file_path}")

# 2. Update CSV files
update_csv('docs/_data/cleaned/products_cleaned.csv')
update_csv('docs/_data/processed/products_ready.csv')

# 3. Update PostgreSQL database
print("Generating database update script...")
update_sql_lines = []
for pid in sorted(LOCAL_SET):
    escaped_pid = pid.replace("'", "''")
    update_sql_lines.append(f"UPDATE products SET image_url = '/images/products/{escaped_pid}.webp' WHERE code = '{escaped_pid}';")

for pid, url in sorted(TOP_MAP.items()):
    if pid not in LOCAL_SET:
        escaped_pid = pid.replace("'", "''")
        escaped_url = url.replace("'", "''")
        update_sql_lines.append(f"UPDATE products SET image_url = '{escaped_url}' WHERE code = '{escaped_pid}';")

batch_sql = "\n".join(update_sql_lines)
with open('scripts/update_images_db.sql', 'w', encoding='utf-8') as f:
    f.write(batch_sql)

print(f"Wrote {len(update_sql_lines)} update statements to scripts/update_images_db.sql")
