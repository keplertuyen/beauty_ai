---
doc: syntheprise-cli-guide
title: syntheprise CLI Reference — Syntheprise Framework v6.0
status: stable
precedence: 6
owner: Delivery Excellence
last_reviewed: 2026-07-26
---

# syntheprise CLI Reference (v6.0)

The `syntheprise` CLI is the single entry point for Syntheprise Framework. It removes the manual
`cp -R` + fill-by-hand onboarding and gives solo devs and teams the same
commands. Run `./syntheprise <command>` from the repo root, or `python scripts/syntheprise.py <command>`.

> Principle unchanged: **AI drafts. Humans decide. Tests prove. Docs govern.**

## Commands

| Command | What it does |
|---|---|
| `syntheprise init <target> --tier 0\|1\|2 --adapter claude\|codex\|antigravity\|all` | Scaffold a new project repo at the right tier; auto-runs `sync` (low-level primitive). |
| `syntheprise new <target> --stack <name> [--tier 0\|1\|2] [--adapter ...]` | Scaffold a legacy v1 single-stack project; retained during the v6 transition. |
| `syntheprise new <target> --backend <name> [--web <name>] [--mobile <name>] [--plan]` | Resolve and scaffold a manifest-v2 composition with exactly one backend and optional web/mobile clients. |
| `syntheprise new <target> --blueprint <name> [--plan] [--json]` | Scaffold one ready-to-use certified blueprint. |
| `syntheprise stack list [--kind legacy\|component\|all] [--role <role>]` | List legacy or manifest-v2 technology packs. |
| `syntheprise stack show <name>` | Show one component or legacy stack manifest. |
| `syntheprise blueprint list [--json]` | List blueprints and certification evidence. |
| `syntheprise kickoff` | AI-assisted bootstrap: the agent reads `docs/_intake/` and drafts the canonical Syntheprise Framework docs for your approval. |
| `syntheprise sync` | Generate runnable slash-commands/skills for each tool from `.agents/`, plus `CLAUDE.md` (a generated mirror of `AGENTS.md`). |
| `syntheprise sync --check` | Verify adapters are in sync, including that `CLAUDE.md` matches `AGENTS.md` (used by the quality gate / CI). |
| `syntheprise gate` | Run the full quality gate (`doctor --quality-gate` + adapter parity). |
| `syntheprise status [--json]` | Machine-readable project state (v5.8 kernel): version, mode, kind, per-change artifact graph, task counts, traceability, dashboard. JSON is a derived view of the Markdown. |
| `syntheprise validate [--json] --phase authoring\|merge\|archive` | Validate change artifacts for a lifecycle phase; typed findings + exit codes (0 ok, 1 findings, 2 internal error). Delegates to the canonical checkers (one implementation). |
| `syntheprise analyze <change-id> [--json] [--strict]` | Read-only cross-artifact analysis of one change (ADR link, review-vs-tasks, requirement-without-test, traceability gap, test evidence). Advisory (exit 0) by default; `--strict` fails on findings; exit 2 on unknown change. |
| `syntheprise converge <change-id> [--json] [--base SHA] [--write]` | Compare the change's diff to its artifacts and propose follow-up tasks (unresolved analyze findings, code-without-test, unsigned review, unchecked tasks). Proposal-only by default; `--write` appends them to the change's `tasks.md`; exit 2 on unknown change. |
| `syntheprise managed [--json]` | Report the provenance of SYNTHEPRISE-managed files (v5.9). Reads `.syntheprise/managed-files.json` (written at scaffold time) and classifies each recorded file as unmodified / modified / missing by recomputing its SHA-256. Read-only; `--json` emits the full report; exit 2 when no manifest is present. |
| `syntheprise integrations [--json] [--strict]` | List declared external integrations and their lifecycle drift (v5.9). Reads the `## Integrations` table in `docs/tech-stack.md`, reconciles each row against the adapter on disk, and (v5.10) flags undeclared adapters found under the seam dir. Advisory (exit 0) by default; `--strict` exits 1 on drift. Opt into gate enforcement with `gate.integrations: strict` in `.syntheprise-quality.yml`. |
| `syntheprise change new "<name>" --type CR\|BUG\|TECH\|FASTLANE` | Scaffold a change folder from the right template. |
| `syntheprise change list` | List active and archived changes. |
| `syntheprise change archive <change-id>` | Move a completed change to `_archive` and remind to sync canonical docs. |
| `syntheprise worktree <name> [--base <branch>]` | Create an isolated git worktree + branch for a change, so parallel work does not collide. |
| `syntheprise update-branch` | Bring the current change branch up to date with the base branch (fetch + rebase/merge per project convention). |
| `syntheprise close-out` | Run the end-of-change checklist: tests, gate, traceability, dashboard/master-plan refresh, and archive reminder. |
| `syntheprise setup-hooks` | Install the repo's git/agent hooks (e.g. the active-change reminder) into the local clone. |
| `syntheprise onboard [--out docs/_baseline]` | Scaffold brownfield baseline artifacts. |
| `syntheprise dashboard` | Regenerate `docs/_dashboard/status.html` + `status.md`. Snapshots are committed. Cadence follows `project.mode`: team = after every PR merge; solo = after every change archive. |
| `syntheprise master-plan` | Regenerate the project Master Plan / status board. Same `project.mode` cadence as `dashboard`. |
| `syntheprise push-tasks <change-id> --to github\|jira\|linear` | Export a change's tasks to a tracker import file (no network). |
| `syntheprise upgrade` | Print migration notes (`UPGRADES.md`). |
| `syntheprise upgrade assess [--path <project>] [--json]` | Read-only v6 compatibility report for a legacy or manifest-v2 project. Detects the existing stack, reviewed component mapping, blockers and ordered migration steps; never edits the assessed project. |
| `syntheprise upgrade --from <kit> [--apply] [--json]` | Safe kit-file upgrade (v5.9): plan and (with `--apply`) apply update / add / remove, keeping local edits — conflicts are written as `<file>.syntheprise-new`. Dry-run by default. |
| `syntheprise doctor [--template\|--strict]` | Passthrough to `doctor.py`. |
| `syntheprise version` | Print the framework version. |

