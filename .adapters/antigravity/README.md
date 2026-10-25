---
doc: antigravity-adapter
title: Antigravity Adapter
status: stable
precedence: 6
owner: delivery-excellence
last_reviewed: 2026-06-17
---

# Antigravity Adapter

## Purpose
Use Antigravity with the V5 kit through shared `AGENTS.md`, `.agents/workflows/`, `.agents/skills/`, and `.agents/rules/`.

## Expected layout
```text
AGENTS.md
.agents/
  agents.md
  rules/
  workflows/
  skills/*/SKILL.md
```

## Operating model
- Start with `AGENTS.md`.
- Use slash workflows such as `/change-propose`, `/qa-test-design`, `/quality-gate`, and `/change-archive`.
- Use skills for repeatable procedures rather than loading long docs into every prompt.
- Keep destructive actions behind explicit approval.

## Recommended Antigravity usage
| Work | Recommended workflow |
|---|---|
| New feature | `/change-propose` → `/change-design` → `/qa-test-design` → implementation → `/quality-gate` |
| Bug fix | `/change-propose` if behavior changes, otherwise `/qa-test-design` → implementation → `/quality-gate` |
| Refactor | ADR if architecture-impacting → implementation → `/quality-gate` |
| Release | `/quality-gate` → release checklist |

## Notes
Antigravity skills use the standard `SKILL.md` folder format; the same skills can be reused by compatible agent clients.
