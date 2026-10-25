#!/usr/bin/env python3
"""Print a stable digest of the generated client tree."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "packages" / "api-client"
digest = hashlib.sha256()
ignored = {"dist", "node_modules", ".openapi-generator"}
for path in sorted(
    item for item in ROOT.rglob("*")
    if (
        item.is_file()
        and item.name != ".openapi-generator-ignore"
        and not ignored.intersection(item.relative_to(ROOT).parts)
    )
):
    relative = path.relative_to(ROOT).as_posix()
    digest.update(relative.encode("utf-8"))
    digest.update(b"\0")
    digest.update(path.read_bytes())
    digest.update(b"\0")
print(digest.hexdigest())
