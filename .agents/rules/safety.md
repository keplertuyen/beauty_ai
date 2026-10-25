---
doc: agent-safety-rules
title: Agent Safety Guardrails
status: stable
precedence: 0
owner: <Tech Lead>
last_reviewed: 2026-06-14
---

# Agent Safety Guardrails (invariant)

> The agent may be fast, but never reckless. These are hard stops; violating them is a Definition-of-Done failure.

## Never do without explicit human approval
- **Destructive commands:** `rm -rf`, `DROP DATABASE/TABLE`, `TRUNCATE`, delete a bucket/volume, `git reset --hard`, `git push --force`, history rewrite.
- **Release tagging:** `git tag` / `git push --tags` for a product release is a protected action — only via the `/release-baseline` workflow, owner-confirmed.
- **Modify an already-applied migration.** Write a new migration; if it changes a contract, write an ADR.
- **Major dependency upgrade** not required by the task.
- **Refactor outside the current task/work-group scope.**
- **Run commands outside the repo root**, or touch paths outside the project, without confirming.
- **Delete any file:** first list the files, state the reason, and ask for approval.

## Always
- Treat `.env`/secrets as read-restricted: never print, log, commit, or send to an LLM.
- Never paste or accept a secret (API key, token, password) in chat, a PR, or a commit. If a secret appears anywhere non-secure (including a chat transcript), treat it as **compromised** and tell the human to rotate it. Pass secrets to a build only via a mechanism that never enters an image layer (e.g. BuildKit `--mount=type=secret`); keep credential bundles in a gitignored path, never committed.
- Keep changes inside the approved plan; if you discover needed out-of-scope work, stop and propose it.
- Prefer reversible steps; for risky steps, describe the rollback first.
- For network/file/db side effects, state what will change before doing it.

## Approval pattern
> "This step will <action> affecting <targets>. Risk: <...>. Rollback: <...>. Proceed?"
