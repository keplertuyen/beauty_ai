#!/usr/bin/env python3
"""check-change-completeness.py — ensure active change folders carry the artifacts
their type requires AND that those artifacts are genuinely filled in (not the
scaffold with a one-word status flip).

Semantic checks (v5.7.3 — closes the one-word-bypass false-green):
  - required files exist;
  - frontmatter `status:` is present and not `template`;
  - no scaffold placeholder tokens remain (CHANGE-ID-HERE, <PROJECT NAME>, <...>, ...);
  - the artifact is not identical to its scaffold template after normalizing BOTH
    the id token AND the status value (so flipping only `template`->`draft` still fails).

Archive readiness (status: done/signed, dashboard sync, MASTER-PLAN, snapshots) is
enforced separately by check-lifecycle-consistency.py.

Template folders (*-template) and docs/_changes/_archive are ignored.
Exit 0 = all present and filled, 1 = problems.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CHANGES = ROOT / "docs" / "_changes"

REQUIRED = {
    "CR": ["proposal.md", "requirements-delta.md", "design.md", "test-plan.md", "tasks.md", "review.md"],
    "TECH": ["proposal.md", "requirements-delta.md", "design.md", "test-plan.md", "tasks.md", "review.md"],
    "BUGFIX": ["bugfix.md", "test-plan.md", "tasks.md", "review.md"],
    "FAST": ["change.md"],
}
TEMPLATE_DIR = {"CR": "CHANGE-template", "TECH": "CHANGE-template",
                "BUGFIX": "BUGFIX-template", "FAST": "FASTLANE-template"}
_ID_TOKENS = ("CHANGE-ID-HERE", "BUGFIX-ID-HERE", "FAST-ID-HERE")
# Placeholder tokens that must not survive into a filled artifact.
# Only tokens the SCAFFOLD actually emits. (`<change-id>` is NOT one — it is
# legitimate CLI-argument syntax that filled artifacts may reference in prose.)
SCAFFOLD_TOKENS = ["CHANGE-ID-HERE", "BUGFIX-ID-HERE", "FAST-ID-HERE",
                   "<PROJECT NAME>", "<YYYY-MM-DD>", "<...>"]


def _status(text: str) -> str | None:
    m = re.search(r"(?m)^status:\s*(\S+)", text[:600])
    return m.group(1).strip() if m else None


def _norm(text: str, change_id: str) -> str:
    """Normalize id token AND status value so a filled artifact is only equal to
    the template when nothing but the id/status was changed."""
    t = text.replace(change_id, "CHANGE-ID-HERE")
    for tok in _ID_TOKENS:
        t = t.replace(tok, "CHANGE-ID-HERE")
    t = re.sub(r"(?m)^status:\s*\S+", "status: template", t)
    return "\n".join(ln.rstrip() for ln in t.strip().splitlines())


def _sentinels(tmpl_text: str) -> list[str]:
    """Substantive placeholder lines from a template. If any survives verbatim in
    the active artifact, that section was not filled in (defeats 'template + one
    appended line'). Headings, frontmatter, tables separators and short lines are
    ignored to avoid false positives."""
    out = []
    in_fm = False
    for i, ln in enumerate(tmpl_text.splitlines()):
        s = ln.strip()
        if i == 0 and s == "---":
            in_fm = True
            continue
        if in_fm:
            if s == "---":
                in_fm = False
            continue
        # Skip headings, code fences, and ALL table rows — table headers/structure
        # are legitimately reused by filled artifacts. Distinctive PROSE is enough
        # to catch an unfilled section ("template + one appended line").
        if not s or s.startswith("#") or s.startswith("|") or s.startswith("```"):
            continue
        if len(s) >= 12:
            out.append(s)
    return out


def main() -> int:
    if not CHANGES.exists():
        print("no docs/_changes — nothing to check.")
        return 0
    problems = []
    checked = 0
    for d in sorted(CHANGES.iterdir()):
        if not d.is_dir() or d.name.endswith("-template") or d.name == "_archive":
            continue
        prefix = d.name.split("-", 1)[0].upper()
        req = REQUIRED.get(prefix)
        if not req:
            problems.append(f"{d.name}: unknown change prefix '{prefix}' (expect CR/TECH/BUGFIX/FAST)")
            continue
        checked += 1
        tmpl_dir = CHANGES / TEMPLATE_DIR.get(prefix, "")
        for f in req:
            fp = d / f
            if not fp.exists():
                problems.append(f"{d.name}: missing {f}")
                continue
            text = fp.read_text(encoding="utf-8", errors="ignore")
            st = _status(text)
            if st is None:
                problems.append(f"{d.name}/{f}: missing frontmatter status")
                continue
            if st == "template":
                problems.append(f"{d.name}/{f}: still a scaffold (status: template) — fill it in")
                continue
            hit = next((t for t in SCAFFOLD_TOKENS if t in text), None)
            if hit:
                problems.append(f"{d.name}/{f}: unfilled placeholder token '{hit}' remains")
                continue
            tp = tmpl_dir / f
            if tp.exists():
                tmpl_text = tp.read_text(encoding="utf-8", errors="ignore")
                if _norm(text, d.name) == _norm(tmpl_text, d.name):
                    problems.append(f"{d.name}/{f}: unchanged from the scaffold template (id/status flip only) — fill it in")
                    continue
                surviving = [s for s in _sentinels(tmpl_text) if s in text]
                if surviving:
                    problems.append(f"{d.name}/{f}: template placeholder still present ({surviving[0][:50]!r}) — fill that section")
    print("Syntheprise Framework change-completeness check\n" + "=" * 32)
    if problems:
        for p in problems:
            print(f"  ERROR  {p}")
        print(f"\n{len(problems)} issue(s) across active changes.")
        return 1
    print(f"  OK — {checked} active change(s) present and filled.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
