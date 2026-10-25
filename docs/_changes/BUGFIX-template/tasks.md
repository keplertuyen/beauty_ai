---
doc: bugfix-tasks-template
title: Bugfix Tasks Template
status: template
precedence: 5
owner: dev-lead
last_reviewed: 2026-06-17
---

# Bugfix Tasks

> Mark tasks that can run concurrently with `[P]` in the Description.

| Task ID | Description | Owner | Depends On | Requirement / AC | Status |
|---|---|---|---|---|---|
| T1 | Write failing reproduction test | QA |  | TC-BUG-001 | Draft |
| T2 | Implement root-cause fix | Dev | T1 | BUGFIX-ID-HERE | Draft |
| T3 | Add/confirm regression tests `[P]` | QA | T1 | TC-REG-001 | Draft |
| T4 | Review + quality gate | QA/TA | T2,T3 | BUGFIX-ID-HERE | Draft |

## Worklog
| Date | Actor | Change | Evidence |
|---|---|---|---|
| 2026-06-17 |  |  |  |
