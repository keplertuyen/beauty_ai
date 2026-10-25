# Contributing to Syntheprise Framework

Thanks for helping improve the Syntheprise Framework - The Human-Governed Agentic Development Framework. Syntheprise Framework is
**open source under Apache-2.0** and welcomes community contributions. Please
follow Syntheprise Framework's own process — we use the framework to build the framework. By
contributing you agree your contributions are licensed under Apache-2.0.

## Ground rules
- **AI drafts. Humans decide. Tests prove. Docs govern.**
- The canonical rule source is `AGENTS.md`. `core-principles.md` and
  `.agents/rules/` win on conflict (see the precedence ladder in `AGENTS.md`).
- Never commit secrets. `.env`, keys, and tokens stay local (see `.gitignore`).

## Branch & change model
1. Create a branch: `feature/<short-name>`, `fix/<short-name>`, or
   `tech/<short-name>`.
2. For any non-trivial change, open a change folder instead of editing canonical
   docs directly:
   ```bash
   ./syntheprise change new "<short-name>" --type CR     # or BUG | TECH | FASTLANE
   ```
   Fill `proposal.md` → `requirements-delta.md` → `design.md` → `test-plan.md`
   → `tasks.md` → `review.md`.
3. Mark independent tasks with `[P]` so they can be picked up in parallel.

## Definition of Done (must pass before a PR is merged)
- Requirement / change ID linked; acceptance criteria exist for changed behavior.
- QA-first: acceptance tests designed **before** implementation; do not weaken a
  test to make code pass.
- Local gate is green:
  ```bash
  ./syntheprise sync          # regenerate adapter commands if you edited .agents/
  ./syntheprise gate          # doctor + traceability + doc-drift + adapter parity
  ```
- `docs/traceability.md` updated; docs/ADR updated if behavior or architecture
  changed; change folder complete.

## Editing workflows & skills
Edit the **canonical** source in `.agents/workflows/` and `.agents/skills/`, then
run `./syntheprise sync`. Never hand-edit the generated files under `.claude/commands/`,
`.codex/prompts/`, or `.claude/skills/` — CI fails on drift (`syntheprise sync --check`).

## Pull requests
- Keep PRs small: one thin slice = one PR.
- Fill the PR template checklist.
- At least one reviewer (not the author) confirms tests are meaningful, not only
  passing. For Must-level behavior, the author may not be the only actor who
  designs the test, implements, and approves it (separation of duties).

## Reporting problems
Use GitHub Issues with the provided templates. For anything security- or
secret-related, follow `SECURITY.md` — do **not** open a public issue.
