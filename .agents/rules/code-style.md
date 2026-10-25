---
doc: agent-code-rules
title: Code & Commit Rules
status: stable
precedence: 0
owner: <Tech Lead>
last_reviewed: 2026-06-14
---

# Code & Commit Rules

- Follow the language conventions in `AGENTS.md` §5 (lint, formatter, types).
- Architecture: keep boundaries (e.g. Router → Service → Repository); no business logic in controllers/routers.
- Tests accompany code in the same slice; do not mark a task done with failing/with no tests.
- Commits: Conventional Commits; one thin slice = one commit.
- Update the relevant doc when behavior or a contract changes (see `doc-sync` skill).

## Delivery discipline (hard lessons — must follow)
- **Reproducibility gate.** A dependency/feature is NOT done until it installs & runs in a *clean* environment (a fresh Docker build / CI), not just a local dev environment. "Works on my machine" — a hand-installed lib or an unpinned dep that is not in the manifest/lockfile or a documented build step — is a defect; it ships broken. Verify a clean build before calling it done.
- **Automated/blanket migrations are reviewed per-file + verified at runtime before merge.** An AST codemod or repo-wide find-replace must not silently rewrite auth, fallback, import-resolution, or degrade paths. Diff every touched file and exercise the runtime — a green unit test that mocks the changed symbol can hide a real break (e.g. a rename to a lib that lacks the called function).
- **Don't pipe a command whose exit code matters** (`docker build … | grep`, `test-runner … | tail`) — a pipeline reports the *last* stage's status, so a real failure reads as success. Write the output to a file and inspect it, or check `${PIPESTATUS[0]}`.
- **Auth-gating ≠ non-existence.** An unauthenticated 404 (a private package index, a gated API) does not prove a resource is absent — probe with the credential or the vendor's tool before concluding, and before ripping out code that depends on it.
- **Prefer degrade-to-fallback for optional external libs.** Import an optional/paid provider lib inside `try/except` with a working fallback; make the fallback catch the *actual* failure mode (import-time AND the lib's runtime auth / `SystemExit` paths), not just `ImportError`.
