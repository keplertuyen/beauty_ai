---
doc: codex-adapter
title: GPT Codex Adapter
status: stable
precedence: 6
owner: delivery-excellence
last_reviewed: 2026-06-17
---

# GPT Codex Adapter

## Purpose
Run Codex against the same V5 source-of-truth rules.

## Files
```text
AGENTS.md
.codex/config.toml
.codex/hooks.json
.codex/agents/*.toml
```

## Operating model
- Codex should load `AGENTS.md` as project guidance.
- Use `.codex/config.toml` for repo-scoped behavior.
- Use `.codex/agents/` for bounded roles such as QA test designer and reviewer.
- Keep machine-local secrets and providers in user-level config, not project config.

## Recommended roles
| Agent | Job |
|---|---|
| qa-test-designer | Write independent acceptance tests and test matrix |
| implementation-worker | Implement bounded tasks after test design |
| reviewer | Inspect code/test/doc/traceability alignment |

## Commands
```bash
python scripts/doctor.py --template
python scripts/doctor.py --strict
python scripts/doctor.py --quality-gate
```
