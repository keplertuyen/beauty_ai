---
doc: upgrades
title: Syntheprise Framework Upgrade & Migration Notes
status: stable
precedence: 6
owner: delivery-excellence
last_reviewed: 2026-07-26
---

# Upgrade & Migration Notes

Run `syntheprise upgrade` to print this file. Apply notes in order for the version you are coming from.

## v5.10.1 → v6.0.0 (composable polyglot stacks)

v6 adds manifest-v2 composition while retaining the legacy v1 `--stack` path.
Existing projects are never rewritten implicitly.

1. **Assess without writes.**

   ```bash
   syntheprise upgrade assess --path <existing-project>
   syntheprise upgrade assess --path <existing-project> --json
   ```

   Review the detected kit/stack, component mapping, blockers and ordered steps.
   Unknown or ambiguous projects return an actionable unsupported result and
   remain byte-for-byte unchanged.

2. **Adopt the kit through provenance-aware upgrade only after review.**
   `syntheprise upgrade --from <v6-kit>` remains a dry-run by default. Use
   `--apply` only after inspecting conflicts; project edits are kept and incoming
   conflicts land beside them as `.syntheprise-new`.

3. **New projects should prefer a certified blueprint.**

   ```bash
   syntheprise blueprint list
   syntheprise new <target> --blueprint python-react-rn \
     --tier 1 --adapter all --mode team
   ```

4. **Custom composition uses the official selectors** `--backend`, `--web` and
   `--mobile`; `--frontend` is not an official alias. Exactly one backend and at
   most one web/mobile component are allowed.
5. **OpenAPI becomes the solution contract seam.** Generated web/mobile clients
   consume the checked-in contract; generated drift fails the stack test.
6. **Certification is bounded.** Only the five named blueprints have recurring
   scaffold/build/test/health evidence. A schema-compatible custom composition
   is not automatically certified.
7. **Support boundary:** local Linux/macOS, CI Linux. Windows-native
   development, app-store publishing and production deployment remain outside
   v6.0.0.
8. **Rollback:** before adoption, preserve the current project commit/tag and
   the dry-run report. If application of managed kit files is rejected, restore
   the previous commit; do not rewrite a published framework tag.

See `docs/_guides/19-v600-release-and-adoption.md` and
`docs/_guides/18-v6-legacy-assessment.md`.

## v5.5 → v5.6 (one-command project initializer)

Purely additive — nothing in v5.5 changes. New capabilities:

1. **`syntheprise new <target> --stack <name>`** scaffolds a runnable, stack-tailored
   project plus a guided `docs/_intake/` inbox. `syntheprise init` is unchanged (it
   remains the low-level primitive). See `docs/_guides/18-project-initializer.md`.
2. **`syntheprise stack list`** shows available stack packs (`python-fastapi`, `node`,
   `react-vite` to start).
3. **`syntheprise kickoff`** launches the `/kickoff` workflow: after you fill
   `docs/_intake/`, the AI drafts your canonical docs for approval.
4. **Adding your own stack** = drop a folder under `presets/stacks/<name>/`
   (`manifest.yaml` + `skeleton/` + `docs/`); `doctor.py` validates it.
5. **Hook portability fix:** re-pull `.claude/settings.json` (hooks now use
   `$CLAUDE_PROJECT_DIR`); no action needed beyond taking the new file.

## v5.4 → v5.5 (field-hardened governance release)

All changes are additive and project-agnostic; existing v5.4 projects keep working. To adopt:

1. **Re-run `syntheprise sync`.** v5.5 generates a `source-command-<name>` skill for every
   workflow and, most importantly, **now generates `CLAUDE.md` as a mirror of
   `AGENTS.md`**. After upgrading, run `./syntheprise sync` once; from then on treat
   `CLAUDE.md` as generated — edit `AGENTS.md` and re-sync. CI keeps you honest via
   `syntheprise sync --check`.
2. **Adopt worktree isolation (recommended).** Run `./syntheprise setup-hooks` to install
   the pre-commit guard, then use `./syntheprise worktree <change-id>` for git-writing
   work and `./syntheprise close-out` to serialize close-outs. Owner escape hatch:
   `SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1`. See `.agents/rules/worktree-isolation.md`.
3. **Set your operating mode.** Add `project.mode: solo|team` to `.syntheprise-quality.yml`
   (missing → defaults to `team`). `doctor.py` validates it.
4. **Declare your dependency inventory.** Fill `docs/tech-stack.md` (new tier-2
   contract). `check-dependencies.py` warns on drift against it.
