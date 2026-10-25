#!/usr/bin/env python3
"""CLI gate for component, blueprint and security-exception lifecycle."""
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

from component_lifecycle import check_catalog


ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--components", type=Path, default=ROOT / "presets/components")
    parser.add_argument("--blueprints", type=Path, default=ROOT / "presets/blueprints")
    parser.add_argument(
        "--policy",
        type=Path,
        default=ROOT / "presets/components/lifecycle-policy.json",
    )
    parser.add_argument(
        "--exceptions",
        type=Path,
        default=ROOT / "presets/security-exceptions.json",
    )
    parser.add_argument("--today", help="override policy date for deterministic tests")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    policy_date = date.fromisoformat(args.today) if args.today else None
    try:
        report = check_catalog(
            args.components,
            args.blueprints,
            args.policy,
            args.exceptions,
            today=policy_date,
        )
    except (ValueError, OSError) as exc:
        report = {
            "schema_version": 1,
            "errors": [{
                "code": "invalid-policy-input",
                "subject": "catalog",
                "message": str(exc),
            }],
        }
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("Syntheprise component lifecycle check")
        print("=" * 37)
        for finding in report["errors"]:
            print(
                f"  ERROR {finding['code']}: {finding['subject']} — "
                f"{finding['message']}"
            )
        if not report["errors"]:
            print(
                f"  OK — {report['component_count']} components and "
                f"{report['certified_blueprint_count']} certified blueprints "
                "are within policy."
            )
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
