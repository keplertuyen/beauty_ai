#!/usr/bin/env python3
"""Syntheprise Framework coverage threshold checker.

Supports common reports when present:
- coverage/coverage-summary.json (nyc/jest)
- coverage.xml (coverage.py/cobertura)
- lcov.info (line hit ratio)
If no report exists and `coverage.require_report` is false, the check passes.
"""
from __future__ import annotations
from pathlib import Path
import json, re, sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / '.syntheprise-quality.yml'

def threshold(default=70):
    line = default
    require = False
    if CONFIG.exists():
        text = CONFIG.read_text(encoding='utf-8', errors='ignore')
        m = re.search(r'line_threshold:\s*(\d+)', text)
        if m:
            line = int(m.group(1))
        require = bool(re.search(r'require_report:\s*true', text, re.I))
    return line, require

def from_summary_json(p: Path):
    data = json.loads(p.read_text(encoding='utf-8'))
    total = data.get('total', {})
    lines = total.get('lines', {})
    return float(lines.get('pct'))

def from_coverage_xml(p: Path):
    root = ET.parse(p).getroot()
    if 'line-rate' in root.attrib:
        return float(root.attrib['line-rate']) * 100
    return None

def from_lcov(p: Path):
    found = hit = 0
    for line in p.read_text(encoding='utf-8', errors='ignore').splitlines():
        if line.startswith('DA:'):
            found += 1
            try:
                if int(line.split(',', 1)[1]) > 0:
                    hit += 1
            except Exception:
                pass
    return (hit / found * 100) if found else None

reports = [
    (ROOT / 'coverage' / 'coverage-summary.json', from_summary_json),
    (ROOT / 'coverage.xml', from_coverage_xml),
    (ROOT / 'coverage' / 'lcov.info', from_lcov),
    (ROOT / 'lcov.info', from_lcov),
]
threshold_pct, require_report = threshold()
print('Syntheprise Framework coverage check')
print('=' * 24)
for p, parser in reports:
    if p.exists():
        pct = parser(p)
        if pct is None:
            continue
        print(f'  coverage: {pct:.2f}% from {p.relative_to(ROOT)}; threshold={threshold_pct}%')
        if pct + 1e-9 < threshold_pct:
            print('  ERROR coverage below threshold')
            sys.exit(1)
        print('  OK — coverage threshold met.')
        sys.exit(0)
if require_report:
    print('  ERROR no supported coverage report found and require_report=true')
    sys.exit(1)
print('  OK — no coverage report found; allowed by current .syntheprise-quality.yml.')
