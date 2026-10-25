#!/usr/bin/env python3
"""review_evidence_github.py — team-mode independent-review evidence adapter (v5.10.1).

Best-effort, read-only: asks GitHub (via the `gh` CLI) whether the current branch's
pull request has at least one APPROVED review from a login other than the PR author —
i.e. a genuinely independent reviewer, which team mode requires before a merge.

Exit codes:
  0  independent approval found
  1  determinably NO independent approval (a PR exists, but no non-author approval)
  2  cannot determine (no `gh`, not authenticated, no PR for this branch, or error)

Callers (check-lifecycle-consistency.py in team mode) treat exit 2 as "fall back to
the recorded `Independent-review:` attestation channel". This adapter contains no
business logic beyond the GitHub shape → normalized boolean; the pure helper is
unit-tested offline.
"""
from __future__ import annotations
import json
import shutil
import subprocess
import sys


def independent_approval(reviews, author_login: str) -> bool:
    """True if any review is APPROVED by a login different from the PR author."""
    for rv in reviews or []:
        login = (rv.get("author") or {}).get("login")
        if rv.get("state") == "APPROVED" and login and login != author_login:
            return True
    return False


def _gh_pr_json():
    """Return the PR's {reviews, author} via `gh`, or None when undeterminable."""
    if not shutil.which("gh"):
        return None
    try:
        r = subprocess.run(["gh", "pr", "view", "--json", "reviews,author"],
                           capture_output=True, text=True, timeout=30)
    except Exception:
        return None
    if r.returncode != 0 or not r.stdout.strip():
        return None
    try:
        return json.loads(r.stdout)
    except Exception:
        return None


def main() -> int:
    quiet = "--quiet" in sys.argv
    data = _gh_pr_json()
    if data is None:
        if not quiet:
            print("review-evidence: cannot determine (no gh / not authenticated / no PR) — exit 2")
        return 2
    author = (data.get("author") or {}).get("login", "")
    ok = independent_approval(data.get("reviews", []), author)
    if not quiet:
        print(f"review-evidence: {'independent approval found' if ok else 'no independent approval'} "
              f"(author={author or '?'})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
