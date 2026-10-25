---
doc: agent-worktree-isolation-rules
title: Worktree Isolation & Concurrency Safety
status: stable
precedence: 0
owner: <Tech Lead>
last_reviewed: 2026-07-24
---

# Worktree Isolation & Concurrency Safety (invariant)

> Hard stop. Violating this is a Definition-of-Done failure. Enforces `AGENTS.md`.
> Rationale: git's working tree, index, and HEAD are a single-writer resource. Concurrent
> sessions writing to one checkout interleave their git commands and corrupt the shared
> working tree — a branch can end up pointing at the wrong commit, producing an empty or
> partial merge and lost work. Isolation removes the shared-writer at the root.

## 1. Core rules
1. **The primary checkout is reserved for the `main` branch** (tracking, pull, running the dev server). Do NOT create, check out, or commit a working branch directly on it.
2. **Every session/task that performs a git write** (`branch`, `checkout -b`, `commit`, `rebase`, `reset`, `merge`, archive `git mv`, `push`, close-out, opening a PR) MUST run inside its own dedicated `git worktree` for that change/task.
3. **No two sessions may run a close-out** (or any multi-step git-writing sequence) **concurrently** on the same checkout/worktree/repo — they must be **serialized** through a **session-lock**.
4. Applies to EVERY agent (Claude Code, Codex, Antigravity) and to **every related task within the same session**.
5. **Only exception:** the owner explicitly requests or approves it (then use the documented escape hatch, e.g. `SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1`).

## 2. Standard operating procedure (SOP)
- **Start a change/task:** `syntheprise worktree <change-id>` — creates a sibling worktree and branch `change/<change-id>` off `origin/main`. Do all code + git work there.
- **Before opening a PR and immediately before merging:** `syntheprise update-branch` — merge `origin/main` into the branch so it is not out-of-date (with strict/require-up-to-date branch protection, the host blocks merging a stale branch). If `main` advances after the PR opens, run it again before merging. Multiple parallel PRs ⇒ serialize update → wait for CI → merge.
- **Close-out:** `syntheprise close-out` (inside the worktree) → acquire the session-lock, run the close-out steps (state snapshot → archive → cleanup → memory), then release.
- **Finish:** `git worktree remove <path>`; confirm the primary checkout is still on `main` and pulled.
- **Never** `git checkout <feature>` in the primary checkout. If you accidentally commit on the primary checkout: do not panic — the commit is still in the reflog; create a branch at that commit (`git branch -f`), move it into a worktree, and reset the primary checkout back to `origin/main`.

## 3. Machine enforcement (defense-in-depth)
| Layer | Mechanism |
|---|---|
| Rule | This file (precedence 0) + the mirrored section in `AGENTS.md` (cross-agent, read by all) |
| Guard | `scripts/check-worktree-isolation.py` at **pre-commit** — blocks a commit on the primary checkout / a branch other than `main`, or while another session holds the lock. (Not run in CI: a CI checkout of a branch in a single worktree is legitimate.) |
| Lock | A session-lock file (keyed per worktree, stale after a timeout or dead pid) — serializes close-out across tools |
| Tooling | `syntheprise worktree` / `syntheprise close-out [--release\|--status]` — auto-creates the worktree and acquires/releases the lock |
| Branch currency | `syntheprise update-branch` (merge `origin/main`) + strict branch protection — the host **blocks the merge** if the branch is out-of-date. Run before the PR and before merge. |

> **Install the hook:** run your pre-commit installer once per clone so the guard runs on commit. Guard + lock share the common `.git/hooks`, so they apply to every worktree.

## 4. Why (principle)
Git's **working tree + index + HEAD are a single-writer resource**. Multiple processes writing concurrently corrupt each other (lost commits, wrong merges). A worktree gives each session its own HEAD/index/working tree (sharing one object DB), eliminating the conflict at the source; the session-lock prevents overlapping close-outs across tools.
