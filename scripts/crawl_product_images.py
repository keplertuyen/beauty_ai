#!/usr/bin/env python3
"""Retired legacy script (BUGFIX-PRODUCT-IMAGES).

Guessed SKU harvesting was removed because it produced unverified/wrong product
photos. Use `scripts/harvest_images.py --batch <N> --size 500` instead.
"""
import sys

if __name__ == "__main__":
    sys.stderr.write(
        "ERROR: scripts/crawl_product_images.py is retired (BUGFIX-PRODUCT-IMAGES).\n"
        "Use: scripts/images/.venv/bin/python scripts/harvest_images.py --batch 1 --size 500\n"
    )
    raise SystemExit(1)
