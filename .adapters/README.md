---
doc: adapter-index
title: AI Agent Tool Adapters
status: stable
precedence: 6
owner: delivery-excellence
last_reviewed: 2026-06-17
---

# AI Agent Tool Adapters

This kit supports three first-class coding-agent clients:

- Antigravity
- GPT Codex
- Claude Code

`AGENTS.md` is the canonical instruction source. Adapter files translate the same operating model into each tool's preferred structure.

## Rule
Adapters may add tool-specific mechanics, but must not contradict `AGENTS.md`, `core-principles.md`, or `.agents/rules/`.
