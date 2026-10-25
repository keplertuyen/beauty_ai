#!/usr/bin/env python3
"""Check V5 traceability matrix hygiene (shared parser, mode-aware).

Framework/kit repo (.syntheprise-kit): the matrix is a template example — only the
columns must be present. Project repo (.syntheprise-project): at least one REAL
(non-placeholder) requirement row is required, and real rows must carry
requirement/AC/test cells. Uses syntheprise_trace so the dashboard cannot disagree.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syntheprise_trace  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
TRACE = ROOT / "docs" / "traceability.md"
IS_KIT = (ROOT / ".syntheprise-kit").exists() and not (ROOT / ".syntheprise-project").exists()

errors = []
warnings = []

if not TRACE.exists():
    errors.append("missing docs/traceability.md")
else:
    text = TRACE.read_text(encoding="utf-8")
    for col in syntheprise_trace.missing_columns(text):
        errors.append(f"traceability matrix missing column: {col}")
    real_rows = [c for c in syntheprise_trace.parse_rows(text) if not syntheprise_trace.is_placeholder(c)]
    for cells in real_rows:
        if len(cells) < 8:
            warnings.append(f"traceability row has too few columns: {' | '.join(cells)[:120]}")
        elif any(c == "" for c in cells[1:4]):
            errors.append(f"traceability row missing requirement/AC/test: {' | '.join(cells)[:120]}")
    if not IS_KIT and not real_rows:
        errors.append("traceability matrix has only template/placeholder rows — add real requirement traceability")

print("Traceability check")
print("==================")
for e in errors:
    print(f"ERROR {e}")
for w in warnings:
    print(f"warn  {w}")
if not errors and not warnings:
    tag = " (kit template — example rows allowed)" if IS_KIT else ""
    print(f"OK — traceability matrix present{tag}.")
sys.exit(1 if errors else 0)
