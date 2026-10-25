#!/usr/bin/env python3
"""syntheprise_kernel.py — v5.8.0 machine-readable state kernel.

Builds a structured, machine-readable model of a Syntheprise Framework repo DERIVED from the
existing Markdown artifacts (Markdown stays the human source of truth; the JSON
is a generated view, so there is never a second hand-maintained truth). Powers
`syntheprise status --json` and `syntheprise validate --json`.

Design:
  - build_model(): the structured state (version, mode, kind, changes with their
    artifact graph, tasks, traceability, dashboard counts).
  - run_validate(phase): a structured front-end over the canonical checker scripts
    so validation has ONE implementation; returns typed findings + an exit code
    (0 ok, 1 findings, 2 internal error).
"""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
CHANGES = ROOT / "docs" / "_changes"
ARCHIVE = CHANGES / "_archive"

sys.path.insert(0, str(SCRIPTS))
import syntheprise_trace  # noqa: E402

# The artifact dependency graph, per change type (ordered).
GRAPH = {
    "CR": ["proposal", "requirements-delta", "design", "test-plan", "tasks", "review"],
    "TECH": ["proposal", "requirements-delta", "design", "test-plan", "tasks", "review"],
    "BUGFIX": ["bugfix", "test-plan", "tasks", "review"],
    "FAST": ["change"],
}


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""


def _status(p: Path):
    m = re.search(r"(?m)^status:\s*(\S+)", _read(p)[:600])
    return m.group(1).strip() if m else None


def _mode() -> str:
    m = re.search(r"(?m)^\s*mode:\s*(\w+)", _read(ROOT / ".syntheprise-quality.yml"))
    return m.group(1) if m else "team"


def _kind() -> str:
    if (ROOT / ".syntheprise-kit").exists():
        return "kit"
    if (ROOT / ".syntheprise-project").exists():
        return "project"
    return "unknown"


def _change_state(d: Path, review_status, tasks_total, tasks_done, archived: bool) -> str:
    if archived:
        return "archived"
    if review_status in ("signed", "accepted") and (tasks_total == 0 or tasks_done == tasks_total):
        return "merge-ready"
    if _status(d / "proposal.md") not in (None, "template") or _status(d / "bugfix.md") not in (None, "template") or _status(d / "change.md") not in (None, "template"):
        return "authoring"
    return "draft"


def _snapshot_linked(change_id: str) -> bool:
    m = re.match(r"([A-Z]+-\d{4}-\d{3})", change_id)
    key = m.group(1) if m else change_id
    for base in (ROOT / "docs" / "_states", ROOT / "docs" / "_states" / "_archive"):
        if base.exists():
            for p in base.glob("*.md"):
                if key in _read(p):
                    return True
    return False


def _change_entry(d: Path, archived: bool) -> dict:
    prefix = d.name.split("-", 1)[0].upper()
    order = GRAPH.get(prefix, [])
    artifacts = []
    for name in order:
        fp = d / f"{name}.md"
        artifacts.append({"id": name, "present": fp.exists(), "status": _status(fp)})
    tt, td = syntheprise_trace.checkbox_stats(_read(d / "tasks.md"))
    rs = _status(d / "review.md")
    return {
        "id": d.name,
        "type": prefix,
        "location": "archived" if archived else "active",
        "state": _change_state(d, rs, tt, td, archived),
        "review_status": rs,
        "tasks_status": _status(d / "tasks.md"),
        "tasks": {"total": tt, "done": td},
        "artifacts": artifacts,
        "snapshot_linked": _snapshot_linked(d.name),
    }


def build_model() -> dict:
    active, archived = [], []
    if CHANGES.exists():
        for d in sorted(CHANGES.iterdir()):
            if d.is_dir() and not d.name.endswith("-template") and d.name != "_archive":
                active.append(_change_entry(d, False))
    if ARCHIVE.exists():
        for d in sorted(ARCHIVE.iterdir()):
            if d.is_dir():
                archived.append(_change_entry(d, True))
    mt, mtt = syntheprise_trace.coverage(_read(ROOT / "docs" / "traceability.md"))
    return {
        "schema_version": 1,
        "kind": _kind(),
        "version": _read(ROOT / "VERSION").strip() or "unknown",
        "mode": _mode(),
        "changes": {"active": active, "archived": archived},
        "traceability": {"must_total": mt, "must_with_test": mtt},
        "dashboard": {"active": len(active), "archived": len(archived)},
    }


