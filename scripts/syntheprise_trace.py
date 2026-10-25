#!/usr/bin/env python3
"""syntheprise_trace.py — one shared parser for docs/traceability.md, used by BOTH
check-traceability.py and syntheprise_dashboard.py so they can never disagree (the
v5.7.3 fix for "checker excludes the placeholder row, dashboard counts it as
100%"). Placeholder / template example rows are excluded from coverage.
"""
import re

REQUIRED_COLUMNS = ["Requirement ID", "Acceptance Criteria ID", "Test Case ID",
                    "Implementation Task", "Status"]


def parse_rows(text: str):
    """Return list of cell-lists for real table rows (excludes header + separators)."""
    rows = [ln for ln in text.splitlines() if ln.lstrip().startswith("|") and "---" not in ln]
    out = []
    for r in rows:
        cells = [c.strip() for c in r.strip().strip("|").split("|")]
        out.append(cells)
    # drop the header row (contains "Requirement ID")
    return [c for c in out if not any("Requirement ID" in x for x in c)]


def is_placeholder(cells) -> bool:
    """A row is a template example ONLY when it is explicitly marked as such
    (an `(example)` / `template` note in the row) or is empty / still has angle
    placeholders. We do NOT infer placeholder from an ID ending in 001 — a real
    project's first requirement legitimately uses AC-001 / FR-...-001."""
    joined = " ".join(cells)
    if not joined.strip():
        return True
    low = joined.lower()
    if "(example)" in low or "template-example" in low or "example row" in low:
        return True
    if "<" in joined and ">" in joined:
        return True
    return False


def checkbox_stats(text: str):
    """(total, done) for GitHub-style task checkboxes: `- [ ]` / `- [x]`."""
    total = done = 0
    for ln in text.splitlines():
        m = re.match(r"\s*[-*]\s*\[( |x|X)\]\s+\S", ln)
        if m:
            total += 1
            if m.group(1).lower() == "x":
                done += 1
    return total, done


def coverage(text: str):
    """(must_total, must_with_test) over REAL (non-placeholder) rows only."""
    total = 0
    with_test = 0
    for cells in parse_rows(text):
        if is_placeholder(cells):
            continue
        total += 1
        joined = " ".join(cells).upper()
        if re.search(r"\bTC[-\w]|\bTEST", joined) and not re.search(r"\bTC-0*0*1\b", joined):
            with_test += 1
    return total, with_test


def missing_columns(text: str):
    return [c for c in REQUIRED_COLUMNS if c not in text]
