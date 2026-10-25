---
doc: agent-change-management-rules
title: Agent Change Management Rules (Syntheprise Framework change-routing enforcement)
status: stable
precedence: 0
owner: <PM>
last_reviewed: 2026-07-24
---

# Change Management Rules (invariant)

> Every non-deterministic change (anything beyond a small local bug fix — see §0) MUST follow the Change/Delta Spec process.
> This is an invariant rule — violating it is a Definition-of-Done failure.

## 0. Objective criteria that force a change folder

A change MUST be routed through `docs/_changes/<change-id>/` if it satisfies **ANY ONE** of the following (you do NOT need to satisfy all of them):

1. **Contract-surface change** — an API/endpoint signature, response schema, event shape, or DB column/table (even a single field).
2. Introduces a **new heuristic, threshold, or magic constant** in a production code path.
3. Changes the **semantics of cache / retry / fallback / rate-limit**.
4. Changes the **frequency or fanout of an external-provider call**.
5. **Touches any contract file** — e.g. `docs/architecture.md`, `docs/data-contracts.md`, `docs/api-contract.md`, `docs/design-system.md`, `docs/security-policy.md`, `docs/testing-strategy.md`, `docs/llm-policy.md`, `docs/domain-rules.md`, or any `*-contract.md` / `*-policy.md`.
6. Touches **authentication, authorization, secrets handling, or PII flow**.
7. Total lines of code changed (excluding tests, docs, comments) is **> 30 LOC**.

When in doubt — open the change folder first; the owner can reject it later. Do not stretch the definition of "small bug fix" to skip the paper trail.

> NOTE: This file is the canonical (precedence-0) home for the change-routing criteria. `AGENTS.md` mirrors this list. If the two diverge, this file wins per the `AGENTS.md` precedence ladder — but the divergence itself is a process violation; fix it via a governance change (`CHANGE-GOV-*`), not by relying on the ladder.

## 1. Mandatory change folder

Before executing ANY PR (feature, bugfix, maintenance, refactor), the agent MUST:

1. Create `docs/_changes/<CHANGE-ID>/` with **all 6 files**:

   ```
   docs/_changes/<CHANGE-ID>/
     proposal.md              # Scope, business reason, risk, affected systems
     requirements-delta.md    # ADDED/MODIFIED/REMOVED/DEPRECATED requirements
     design.md                # Technical design, file changes, data flow
     test-plan.md             # Acceptance criteria, test matrix, verification
     tasks.md                 # Task checklist (tick [x] when done)
     review.md                # Review checklist + sign-off slots
   ```

2. Commit the change folder **before** or **with** the first commit of the PR.

3. Do NOT skip any file, even for a small change. Content may be brief, but the file must exist.

## 2. Change ID naming convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `CHANGE-<scope>-<description>` | `CHANGE-UX-005-adaptive-alerts` |
| Bugfix | `BUGFIX-<description>` | `BUGFIX-hang-on-503` |
| Maintenance | `CHANGE-MAINT-<NNN>-<description>` | `CHANGE-MAINT-001-high-priority` |
| Fast-lane | `FASTLANE-<description>` | `FASTLANE-hotfix-login-crash` |

## 3. PR lifecycle

Every PR MUST follow this flow:

```
[1] Create change folder (6 files) ─→ commit
[2] Execute tasks ─→ tick [x] in tasks.md ─→ commit(s)
[3] Run tests / gates ─→ record results in review.md
[4] Sign off review.md ─→ commit
[5] Push branch + open PR
[6] STATE SNAPSHOT (close-out step 1) ─→ write/update docs/_states/state_<date>_<slug>.md.
    MUST be done IMMEDIATELY BEFORE archive and included in the SAME commit/PR as the archive (atomic).
[7] Archive change folder ─→ docs/_changes/_archive/  (only allowed once [6] exists)
[8] Post-merge cleanup: delete the PR branch (local + remote);
    `git worktree remove <path>` if the change used a dedicated worktree;
    confirm the primary checkout is on main and freshly pulled.
[9] Update the agent's memory / status notes (if any) ─→ mark the change CLOSED.
```

> The close-out order [6]→[7]→[8]→[9] is MANDATORY and applies identically to every agent
> (Antigravity, Codex, Claude Code). The state snapshot is the GATE for archive: archiving,
> cleanup, or memory-write is forbidden while the snapshot does not yet exist.
> Rationale for the gate: prevents closing a change with no point-in-time record to recover from.
> Rationale for step [8]: orphaned branches/worktrees accumulate as operational debt.

## 4. Archive rule

After the PR is merged to `main`:

- **PRECONDITION:** the change's state snapshot already exists in `docs/_states/`. If not → write it first and include it in the same archive commit. Do NOT archive without a snapshot.
- `git mv docs/_changes/<CHANGE-ID>/ docs/_changes/_archive/`
- Update `tasks.md` status header → `status: done`
- Update `review.md` status header → `status: signed`
- Do NOT delete the change folder — retain it permanently in `_archive/`.

## 5. tasks.md hygiene

- Every task checkbox MUST be ticked `[x]` as soon as the task is done — do not let them accumulate.
- If code is implemented but the checkbox is not ticked → that is a DoD violation.
- The agent MUST review tasks.md before creating the PR's final commit.

## 6. MASTER-PLAN & dashboard sync (mode-parameterized)

Cadence reads from `project.mode` in `.syntheprise-quality.yml` (missing → default `team`):

| Mode | Required checkpoint |
|---|---|
| `team` | After EACH PR merge |
| `solo` | After EACH change archive (close-out) |

At each checkpoint, the agent MUST:

- Update `docs/_plans/MASTER-PLAN.md`: phase status reflects reality (no `[TODO]` when the code is done), refresh `last_reviewed` and timestamps.
- Run the dashboard command and commit the status snapshot (the snapshot is committed, not gitignored).

At the end of a release batch: baseline via the `/release-baseline` workflow.

## 7. Escalation

If the agent finds a mismatch between code and documentation (e.g. code implemented but tasks.md not ticked, or MASTER-PLAN status wrong), the agent MUST:

1. Report it immediately to the User/PM.
2. Open a `CHANGE-MAINT-*` to fix it.
3. NOT skip it or "leave it for later".

## 8. Solo vs team mode

- **Team mode:** multiple contributors; PR review and sign-off in `review.md` come from distinct roles; MASTER-PLAN/dashboard sync after every PR merge.
- **Solo mode:** one person wearing multiple hats; the role sign-offs still exist but may be performed by the same person acting per-role; MASTER-PLAN/dashboard sync after every change archive.
- The change-folder discipline (§0–§5) is identical in both modes — only the review cadence and reviewer identity differ.
