---
doc: change-tasks-template
title: Change Tasks Template
status: template
precedence: 5
owner: pm-dev-lead
last_reviewed: 2026-06-17
---

# Change Tasks

> Mark tasks that have no dependency on each other with `[P]` (parallel). The
> dashboard counts `[P]` tasks, and `syntheprise push-tasks` labels their issues
> `parallel` so a team can pick them up concurrently. One thin slice = one commit/PR.

| Task ID | Description | Owner | Depends On | Requirement / AC | Status |
|---|---|---|---|---|---|
| T1 | QA test design | QA |  | FR-NEW-001 / AC-NEW-001 | Draft |
| T2 | Implementation | Dev | T1 | FR-NEW-001 / AC-NEW-001 | Draft |
| T3 | Update docs/traceability `[P]` | Dev | T2 | FR-NEW-001 / AC-NEW-001 | Draft |
| T4 | Review and gate | QA/TA | T2 | FR-NEW-001 / AC-NEW-001 | Draft |

## Worklog
| Date | Actor | Change | Evidence |
|---|---|---|---|
| 2026-06-17 |  |  |  |
