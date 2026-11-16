"""Provenance manifest: one row per product attempted (append-only, resumable)."""
from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path

FIELDS = ["product_id", "tier", "source", "source_url", "image_url",
          "matched_brand", "matched_name", "match_score", "status", "fetched_at"]

# status values
VERIFIED = "verified"        # image downloaded and matched
REJECTED = "rejected"        # candidate found but failed matcher
NOT_FOUND = "not_found"      # no source had it -> placeholder
ERROR = "error"              # transient errors exhausted


def load(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8", newline="") as f:
        return {r["product_id"]: r for r in csv.DictReader(f)}


def append(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    new = not path.exists()
    full = {k: "" for k in FIELDS}
    full.update(row)
    full.setdefault("fetched_at", "")
    if not full["fetched_at"]:
        full["fetched_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with path.open("a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        if new:
            w.writeheader()
        w.writerow(full)