`upgrade assess` and `upgrade --from` are deliberately separate. Assessment
answers whether and how a project can move to manifest v2; `--from` performs the
existing provenance-aware kit-file operation only after its dry-run is reviewed.
See `18-v6-legacy-assessment.md`.

## Toolchain preflight (v6.0.1)

Legacy stacks and manifest-v2 components declare the executable names needed by
their documented commands. Composition `--plan` and `--json` output include the
deterministic sorted union as `required_tools`; they never include
machine-specific presence or absence.

After `syntheprise new` atomically creates the project, the CLI checks those
names on PATH. Missing tools produce an advisory stderr warning only: the
project remains created, the command remains successful, and the CLI does not
run `npm install`, `pip install`, a manifest hook or any other setup command.
Install the reported toolchain explicitly before using the generated
dev/build/test commands.

## Tiers (what `init` ships)

| Tier | Audience | Included |
|---|---|---|
| 0 | Solo / spike / PoC | Constitution, principles, requirements, safety rules, CLI + gate, fast-lane change template. No ADR/plans/contracts. |
| 1 | MVP / team project | Tier 0 + architecture, testing-strategy, qa-governance, traceability, plans, ADR, full change template, CI. |
| 2 | Production / scale | Everything: data/api/design/security/domain contracts, runbooks, release checklist. |

Company-rollout material and framework-authoring guides are never copied into a project.

## Adapter generation (no more drift)

`syntheprise sync` reads the canonical `.agents/workflows/*.md` and `.agents/skills/*/SKILL.md`
and writes, for each tool:

- `.claude/commands/<name>.md` — Claude Code slash commands
- `.codex/prompts/<name>.md` — Codex slash prompts
- `.claude/skills/<name>/SKILL.md` — mirrored skills

Generated files carry a `DO NOT EDIT` marker. CI runs `syntheprise sync --check`; if a
canonical file changed but adapters were not regenerated, the build fails.
Antigravity reads `.agents/` natively, so it needs no generation.

