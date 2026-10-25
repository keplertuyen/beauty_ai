---
doc: bugfix-test-plan-template
title: Bugfix Test Plan Template
status: template
precedence: 3
owner: qa
last_reviewed: 2026-06-17
---

# Bugfix Test Plan

## Reproduction test (write first — must FAIL before the fix)
| Test ID | Steps | Expected (post-fix) | Currently |
|---|---|---|---|
| TC-BUG-001 |  |  | failing |

## Regression tests (must STAY green)
| Test ID | Behavior protected | Linked to "unchanged behavior" row |
|---|---|---|
| TC-REG-001 |  |  |

## Exit criteria
- Reproduction test passes after fix.
- All regression tests green.
- No new lint/type errors.
