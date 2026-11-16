"""Download + standardize to 800x800-bounded WebP q85 (requires Pillow)."""
from __future__ import annotations

import io
import urllib.request
from pathlib import Path

USER_AGENT = "BeautyAI-student-project/0.1 (image provenance pipeline)"
MAX_SIDE = 800


def make_downloader(out_dir: Path, public_prefix: str = "/images/products", timeout_s: float = 30):
    from PIL import Image  # lazy: tests don't need Pillow

    out_dir.mkdir(parents=True, exist_ok=True)

    def download(url: str, pid: str) -> str:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout_s) as r:
            data = r.read()
        img = Image.open(io.BytesIO(data))
        if img.mode not in ("RGB",):
            img = img.convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        img.save(out_dir / f"{pid}.webp", "WEBP", quality=85)
        return f"{public_prefix}/{pid}.webp"

    return download