5. **New governed folders.** `docs/_research/` and `docs/_ui-ux_design/` ship with
   README governance and are declared in AGENTS.md's folder-taxonomy section
   (checked by `doctor.py`). Keep them present.
6. **Release flow.** Cut product releases via the new `/release-baseline` workflow;
   product version (git tag + `CHANGELOG.md`) is separate from the kit `VERSION`.
   See `docs/_guides/16-release-versioning.md`.
7. **Behavior change to note.** The missing-state-snapshot check in the quality
   gate is now a **warning** by default; set `SYNTHEPRISE_REQUIRE_STATE_SNAPSHOT=1` to make
   it fatal (e.g. enforced during change-archive/close-out).
8. **Optional:** enable `.pre-commit-config.yaml` (`pre-commit install`) for a
   tool-agnostic local guard layer, and the opt-in provider-abstraction gate.

## v5.2 → v5.3 (DevEx release)

New capabilities (additive — nothing in v5.2 is removed):

1. **`syntheprise` CLI** (`scripts/syntheprise.py` + root `./syntheprise` wrapper). Replaces the manual
   `cp -R` + fill-by-hand onboarding. Key commands: `init`, `sync`, `gate`,
   `change new|list|archive`, `onboard`, `dashboard`, `push-tasks`, `upgrade`.
2. **Real slash-commands per tool.** Run `syntheprise sync` to generate
   `.claude/commands/`, `.codex/prompts/`, and mirror `.claude/skills/` from the
   canonical `.agents/`. CI now fails on adapter drift (`syntheprise sync --check`).
3. **CI gate runs on `pull_request`/`push`** (was `workflow_dispatch` only) and
   adds a change-completeness check.
4. **Tier-0 fast lane** for solo/PoC: `syntheprise change new "<name>" --type FASTLANE`
   uses a single-file change template.
5. **Brownfield onboarding:** `syntheprise onboard` + `/onboard-existing` workflow +
   `reverse-spec` skill scaffold `docs/_baseline/`.
6. **Bugfix Spec:** `syntheprise change new "<name>" --type BUG` (root-cause +
   regression-guard template).
7. **Team:** `syntheprise dashboard` (status page) and `syntheprise push-tasks` (GitHub/Jira/
   Linear export); `[P]` parallel-task convention.

Migration steps for a project already on v5.2:

```bash
# from the project repo root
cp -R <syntheprise-v5.3>/scripts/syntheprise*.py scripts/
cp -R <syntheprise-v5.3>/scripts/check-change-completeness.py scripts/
cp <syntheprise-v5.3>/syntheprise ./syntheprise && chmod +x ./syntheprise scripts/syntheprise*.py
cp <syntheprise-v5.3>/VERSION ./VERSION
cp -R <syntheprise-v5.3>/docs/_changes/BUGFIX-template docs/_changes/
cp -R <syntheprise-v5.3>/docs/_changes/FASTLANE-template docs/_changes/
cp <syntheprise-v5.3>/.agents/workflows/onboard-existing.md .agents/workflows/
cp <syntheprise-v5.3>/.agents/workflows/dashboard.md .agents/workflows/
cp <syntheprise-v5.3>/.agents/workflows/push-tasks.md .agents/workflows/
cp -R <syntheprise-v5.3>/.agents/skills/reverse-spec .agents/skills/
cp <syntheprise-v5.3>/.github/workflows/quality-gate.yml .github/workflows/
touch .syntheprise-project        # enables strict quality-gate in CI for real projects
syntheprise sync                  # regenerate adapter commands
syntheprise gate                  # confirm green
```

No data format changed; existing `docs/_changes/`, `requirements.md`,
`traceability.md`, and ADRs remain valid.

# Upgrade to v5.4.0

## What changed
- Presets are now first-class: use `syntheprise preset list` and `syntheprise init --preset <name>`.
- Brownfield onboarding can prefill evidence-backed baseline docs with `syntheprise onboard --scan`.
- Quality gates now include secret scanning, dependency hygiene, and coverage threshold checks.
- Stack-specific GitHub Actions examples are included for .NET, Node/React, and Python.

## Migration notes
Existing v5.3.1 projects can copy the following from v5.4.0:
- `presets/`
- `.syntheprise-quality.yml`
- `scripts/check-secrets.py`
- `scripts/check-dependencies.py`
- `scripts/check-coverage.py`
- `.github/workflows/quality-gate-*.yml`
- updated `scripts/syntheprise.py` and `scripts/doctor.py`

Run:
```bash
./syntheprise sync
python scripts/doctor.py --template
```