## Typical loops

Solo (Tier 0):
```bash
syntheprise init my-poc --tier 0 --adapter claude
cd my-poc
syntheprise change new "first-slice" --type FASTLANE
# write the acceptance check, implement, then:
syntheprise gate
```

Team (Tier 1+):
```bash
syntheprise init my-app --tier 1 --adapter all
cd my-app && touch .syntheprise-project     # enable strict CI gate
syntheprise change new "add-invoice-export" --type CR
syntheprise push-tasks CR-2026-001-add-invoice-export --to github
# ... implement per QA-first loop ...
syntheprise dashboard
syntheprise change archive CR-2026-001-add-invoice-export
```

Existing system (brownfield):
```bash
syntheprise onboard
# run /onboard-existing, review baselines, promote to canonical docs
syntheprise change new "fix-payment-retry" --type BUG
```

## v5.4.0 preset and scanner commands

```bash
./syntheprise preset list
./syntheprise init <target> --preset greenfield-sme-webapp --adapter all
./syntheprise init <target> --preset brownfield-modernization --adapter all
./syntheprise init <target> --preset odc-light --adapter all
./syntheprise onboard --scan
```

If `--tier` is omitted, the selected preset supplies the default tier. Use `--tier` only when the project needs a deliberate exception.

## v5.5.0 additions

### `CLAUDE.md` is a generated mirror

`syntheprise sync` now generates `CLAUDE.md` as a mirror of `AGENTS.md` (with a short Claude Code adapter preamble). `AGENTS.md` stays the single canonical rule source; `CLAUDE.md` is never hand-edited beyond the generated content. `syntheprise sync --check` fails the build if the two drift apart — the same no-drift guarantee already applied to slash-commands and skills. Generated files carry a `DO NOT EDIT` marker.

### Worktree + close-out loop

For parallel or isolated work, `syntheprise worktree <name>` creates a dedicated git worktree and branch so multiple changes can progress without stepping on each other. `syntheprise update-branch` keeps that branch current with its base, and `syntheprise close-out` runs the end-of-change checklist (tests, gate, traceability, status refresh, archive reminder) before a change is considered Done. `syntheprise setup-hooks` installs the repo hooks (such as the active-change reminder) into a fresh clone.

### Cadence parameterized by `project.mode`

`syntheprise dashboard` and `syntheprise master-plan` refresh on a cadence driven by `project.mode` in the project quality config:

| `project.mode` | Dashboard / master-plan refresh |
|---|---|
| `team` | After every PR merge |
| `solo` | After every change archive |

Release baselining (see `docs/_guides/16-release-versioning.md`) is independent of this cadence: it runs when the owner decides to cut a batch, not on every merge or archive.

## v5.9.0 additions

### Managed-file provenance (`.syntheprise/managed-files.json` + `syntheprise managed`)

`syntheprise new` / `syntheprise init` now write `.syntheprise/managed-files.json` when they scaffold a
project — a baseline recording, for every file the kit shipped, a SHA-256 of its
scaffold-time content plus the originating `kit_version`. It is written after `syntheprise
sync` (so generated adapters are included) and lands atomically with the rest of the
scaffold. The manifest excludes itself and is not redistributed (`.syntheprise/` is outside
the distribution manifest).

`syntheprise managed [--json]` reads that baseline and classifies each recorded file:

- **unmodified** — current SHA-256 matches the recorded one (safe for a future upgrade to overwrite),
- **modified** — the team hand-edited it (an upgrade must never clobber it),
- **missing** — the file was deleted.

It never mutates anything, and exits 2 if there is no manifest (e.g. an older
project scaffolded before v5.9). This is the foundation for the safe `syntheprise upgrade`
below.

Since v5.9.1 the manifest records only the files copied **verbatim** from the kit
(identical bytes). Stack-filled docs, generated project-state (`.syntheprise/project.yaml`,
dashboard, MASTER-PLAN) and markers are deliberately excluded — they are team-owned
and must never be overwritten by an upgrade.

## v5.9.1 additions

