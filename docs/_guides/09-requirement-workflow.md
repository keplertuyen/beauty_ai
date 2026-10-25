---
doc: requirement-workflow-guide
title: Requirement Workflow — Triage to Close-out
status: stable
precedence: 6
owner: PM / QA Lead
last_reviewed: <YYYY-MM-DD>
---

# Requirement Workflow Guide

> **Informational. Authority lives elsewhere.**
> - For the criteria that force a change folder: see
>   [`.agents/rules/change-management.md`](../../.agents/rules/change-management.md) §0.
> - For the change-folder layout and PR lifecycle: see `AGENTS.md` and the
>   change-management rule.
> - For the proposal-first and QA-first rules: see `AGENTS.md`.
>
> This guide is a reading aid for new sessions and onboarding humans.
> When a question of authority arises, the canonical sources win — do not
> treat this guide as a source of truth. By design it points back at
> authority instead of duplicating it (in particular, the change-classification
> criteria are NOT pasted here — go read them at the source).

---

## 1. Triage cheat-sheet

```text
Requirement arrives (feature / enhancement / bugfix / refactor)
       │
       ▼
┌───────────────────────────────────────────────┐
│ Read the criteria in §0 of the canonical rule  │
│ .agents/rules/change-management.md             │
└───────────────────────────────────────────────┘
       │
       ├──► Triggers ≥ 1 criterion ──► Full CHANGE flow  (proposal-first)
       │
       └──► 0 criteria             ──► Lite flow          (genuine small fix)
```

The classification criteria deliberately live in two places (the canonical
rule at precedence 0 + its mirror in `AGENTS.md` at precedence 1) and
**nowhere else**. If you need to reference them in code or another doc, link
to the canonical rule — never copy-paste the list.

## 2. The criteria (pointer only)

Go read them at `.agents/rules/change-management.md` §0. They cover, at a high
level: contract-surface changes; new heuristics / thresholds / magic constants;
cache / retry / fallback / rate-limit semantics; external-provider call
frequency or fanout; edits to any contract document; authentication / secrets /
PII; and a code-volume threshold.

If you find yourself paraphrasing the list more precisely than that — **stop and
go read the source**. The exact wording matters, and any-one-of-them triggers the
full flow.

## 3. Full CHANGE flow

```text
[Proposal-first]
   docs/_changes/<CHANGE-ID>/proposal.md
     ↓ owner sign-off
[QA-first]
   requirements-delta.md     # ADDED / MODIFIED / REMOVED / DEPRECATED
   design.md                 # technical approach + alternatives
   test-plan.md              # QA-owned; ACs and TCs before code
   tasks.md                  # T1..TN with dependencies
     ↓
[Implementation]
   Code matching the test-plan; integration tests hit real boundaries (no mocks that hide behavior)
     ↓
[Gates]
   Run the project test layers
   ./syntheprise gate && ./syntheprise test-gate
     ↓
[Review]
   review.md  (Decision, Evidence per AC, Findings, Outstanding work)
     ↓
[Commit + PR]
   Conventional Commits; branch off the default branch; open a PR
     ↓ owner merge
[Close-out]
   Archive the change folder under docs/_changes/_archive/
   Update docs/traceability.md (link FR / AC / TC / PR)
```

Each arrow is a discrete decision point. Stop at it; do not chain past the next
stage without confirming the current one is done.

## 4. Lite flow (genuine small fix — 0 criteria)

For genuine small fixes — typos, dead-code removal, a refactor that preserves all
behavior, tests for already-merged behavior:

1. Branch off the default branch: `fix/<slug>` or `test/<slug>`.
2. Run the §0 criteria check **mentally**; if the 0-criteria outcome is not
   obvious, note it in the commit message body.
3. Fix → run relevant tests → commit (Conventional Commits) → PR.
4. After merge: if an FR/AC was touched, update `docs/traceability.md`.

If a pre-tool reminder banner fires because no change folder is active, treat it
as the moment to double-check the 0-criteria verdict — not to dismiss it.

## 5. Folder variants

| Prefix | Use case | Notes |
|---|---|---|
| `CR-YYYY-NNN` / `CHANGE-<AREA>-YYYY-NNN` | Behavior change per the §0 criteria | Full file set (`CHANGE-template/`) |
| `BUGFIX-<slug>` | Bug fix that touches behavior but at smaller scope | `BUGFIX-template/` shows the trimmed file set |
| `FASTLANE-<slug>` | Hotfix shipped first, paper trail retrofit | `FASTLANE-template/`; the retrofit obligation is tracked |
| `TECH-YYYY-NNN` | Tech-only refactor, no business-behavior change | Proposal + design + tasks + review |

Scaffold the right variant with `syntheprise change new "<name>" --type CR|BUG|TECH|FASTLANE`.

## 6. Definition of Done

See `AGENTS.md`. Summary: code + tests green, lint/types clean, rules not
violated, QA design preceded code, execution evidence recorded, traceability
updated, docs in sync, plan/state files written. Anything less than all of them
is not Done.

## 7. Common pitfalls

| Pitfall | Counter-rule |
|---|---|
| Weighing "small" by lines of code instead of semantic surface area | Use the §0 criteria; LOC is only the last one |
| Reading "just fix it" as permission to skip the proposal | The proposal-first rule is unconditional; "fix" is direction, not approval |
| Over-extending a narrow memory or autonomy into governance decisions | Memories and autonomy have scope; do not transplant them onto the change process |
| "I already know the root cause" → skip the proposal | That is exactly when the proposal catches over-confidence |
| Mocking away the boundary under test in integration tests | Hit the real boundary; hiding it has masked defects before |
| Bypassing a failing hook (e.g. `--no-verify`) | Fix the root cause; hooks are signals, not obstacles |
| Mixing unrelated fixes into one branch | One change → one branch off the default branch → one PR |
| Forgetting the close-out archive | Archive + traceability is part of Done, not optional |
| Updating only `AGENTS.md` and forgetting the precedence-0 rule file | The precedence-0 file wins; sync both, or the higher-precedence file silently overrides |

---

> Maintenance note: when the change-classification criteria in
> `.agents/rules/change-management.md` §0 (or their `AGENTS.md` mirror) change,
> this guide may need to update its prose (sections 1, 2, 7). The criteria
> themselves are intentionally not duplicated here, so the most common drift
> vector is closed by construction.
