#!/usr/bin/env python3
"""check-version-consistency.py — the VERSION file is the single source of truth
for the Syntheprise Framework kit version. This gate fails when a "current version" marker in the
docs or CLI drifts from VERSION.

Only CURRENT-version markers are checked (curated list below). Historical
references (CHANGELOG.md, UPGRADES.md, per-release headings, changelog examples)
are intentionally NOT checked — they are meant to name older versions.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def _version() -> str:
    return (ROOT / "VERSION").read_text(encoding="utf-8").strip()


# (relative path, regex with a `ver` group, human label). Each match's captured
# version must equal VERSION.
MARKERS = [
    ("README.md", r"\*\*Current implementation:\*\*\s*Syntheprise Framework\s*(?P<ver>v\d+\.\d+\.\d+)", "README current implementation"),
    ("README.md", r"Recommended start path \((?P<ver>v\d+\.\d+\.\d+)\)", "README start-path heading"),
    ("SYNTHEPRISE-FRAMEWORK-OVERVIEW.md", r"(?m)^version:\s*(?P<ver>v\d+\.\d+\.\d+)", "overview entry frontmatter"),
    ("docs/_guides/00-framework-overview.md", r"(?m)^version:\s*(?P<ver>v\d+\.\d+\.\d+)", "framework-overview frontmatter"),
    ("docs/_guides/00-framework-overview.md", r"\*\*Current implementation:\*\*\s*Syntheprise Framework\s*(?P<ver>v\d+\.\d+\.\d+)", "framework-overview current implementation"),
    ("scripts/syntheprise.py", r"Syntheprise Framework - The Human-Governed Agentic Development Framework. CLI \((?P<ver>v\d+\.\d+\.\d+)\)", "syntheprise.py docstring"),
]


def main() -> int:
    # In an initialized project repo (.syntheprise-project), the product has its own README/versioning.
    if (ROOT / ".syntheprise-project").exists():
        return 0
    version = _version()
    problems = []
    checked = 0
    for rel, pattern, label in MARKERS:
        p = ROOT / rel
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        m = re.search(pattern, text)
        if not m:
            problems.append(f"{rel}: expected a current-version marker ({label}) but none found")
            continue
        found = m.group("ver")
        checked += 1
        if found != version:
            problems.append(f"{rel}: {label} says {found}, but VERSION is {version}")
    print("Syntheprise Framework version-consistency check\n" + "=" * 32)
    if problems:
        for pr in problems:
            print(f"  ERROR  {pr}")
        print(f"\n{len(problems)} version-drift issue(s). VERSION = {version}")
        return 1
    print(f"  OK — {checked} current-version marker(s) match VERSION {version}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
