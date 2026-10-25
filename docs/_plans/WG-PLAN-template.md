---
doc: work-group-plan
title: "WG-P<n>-<id>: <name>"
status: in_progress      # not_started | in_progress | blocked | done
precedence: 5
owner: <WG owner>
last_updated: <YYYY-MM-DD>
parent: docs/_plans/P<n>/PHASE-PLAN.md
traces: [FR-...-01, ADR-00NN]   # link requirements & decisions
---

# WG-P<n>-<id>: <work-group name>

> LIVE worklog — updated every session. Tracks tasks, outputs, tech, and decisions continuously.

## 1. Objective & scope
<what this work-group delivers; in/out of scope>

## 2. Tasks
| Task id | Description | Output | Tech | Status | Commit/PR |
|---|---|---|---|---|---|
| WG-P<n>-<id>-T1 | <...> | <artifact> | <stack/lib> | <status> | <sha/link> |

## 3. Decision log (local decisions)
> Structural decisions go to `docs/adr/` instead. Promote a local decision to an ADR once it affects other work-groups/phases.
| Date | Decision | Rationale / trade-off | Scope | Promote to ADR? |
|---|---|---|---|---|
| <YYYY-MM-DD> | <...> | <...> | local | no / ADR-00NN |

## 4. Worklog (append newest at top)
- <YYYY-MM-DD>: did <...>; blockers <...>; next <...>.

## 5. Definition of Done (this WG)
- [ ] Outputs delivered; tests green; decisions recorded; status rolled up to Master.
