---
doc: fastlane-change-template
title: Fast-Lane Change Template (Tier 0 / solo)
status: template
precedence: 3
owner: solo-dev
last_reviewed: 2026-06-17
---

# Fast-Lane Change

> One file, one small slice. For Tier 0 (spike/PoC/solo). The heavier
> proposal/design/test-plan/review split is NOT required here — but the two
> non-negotiables still apply: (1) define the acceptance check BEFORE coding,
> (2) do not weaken that check to make code pass.
>
> Create with: `syntheprise change new "<name>" --type FASTLANE`.

## Change ID
FAST-ID-HERE

## Goal (what & why)
One or two sentences.

## Acceptance check (write BEFORE coding)
- [ ] Given <context>, when <action>, then <observable result>.

## Scope guard
- In: <...>
- Out: <...>

## Tasks
| Task | `[P]`? | Status |
|---|---|---|
| Write acceptance check |  | Draft |
| Implement thin slice |  | Draft |
| Run `syntheprise gate` |  | Draft |

## Done when
- Acceptance check passes, tests/lint green, `syntheprise gate` clean.
- If this slice touched architecture/auth/data/deploy → STOP and escalate to a full change folder (`--type CR`).
