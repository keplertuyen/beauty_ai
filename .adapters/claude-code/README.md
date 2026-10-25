---
doc: claude-code-adapter
title: Claude Code Adapter
status: stable
precedence: 6
owner: delivery-excellence
last_reviewed: 2026-06-17
---

# Claude Code Adapter

## Purpose
Use Claude Code while keeping `AGENTS.md` as the canonical project constitution.

## Files
```text
CLAUDE.md
.claude/settings.json
.claude/skills/*/SKILL.md
```

## Operating model
- `CLAUDE.md` points Claude to `AGENTS.md` and the V5 context map.
- `.claude/settings.json` contains project-level permissions and hook examples.
- `.claude/skills/` mirrors high-value V5 procedures for direct invocation.

## Rule
Use hooks/permissions for deterministic blocking. Do not rely on memory/context alone for dangerous actions.