### Safe kit upgrade (`syntheprise upgrade --from <kit>`)

Point `syntheprise upgrade` at a newer Syntheprise Framework kit checkout to bring this project's kit files
up to date **without ever clobbering local edits**:

```bash
syntheprise upgrade --from ../syntheprise              # dry-run: print the plan
syntheprise upgrade --from ../syntheprise --apply      # write the changes
```

For each managed file it compares three hashes — the recorded baseline
(`managed-files.json`), the current on-disk content, and the incoming kit — and picks
an action, scoped to the project's own tier/adapter:

| Code | Action | When |
|---|---|---|
| `U` | update | file is pristine and the kit changed it |
| `A` | add | genuinely new kit file in an area the project already adopted |
| `D` | delete | pristine file the newer kit dropped |
| `C` | conflict | both kit and team changed it → keep your file, write `<file>.syntheprise-new` |
| `K` | kept | you edited it, the kit did not — your version stands |
| `!` | missing | you deleted it — left alone |

It is **dry-run by default**; `--apply` writes the changes (refusing to write outside
the project), advances the provenance baseline to the new kit version, and leaves any
`.syntheprise-new` files for you to merge. Run `./syntheprise gate` afterwards. Bare `syntheprise upgrade`
(no `--from`) still just prints the migration notes.

## v5.9.2 additions

### Integration lifecycle (`syntheprise integrations`)

Declare the project's external integrations in the `## Integrations` table of
`docs/tech-stack.md` (the canonical third-party contract), one row per integration:

| Name | Kind | Adapter | Status | Since | Notes |
|---|---|---|---|---|---|
| `stripe` | provider | `src/providers/stripe_provider.py` | active | 2026-07 | payments |

`syntheprise integrations [--json] [--strict]` derives the lifecycle and reconciles it against
the code, flagging drift:

- an `active` integration whose `Adapter` path is **missing** (or left undeclared),
- a `removed` integration whose adapter still **lingers** on disk.

`planned` rows are informational (no adapter expected yet). It is **advisory** (exit 0)
by default; `--strict` exits 1 on drift so you can wire it into CI when your project is
ready. This closes the v5.9 provenance line — files (`syntheprise managed`), safe adoption
(`syntheprise upgrade`), and external-dependency lifecycle (`syntheprise integrations`) — and ties
into the provider/adapter seam in `.agents/rules/provider-abstraction.md`.

### v5.10 — undeclared-adapter scan + opt-in gate

`syntheprise integrations` also reports the **reverse** drift: adapter files that live under
the seam directory but that no `## Integrations` row declares (`undeclared-adapter`).
The seam directory defaults to `src/providers`; set `providers_dir:` in
`.syntheprise/project.yaml` to point elsewhere. Seam infrastructure (`index.*`, `factory.*`,
`__init__.py`, `_`-prefixed files) is ignored. `--json` output gains `undeclared` and
`providers_dir`.

To make drift **fail the gate** (not just report), opt in per project — add to
`.syntheprise-quality.yml`:

```yaml
gate:
  integrations: strict
```

`syntheprise gate` (project mode) then runs `syntheprise integrations --strict`. It stays off by
default so a freshly scaffolded project that has not filled the table is never failed.

### v5.10.1 — team-mode independent review evidence

In **team mode** (`project.mode: team` in `.syntheprise-quality.yml`), a change can no longer
be merged on a self-signed review alone. The `--merge` lifecycle phase requires
evidence of a reviewer **independent of the author**, from either channel:

1. a verified **GitHub approval** by a non-author — checked best-effort by
   `scripts/review_evidence_github.py` (via `gh`) when a PR and `gh` are available; or
2. an **`Independent-review: @<reviewer>`** line recorded in the change's `review.md`.

**Solo mode is unchanged** — self-review remains valid, since one owner acts per role.
Escape hatch for exceptional cases: `SYNTHEPRISE_ALLOW_SELF_REVIEW=1` (owner-recorded). This
ties the `mode: solo|team` declaration to a real enforcement difference, so a team that
declares team mode cannot silently self-approve.
