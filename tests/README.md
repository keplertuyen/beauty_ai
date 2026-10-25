---
doc: tests-readme
title: Tests
status: stable
precedence: 6
owner: QA Lead / Tech Lead
last_reviewed: <YYYY-MM-DD>
---

# tests/

**Every new code module ships a matching test in the same slice** (see `AGENTS.md` §2 and `docs/testing-strategy.md`).

- Simple repos: tests live here in `tests/`.
- Monorepos: tests live per package (e.g. `packages/backend/tests/`, `apps/web/__tests__/`) following each stack's convention. This root `tests/` then holds cross-cutting/E2E tests.

A task is not Done if new behavior has no test (Definition of Done). `/test-gate` must be green before proceeding.
