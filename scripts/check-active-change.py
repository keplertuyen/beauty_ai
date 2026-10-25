#!/usr/bin/env python3
"""PreToolUse reminder hook for source-code edits.

Wired via .claude/settings.json under hooks.PreToolUse with matcher
"Edit|Write|MultiEdit". The hook is ADVISORY ONLY — it ALWAYS exits 0 so
nothing is blocked. Its job is to remind the agent of the change-folder rule
when a source-code path is about to be modified without an in-progress
change folder.

SOURCE_PREFIXES is a generic default. Projects with a different source layout
can override it via the SYNTHEPRISE_SOURCE_PREFIXES environment variable, a
comma-separated list (e.g. "src/,packages/,apps/").
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def _source_prefixes() -> tuple[str, ...]:
    raw = os.environ.get("SYNTHEPRISE_SOURCE_PREFIXES", "")
    if raw.strip():
        return tuple(p.strip() for p in raw.split(",") if p.strip())
    return ("src/", "scripts/")


SOURCE_PREFIXES = _source_prefixes()
PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")).resolve()


def _read_payload() -> dict:
    if sys.stdin.isatty():
        return {}
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except Exception:
        return {}


def _is_source_path(file_path: str) -> bool:
    if not file_path:
        return False
    try:
        candidate = Path(file_path)
        if candidate.is_absolute():
            try:
                rel = candidate.relative_to(PROJECT_ROOT)
            except ValueError:
                return False
            file_path = str(rel)
        else:
            file_path = file_path.lstrip("./")
    except Exception:
        return False
    return file_path.startswith(SOURCE_PREFIXES)


def _has_active_change() -> bool:
    """Return True iff the working tree has an in-progress change folder.

    A proposal.md is "in-progress" when git reports it as modified, added,
    untracked, or staged — i.e. the user is actively building or amending
    the change in this session. Standing proposals that are already
    committed do not count: they represent prior work, not the work
    currently being done.
    """
    try:
        out = subprocess.run(
            [
                "git",
                "status",
                "--porcelain",
                "--untracked-files=all",
                "--",
                "docs/_changes/",
            ],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except Exception:
        return False
    if out.returncode != 0:
        return False
    for line in out.stdout.splitlines():
        # Porcelain format: "XY path" — first two chars are status flags.
        # Any non-empty status means the file is in the working tree's
        # uncommitted set. We only need to see one CHANGE-*/proposal.md
        # entry to consider the change "active".
        path = line[3:].strip()
        if "CHANGE-" in path and path.endswith("/proposal.md"):
            return True
    return False


def main() -> int:
    payload = _read_payload()
    tool_name = payload.get("tool_name") or payload.get("toolName") or ""
    if tool_name not in {"Edit", "Write", "MultiEdit"}:
        return 0

    tool_input = payload.get("tool_input") or payload.get("toolInput") or {}
    file_path = tool_input.get("file_path") or tool_input.get("path") or ""

    if not _is_source_path(file_path):
        return 0
    if _has_active_change():
        return 0

    print(
        "Reminder (change-folder rule): about to edit a source path\n"
        f"    ({file_path}) but no in-progress docs/_changes/CHANGE-*/proposal.md\n"
        "    is in the working tree. Verify this qualifies as a small bug fix\n"
        "    under the change-management criteria; if not, create the change\n"
        "    folder first.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
