#!/usr/bin/env python3
"""syntheprise_tracker.py — export a change's tasks.md into a tracker import file.

Solves v5.2 gap G6 (no tracker integration). Parses the task table of a change
folder and emits an import-ready file for GitHub Issues, Jira, or Linear, keeping
the Syntheprise Framework traceability ID (Requirement / AC) on every issue.

This writes a file by design (no network, no credentials handled here — that keeps
it safe and CI-friendly). A human imports it, or a thin CI step posts it.

Usage:
  syntheprise push-tasks <change-id> --to github [--out <file>]
  syntheprise push-tasks <change-id> --to jira
  syntheprise push-tasks <change-id> --to linear
"""
from __future__ import annotations
import argparse
import csv
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CHANGES = REPO / "docs" / "_changes"


def _find_change(change_id: str) -> Path | None:
    direct = CHANGES / change_id
    if direct.exists():
        return direct
    arch = CHANGES / "_archive"
    if arch.exists():
        for d in arch.iterdir():
            if d.name.endswith(change_id):
                return d
    return None


def _parse_tasks(folder: Path):
    """Yield dicts for each task row across tasks.md files in the change."""
    tasks = []
    for tf in folder.glob("**/tasks.md"):
        header = None
        for line in _read(tf).splitlines():
            if not line.strip().startswith("|"):
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if set("".join(cells)) <= {"-", " "}:
                continue
            if header is None:
                header = [c.lower() for c in cells]
                continue
            if cells[0].lower() in ("task id", "date"):
                continue
            if not cells[0]:
                continue
            row = dict(zip(header, cells))
            tid = row.get("task id") or cells[0]
            if not re.match(r"^[A-Za-z]*\d", tid):
                continue
            tasks.append({
                "id": tid,
                "title": row.get("description", cells[1] if len(cells) > 1 else tid),
                "owner": row.get("owner", ""),
                "depends_on": row.get("depends on", ""),
                "requirement": row.get("requirement / ac", row.get("requirement / ac ", "")),
                "status": row.get("status", ""),
                "parallel": "[P]" in " ".join(cells),
            })
    return tasks


def _read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return ""


def _github(tasks, change_id):
    items = []
    for t in tasks:
        body = (f"**Change:** {change_id}\n**Task:** {t['id']}\n"
                f"**Requirement/AC:** {t['requirement'] or 'n/a'}\n"
                f"**Depends on:** {t['depends_on'] or 'none'}\n"
                f"**Owner:** {t['owner'] or 'unassigned'}\n")
        labels = ["syntheprise", change_id]
        if t["parallel"]:
            labels.append("parallel")
        items.append({"title": f"[{t['id']}] {t['title']}", "body": body, "labels": labels})
    return json.dumps(items, indent=2, ensure_ascii=False), "json"


def _linear(tasks, change_id):
    items = []
    for t in tasks:
        items.append({
            "title": f"{t['id']} — {t['title']}",
            "description": f"Change {change_id} · Req {t['requirement'] or 'n/a'} · "
                           f"depends:{t['depends_on'] or 'none'}",
            "labels": ["Syntheprise Framework", "parallel"] if t["parallel"] else ["Syntheprise Framework"],
        })
    return json.dumps(items, indent=2, ensure_ascii=False), "json"


def _jira(tasks, change_id):
    # Jira CSV external import format.
    rows = [["Summary", "Description", "Labels", "Assignee", "Issue Type"]]
    for t in tasks:
        rows.append([
            f"[{t['id']}] {t['title']}",
            f"Change {change_id}; Requirement {t['requirement'] or 'n/a'}; "
            f"depends {t['depends_on'] or 'none'}",
            "syntheprise parallel" if t["parallel"] else "syntheprise",
            t["owner"], "Task",
        ])
    import io
    buf = io.StringIO()
    csv.writer(buf).writerows(rows)
    return buf.getvalue(), "csv"


EXPORTERS = {"github": _github, "jira": _jira, "linear": _linear}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="syntheprise push-tasks")
    ap.add_argument("change_id")
    ap.add_argument("--to", default="github", choices=list(EXPORTERS))
    ap.add_argument("--out")
    args = ap.parse_args(argv)

    folder = _find_change(args.change_id)
    if not folder:
        print(f"no such change: {args.change_id}", file=__import__("sys").stderr)
        return 1
    tasks = _parse_tasks(folder)
    if not tasks:
        print(f"no task rows found in {folder.relative_to(REPO)}", file=__import__("sys").stderr)
        return 1
    content, ext = EXPORTERS[args.to](tasks, args.change_id)
    out = Path(args.out) if args.out else (REPO / "docs" / "_dashboard" /
                                           f"tracker-{args.to}-{args.change_id}.{ext}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    print(f"push-tasks: {len(tasks)} task(s) -> {out.relative_to(REPO)} "
          f"(import into {args.to}). No data was sent over the network.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