# --- validation front-end (one implementation: the canonical checker scripts) ---

_PHASE_CHECKS = {
    "authoring": [["check-change-completeness.py"]],
    "merge": [["check-change-completeness.py"],
              ["check-lifecycle-consistency.py", "--merge"],
              ["check-version-consistency.py"],
              ["check-doc-drift.py", "--strict"]],
    "archive": [["check-change-completeness.py"],
                ["check-lifecycle-consistency.py"]],
}


def run_validate(phase: str) -> dict:
    checks = _PHASE_CHECKS.get(phase)
    if checks is None:
        return {"ok": False, "phase": phase, "error": f"unknown phase {phase!r}", "exit": 2}
    findings = []
    exit_code = 0
    for cmd in checks:
        script = cmd[0]
        try:
            r = subprocess.run([sys.executable, str(SCRIPTS / script), *cmd[1:]],
                               cwd=ROOT, capture_output=True, text=True, timeout=120)
        except Exception as e:  # internal error
            return {"ok": False, "phase": phase, "error": f"{script}: {e}", "exit": 2}
        if r.returncode != 0:
            exit_code = 1
            for line in (r.stdout + r.stderr).splitlines():
                s = line.strip()
                if s.startswith("ERROR"):
                    findings.append({
                        "check": script,
                        "category": "missing_evidence" if ("snapshot" in s or "unchecked" in s or "not merge-ready" in s) else "invalid_artifact",
                        "severity": "error",
                        "message": s[5:].strip() if s.startswith("ERROR") else s,
                    })
    return {"ok": exit_code == 0, "phase": phase, "findings": findings, "exit": exit_code}


# --- analyze: read-only cross-artifact consistency checks (v5.8.1) ---

def _find_change(change_id: str):
    for base in (CHANGES, ARCHIVE):
        d = base / change_id
        if d.is_dir():
            return d
    return None


def run_analyze(change_id: str, strict: bool = False) -> dict:
    """Read-only cross-artifact analysis of one change. Never mutates. Advisory by
    default (exit 0); --strict makes findings fail (exit 1). Missing change = exit 2."""
    d = _find_change(change_id)
    if d is None:
        return {"change": change_id, "ok": False, "error": "change not found", "exit": 2, "findings": []}
    proposal = _read(d / "proposal.md")
    design = _read(d / "design.md")
    reqdelta = _read(d / "requirements-delta.md")
    testplan = _read(d / "test-plan.md")
    tasks = _read(d / "tasks.md")
    review = _read(d / "review.md")
    findings = []

    def add(code, msg, severity="warning"):
        findings.append({"code": code, "severity": severity, "message": msg})

    # 1. change marks an ADR required but references no ADR record.
    if re.search(r"ADR required\?[\s\S]{0,120}\[[xX]\]\s*Yes", design) and "docs/adr/" not in (design + proposal):
        add("adr-missing-link", "design marks an ADR required but references no docs/adr/ record")

    # 2. review signed/accepted but tasks still have unchecked boxes.
    rs = _status(d / "review.md")
    tt, td = syntheprise_trace.checkbox_stats(tasks)
    if rs in ("signed", "accepted") and tt and td < tt:
        add("review-vs-tasks", f"review is {rs} but {tt - td} task(s) are unchecked", "error")

    # 3. requirements introduce FR IDs but the test plan lists no test cases.
    if re.search(r"\bFR-[A-Z0-9-]+\b", reqdelta) and not re.search(r"\bTC-[A-Z0-9-]+\b|Given/When/Then", testplan + tasks):
        add("req-without-test", "requirements delta names FR requirements but the test plan lists no test cases")

    # 4. tasks reference no requirement/AC/test — traceability gap.
    if tt and not re.search(r"\b(FR|AC|TC)-[A-Z0-9-]+\b", tasks):
        add("task-without-traceability", "tasks reference no requirement/AC/test IDs (traceability gap)")

    # 5. review asserts tests pass but records no test evidence.
    if re.search(r"(?i)tests?\b.{0,40}(pass|meaningful|green)", review) and not re.search(r"(?i)unittest|pytest|\bTC-|syntheprise gate|exit 0", review + testplan):
        add("review-without-test-evidence", "review asserts tests pass but records no test command/evidence")

    return {"change": change_id, "ok": not (strict and findings), "strict": strict,
            "findings": findings, "exit": (1 if (strict and findings) else 0)}


