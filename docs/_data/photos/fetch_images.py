"""
Tải ảnh sản phẩm cho đồ án (phi thương mại) từ Sephora.

Cài đặt các gói cần thiết:
    pip install playwright pillow requests
    playwright install chromium

Cách chạy thử 20 sản phẩm đầu tiên trong top 50:
    python fetch_images.py --limit 20 --headed

Cách chạy toàn bộ 50 sản phẩm top:
    python fetch_images.py
"""
import argparse
import csv
import json
import random
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

# Thư mục mặc định
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CSV = BASE_DIR / "top_50_products.csv"
FALLBACK_CSV = BASE_DIR.parent / "cleaned" / "products_cleaned.csv"
DEFAULT_OUT = BASE_DIR / "images"
DEFAULT_LOG = BASE_DIR / "image_log.csv"
MAX_SIDE = 800
DELAY = (2.0, 4.0)


def load_done(log_file: Path) -> set:
    if not log_file.exists():
        return set()
    done = set()
    with log_file.open("r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                done.add(row[0].strip())
    return done


def log_result(log_file: Path, pid: str, status: str, url: str = ""):
    with log_file.open("a", encoding="utf-8") as f:
        f.write(f"{pid},{status},{url}\n")


def extract_image_url(page) -> str | None:
    # 1. Thử lấy từ OpenGraph meta tag
    og = page.locator('meta[property="og:image"]')
    if og.count():
        content = og.first.get_attribute("content")
        if content and content.startswith("http"):
            return content

    # 2. Thử lấy từ JSON-LD schema markup
    for s in page.locator('script[type="application/ld+json"]').all_inner_texts():
        try:
            data = json.loads(s)
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if isinstance(it, dict):
                img = it.get("image")
                if img:
                    return img[0] if isinstance(img, list) else img
    return None


def save_image(url: str, pid: str, out_dir: Path) -> str:
    # Loại bỏ query params để lấy ảnh gốc độ phân giải cao nhất
    clean_url = re.sub(r"\?.*$", "", url)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
    }
    r = requests.get(clean_url, timeout=30, headers=headers)
    r.raise_for_status()

    img = Image.open(BytesIO(r.content)).convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    target_path = out_dir / f"{pid}.webp"
    img.save(target_path, "WEBP", quality=85)
    return clean_url


def read_products(csv_path: Path, top_n: int | None = None):
    items = []
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = (row.get("product_id") or "").strip()
            if not pid:
                continue
            try:
                loves = float(row.get("loves_count", 0) or 0)
            except ValueError:
                loves = 0
            items.append({
                "product_id": pid,
                "name": row.get("product_name", ""),
                "brand": row.get("brand_name", ""),
                "loves": loves,
            })

    if top_n and top_n < len(items):
        items.sort(key=lambda x: x["loves"], reverse=True)
        items = items[:top_n]
    return items


def main():
    if sync_playwright is None:
        print("Lỗi: Chưa cài đặt thư viện 'playwright'.")
        print("Vui lòng chạy: pip install playwright pillow requests && playwright install chromium")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Tải ảnh sản phẩm Sephora cho đồ án")
    parser.add_argument("--limit", type=int, default=None, help="Giới hạn số sản phẩm tải")
    parser.add_argument("--top", type=int, default=None, help="Lọc lấy Top N sản phẩm theo loves_count")
    parser.add_argument("--headed", action="store_true", help="Mở cửa sổ trình duyệt để theo dõi và tránh chặn bot")
    parser.add_argument("--csv", type=str, default=None, help="Đường dẫn file CSV sản phẩm")
    parser.add_argument("--out", type=str, default=str(DEFAULT_OUT), help="Thư mục lưu ảnh (.webp)")
    args = parser.parse_args()

    csv_path = Path(args.csv) if args.csv else (DEFAULT_CSV if DEFAULT_CSV.exists() else FALLBACK_CSV)
    if not csv_path.exists():
        print(f"Lỗi: Không tìm thấy file CSV tại {csv_path}")
        sys.exit(1)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    log_file = BASE_DIR / "image_log.csv"

    products = read_products(csv_path, top_n=args.top)
    done_ids = load_done(log_file)
    todo = [p for p in products if p["product_id"] not in done_ids and not (out_dir / f"{p['product_id']}.webp").exists()]

    if args.limit:
        todo = todo[:args.limit]

    print(f"==================================================")
    print(f"File CSV nguồn: {csv_path.name} (Tổng duyệt: {len(products)} SP)")
    print(f"Số lượng cần tải: {len(todo)} sản phẩm")
    print(f"Thư mục lưu ảnh: {out_dir}")
    print(f"Chế độ hiển thị: {'Có cửa sổ (Headed)' if args.headed else 'Ẩn danh (Headless)'}")
    print(f"==================================================")

    if not todo:
        print("Tất cả sản phẩm đã được tải hoàn tất!")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            locale="en-US",
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        fails_in_row = 0

        for idx, item in enumerate(todo, 1):
            pid = item["product_id"]
            name = item["name"]
            brand = item["brand"]
            print(f"[{idx}/{len(todo)}] Đang xử lý [{pid}] {brand} - {name}...")

            try:
                page.goto(f"https://www.sephora.com/product/{pid}", wait_until="domcontentloaded", timeout=35000)
                page.wait_for_timeout(1500)
                url = extract_image_url(page)

                if not url:
                    print(f"  -> Không tìm thấy ảnh (có thể đã ngừng bán)")
                    log_result(log_file, pid, "no_image")
                    fails_in_row += 1
                else:
                    saved_url = save_image(url, pid, out_dir)
                    print(f"  -> Đã lưu ảnh: {pid}.webp")
                    log_result(log_file, pid, "ok", saved_url)
                    fails_in_row = 0
            except Exception as e:
                print(f"  -> Lỗi: {e}")
                log_result(log_file, pid, "error")
                fails_in_row += 1

            if fails_in_row >= 8:
                print("\n[CẢNH BÁO] 8 lần thất bại liên tiếp (có thể Sephora đang chặn IP hoặc dính Captcha).")
                print("Tạm dừng script. Bạn có thể mở lại với cờ '--headed' để vượt Captcha bằng tay.")
                break

            sleep_sec = random.uniform(*DELAY)
            time.sleep(sleep_sec)

        browser.close()
        print("\nHoàn tất phiên tải!")


if __name__ == "__main__":
    main()
