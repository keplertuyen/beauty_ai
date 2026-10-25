---
doc: brownfield-onboarding-guide
title: Brownfield Onboarding — Syntheprise Framework v5.3
status: stable
precedence: 6
owner: SA / Delivery Excellence
last_reviewed: 2026-06-17
---

# Brownfield Onboarding

Adopting Syntheprise Framework on an existing codebase. The cardinal rule: **make current
behavior visible before changing anything.** Do not start by refactoring.

## Why
An agent let loose on legacy code will "improve" things nobody asked for and
erase behavior nobody documented. Syntheprise Framework onboarding first captures the as-is
system as reviewable artifacts, then changes it through controlled deltas.

## Steps
1. **Scaffold baselines**
   ```bash
   syntheprise onboard            # writes docs/_baseline/
   ```
   Creates `system-scan.md`, `current-behavior.md`, `architecture-baseline.md`,
   `risk-map.md`.
2. **Capture, evidence-first** — run the `/onboard-existing` workflow. The
   `reverse-spec` skill fills the drafts strictly from observed evidence (paths,
   endpoints, tests), each item tagged with a confidence level. Unknowns go to
   `risk-map.md`, not into requirements.
3. **Human review** — SA/TA approve the architecture baseline; BA/QA approve the
   captured behavior. Nothing is "true" until a human signs it.
4. **Promote to canonical** — move approved baselines into `docs/architecture.md`,
   `docs/adr/0001-architecture-baseline.md`, and seed `requirements.md` +
   `docs/traceability.md`.
5. **Change through deltas** — from now on every change uses
   `syntheprise change new ... --type CR|BUG`. Bug fixes use the Bugfix Spec
   (root-cause + regression guard).

## Anti-patterns
- "Let the agent refactor the legacy module first." → No. Capture, then change.
- Writing intended behavior as if it were current behavior. → Current behavior is
  what the code does today; intent becomes a future change.
- Skipping the risk map. → The risk map is how you pick the smallest safe first change.