# --- converge: compare the implementation diff to the change artifacts and
#     PROPOSE follow-up tasks for uncovered gaps (v5.8.2). ---

import os as _os

_CODE_EXTS = (".py", ".js", ".ts", ".tsx", ".jsx", ".cs", ".rs", ".java", ".go", ".rb", ".kt")


def _changed_files(base: str | None):
    base = base or _os.environ.get("SYNTHEPRISE_BASE_SHA") or "origin/main"
    for rng in (f"{base}...HEAD", "HEAD"):
        try:
            out = subprocess.run(["git", "diff", "--name-only", rng], cwd=ROOT,
                                 capture_output=True, text=True, timeout=60)
            if out.returncode == 0:
                files = [x for x in out.stdout.splitlines() if x.strip()]
                if files or rng == "HEAD":
                    return files
        except Exception:
            continue
    return []


def run_converge(change_id: str, base: str | None = None, write: bool = False) -> dict:
    """Compare the implementation diff against the change artifacts and PROPOSE
    follow-up tasks for uncovered gaps. Read-only unless --write appends the
    proposals to the change's tasks.md. Missing change = exit 2."""
    d = _find_change(change_id)
    if d is None:
        return {"change": change_id, "ok": False, "error": "change not found", "exit": 2, "proposals": []}
    changed = _changed_files(base)
    proposals = []

    def propose(code, task, evidence=""):
        proposals.append({"code": code, "task": task, "evidence": evidence})

    # 1. every analyze finding becomes a proposed resolution task.
    for f in run_analyze(change_id).get("findings", []):
        propose(f"resolve-{f['code']}", f"Resolve analyze finding: {f['message']}", f["code"])

    # 2. code changed with no test change -> propose adding/verifying coverage.
    code_files = [c for c in changed if c.endswith(_CODE_EXTS) and "test" not in c.lower()]
    test_files = [c for c in changed if "test" in c.lower() or "/tests/" in c]
    if code_files and not test_files:
        propose("add-tests",
                f"Add or verify test coverage: {len(code_files)} code file(s) changed with no test change",
                ", ".join(code_files[:5]))

    # 3. merge readiness gaps.
    if _status(d / "review.md") not in ("signed", "accepted"):
        propose("sign-review", "Sign the review (status: signed) before merge", "review.md")
    tt, td = syntheprise_trace.checkbox_stats(_read(d / "tasks.md"))
    if tt and td < tt:
        propose("finish-tasks", f"Complete or defer {tt - td} unchecked task(s)", "tasks.md")

    written = False
    if write and proposals:
        tasks = d / "tasks.md"
        if tasks.exists():
            body = tasks.read_text(encoding="utf-8").rstrip() + "\n\n## Converge follow-ups\n\n"
            body += "".join(f"- [ ] {p['task']}\n" for p in proposals)
            tasks.write_text(body, encoding="utf-8")
            written = True

    return {"change": change_id, "ok": True, "changed_files": len(changed),
            "proposals": proposals, "written": written, "exit": 0}


# --- integrations: derive the external-integration lifecycle from the canonical
#     tech-stack inventory and reconcile declared state against the filesystem
#     (v5.9.2). Markdown is the source of truth; this is a read-only derived view. ---

_INTEG_STATUSES = ("planned", "active", "deprecated", "removed")
_INTEG_KINDS = ("provider", "service", "queue", "store", "llm", "other")
_ADAPTER_EXTS = (".py", ".js", ".ts", ".mjs", ".cjs", ".go", ".rs", ".java", ".cs", ".rb", ".kt")
# Seam infrastructure files that are not themselves integration adapters.
_SEAM_IGNORE = {"index.js", "index.ts", "factory.py", "factory.js", "factory.ts",
                "base.py", "capabilities.py", "resolver.py", "README.md", ".gitkeep"}


