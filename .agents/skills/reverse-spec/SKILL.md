---
name: reverse-spec
description: Reconstruct requirements, architecture baseline and risk map from an existing codebase, evidence-first.
---

# Skill: reverse-spec

## When to use
During `/onboard-existing` on a brownfield repo, to turn existing code into reviewable Syntheprise Framework baselines.

## Principles
- **Evidence over assumption.** Every captured statement cites a path, endpoint, test, or config. No evidence → it goes in `risk-map.md` as an unknown, not in requirements.
- **Describe, do not improve.** Capture what the system DOES today, not what it should do. Improvements become changes later.
- **Behavior is business truth; structure is architecture.** Keep them in separate files (`current-behavior.md` vs `architecture-baseline.md`).

## Procedure
1. Inventory the repo: languages, entrypoints, services, data stores, migrations, integrations, build/CI, existing tests. Fill `system-scan.md`.
2. For each user-facing capability, write an `OBS-<AREA>-NN [observed]` statement with evidence and today's test coverage in `current-behavior.md`.
3. Draft the as-is architecture (components, data flow, contracts, constraints) in `architecture-baseline.md`.
4. Record risk hotspots, unknowns, and untested critical paths in `risk-map.md`, each with a recommended first safe change.
5. Flag anything that needs a human decision (ambiguous behavior, missing tests on critical paths, security concerns).

## Output
- Filled `docs/_baseline/` drafts with confidence levels.
- A short list of recommended first changes (smallest safe slices), ordered by risk reduction.

## Forbidden
- Changing code, dependencies, or schema.
- Asserting intent the evidence does not support.
