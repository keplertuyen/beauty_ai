#!/usr/bin/env python3
"""Fail-closed static safety checks for GitHub Actions workflow supply chain."""
from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
UNSAFE_REFS = {"main", "master", "head", "latest", "dev", "develop"}


def findings_for(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    findings: list[str] = []
    if re.search(r"(?m)^  pull_request_target:", text):
        findings.append("pull_request_target is not allowed")
    if not re.search(r"(?m)^permissions:\s*$", text):
        findings.append("top-level least-privilege permissions are required")
    for line_number, match in enumerate(text.splitlines(), 1):
        found = re.search(r"^\s*-\s+uses:\s+([^@\s]+)@([^\s#]+)", match)
        if not found:
            continue
        action, ref = found.groups()
        if ref.lower() in UNSAFE_REFS:
            findings.append(
                f"line {line_number}: {action} uses floating ref @{ref}"
            )
    return findings


def main() -> int:
    findings: list[tuple[Path, str]] = []
    for path in sorted(WORKFLOWS.glob("*.yml")):
        findings.extend((path, item) for item in findings_for(path))
    print("Syntheprise workflow security check")
    print("=" * 36)
    for path, finding in findings:
        print(f"  ERROR {path.relative_to(ROOT)} — {finding}")
    if findings:
        return 1
    print("  OK — explicit permissions and non-floating action refs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
