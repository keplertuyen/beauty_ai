#!/usr/bin/env python3
"""Lightweight doc drift checker for V5.

Flags changes that commonly require documentation updates. This script is a
starter quality gate; project teams should extend patterns for their stack.
"""
from pathlib import Path
import os, subprocess, sys, re

ROOT = Path(__file__).resolve().parents[1]
changed_only = "--changed-only" in sys.argv
warnings = []
errors = []


def _git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True, stderr=subprocess.DEVNULL)


def _changed_files():
    """Files changed in this PR/branch.

    In CI a PR's changes are already committed, so a plain `git diff HEAD`
    (working tree) is empty. Diff against the base instead: SYNTHEPRISE_BASE_SHA /
    SYNTHEPRISE_BASE_REF (set by CI) or origin/<default>; fall back to the working tree.
    """
    base = os.environ.get("SYNTHEPRISE_BASE_SHA") or os.environ.get("SYNTHEPRISE_BASE_REF")
    for rng in ([f"{base}...HEAD"] if base else []) + ["origin/main...HEAD", "HEAD"]:
        try:
            out = _git("diff", "--name-only", rng)
            files = [Path(p) for p in out.splitlines() if p.strip()]
            if files or rng == "HEAD":
                return files
        except Exception:
            continue
    return []


changed = _changed_files()

if changed_only and not changed:
    print("Doc drift check: no git diff available or no changed files.")
    sys.exit(0)

strict = "--strict" in sys.argv
# (pattern, message, docs that satisfy the requirement — any one changed clears it)
sensitive_patterns = [
    (re.compile(r"(^|/)(migrations?|db|schema)/", re.I), "Database/schema changed; update docs/data-contracts.md / docs/db-schema/ or an ADR.", ("docs/data-contracts.md", "docs/db-schema/", "docs/adr/")),
    (re.compile(r"(^|/)(routes?|controllers?|api)/", re.I), "API surface changed; update docs/api-contract.md.", ("docs/api-contract.md", "docs/adr/")),
    (re.compile(r"(^|/)(auth|security|permissions?)/", re.I), "Auth/security changed; update docs/security-policy.md and ADR if needed.", ("docs/security-policy.md", "docs/adr/")),
    (re.compile(r"(^|/)(prompts?|llm)/|(^|/)agents?/", re.I), "LLM/agent behavior changed; update docs/llm-policy.md or AGENTS.md.", ("docs/llm-policy.md", "AGENTS.md")),
]

changed_str = {str(p).replace("\\", "/") for p in changed}


def _commit_range_attested() -> bool:
    """Attestation via commit message, so it works in CI (which passes no extra argv).
    An owner writes `[no-doc-impact]` in a commit message on this branch to record that
    a flagged change carries no doc impact — auditable in git history."""
    try:
        base = os.environ.get("SYNTHEPRISE_BASE_SHA")
        rng = f"{base}..HEAD" if base else "-1"
        msgs = _git("log", "--format=%B", rng)
    except Exception:
        try:
            msgs = _git("log", "-1", "--format=%B")
        except Exception:
            return False
    return "[no-doc-impact]" in msgs


# Escape hatch: attest a no-doc-impact change (owner-recorded) to satisfy strict mode —
# via env var, an argv marker, or a `[no-doc-impact]` commit message on the branch.
attested = (os.environ.get("SYNTHEPRISE_DOC_ATTEST", "")
            or ("[no-doc-impact]" in " ".join(sys.argv))
            or _commit_range_attested())


def _doc_present(docs):
    return any(any(c == d or c.startswith(d) for c in changed_str) for d in docs)


for s in changed_str:
    for pat, msg, docs in sensitive_patterns:
        if pat.search(s):
            if strict and not _doc_present(docs) and not attested:
                errors.append(f"{s}: {msg} (no matching doc changed; add the doc or set SYNTHEPRISE_DOC_ATTEST)")
            else:
                warnings.append(f"{s}: {msg}")

print("Doc drift check")
print("===============")
for e in sorted(set(errors)):
    print(f"ERROR {e}")
for w in sorted(set(warnings)):
    print(f"warn  {w}")
if not warnings and not errors:
    print("OK — no obvious doc drift patterns detected.")
sys.exit(1 if errors else 0)
