"""Tier 1 — Sephora product page by P-code (BUGFIX-PRODUCT-IMAGES T3).

Opens https://www.sephora.com/product/{pid} in a real browser, reads JSON-LD
Product (fallback og:*). Rejects redirects to a different product.
Never bypasses bot protection: 403/429/captcha -> SourceBlocked.
"""
from __future__ import annotations

import html as htmllib
import json
import re
from typing import Optional

from .base import Candidate, ProductRef, SourceBlocked, SourceError

NAME = "sephora_page"
URL = "https://www.sephora.com/product/{pid}"
_LD = re.compile(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', re.S | re.I)
_META = re.compile(r'<meta[^>]+property=["\']og:(title|image)["\'][^>]+content=["\']([^"\']+)', re.I)
_BLOCK_MARKERS = ("access denied", "are you a robot", "px-captcha", " reference #")


def _first(v):
    return v[0] if isinstance(v, list) and v else v


_LINKSTORE = re.compile(r'<script[^>]+id=["\']linkStore["\'][^>]*>(.*?)</script>', re.S | re.I)


def _parse_linkstore(html: str, final_url: str, pid: str) -> Optional[Candidate]:
    """Primary: page state JSON on a /product/ page (either exact pid or
    Sephora's official 301 P-code upgrade, which still must pass matcher's
    5-rule cross-check). Image query string is dropped to avoid badge overlays."""
    m = _LINKSTORE.search(html or "")
    if not m:
        return None
    try:
        prod = json.loads(m.group(1))["page"]["product"]
    except (ValueError, KeyError, TypeError):
        return None
    det = prod.get("productDetails") or {}
    page_pid = (det.get("productId") or prod.get("productId") or "").upper()
    if not page_pid.startswith("P"):
        return None
    img = ((prod.get("currentSku") or {}).get("skuImages") or {}).get("imageUrl", "")
    img = img.split("?")[0]
    brand = (det.get("brand") or {}).get("displayName", "")
    name = det.get("displayName", "")
    if not (img.startswith("http") and name):
        return None
    return Candidate(img, final_url, htmllib.unescape(brand), htmllib.unescape(name), NAME,
                     id_anchored=True)


def _valid_img(u) -> bool:
    return isinstance(u, str) and u.startswith("http") and "sephora_logo" not in u.lower()


def parse(html: str, final_url: str, pid: str) -> Optional[Candidate]:
    """Pure parser. None if redirected away from a /product/ page (e.g. /search, /shop)."""
    u = (final_url or "").lower()
    if "/product/" not in u:
        return None
    c = _parse_linkstore(html, final_url, pid)
    if c:
        return c
    if pid.lower() not in u:
        return None
    for block in _LD.findall(html or ""):
        try:
            data = json.loads(block.strip())
        except ValueError:
            continue
        for it in data if isinstance(data, list) else [data]:
            if not isinstance(it, dict) or it.get("@type") != "Product":
                continue
            brand = _first(it.get("brand"))
            brand = brand.get("name", "") if isinstance(brand, dict) else (brand or "")
            img = _first(it.get("image"))
            if _valid_img(img) and it.get("name"):
                return Candidate(img, final_url, htmllib.unescape(brand),
                                 htmllib.unescape(it["name"]), NAME)
    meta = dict((k.lower(), v) for k, v in _META.findall(html or ""))
    if _valid_img(meta.get("image")) and meta.get("title"):
        # og:title format: "<Product Name> - <Brand> | Sephora"
        title = htmllib.unescape(meta["title"]).split("|")[0].strip()
        name, _, brand = title.rpartition(" - ")
        if name and brand:
            return Candidate(meta["image"], final_url, brand.strip(), name.strip(), NAME)
    return None


class SephoraPageSource:
    name = NAME

    def __init__(self, headed: bool = True, timeout_ms: int = 35000, rate_limiter=None):
        self.headed, self.timeout_ms, self.rl = headed, timeout_ms, rate_limiter
        self._pw = self._browser = self._page = None

    def __enter__(self):
        from playwright.sync_api import sync_playwright
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(headless=not self.headed)
        self._page = self._browser.new_page(locale="en-US", viewport={"width": 1280, "height": 900})
        return self

    def __exit__(self, *exc):
        if self._browser:
            self._browser.close()
        if self._pw:
            self._pw.stop()

    def find(self, product: ProductRef) -> Optional[Candidate]:
        from playwright.sync_api import Error as PwError
        if self.rl:
            self.rl.wait()
        try:
            resp = self._page.goto(URL.format(pid=product.product_id),
                                   wait_until="domcontentloaded", timeout=self.timeout_ms)
            self._page.wait_for_timeout(1500)
        except PwError as e:
            raise SourceError(str(e)) from e
        status = resp.status if resp else 0
        if status in (403, 429):
            raise SourceBlocked(f"HTTP {status}")
        if status == 404:
            return None
        if status >= 500 or status == 0:
            raise SourceError(f"HTTP {status}")
        html = self._page.content()
        cand = parse(html, self._page.url, product.product_id)
        if cand is not None:
            return cand
        low = html[:15000].lower()
        if any(m in low for m in _BLOCK_MARKERS):
            raise SourceBlocked("bot challenge page")
        return None
