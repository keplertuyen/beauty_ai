---
doc: adr-0001
title: "ADR-0001: Architecture baseline & tier"
status: accepted
precedence: 2
owner: <SA>
last_reviewed: <YYYY-MM-DD>
---

# ADR-0001: Architecture baseline & tier

## 1. Context
First structural decision: establish the starting tier and stack so the agent does not over- or under-build. (Example record — replace with your real decision.)

## 2. Decision
Start at **Tier <0/1/2>** with stack: <frontend / backend / storage / jobs / auth>. Defer <heavier components> to a later stage.

## 3. Rationale
- Anti-over-engineering (core-principles §4): match infra to current size.
- <cost / time-to-market / simplicity reasoning>.

## 4. Consequences
- Positive: lean ops, fast delivery.
- Negative: <known ceiling, e.g. single-node limits>.
- Remediation: graduate to the next tier per project-charter.md §4; the abstraction boundaries (<...>) make migration a swap, not a rewrite.
