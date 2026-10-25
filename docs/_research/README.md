---
doc: research-notes-readme
title: Research & Exploration Notes
status: stable
precedence: 5
owner: SA / TA
last_reviewed: <YYYY-MM-DD>
---

# docs/_research/

Home for **research and exploration notes**: options explored, technology
comparisons, and trade-off narratives produced while studying a problem —
captured **before** a plan/ADR/change is written, and optionally refined
**after** implementation with lessons learned.

These notes have long-term reference value. They complement — but do not
replace — the canonical decision records:

| Artifact | Lives in | Captures |
|---|---|---|
| Full research narrative, comparisons, alternatives | `docs/_research/` (here) | The *how we got there* |
| Chosen architecture decision + trade-offs | `docs/adr/` (ADR) | The *decision* |
| Per-change proposal & technical design | `docs/_changes/<ID>/proposal.md`, `design.md` | The *scoped change* |
| Review record & evidence | `docs/_review/` | Post-hoc *verification* |

An ADR records the decision; a change folder records the scoped change. Neither
is the place for the exploration that led there — that narrative lives here.

## Rules

1. **Always commit.** Never leave a research note untracked — untracked files are
   not recoverable from git and are easily lost. The quality gate warns when this
   folder has uncommitted files.
2. **Never delete or bulk-clean.** These files are preserved indefinitely. Do not
   include `docs/_research/` in any `git clean` or bulk `rm` cleanup.
3. **Link to the ADR it informed.** When a research note drives a structural
   decision, open an **ADR** in `docs/adr/` and link back to the note here, so the
   *how* and the *decision* stay connected.
