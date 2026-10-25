---
doc: release-versioning-guide
title: Release & Versioning
status: stable
precedence: 6
owner: DevOps / Delivery
last_reviewed: 2026-10-25
---

# Release & Versioning

> Operating guide for the `/release-baseline` workflow. It keeps two version
> concepts strictly separate and records how product releases are cut. Structural
> decisions behind this process belong in an ADR.

## 1. Two version concepts — never mix them

| Concept | Home | Format | Who bumps it |
|---|---|---|---|
| **Product version** | git tag on the default branch + `CHANGELOG.md` | `vMAJOR.MINOR.PATCH` (semver) | `/release-baseline` |
| **Framework / kit version** | the `VERSION` file at the repo root | `vX.Y.Z` | Bumped only when the framework changes (workflow / rule / CLI), **not** on every product release |

The product version tracks what the built application does. The framework version
tracks the Syntheprise Framework kit itself. A product release does not bump `VERSION`, and a
framework change does not tag the product.

## 2. Product semver

- **MINOR** — a batch of features/changes completes (one or more archived changes).
- **PATCH** — a hotfix on an already-tagged build.
- **MAJOR** — a large compatibility break (e.g. a stage transition or a breaking public API).
- Pre-releases use a suffix when needed: `v1.0.0-rc.1`. A dry-run tag such as
  `v0.0.0-dryrun` is deleted immediately after the demo.
- Choose the starting version deliberately (e.g. `v0.9.0` for a near-feature-complete
  MVP, `v1.0.0` at first production release) and record the rationale.
- Any legacy hand-made tags predating this convention are kept as historical
  markers; do not add new tags in the old style.

## 3. Technical CHANGELOG vs user-facing release notes

| Artifact | Audience | Contents |
|---|---|---|
| `CHANGELOG.md` (root, Keep-a-Changelog format) | Technical / audit | COMPLETE: every change-id, PR, and fix — machine- and human-readable |
| User-facing release notes (e.g. a "What's New" page) | End users | CURATED: highlighted features, product language, translated as needed |

Two artifacts, two audiences — not two homes for one fact. `CHANGELOG.md` is the
technical source; the user-facing notes are rewritten for readers and need not map
one-to-one.

## 4. Release process — `/release-baseline`

Run the `/release-baseline` workflow. It is a 9-step flow:

1. **Precondition** — verify all PRs in the batch are merged and their change folders archived.
2. **Pull** — update the local checkout of the default branch.
3. **Deploy** — deploy per environment. _(Project placeholder: fill in the deploy command/runbook.)_
4. **Migrate** — apply data/schema migrations. _(Project placeholder: fill in the migrate command.)_
5. **Smoke** — run the minimum smoke checks. _(Project placeholder: e.g. health endpoint returns 200, services healthy, app reachable.)_
6. **Pick version** — choose the semver bump per §2.
7. **CHANGELOG** — update `CHANGELOG.md`.
8. **Owner confirm** — STOP for owner confirmation before tagging.
9. **Tag + rollback point** — create the tag and record the rollback point in the state snapshot.

Tagging and pushing a tag is a protected action (safety rules) — never tag by hand
outside this workflow.

## 5. Rollback

Follow the project's release runbook: check out the previous tag, rebuild,
migrate, and bring services up. Each baseline records its rollback point (step 9)
so the previous known-good tag is always identified.

## 6. Related cadence (mode-parameterized)

The Master Plan and dashboard refresh on a cadence driven by `project.mode`:
team = after every PR merge; solo = after every change archive (see
`.agents/rules/change-management.md` §6). Release baselining is independent of
this cadence — it runs when the owner decides to cut a batch.
