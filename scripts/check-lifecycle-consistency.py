#!/usr/bin/env python3
"""check-lifecycle-consistency.py — enforce Syntheprise Framework's own close-out/merge lifecycle so
the framework cannot merge or archive a change that violates the rules it asks
projects to follow (v5.7.4 — closes the empty-archive / draft-merge false-greens).

Default (archive integrity + repo hygiene):
  - every ARCHIVED change has the FULL required artifact set for its type;
  - archived `tasks.md`: status == done AND every task checkbox is checked;
  - archived `review.md`: status == signed;
  - a state snapshot in docs/_states referencing the change id exists;
  - docs/_plans/MASTER-PLAN.md exists;
  - the committed dashboard is current (`syntheprise_dashboard.py --check`).

--merge (also assert ACTIVE changes are merge-ready, per the canonical rule that
review is signed and tasks ticked before a PR merges):
  - active `review.md`: status in {signed, accepted};
  - active `tasks.md`: every checkbox checked.

Exit 0 = consistent, 1 = violations.
"""
from pathlib import Path
import os
import re
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syntheprise_trace  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CHANGES = ROOT / "docs" / "_changes"
ARCHIVE = CHANGES / "_archive"
PLANS = ROOT / "docs" / "_plans"
STATES = ROOT / "docs" / "_states"

REQUIRED = {
    "CR": ["proposal.md", "requirements-delta.md", "design.md", "test-plan.md", "tasks.md", "review.md"],
    "TECH": ["proposal.md", "requirements-delta.md", "design.md", "test-plan.md", "tasks.md", "review.md"],
    "BUGFIX": ["bugfix.md", "test-plan.md", "tasks.md", "review.md"],
    "FAST": ["change.md"],
}


def _status(p: Path):
    if not p.exists():
        return None
    m = re.search(r"(?m)^status:\s*(\S+)", p.read_text(encoding="utf-8", errors="ignore")[:600])
    return m.group(1).strip() if m else None


def _mode() -> str:
    q = ROOT / ".syntheprise-quality.yml"
    if q.exists():
        m = re.search(r"(?m)^\s*mode:\s*(\w+)", q.read_text(encoding="utf-8", errors="ignore"))
        if m:
            return m.group(1)
    return "team"


def _github_evidence():
    """Best-effort GitHub check via the adapter: True (independent approval), False
    (determinably none), or None (undeterminable — fall back to attestation)."""
    adapter = ROOT / "scripts" / "review_evidence_github.py"
    if not adapter.exists():
        return None
    try:
        r = subprocess.run([sys.executable, str(adapter), "--quiet"],
                           cwd=ROOT, capture_output=True, text=True, timeout=30)
    except Exception:
        return None
    return {0: True, 1: False}.get(r.returncode, None)


def _independent_review_evidence(review: Path):
    """Team mode requires evidence of a reviewer independent of the author. Channels:
    (1) a verified GitHub approval from a non-author; (2) an `Independent-review:`
    attestation line recorded in review.md. Returns (ok, detail)."""
    gh = _github_evidence()
    if gh is True:
        return True, "github approval"
    txt = review.read_text(encoding="utf-8", errors="ignore") if review.exists() else ""
    m = re.search(r"(?mi)^\s*[-*]?\s*Independent-review:\s*(\S.+)$", txt)
    attested = bool(m and m.group(1).strip() and m.group(1).strip().lower() not in ("none", "n/a", "-"))
    if attested:
        return True, "attestation line"
    return False, ("github: no independent approval" if gh is False else "no evidence")


def _snapshot_links(change_id: str) -> bool:
    # Match on the CR-YYYY-NNN number prefix (snapshots reference the change by
    # number, not always the full slug).
    m = re.match(r"([A-Z]+-\d{4}-\d{3})", change_id)
    key = m.group(1) if m else change_id
    for base in (STATES, STATES / "_archive"):
        if not base.exists():
            continue
        for p in base.glob("*.md"):
            if key in p.read_text(encoding="utf-8", errors="ignore"):
                return True
    return False


def main() -> int:
    merge = "--merge" in sys.argv
    problems = []

    if ARCHIVE.exists():
        for d in sorted(ARCHIVE.iterdir()):
            if not d.is_dir():
                continue
            prefix = d.name.split("-", 1)[0].upper()
            req = REQUIRED.get(prefix, [])
            for f in req:
                if not (d / f).exists():
                    problems.append(f"archive/{d.name}: missing required artifact {f}")
            tasks, review = d / "tasks.md", d / "review.md"
            if tasks.exists():
                if _status(tasks) != "done":
                    problems.append(f"archive/{d.name}/tasks.md: status must be 'done'")
                tot, dn = syntheprise_trace.checkbox_stats(tasks.read_text(encoding="utf-8", errors="ignore"))
                if tot and dn < tot:
                    problems.append(f"archive/{d.name}/tasks.md: {tot - dn} task checkbox(es) still unchecked")
            if review.exists() and _status(review) != "signed":
                problems.append(f"archive/{d.name}/review.md: status must be 'signed'")
            if not _snapshot_links(d.name):
                problems.append(f"archive/{d.name}: no state snapshot in docs/_states references it")

    if merge:
        for d in sorted(CHANGES.iterdir()):
            if not d.is_dir() or d.name.endswith("-template") or d.name == "_archive":
                continue
            review, tasks = d / "review.md", d / "tasks.md"
            if review.exists() and _status(review) not in ("signed", "accepted"):
                problems.append(f"{d.name}/review.md: not merge-ready (status must be signed/accepted before a PR merges)")
            if tasks.exists():
                tot, dn = syntheprise_trace.checkbox_stats(tasks.read_text(encoding="utf-8", errors="ignore"))
                if tot and dn < tot:
                    problems.append(f"{d.name}/tasks.md: {tot - dn} task(s) unchecked — not merge-ready")
            # Team mode: a signed review must have independent-reviewer evidence.
            if (_mode() == "team" and not os.environ.get("SYNTHEPRISE_ALLOW_SELF_REVIEW")
                    and review.exists() and _status(review) in ("signed", "accepted")):
                ok, detail = _independent_review_evidence(review)
                if not ok:
                    problems.append(
                        f"{d.name}/review.md: team mode requires independent review evidence "
                        f"({detail}) — add an `Independent-review: @<reviewer>` line, get a GitHub "
                        f"approval from a non-author, or set SYNTHEPRISE_ALLOW_SELF_REVIEW=1")

    if not (PLANS / "MASTER-PLAN.md").exists():
        problems.append("docs/_plans/MASTER-PLAN.md is missing (required by the MASTER-PLAN/dashboard rule)")

    try:
        r = subprocess.run([sys.executable, str(ROOT / "scripts" / "syntheprise_dashboard.py"), "--check"],
                           cwd=ROOT, capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            tail = (r.stdout + r.stderr).strip().splitlines()
            problems.append(tail[-1] if tail else "dashboard snapshot is stale")
    except Exception as e:
        problems.append(f"could not run dashboard --check: {e}")

    print("Syntheprise Framework lifecycle-consistency check" + (" (merge phase)" if merge else "") + "\n" + "=" * 34)
    if problems:
        for p in problems:
            print(f"  ERROR  {p}")
        print(f"\n{len(problems)} lifecycle issue(s).")
        return 1
    print("  OK — archives complete + closed out; MASTER-PLAN present; dashboard current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
