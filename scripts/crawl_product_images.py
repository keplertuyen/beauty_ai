#!/usr/bin/env python3
"""
scripts/crawl_product_images.py — BeautyAI Standardized Product Image Harvester

Protocol for harvesting verified real cosmetic photography:
1. Exact SKU Grounding: Maps Kaggle Sephora product codes (P-code) to official Sephora SKU IDs (s-code).
2. Sephora CDN High-Res Zoom Fetch:
   Template: https://www.sephora.com/productimages/sku/{sku}-main-zoom.jpg
   Headers: Must include standard Chrome desktop User-Agent and Referer: https://www.sephora.com/
3. Brand Direct CDN Fallback (for items not hosted on Sephora US, e.g. Paula's Choice EU):
   Uses official brand media assets directly without referer restrictions.
4. WebP Image Standardization:
   - Resized/proportioned to 800x800px using Lanczos resampling.
   - Saved as WebP (lossy quality 85) to src/frontend/public/images/products/{product_id}.webp.
5. Database & Asset Sync:
   - Integrates with scripts/sync_image_data.py to update CSV datasets and generate SQL updates.
"""

import sys
import os
import io
import time
import argparse
import urllib.request
from PIL import Image

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.sephora.com/',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
}

OUTPUT_DIR = 'src/frontend/public/images/products'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_and_process_image(url: str, output_path: str, custom_headers=None) -> bool:
    """Download image from URL, convert to 800x800 WebP, and save."""
    req_headers = custom_headers or HEADERS
    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            if resp.status == 200:
                data = resp.read()
                img = Image.open(io.BytesIO(data))
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                img.save(output_path, format="WEBP", quality=85)
                print(f" [OK] Saved {output_path} ({len(data)} B -> {os.path.getsize(output_path)} B WebP)")
                return True
            else:
                print(f" [ERR] HTTP {resp.status} for {url}")
                return False
    except Exception as e:
        print(f" [ERR] Failed {url}: {e}")
        return False

def download_sephora_sku(pid: str, sku: str, force: bool = False) -> bool:
    """Download Sephora SKU and save as {pid}.webp."""
    pid = pid.strip()
    sku = sku.strip()
    if not sku.startswith('s'):
        sku = f"s{sku}"
    
    out_path = os.path.join(OUTPUT_DIR, f"{pid}.webp")
    if os.path.exists(out_path) and not force:
        print(f" [SKIP] {pid} already exists at {out_path}")
        return True

    url = f"https://www.sephora.com/productimages/sku/{sku}-main-zoom.jpg"
    return download_and_process_image(url, out_path)

def main():
    parser = argparse.ArgumentParser(description="BeautyAI Product Image Harvester")
    parser.add_argument("--pid", type=str, help="Product code (e.g. P469502)")
    parser.add_argument("--sku", type=str, help="Sephora SKU ID (e.g. s2421360 or 2421360)")
    parser.add_argument("--url", type=str, help="Direct image URL if not from Sephora SKU")
    parser.add_argument("--force", action="store_true", help="Force re-download even if file exists")
    parser.add_argument("--sync", action="store_true", help="Run sync_image_data.py after downloading")
    args = parser.parse_args()

    if args.pid and args.sku:
        success = download_sephora_sku(args.pid, args.sku, args.force)
        if success and args.sync:
            os.system("python3 scripts/sync_image_data.py")
        sys.exit(0 if success else 1)
    elif args.pid and args.url:
        out_path = os.path.join(OUTPUT_DIR, f"{args.pid}.webp")
        headers = {'User-Agent': HEADERS['User-Agent']}
        success = download_and_process_image(args.url, out_path, headers)
        if success and args.sync:
            os.system("python3 scripts/sync_image_data.py")
        sys.exit(0 if success else 1)
    else:
        print("Usage:")
        print("  python3 scripts/crawl_product_images.py --pid P469502 --sku s2421360 --sync")
        print("  python3 scripts/crawl_product_images.py --pid P480627 --url 'https://...' --sync")
        sys.exit(1)

if __name__ == "__main__":
    main()
