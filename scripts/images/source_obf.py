"""Tier 2 — Open Beauty Facts search API (BUGFIX-PRODUCT-IMAGES T4).

Free, open data (ODbL; images CC BY-SA). Policy: identify with a custom
User-Agent; search is rate-limited (~10 req/min) -> caller must use a
RateLimiter with >= 6 s delay.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional

from .base import Candidate, ProductRef, SourceBlocked, SourceError
from .matcher import normalize, score

NAME = "open_beauty_facts"
SEARCH = "https://world.openbeautyfacts.org/cgi/search.pl"
PRODUCT_PAGE = "https://world.openbeautyfacts.org/product/{code}"
USER_AGENT = "BeautyAI-student-project/0.1 (image provenance pipeline)"


def build_url(product: ProductRef) -> str:
    q = {"search_terms": f"{product.brand} {product.name}", "search_simple": 1,
         "action": "process", "json": 1, "page_size": 10,
         "fields": "code,product_name,brands,image_front_url"}
    return f"{SEARCH}?{urllib.parse.urlencode(q)}"


def parse(payload: dict, product: ProductRef) -> Optional[Candidate]:
    """Pure: return the best-scoring result that has an image."""
    best, best_s = None, -1.0
    for p in payload.get("products") or []:
        img, name, brands = p.get("image_front_url"), p.get("product_name"), p.get("brands") or ""
        if not (img and name and p.get("code")):
            continue
        brand = brands.split(",")[0].strip()
        if not brand and normalize(name).startswith(normalize(product.brand) + " "):
            # brand omitted in OBF but embedded in name, e.g. "NARS Blush"
            brand = product.brand
            name = name[len(product.brand):].strip(" -")
        s = score(product.brand, product.name, brand, name)
        if s > best_s:
            best_s = s
            best = Candidate(img, PRODUCT_PAGE.format(code=p["code"]), brand, name, NAME)
    return best


class OpenBeautyFactsSource:
    name = NAME

    def __init__(self, timeout_s: float = 20, rate_limiter=None):
        self.timeout_s, self.rl = timeout_s, rate_limiter

    def find(self, product: ProductRef) -> Optional[Candidate]:
        if self.rl:
            self.rl.wait()
        req = urllib.request.Request(build_url(product), headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as r:
                payload = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                raise SourceBlocked(f"HTTP {e.code}") from e
            raise SourceError(f"HTTP {e.code}") from e
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            raise SourceError(str(e)) from e
        return parse(payload, product)
