#!/usr/bin/env python3
"""Syntheprise Framework worktree-isolation guard (enforces the worktree-isolation rule).

Dependency-free. Prevents the class of failure where two agent sessions run
git-write sequences (close-out) in the SAME primary checkout, interleaving
branch switches/commits -> orphaned commits, wrong-PR merges, lost code.

This is a LOCAL working-state check — meant for the pre-commit hook, NOT CI.
(CI legitimately checks out feature branches in a single worktree, so it is
skipped there.)

Fails (exit 1) when EITHER:
  1. Committing from the PRIMARY checkout (main worktree) on a NON-`main`
     named branch — work branches must live in a dedicated `git worktree`.
  2. Another worktree/session currently holds the close-out session-lock
     (concurrent git-write sequence -> serialize).

Escape hatch (owner-approved exception): set `SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1`.

Usage:  python scripts/check-worktree-isolation.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import session_lock as sl  # noqa: E402

ALLOWED_PRIMARY_BRANCHES = {"main", "HEAD"}  # HEAD = detached (rebase/bisect) — skip


def _is_ci() -> bool:
    # Only skip in GitHub Actions (the CI that runs our workflows). A generic
    # CI=true (some dev sandboxes set it) must NOT disable local enforcement.
    return bool(os.environ.get("GITHUB_ACTIONS"))


def main() -> int:
    if _is_ci():
        return 0  # CI checks out branches in one worktree by design
    if os.environ.get("SYNTHEPRISE_ALLOW_PRIMARY_BRANCH") == "1":
        return 0  # explicit owner-approved exception

    errors: list[str] = []

    branch = sl.current_branch()
    if sl.is_main_worktree() and branch not in ALLOWED_PRIMARY_BRANCHES:
        errors.append(
            f"In the PRIMARY checkout on branch '{branch}' (not main).\n"
            f"  -> Work branches MUST live in a dedicated worktree. Create one: ./syntheprise worktree <change-id>\n"
            f"  -> The primary checkout is reserved for 'main'."
        )

    other = sl.held_by_other()
    if other:
        errors.append(
            f"Another session/worktree holds the close-out lock: "
            f"worktree={other.get('worktree')} branch={other.get('branch')} label={other.get('label')}.\n"
            f"  -> Do NOT run a concurrent close-out/commit sequence. Wait or coordinate; "
            f"if the lock is stale: ./syntheprise close-out --release."
        )

    if errors:
        print("worktree-isolation guard failed:", file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        print(
            "\n  Exception (owner-approved): SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1 git commit ...",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