def _providers_dir() -> str:
    """The provider/adapter seam directory (repo-relative). Declared in
    `.syntheprise/project.yaml` as `providers_dir:`; defaults to the conventional
    `src/providers`. Used by the undeclared-adapter scan (v5.10)."""
    m = re.search(r"(?m)^\s*providers_dir:\s*(\S+)", _read(ROOT / ".syntheprise" / "project.yaml"))
    return m.group(1).strip().strip("\"'") if m else "src/providers"


def _scan_undeclared(declared_adapters) -> list:
    """Reverse-drift check (v5.10): adapter files under the seam directory that no
    declared integration references. Returns `undeclared-adapter` findings. Skips seam
    infrastructure and private (`_`-prefixed) files. No-op when the dir is absent."""
    pdir = ROOT / _providers_dir()
    if not pdir.is_dir():
        return []
    decl = {a.strip("/") for a in declared_adapters if a and a not in ("-", "—")}
    findings = []
    for p in sorted(pdir.rglob("*")):
        if not p.is_file() or p.suffix not in _ADAPTER_EXTS:
            continue
        if p.name in _SEAM_IGNORE or p.name.startswith("_") or "__pycache__" in p.parts:
            continue
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if any(rel == d or rel.startswith(d.rstrip("/") + "/") for d in decl):
            continue
        findings.append({"name": p.stem, "code": "undeclared-adapter", "adapter": rel})
    return findings


def _parse_integrations(text: str) -> list:
    """Parse the `## Integrations` table from docs/tech-stack.md. Columns:
    Name | Kind | Adapter | Status | Since | Notes. Placeholder/example rows
    (angle-bracketed or backtick-`<...>` cells) are skipped."""
    rows = []
    m = re.search(r"(?mi)^##\s+Integrations\b(.*?)(?=^\#\#\s|\Z)", text, re.S)
    if not m:
        return rows
    section = m.group(1)
    for ln in section.splitlines():
        s = ln.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip().strip("`") for c in s.strip("|").split("|")]
        if len(cells) < 4:
            continue
        name = cells[0]
        low = name.lower()
        if low in ("name", "") or set(name) <= set("-: "):
            continue  # header / separator row
        if name.startswith("<") or "example" in low or name.startswith("&lt;"):
            continue  # template placeholder row
        rows.append({
            "name": name,
            "kind": cells[1].lower(),
            "adapter": cells[2].strip(),
            "status": cells[3].lower(),
            "since": cells[4] if len(cells) > 4 else "",
            "notes": cells[5] if len(cells) > 5 else "",
        })
    return rows


def run_integrations(strict: bool = False) -> dict:
    """List declared external integrations and reconcile them against the filesystem.
    Read-only. Advisory (exit 0) by default; --strict fails (exit 1) on drift."""
    doc = ROOT / "docs" / "tech-stack.md"
    if not doc.exists():
        return {"ok": True, "integrations": [], "findings": [],
                "error": "docs/tech-stack.md not found", "exit": 0}
    rows = _parse_integrations(_read(doc))
    findings = []
    out = []
    for r in rows:
        adapter = r["adapter"]
        has_path = adapter not in ("", "-", "—")
        exists = has_path and (ROOT / adapter).exists()
        drift = None
        if r["status"] not in _INTEG_STATUSES:
            drift = "unknown-status"
        elif r["status"] == "active" and has_path and not exists:
            drift = "adapter-missing"
        elif r["status"] == "active" and not has_path:
            drift = "adapter-undeclared"
        elif r["status"] == "removed" and exists:
            drift = "lingering-adapter"
        if drift:
            findings.append({"name": r["name"], "code": drift, "status": r["status"],
                             "adapter": adapter})
        out.append({**r, "adapter_exists": exists, "drift": drift})
    undeclared = _scan_undeclared({r["adapter"] for r in rows})
    findings.extend(undeclared)
    return {"ok": not (strict and findings), "strict": strict,
            "integrations": out, "undeclared": undeclared, "findings": findings,
            "providers_dir": _providers_dir(),
            "exit": (1 if (strict and findings) else 0)}
