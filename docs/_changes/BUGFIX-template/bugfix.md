---
doc: bugfix-spec-template
title: Bugfix Spec Template
status: template
precedence: 3
owner: qa-dev-lead
last_reviewed: 2026-06-17
---

# Bugfix Spec

> Surgical bug fixing with regression prevention. Adapted for Syntheprise Framework from a
> dedicated bugfix workflow. Create with: `syntheprise change new "<name>" --type BUG`.

## Bug ID
BUGFIX-ID-HERE

## Severity & impact
| Severity | Affected users / systems | Frequency | Workaround |
|---|---|---|---|
| Sev-1/2/3 |  |  |  |

## Behavior analysis
| Aspect | Description | Evidence |
|---|---|---|
| Current (buggy) behavior |  | log / repro steps |
| Expected behavior |  | requirement / AC ref |
| Unchanged behavior (must NOT regress) |  | tests to keep green |

## Root cause
Explain the actual cause, not just the symptom. Link the offending code path.

## Fix approach
Smallest safe change. State the blast radius and rollback.

## Regression guard
- Failing test that reproduces the bug (added FIRST, must fail before the fix).
- Regression tests covering the "unchanged behavior" rows above.

## Approval
| Role | Name | Status | Date |
|---|---|---|---|
| QA Lead |  | Draft |  |
| TA/SA |  | Draft |  |
