"""Tiered orchestration: for each product, try sources in order, verify,
download, record provenance. Resumable via the manifest.

A product is "final" in the manifest when status is verified or not_found;
error rows are retried on the next run.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable, Iterable, Sequence

from . import manifest as mf
from .base import Candidate, ImageSource, ProductRef, SourceBlocked, SourceError, with_retry
from .matcher import THRESHOLD, score

log = logging.getLogger(__name__)

# downloader(image_url, product_id) -> local public URL (e.g. /images/products/P1.webp)
Downloader = Callable[[str, str], str]


def run(products: Iterable[ProductRef],
        tiers: Sequence[tuple[int, ImageSource]],
        manifest_path: Path,
        downloader: Downloader,
        threshold: float = THRESHOLD,
        retry_sleep: Callable[[float], None] | None = None,
        max_consecutive_errors: int = 20) -> dict[str, int]:
    done = {pid for pid, r in mf.load(manifest_path).items()
            if r.get("status") in (mf.VERIFIED, mf.NOT_FOUND)}
    blocked: set[str] = set()
    stats = {"skipped": 0, mf.VERIFIED: 0, mf.NOT_FOUND: 0, mf.ERROR: 0}
    retry_kw = {"sleep": retry_sleep} if retry_sleep else {}
    consecutive_errors = 0

    items = list(products)
    total = len(items)
    for idx, p in enumerate(items, 1):
        if p.product_id in done:
            stats["skipped"] += 1
            continue
        if len(blocked) == len(tiers):
            log.warning("all sources blocked — stopping batch early")
            break
        outcome = None
        had_error = False
        for tier, src in tiers:
            if src.name in blocked:
                continue
            try:
                cand: Candidate | None = with_retry(lambda: src.find(p), **retry_kw)
            except SourceBlocked:
                log.warning("source %s blocked us — disabling for this run", src.name)
                blocked.add(src.name)
                continue
            except SourceError as e:
                log.info("%s %s error: %s", p.product_id, src.name, e)
                had_error = True
                continue
            if cand is None:
                continue
            s = score(p.brand, p.name, cand.brand, cand.name, id_anchored=cand.id_anchored)
            base = {"product_id": p.product_id, "tier": tier, "source": src.name,
                    "source_url": cand.source_url, "matched_brand": cand.brand,
                    "matched_name": cand.name, "match_score": f"{s:.3f}"}
            if s < threshold:
                mf.append(manifest_path, {**base, "status": mf.REJECTED})
                continue
            try:
                local = downloader(cand.image_url, p.product_id)
            except Exception as e:  # download/convert failure -> try next tier
                log.info("%s download failed: %s", p.product_id, e)
                had_error = True
                continue
            outcome = {**base, "image_url": local, "status": mf.VERIFIED}
            break
        if outcome is None:
            status = mf.ERROR if had_error else mf.NOT_FOUND
            outcome = {"product_id": p.product_id, "status": status}
        mf.append(manifest_path, outcome)
        stats[outcome["status"]] += 1
        log.info("[%d/%d] %s (%s - %s) -> %s", idx, total, p.product_id, p.brand, p.name, outcome["status"])
        if outcome["status"] == mf.ERROR:
            consecutive_errors += 1
            if consecutive_errors >= max_consecutive_errors:
                log.warning("hit %d consecutive errors — stopping batch early", consecutive_errors)
                break
        else:
            consecutive_errors = 0
    return stats
