---
doc: solo-fast-lane-guide
title: Solo / Tier-0 Fast Lane — Syntheprise Framework v5.3
status: stable
precedence: 6
owner: Delivery Excellence
last_reviewed: 2026-06-17
---

# Solo / Tier-0 Fast Lane

For a single developer, a spike, or a PoC, the full multi-document process is
overkill. The fast lane keeps the two non-negotiables and drops the rest.

## The only two rules that survive at Tier 0
1. **Define the acceptance check BEFORE you code.**
2. **Do not weaken that check to make code pass.**

Everything else (master/phase plans, ADRs, separate proposal/design/test-plan
files, traceability matrix) is optional until the project grows to Tier 1.

## Setup
```bash
syntheprise init my-poc --tier 0 --adapter claude   # only the minimal file set
cd my-poc
```

## Loop
```bash
syntheprise change new "search-filter" --type FASTLANE
# edit docs/_changes/FAST-2026-001-search-filter/change.md:
#   - write the Goal
#   - write the acceptance check (Given/When/Then)
# implement a thin slice with your agent
syntheprise gate         # doctor + adapter parity
```

## When to leave the fast lane (escalate to Tier 1)
Stop and create a full change (`--type CR`) the moment a slice touches:
- architecture, API, data schema, auth, or deployment behavior, or
- anything another person will need to understand or maintain.

The fast lane is a privilege of small, low-risk, single-owner work. Promote to
the full lane as soon as risk or team size grows — `syntheprise init` higher tiers and
the `docs/_changes/CHANGE-template` flow are waiting.
