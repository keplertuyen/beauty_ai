---
doc: syntheprise-v5-core-build-summary
title: Syntheprise Framework v5.3.1 Build Summary
status: stable
precedence: 6
owner: Delivery / PMO / Architecture
last_reviewed: 2026-06-17
---

# Syntheprise Framework v5.3.1 Build Summary

This package is the **Syntheprise Framework v5.3.1 (P0 release-clean patch)** of **Syntheprise Framework - The Human-Governed Agentic
Development Framework** — the v5.2 governance core plus a tooling layer that
closes the gap with Spec-Kit / Kiro / OpenSpec.

---

## Naming standard applied

| Purpose | Name |
|---|---|
| Official framework | Syntheprise Framework - The Human-Governed Agentic Development Framework. |
| Short internal name | Syntheprise Framework |
| Repo/package | `syntheprise-framework` |
| Template/tooling package | Syntheprise Framework Starter Kit |
| Current implementation | Syntheprise Framework v5.3.1 (P0 release-clean patch) |
| Rollout program | Syntheprise Framework Adoption Program |
| Zip file | `syntheprise-framework.zip` |

---

## v5.3 additions (over v5.2)

**5.1 DevEx**
1. `syntheprise` CLI (`scripts/syntheprise.py` + root `./syntheprise`): init / sync / gate / change /
   onboard / dashboard / push-tasks / upgrade / doctor / version.
2. Adapter generator `scripts/syntheprise_sync.py`: runnable slash-commands per tool
   (`.claude/commands/`, `.codex/prompts/`, mirrored `.claude/skills/`) from the
   canonical `.agents/`; `--check` mode enforces no drift in CI.
3. CI runs on `pull_request`/`push` and adds `scripts/check-change-completeness.py`.
4. `doctor.py` extended (new required files, template-folder detection, adapter
   parity). Added `VERSION` and `UPGRADES.md`.

**5.2 New projects** — tiered `syntheprise init --tier 0|1|2 --adapter ...`; Tier-0
fast lane (`FASTLANE-template`, guide 05).

**5.3 Brownfield** — `/onboard-existing` workflow, `reverse-spec` skill,
`syntheprise onboard` baselines, dedicated **Bugfix Spec** (`BUGFIX-template`), guide 06.

**5.4 Team** — `syntheprise dashboard` (status page), `syntheprise push-tasks` (GitHub/Jira/
Linear export), `[P]` parallel-task convention, guides 07 and 08.

The v5.2 governance core (precedence ladder, Change/Delta Spec, QA-first + SoD,
traceability, tiering, adapters, Adoption Program) is unchanged and fully preserved.

---

## Validation commands

```bash
# framework repo (placeholders expected)
python scripts/doctor.py --template
python scripts/syntheprise_sync.py --check
python scripts/check-change-completeness.py

# initialized project repo (after placeholders replaced; create .syntheprise-project)
syntheprise gate          # = doctor --quality-gate + traceability + doc-drift + adapter parity
```

`doctor.py --quality-gate` / `syntheprise gate` is intended for real project repositories
after placeholders have been replaced.


## v5.3.1 P0 release-clean patch

- Release package cleaned of OS junk.
- Project-level company rollout references cleaned.
- Tier-aware doctor link validation added for initialized projects.
- Adapter files regenerated from canonical `.agents/` sources.

## v5.4.0 P1 hardening

P1 has been implemented: presets, preset-aware init, brownfield scanner mode, secret/dependency/coverage gates, stack-specific CI examples, and security quality gate hooks.

Release classification: `Syntheprise Framework v5.4.0 = pilot-hardening release candidate`.

## v5.4.1 Overview documentation patch

Added the missing complete framework overview layer:

- `SYNTHEPRISE-FRAMEWORK-OVERVIEW.md` as the root entry point.
- `docs/_guides/00-framework-overview.md` as the full framework overview.
- README and Quickstart updated to guide new users through the correct reading path.

The new overview explains Syntheprise Framework's purpose, target users, supported project types, repository architecture, folder/file responsibilities, source-of-truth model, AI Agent operating model, Dev-AI Pair Development, QA-first model, Change/Delta Spec model, traceability, quality gates, CLI/presets, lifecycle, limitations, roadmap, and glossary.
