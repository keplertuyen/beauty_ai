#!/usr/bin/env python3
"""Syntheprise Framework architectural-seam guard (OPTIONAL, opt-in example template).

This is a GENERIC template, not an enabled gate. It is NOT wired into any
default quality gate or pre-commit config. Copy it, configure the three
constants below for your project, wire it where you want it (pre-commit,
CI, `syntheprise gate`), and keep the allowlist minimal.

What it does
------------
Guards an architectural seam: a configured set of libraries may only be
imported from a configured "adapters/providers" package. Everywhere else
importing those libs — or instantiating a concrete provider, or calling a
provider's private method — is a violation. This keeps a swappable seam
intact so an implementation (one HTTP client, one vendor SDK, one data
source) can be replaced without touching call-sites across the codebase.

How to configure
----------------
  SCAN_ROOT         package to scan (repo-relative)
  PROVIDERS_DIRNAME the ONE directory under SCAN_ROOT where the libs may live
  GUARDED_LIBS      import names that must stay behind the seam
  RULES             optional extra regex rules (concrete instantiation, etc.)
  ALLOW_FILE        minimal allowlist of exempt paths (e.g. composition root)

Usage:
    python scripts/check-provider-abstraction.py [--changed-only]
Exit 0 = clean, 1 = violation(s).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# --- Configure for your project --------------------------------------------
# Package to scan (repo-relative). Default is a conventional Python source dir.
SCAN_ROOT = ROOT / "src"
# The ONE directory (by name, anywhere under SCAN_ROOT) where guarded libs
# legitimately live — the adapters/providers seam.
PROVIDERS_DIRNAME = "providers"
# Import names that must only be imported inside the providers dir. Replace
# these placeholders with the libraries your project wants to keep behind the
# seam (e.g. "requests", "boto3", a vendor SDK, ...).
GUARDED_LIBS = ["example_vendor_sdk", "example_http_client"]
# Minimal allowlist of exempt repo-relative paths (e.g. the composition root).
ALLOW_FILE = ROOT / "scripts" / "provider_abstraction_allow.txt"
# ---------------------------------------------------------------------------

_LIBS = "|".join(re.escape(name) for name in GUARDED_LIBS) or r"(?!x)x"
RULES = [
    ("lib-import-outside-providers",
     re.compile(rf"^\s*(?:from|import)\s+(?:{_LIBS})\b")),
    # Example extra rules — uncomment/adapt to your concrete provider classes:
    # ("concrete-provider-instantiation",
    #  re.compile(r"\b(?:FooProvider|BarProvider)\s*\(")),
    # ("private-provider-method-call",
    #  re.compile(r"\._call_\w+\b|\._get_\w+_sync\s*\(")),
]


def _load_allow() -> set[str]:
    allow: set[str] = set()
    if ALLOW_FILE.exists():
        for line in ALLOW_FILE.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                allow.add(line)
    return allow


def _changed_py_files() -> list[Path]:
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout
    except Exception:
        return []
    files = []
    for rel in out.splitlines():
        p = ROOT / rel
        if p.suffix == ".py" and p.is_relative_to(SCAN_ROOT):
            files.append(p)
    return files


def _iter_files(changed_only: bool) -> list[Path]:
    if changed_only:
        return _changed_py_files()
    if not SCAN_ROOT.exists():
        return []
    return sorted(SCAN_ROOT.rglob("*.py"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--changed-only", action="store_true",
                    help="only scan files changed vs HEAD (fast pre-commit path)")
    args = ap.parse_args()

    allow = _load_allow()
    violations: list[str] = []
    allowed_hits = 0

    for path in _iter_files(args.changed_only):
        # The providers dir is where the libs live — always exempt.
        if PROVIDERS_DIRNAME in path.relative_to(ROOT).parts:
            continue
        rel = path.relative_to(ROOT).as_posix()
        exempt = rel in allow
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except Exception:
            continue
        for n, line in enumerate(lines, start=1):
            if line.lstrip().startswith("#"):
                continue
            for rule_name, pat in RULES:
                if pat.search(line):
                    if exempt:
                        allowed_hits += 1
                    else:
                        violations.append(f"{rel}:{n}: [{rule_name}] {line.strip()}")

    if violations:
        print("provider-abstraction guard FAILED — "
              f"{len(violations)} violation(s):\n", file=sys.stderr)
        for v in violations:
            print(f"  {v}", file=sys.stderr)
        print(f"\nFix: route access through the '{PROVIDERS_DIRNAME}' seam so the "
              "implementation stays swappable.", file=sys.stderr)
        return 1

    scope = "changed files" if args.changed_only else str(SCAN_ROOT.relative_to(ROOT))
    extra = f" ({len(allow)} allowlisted path(s), {allowed_hits} exempt hit(s))" if allow else ""
    print(f"provider-abstraction guard OK — no leaks in {scope}{extra}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
