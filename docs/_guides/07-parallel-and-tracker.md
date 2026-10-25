---
doc: parallel-and-tracker-guide
title: Parallel Work, Tracker & Dashboard — Syntheprise Framework v5.3
status: stable
precedence: 6
owner: PM / Delivery Excellence
last_reviewed: 2026-06-17
---

# Parallel Work, Tracker & Dashboard (team)

How multiple people (and agents) work concurrently under Syntheprise Framework without stepping
on each other.

## 1. One change = one folder = one owner
Each change lives in its own `docs/_changes/<CHANGE-ID>/` with a single owner in
`proposal.md`. Because changes are isolated folders, several can be in flight at
once with minimal merge conflict — this is Syntheprise Framework's natural parallelism unit.

Convention:
- `CR-YYYY-NNN-*` feature/behavior change
- `BUGFIX-YYYY-NNN-*` bug fix (root-cause + regression guard)
- `TECH-YYYY-NNN-*` technical/refactor change
- `FAST-YYYY-NNN-*` Tier-0 fast-lane slice

## 2. Parallel tasks inside a change — the `[P]` marker
In a change's `tasks.md`, mark tasks with no dependency on each other using `[P]`
in the Description. Rules:
- One thin slice = one commit/PR.
- `[P]` tasks can be picked up by different people concurrently.
- `syntheprise dashboard` counts `[P]` tasks; `syntheprise push-tasks` labels their issues `parallel`.

## 3. Tracker integration
```bash
syntheprise push-tasks CR-2026-001-add-invoice-export --to github   # or jira | linear
```
Writes an import-ready file to `docs/_dashboard/` (no network, no credentials).
Each issue keeps the Syntheprise Framework `Requirement / AC` link for two-way traceability.
Paste the created issue keys back into the change's `tasks.md`.

## 4. Status dashboard
```bash
syntheprise dashboard
```
Generates `docs/_dashboard/status.html` (+ `status.md`): active vs archived
changes, task progress, parallel-task counts, and Must-FR traceability coverage.
Use it in weekly review and to feed the Syntheprise Framework Adoption Program adoption metrics.

## 5. Avoiding conflicts
- Keep changes small and short-lived; archive promptly with `syntheprise change archive`.
- Two changes touching the same contract → sequence them, or split the contract
  edit into its own `TECH-*` change that both depend on.
- After archiving, always sync accepted deltas into canonical docs so the next
  change branches from current truth.
