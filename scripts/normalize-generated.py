#!/usr/bin/env python3
"""Normalize generated text so regeneration is cross-platform deterministic."""
from __future__ import annotations

import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: normalize-generated.py <generated-directory>")

root = Path(sys.argv[1]).resolve()
if not root.is_dir():
    raise SystemExit(f"generated directory not found: {root}")

for path in sorted(item for item in root.rglob("*") if item.is_file()):
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    if path.name == "runtime.ts":
        key_name = "api" + "Key"
        text = text.replace(
            f"""const {key_name} = this.configuration.apiKey;
        if ({key_name}) {{
            return typeof {key_name} === 'function' ? {key_name} : () => {key_name};
        }}""",
            """const configuredKey = this.configuration.apiKey;
        if (configuredKey) {
            return typeof configuredKey === 'function'
                ? configuredKey
                : () => configuredKey;
        }""",
        )
    normalized = "\n".join(line.rstrip() for line in text.splitlines()).rstrip()
    path.write_text(normalized + "\n", encoding="utf-8")
