---
description: Onboard an existing (brownfield) codebase by capturing current behavior before any change.
---

# /onboard-existing

**Purpose:** make the current behavior of an existing system VISIBLE before changing it. Never start by refactoring.
**When to use:** first time Syntheprise Framework is applied to a repo that already has code.
**Inputs:** the target repository (read-only first pass).
**Files to read:** `AGENTS.md`, `.agents/rules/safety.md`, skill `read-context`, skill `reverse-spec`.

**Steps:**
1. Run `syntheprise onboard` to scaffold `docs/_baseline/` (system-scan, current-behavior, architecture-baseline, risk-map).
2. Use the `reverse-spec` skill to fill the drafts strictly from observed evidence (paths, endpoints, tests). Mark every item with a confidence level. Do NOT invent intended behavior.
3. Surface unknowns and risk hotspots in `risk-map.md`; do not guess.
4. Human review: SA/TA approve `architecture-baseline.md`, BA/QA approve `current-behavior.md`.
5. Promote approved baselines into canonical docs: `docs/architecture.md`, `docs/adr/0001-architecture-baseline.md`, and seed `requirements.md` / `docs/traceability.md` with the captured behavior.
6. From now on, route every change through `docs/_changes/<CHANGE-ID>/` (use `syntheprise change new`).

**Output artifact:** reviewed `docs/_baseline/` + promoted canonical baselines.
**Approval gate:** human approves baselines before any code change.
**Forbidden:** refactoring, renaming, dependency upgrades, or schema edits during onboarding; inventing behavior the evidence does not show.
