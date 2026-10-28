#!/usr/bin/env python3
"""Syntheprise Framework secret scanner.

Dependency-free, conservative scan for committed secrets. It is not a replacement
for enterprise scanners such as GitHub secret scanning, TruffleHog, Gitleaks, or
cloud-provider scanners, but it catches common mistakes before AI-assisted code
is merged.
"""
from __future__ import annotations
from pathlib import Path
import argparse, re, sys

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {'.git', '.venv', 'venv', 'node_modules', 'dist', 'build', 'coverage', '__pycache__', '.pytest_cache', 'bin', 'obj', 'data'}
EXCLUDE_SUFFIXES = {'.zip', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.lock', '.csv'}
ALLOW_FILES = {'.env.example'}
PATTERNS = [
    ('private-key-block', re.compile(r'-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----')),
    ('aws-access-key', re.compile(r'\bAKIA[0-9A-Z]{16}\b')),
    ('google-api-key', re.compile(r'\bAIza[0-9A-Za-z_\-]{35}\b')),
    ('github-token', re.compile(r'\bgh[pousr]_[A-Za-z0-9_]{36,}\b')),
    ('slack-token', re.compile(r'\bxox[baprs]-[0-9A-Za-z-]{20,}\b')),
    ('generic-secret-assignment', re.compile(r'(?i)\b(secret|password|passwd|api[_-]?key|token)\b\s*[:=]\s*["\']?[A-Za-z0-9_./+\-=]{24,}["\']?')),
]
PLACEHOLDER_WORDS = {'example', 'placeholder', 'changeme', 'your_', '<', '{{', 'dummy', 'test'}

def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if any(part in EXCLUDE_DIRS for part in rel.parts):
        return True
    if path.name in ALLOW_FILES:
        return True
    if path.suffix.lower() in EXCLUDE_SUFFIXES:
        return True
    # Skip archive / review / proof-of-concept trees: these hold historical or
    # scratch material, not shipping source, and generate noisy false positives.
    if any(part in {'PoC', '_archive', '_review'} for part in rel.parts):
        return True
    return False

def is_placeholder(line: str) -> bool:
    low = line.lower()
    return any(w in low for w in PLACEHOLDER_WORDS)

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--path', default='.', help='path under repo to scan')
    args = ap.parse_args()
    base = (ROOT / args.path).resolve()
    findings = []
    for p in base.rglob('*') if base.is_dir() else [base]:
        if not p.is_file() or should_skip(p):
            continue
        try:
            text = p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if is_placeholder(line):
                continue
            for name, pat in PATTERNS:
                if pat.search(line):
                    findings.append((p.relative_to(ROOT), i, name))
    print('Syntheprise Framework secret scan')
    print('=' * 24)
    if findings:
        for rel, line, name in findings[:50]:
            print(f'  ERROR {name}: {rel}:{line}')
        if len(findings) > 50:
            print(f'  ... {len(findings)-50} more finding(s)')
        return 1
    print('  OK — no obvious secrets found.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
