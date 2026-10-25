---
doc: changelog
title: Syntheprise Framework Changelog
status: stable
precedence: 6
owner: Delivery / PMO / Architecture
last_reviewed: 2026-07-26
---

# Changelog

## v6.0.1 — Toolchain preflight

Makes runnable-stack prerequisites visible without introducing automatic setup
or host-dependent plan output (CR-2026-019; PR #12).

**Added**

- Explicit `required_tools` metadata for all 9 legacy v1 stacks and 13
  manifest-v2 production components.
- Strict v2 validation for safe, unique executable names and a deterministic
  sorted tool union in text/JSON composition plans.
- A post-scaffold PATH preflight that reports missing executables on stderr
  while preserving a successful scaffold and exit code.
- Formal evidence-based assessment of SA/Dev review 4.

**Security and compatibility**

- No manifest setup/post-install command is executed; dependency installation
  remains an explicit user or agent action.
- Third-party v2 components that omit `required_tools` remain compatible and
  normalize to an empty list.
- Devcontainers remain a separately evaluated, opt-in concern.

`VERSION` → `v6.0.1`.

## v6.0.0 — Composable polyglot stack packs

Transforms new-project scaffolding from one copied technology skeleton into a
safe, contract-driven composition of backend, web and mobile components
(CR-2026-014–018; PRs #3–#10).

**Added**

- Manifest-v2 component registry, deterministic resolver, preflight collision
  checks, atomic materialization and `.syntheprise/stack-lock.json`.
- Thirteen production components: .NET, Java/Spring, Node.js, Python/FastAPI,
  Rust/Axum; React/Vite, Angular, Next.js and Vanilla JS/Vite; React
  Native/Expo and Flutter; OpenAPI HTTP and Compose-local infrastructure.
- Five ready-to-use certified blueprints: `dotnet-react-rn`,
  `java-angular-flutter`, `node-next-rn`, `python-react-rn` and
  `rust-react-rn`.
- OpenAPI-first generated TypeScript/Angular/Dart clients with drift gates,
  design-first and controlled code-first export support.
- v6 CLI selectors: `--backend`, official `--web`, `--mobile`, `--blueprint`,
  planning/JSON output and component/blueprint discovery.
- Recurring five-blueprint Linux certification, component lifecycle/EOL
  validation, strict dependency/workflow/secret checks and dated security
  exceptions.
- Read-only `syntheprise upgrade assess` for deterministic legacy compatibility
  and migration planning.
- v6 adoption, pilot, support and release-readiness documentation.

**Changed**

- `current-stable` lifecycle metadata is enforced for every production
  component with owner, support state, verification date and official evidence.
- `nextjs-web` is an external API consumer by default; BFF requires an explicit
  capability.
- Local support is Linux/macOS and authoritative certification CI is Linux.
- Legacy v1 `--stack` remains supported during the transition.

**Identity and repository migration**

- Established **Syntheprise Framework - The Human-Governed Agentic Development
  Framework.** as the canonical product identity.
- Renamed the CLI, configuration, project metadata, scripts, tests, guides, and
  distribution artifacts to the `syntheprise` namespace.
- Established Syntheprise as the company, `tm@syntheprise.ai` as the contact,
  `www.syntheprise.ai` as the website, and `TM` as the author identity.
- Updated repository ownership and links to
  `trmn-ai/syntheprise-framework`.
- Added repository-wide regression checks proving the retired identities no
  longer appear in tracked content or paths.

`VERSION` → `v6.0.0`.

## v5.10.1 — Team-mode independent review evidence

Closes the last backlog item: in team mode a change cannot be merged on a
self-signed review alone (CR-2026-013).

**Added**
- **Team-mode review-evidence check** — in the `--merge` phase,
  `check-lifecycle-consistency.py` now requires evidence of a reviewer independent of
  the author when `project.mode: team`. Evidence comes from either a verified GitHub
  approval by a non-author, or an `Independent-review: @<reviewer>` line recorded in
  `review.md`. **Solo mode is unchanged** (self-review remains valid). Escape hatch:
  `SYNTHEPRISE_ALLOW_SELF_REVIEW=1`.
- **`scripts/review_evidence_github.py`** — a read-only, best-effort adapter that asks
  GitHub (via `gh`) whether the current branch's PR has an APPROVED review from a login
  other than the author. Exit 0 approved / 1 none / 2 undeterminable (callers fall back
  to the attestation line). Its pure `independent_approval()` helper is unit-tested.

`VERSION` → `v5.10.1`. This completes the team/integration governance backlog
(#1 undeclared+gate, #2 seam scan, #3 review evidence).

## v5.10.0 — Integration gate hardening

Makes the integration lifecycle enforceable and two-directional (CR-2026-012).

**Added**
- **Undeclared-adapter scan** — `syntheprise integrations` now also flags the reverse drift:
  adapter files that live under the provider/adapter seam directory but no row in the
  `## Integrations` table references. Seam infrastructure (`index.*`, `factory.*`,
  `__init__.py`, `_`-prefixed files) is ignored. The seam directory is
  `src/providers` by default, or `providers_dir:` in `.syntheprise/project.yaml`.
- **Opt-in gate enforcement** — a project can set `integrations: strict` under a
  `gate:` block in `.syntheprise-quality.yml` to make `syntheprise gate` (project mode) fail on
  integration drift. Default off, so scaffolds that have not filled the Integrations
  table are never failed; `syntheprise integrations` stays advisory until a team opts in.

`syntheprise integrations --json` now also returns `undeclared` and `providers_dir`.
`VERSION` → `v5.10.0`. Next: team-mode independent review-evidence.

## v5.9.2 — Integration lifecycle (provenance milestone, phase 3)

Completes the v5.9 provenance milestone with a lifecycle view over the project's
external integrations (CR-2026-011).

**Added**
- `syntheprise integrations [--json] [--strict]` — derives the integration lifecycle from a
  new `## Integrations` table in `docs/tech-stack.md` (the canonical L2 third-party
  contract) and reconciles the declared state against the filesystem. Each row has a
  `Kind` (provider / service / queue / store / llm / other) and a `Status`
  (`planned` → `active` → `deprecated` → `removed`). It flags drift — an `active`
  integration whose adapter is missing or undeclared, or a `removed` one whose adapter
  still lingers — advisory (exit 0) by default; `--strict` exits 1 on drift. Read-only;
  Markdown stays the source of truth, JSON is a derived view.
- The `## Integrations` section ships in the kit's `docs/tech-stack.md` and all nine
  stack packs, so scaffolded projects get it out of the box.

With this the v5.9 provenance line is complete: `syntheprise managed` (files), `syntheprise upgrade`
(safe adoption), `syntheprise integrations` (external-dependency lifecycle). `VERSION` →
`v5.9.2`.

## v5.9.1 — Safe kit upgrade (provenance milestone, phase 2)

Consumes the v5.9.0 provenance baseline to upgrade a project's Syntheprise Framework kit files
**without ever clobbering local edits** (CR-2026-010).

**Added**
- `syntheprise upgrade --from <kit> [--apply] [--json]` — compares three hashes per managed
  file (recorded baseline, current on-disk, incoming kit) and produces a plan:
  **update** pristine files the kit changed, **add** genuinely-new kit files in an
  adopted area, **remove** pristine files the kit dropped, and for a **conflict**
  (both kit and team changed a file) keep the team's copy and drop the kit version
  beside it as `<file>.syntheprise-new`. Files the team edited that the kit did not change
  are **kept**; deleted files are reported **missing**. **Dry-run by default**;
  `--apply` writes changes (refusing to write outside the project) and advances the
  provenance baseline to the new kit version. Bare `syntheprise upgrade` (no `--from`) still
  prints migration notes.

**Changed**
- `.syntheprise/managed-files.json` now records only the files copied **verbatim** from the
  kit (identical bytes) — stack-filled docs, generated project-state, and markers are
  excluded, so they are never mistaken for kit-managed and never overwritten on
  upgrade. This tightens the v5.9.0 manifest so `syntheprise managed` / `syntheprise upgrade` report
  the true framework surface.

`VERSION` → `v5.9.1`. Next: integration / managed-dependency lifecycle.

## v5.9.0 — Managed-file provenance (provenance milestone, phase 1)

Starts the v5.9 provenance milestone (CR-2026-009): every scaffolded project now
records which files came from the Syntheprise Framework kit and their original content hash, so a
future `syntheprise upgrade` can safely overwrite pristine managed files while never
touching ones the team hand-edited. No product change to scaffolded apps.

**Added**
- `.syntheprise/managed-files.json` — written at scaffold time by `syntheprise new` / `syntheprise init`
  (after `sync`, before deploy). Records `schema_version`, `source` (`syntheprise-kit`),
  the originating `kit_version`, and a SHA-256 for every distributed file. Output is
  deterministic (`sort_keys`) and diff-stable; the manifest excludes itself.
- `syntheprise managed [--json]` — read-only provenance report that classifies each
  recorded file as unmodified / modified / missing by recomputing its SHA-256.
  Human summary plus `M`/`D` lines; `--json` emits the full report; exit 2 when no
  manifest is present.

This is the foundation for the safe `syntheprise upgrade` (next v5.9 slice) and the
integration/managed-dependency lifecycle after it. `VERSION` → `v5.9.0`.

## v5.8.2 — Converge engine (kernel phase 3, kernel surface complete)

Completes the machine-readable kernel surface — `status`, `validate`, `analyze`,
`converge` — with the converge step (CR-2026-008). No product change.

**Added**
- `syntheprise converge <change-id> [--json] [--base SHA] [--write]` — compares a change's
  implementation diff against its artifacts and proposes follow-up tasks for
  uncovered gaps: each unresolved `analyze` finding, code changed with no test
  change, an unsigned review, and unchecked tasks. **Proposal-only by default**
  (read-only); `--write` appends the proposals to the change's `tasks.md` under a
  "Converge follow-ups" section; exit 2 on an unknown change.

With this, the kernel exposes the full validate → analyze → converge flow the
review recommended. `VERSION` → `v5.8.2`. Next: v5.9 managed-file / integration
provenance (backlog in `docs/_research/`).

## v5.8.1 — Read-only analyze engine (kernel phase 2)

Adds the read-only cross-artifact analysis step of the kernel (CR-2026-007),
before any converge that would mutate state. No product change.

**Added**
- `syntheprise analyze <change-id> [--json] [--strict]` — inspects one change's artifacts
  for consistency and emits coded findings: `adr-missing-link` (an ADR marked
  required but not referenced), `review-vs-tasks` (review signed while tasks are
  unchecked), `req-without-test` (requirements without any test case),
  `task-without-traceability` (tasks with no requirement/AC/test reference), and
  `review-without-test-evidence`. It **never mutates**; advisory (exit 0) by
  default, fails under `--strict`, and exits 2 on an unknown change.

`VERSION` → `v5.8.1`. Next: `syntheprise converge` (compare implementation to artifacts
and propose follow-up tasks); then v5.9 managed-file / integration provenance.

## v5.8.0 — Machine-readable state kernel (phase 1)

The first slice of the machine-readable kernel (CR-2026-006). Markdown stays the
single human source of truth; the JSON is a generated, derived view — no second
hand-maintained truth. Analyze and converge are deferred to later slices.

**Added**
- `scripts/syntheprise_kernel.py` — `build_model()` derives a structured, versioned model
  of the repo (kind, version, mode, per-change artifact graph with statuses, task
  counts, traceability coverage, dashboard counts, derived lifecycle state:
  draft / authoring / merge-ready / archived).
- `syntheprise status [--json]` — emit the model (human summary or machine-readable JSON).
- `syntheprise validate [--json] --phase authoring|merge|archive` — validate change
  artifacts for a lifecycle phase, returning typed findings and distinct exit
  codes (0 ok, 1 findings, 2 internal error). It delegates to the canonical
  checker scripts, so validation has ONE implementation and the model and the
  gates cannot diverge.
- `.syntheprise/project.yaml` — a small, versioned machine-readable descriptor
  (schema_version, kind, mode); the initializer generates one per project (kind
  `project`) and the kit descriptor/config are excluded from distribution.

`VERSION` → `v5.8.0`. Next slices (backlog in `docs/_research/`): `syntheprise analyze`
(read-only cross-artifact checks) then `syntheprise converge`, then managed-file /
integration provenance.

## v5.7.4 — Project boundary & fail-closed safety (4th SA review)

Fixes the ten findings of the fourth SA review (CR-2026-005). Two are headline:
a `--force` deploy that could escape the target through a symlink, and an
initializer that copied the kit's own governance state into every project.
No new product features.

**Fixed (P0/P1)**
- **Symlink escape (P0)** — `syntheprise new --force` / `syntheprise init --force` now refuse to
  write through a symlinked destination component (and refuse a symlinked target),
  so a `--force` overlay can no longer create/overwrite files outside the target.
- **Project/framework boundary (P1)** — scaffolding no longer copies "every tracked
  file minus a denylist". A new explicit `scripts/kit_manifest.py` allowlist keeps
  the kit's change instances, archive, real state snapshots, dashboard, MASTER/PHASE
  plan instances, research notes, framework ADRs and kit quality config out of
  generated projects. The initializer generates **clean** project state: a fresh
  0/0 dashboard, a project MASTER-PLAN from the template, an empty change archive,
  all taxonomy folders, and a project quality config.
- **Operating-mode leak (P1)** — `syntheprise new`/`init` take `--mode team|solo`
  (**default team**); the generated `.syntheprise-quality.yml` carries the project's own
  mode instead of inheriting the kit's `solo`.
- **Lifecycle depth (P1)** — `check-lifecycle-consistency.py` now requires an
  archived change to have its full artifact set, every task checkbox ticked, a
  linked state snapshot, and terminal statuses; a new `--merge` phase blocks an
  active change from merging while its review is unsigned or tasks are unticked
  (wired into the PR job). An empty archive folder no longer passes.
- **Un-thinnable completeness (P1)** — `check-change-completeness.py` rejects
  residual template prose, so "template + one appended line" no longer passes.
- **Strict doc-drift wired (P1)** — `check-doc-drift.py --strict` now runs in
  `syntheprise gate` and both CI paths; a sensitive change with no matching doc fails.

**Fixed (P2)**
- Traceability parser no longer treats an ID ending in `001` (e.g. `AC-001`) as a
  placeholder; example rows are marked explicitly.
- The dashboard counts checkbox tasks via a shared parser (was reporting 0).
- Rollback keeps the recovery backup when it cannot fully complete, and removes
  only empty created directories.
- Negative/fault-injection tests added for the symlink escape, contamination,
  empty archive, and thin-artifact cases (suite 15 → 21).

`VERSION` → `v5.7.4`. (v5.8 machine-readable kernel remains backlog; the explicit
manifest is its seed.)

## v5.7.3 — Governance integrity hardening (3rd SA review)

Closes the gap between Syntheprise Framework's *described* governance and its *enforced* governance
(CR-2026-004). The gates now prove semantics rather than "an artifact was touched".
No new product features.

**Fixed (P1)**
- **Un-bypassable change-completeness** — `check-change-completeness.py` now rejects
  leftover placeholder tokens and artifacts that are template-identical after
  normalizing BOTH the id token AND the status value. Flipping only
  `status: template` → `draft` no longer passes (a reproduction test guards it).
- **Lifecycle-consistency gate** — new `check-lifecycle-consistency.py`: an archived
  change must have `tasks.md status: done` and `review.md status: signed`;
  `docs/_plans/MASTER-PLAN.md` must exist; the committed dashboard must be current
  (`syntheprise dashboard --check`). Wired into `syntheprise gate`. This would have caught the
  non-compliant close-outs the review found. Archived CR-2026-001/002/003 migrated
  to valid terminal states; MASTER-PLAN created; dashboard regenerated.
- **Honest operating mode** — this kit is declared `mode: solo` (one owner + AI);
  per-role sign-offs are recorded as `review_mode: self-review` rather than implying
  independent team review that did not happen.
- **Genuinely reversible `--force`** — the transactional overlay now also removes the
  directories it creates on rollback, so a failed forced deploy leaves the target
  unchanged (fault-injection test guards it).

**Fixed (P2)**
- **Shared traceability parser** — new `syntheprise_trace.py` used by both
  `check-traceability.py` and `syntheprise_dashboard.py`, so they can no longer disagree.
  A template/placeholder-only matrix now reports `n/a` coverage (was a false 100%);
  project mode requires at least one real requirement row.
- **Strict doc-drift** — `check-doc-drift.py --strict` fails when a sensitive surface
  changes with no matching doc update (or an `SYNTHEPRISE_DOC_ATTEST` attestation).
- **Negative / fault-injection tests** — added for the bypass, placeholder token,
  `--force` rollback, and traceability-coverage guarantees (suite 11 → 15).

`VERSION` → `v5.7.3`. (F8, version-scope metadata, deferred; v5.8 kernel remains
backlog in `docs/_research/`.)

## v5.7.2 — Enforcement hardening (2nd SA review)

Resolves the six findings of the second SA review of v5.7.1 (CR-2026-003) and the
version drift it surfaced. The strategic roadmap (v5.8+) from that review is
captured as a backlog in `docs/_research/`, not implemented here.

**Fixed (P1)**
- **`.env.example` restored** — the v5.7.1 secret exclusion was too broad and
  dropped the intentional `.env.example` template from every generated project.
  Now only real secret env files are excluded (`.env`, `.env.local`, …); the
  `.env.example`/`.env.template`/`.env.sample` templates are kept.
- **Genuinely atomic scaffold** — a new/empty target is deployed with a single
  `os.replace` (staging built under the target's parent, same filesystem), so a
  failure leaves NO partial target. `--force` overlays transactionally (backs up
  overwritten files, restores on error). A failed `syntheprise_sync` now blocks the
  deploy entirely (returns before writing the target).
- **Semantic change-completeness** — `check-change-completeness.py` now rejects
  artifacts left as the scaffold template (`status: template` or
  template-identical), not just missing files, closing the false-green gap where
  a change could merge with a blank `review.md`.
- **CI-aware doc-drift + version consistency** — `check-doc-drift.py` diffs
  `SYNTHEPRISE_BASE_SHA...HEAD` (CI passes the base) instead of the always-empty working
  tree. New `check-version-consistency.py` fails when a current-version marker
  drifts from `VERSION`; wired into the quality gate and framework CI. All stale
  references (README, overview, framework-overview, CLI docstring) corrected to
  the current version.

**Fixed (P2)**
- **Missing acceptance tests added** — `.env.example` presence, ISO-dated snapshot
  recognition (TC-H-05), archive-aware change sequencing (TC-H-06). Base-kit
  enumeration takes an overridable `root` for isolated fixtures. Suite: 8 → 11.
- **Reproducible framework gate** — a `.syntheprise-kit` marker + `syntheprise gate` that
  auto-selects framework mode (placeholders allowed; version + completeness
  enforced) vs strict project mode (`--framework`/`--project` to override).
  `doctor.py` errors on OS junk only when it is git-tracked, and treats
  `docs/_intake/` and `docs/_baseline/` links as per-project (not broken).

**Added**
- `docs/_research/2026-07-25-strategic-roadmap-openspec-speckit.md` — backlog of
  the review's forward-looking roadmap (machine-readable kernel, analyze/converge,
  managed integrations, runtime/project split, OpenSpec/Spec Kit interop).

`VERSION` → `v5.7.2`.

## v5.7.1 — Harden initializer + fail-closed gates (SA review)

Addresses all six findings of the SA review of v5.7.0 (CR-2026-002).

**Fixed (P1)**
- **Scaffold contamination / secrets leak** — `syntheprise new`/`syntheprise init` now source the
  base kit from `git ls-files` (tracked files only), with a hardened `rglob`
  fallback for non-git kits. Ignored/untracked paths — `.env`, nested
  `.claude/worktrees/`, `.venv`, `node_modules`, `secrets/` — are never copied.
  A generated Node project dropped from ~748 files to ~311.
- **Silent overwrite** — `syntheprise new`/`init` refuse a non-empty target unless
  `--force`, and build in a staging dir (atomic: no half-written target).
- **CI fail-closed** — removed `|| true` (and `pip install -e . || true`) from the
  Node/Python stack gates; test steps now fail the job when tests fail.
- **Angular skeleton** — added the missing `@angular-devkit/build-angular`
  (+ `@angular/compiler`) so `npm run build`/`start` work.

**Fixed (P2)**
- **Dead contract reference** — `AGENTS.md` §2.10 no longer implies a
  `./syntheprise test-gate` CLI command; it references the `/test-gate` workflow (tests
  are stack-specific). `./syntheprise gate` remains the CLI quality gate.
- **Doctor state-snapshot** — standardized on ISO `YYYY-MM-DD`; `doctor.py` now
  also excludes nested `.claude/worktrees/` from its scan.

**Fixed (extra)**
- `_next_change_seq` scans `docs/_changes/_archive/` too, so a new change id never
  collides with an already-archived one.

Tests: `tests/test_syntheprise_new.py` grew to 8 (contamination, non-empty guard,
`--force`, Angular builder). `VERSION` → `v5.7.1`.

## v5.7.0 — Stack matrix complete (initializer Phase 2)

Completes the `syntheprise new` stack registry (CR-2026-001 Phase 2). Six new stack
packs, each a runnable skeleton + health check + stack-tailored Syntheprise Framework docs, added
via the same one-folder-one-manifest pattern (no engine change):

- `dotnet` (ASP.NET Core minimal API), `rust` (axum), `java` (Spring Boot),
  `react-native` (Expo), `angular` (standalone components), `nextjs-fullstack`
  (App Router + API route).

Full set now: `python-fastapi`, `node`, `react-vite`, `dotnet`, `rust`, `java`,
`react-native`, `angular`, `nextjs-fullstack` (`syntheprise stack list`).

Verified: every stack scaffolds a `doctor --template`-clean project; `doctor`
validates all stack manifests + skeletons; `tests/test_syntheprise_new.py` asserts the
full stack list. `VERSION` → `v5.7.0`.

## v5.6.0 — One-command project initializer

Adds a low-friction "download → one command → tailored, runnable project" path,
then an AI step that drafts the governance docs from materials you provide.
Additive; `syntheprise init` is unchanged. See `docs/_guides/18-project-initializer.md`
and ADR-0002. Delivered via change `CR-2026-001-syntheprise-new-initializer`.

**New commands**
- `syntheprise new <target> --stack <name>` — deterministic scaffold: base kit at the
  resolved tier + a **stack pack** (runnable skeleton, dependency manifest,
  stack-filled `docs/tech-stack.md` + `architecture.md` scaffold) + a guided
  `docs/_intake/` inbox that tells you exactly what to prepare.
- `syntheprise stack list` — list available stack packs.
- `syntheprise kickoff` — launches the `/kickoff` workflow: the AI reads `docs/_intake/`,
  extracts content, and DRAFTS the canonical docs (`requirements.md`,
  `project-charter.md`, `docs/architecture.md`, `docs/tech-stack.md`,
  `docs/domain-rules.md`, `docs/design-system.md`) for your approval. It drafts
  only from intake materials and never invents domain facts.

**New building blocks**
- Extensible **stack-pack registry** `presets/stacks/<name>/` (manifest + runnable
  `skeleton/` + doc overrides). Adding a stack is one folder + one manifest.
- Reference stack packs: `python-fastapi`, `node`, `react-vite`.
- Guided intake templates under `presets/_intake/` (copied to `docs/_intake/`).
- `.agents/workflows/kickoff.md` (+ generated `source-command-kickoff` skill).
- `doctor.py`: validates stack-pack manifests + skeletons; treats `docs/_intake/`
  as an informational inbox.

**Fixed**
- `.claude/settings.json` hooks now use `$CLAUDE_PROJECT_DIR/scripts/...` (portable
  from worktrees/subdirs) — completing the v5.5.0 hook-portability intent (F10)
  that was missed.

**Changed**
- `VERSION` → `v5.6.0`.

## v5.5.0 — Field-hardened governance release

Distilled from proven best practices accumulated running Syntheprise Framework on a large
real-world delivery, then generalized back into the kit. All changes are
project-agnostic and English-only; nothing project-specific was carried over.
Additive except where noted under "Changed".

**Multi-agent concurrency & worktree isolation**
- New `.agents/rules/worktree-isolation.md`: the primary checkout is reserved for
  `main`; any git-writing task runs in its own `git worktree`; concurrent
  multi-step git sequences (e.g. close-out) are serialized via a session lock.
- New `scripts/session_lock.py` (dependency-free advisory lock keyed by worktree
  path) and `scripts/check-worktree-isolation.py` (pre-commit guard, CI-aware,
  escape hatch `SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1`).
- New CLI commands: `syntheprise worktree`, `syntheprise close-out`, `syntheprise update-branch`,
  `syntheprise setup-hooks`; entry points self-install the git guard hook.
- New invariant `AGENTS.md §2.12`.

**Adapter generation upgrade (no drift)**
- `syntheprise sync` now generates a `source-command-<name>` skill for **every**
  workflow, so each migrated command is discoverable as a skill and can no longer
  drift from its workflow source (single-pass convergent).
- `CLAUDE.md` is now a generated, marker-stamped mirror of `AGENTS.md` (was a
  hand-maintained stub that could diverge); `syntheprise sync --check` verifies it.

**Change routing & close-out discipline**
- New `.agents/rules/change-management.md` (canonical home) with 7 objective
  criteria that force a change through `docs/_changes/` ("satisfy any one").
  Mirrored in `AGENTS.md §2.7`.
- Approval-before-execution invariant (`§2.9`) and auto-commit/PR-after-gates
  invariant (`§2.10`).
- Close-out procedure with an atomic state-snapshot gate in the Definition of
  Done; `change-archive` workflow hardened (snapshot gate + branch/worktree
  cleanup + agent-agnostic ordering).

**Release lifecycle & versioning**
- New `/release-baseline` workflow and `docs/_guides/16-release-versioning.md`:
  product semver (git tag + `CHANGELOG.md`) is separated from the Syntheprise Framework kit
  version (`VERSION`). Tagging is an owner-confirmed protected action.

**Solo/team operating modes**
- Single `project.mode: solo|team` switch in `.syntheprise-quality.yml` (default `team`),
  validated by `doctor.py`. Personas persist in both modes; only cadence changes.

**New contract surfaces & doc governance**
- New `docs/tech-stack.md` (tier-2 dependency/license inventory contract), added
  to the arbitration ladder and context map; `check-dependencies.py` warns on
  drift against it.
- New governed folders `docs/_research/` and `docs/_ui-ux_design/` (with README
  governance), declared in the new "Canonical docs/ folder taxonomy" section;
  `doctor.py` checks the taxonomy for constitution drift.
- New `docs/_guides/09-requirement-workflow.md` (a model "points-to-authority"
  guide). `testing-strategy.md` gains an Execution-Report requirement.

**Design-first (UI analog of QA-first)**
- New `/ux-design` workflow + `.agents/rules/ui-ux-standards.md` + UI/UX Designer
  persona: a design brief is approved before frontend implementation.

**Tooling hygiene & security**
- `doctor.py`: `EXCLUDE_DIRS` walk filter, archive/review/research skips, official
  doc-root scoping, and `project.mode` validation.
- `safety.md`: secret-in-chat treated as compromised (rotate); build-time secret
  injection guidance. `code-style.md`: "Delivery discipline (hard lessons)".
- `check-secrets.py` skips archive/review dirs; `syntheprise_dashboard.py` uses
  timezone-aware UTC. New `.pre-commit-config.yaml` (tool-agnostic local layer).
- Optional, opt-in `scripts/check-provider-abstraction.py` template for enforcing
  a provider/adapter seam.

**Changed**
- `CLAUDE.md` is now generated by `syntheprise sync` — do not edit it by hand; edit
  `AGENTS.md` and re-sync.
- The missing-state-snapshot quality-gate check is a warning by default (set
  `SYNTHEPRISE_REQUIRE_STATE_SNAPSHOT=1` to make it fatal during close-out).
- `VERSION` → `v5.5.0`.

## v5.4.1 — Framework Overview Onboarding Patch

- Added root overview entry: `SYNTHEPRISE-FRAMEWORK-OVERVIEW.md`.
- Added complete overview guide: `docs/_guides/00-framework-overview.md`.
- Updated `README.md` with the recommended first-reading path.
- Updated `docs/_guides/00-quickstart.md` to point new users to the overview before CLI usage.
- Updated `VERSION` to `v5.4.1`.


## 2026-06-17 — Syntheprise Framework v5.3.1 (P0 release-clean patch)

- Removed macOS/OS junk from the release package: `.DS_Store`, `__MACOSX`, and AppleDouble `._*` files.
- Cleaned project-level references to company rollout materials; those materials now remain framework-level Syntheprise Framework Adoption Program assets.
- Made doctor internal-link validation tier-aware so `syntheprise init --tier 0|1|2` produces clean project health checks without warning on intentionally omitted optional artifacts.
- Kept adapter parity by regenerating Claude Code commands, Claude skills, and Codex prompts from canonical `.agents/` sources.

## 2026-06-17 — Syntheprise Framework v5.3.0 (DevEx release)

Closes the tooling gap with Spec-Kit / Kiro / OpenSpec while keeping Syntheprise Framework's
governance lead. All changes are additive; v5.2 artifacts remain valid.

**5.1 DevEx**
- Added the `syntheprise` CLI (`scripts/syntheprise.py` + root `./syntheprise`): `init`, `sync`,
  `gate`, `change`, `onboard`, `dashboard`, `push-tasks`, `upgrade`, `doctor`.
- Added `scripts/syntheprise_sync.py`: generates runnable slash-commands/skills per tool
  (`.claude/commands/`, `.codex/prompts/`, mirrored `.claude/skills/`) from the
  canonical `.agents/`; CI fails on drift via `syntheprise sync --check`.
- CI quality gate now runs on `pull_request`/`push` (was `workflow_dispatch`)
  and adds `scripts/check-change-completeness.py`.
- Extended `doctor.py`: new required files, template-folder detection, adapter
  parity in `--quality-gate`. Added `VERSION` and `UPGRADES.md`.

**5.2 New projects**
- Tiered scaffolding: `syntheprise init --tier 0|1|2 --adapter ...`.
- Tier-0 fast lane for solo/PoC: `FASTLANE-template` + guide `05-solo-fast-lane.md`.

**5.3 Brownfield**
- `/onboard-existing` workflow + `reverse-spec` skill + `syntheprise onboard` baselines.
- Dedicated **Bugfix Spec** (`BUGFIX-template`): root-cause + regression guard.
- Guide `06-brownfield-onboarding.md`.

**5.4 Team**
- `syntheprise dashboard` status page (`docs/_dashboard/`).
- `syntheprise push-tasks` exporter for GitHub/Jira/Linear (no network).
- `[P]` parallel-task convention. Guide `07-parallel-and-tracker.md`.
- CLI reference guide `08-syntheprise-cli.md`.

## 2026-06-17 — Syntheprise Framework V5 Core naming and language standardization

- Renamed the framework to **Syntheprise Framework - The Human-Governed Agentic Development Framework.**.
- Standardized the short internal name as **Syntheprise Framework**.
- Standardized the repo/package name as `syntheprise-framework`.
- Standardized the zip file name as `syntheprise-framework.zip`.
- Standardized the companion tooling/template package as **Syntheprise Framework Starter Kit**.
- Standardized the current implementation as **Syntheprise Framework V5 Core**.
- Standardized the internal rollout program as **Syntheprise Framework Adoption Program**.
- Converted all Vietnamese guide content to English.
- Removed project-specific naming and replaced it with `<Project Name>` or equivalent placeholders.
- Removed OS junk files.

## 2026-06-17 — Syntheprise Framework V5 Core build

- Added Change/Delta Spec model.
- Added QA-first test design governance.
- Added traceability matrix.
- Upgraded quality-gate scripts.
- Added adapters for Antigravity, GPT Codex, and Claude Code.
- Added Syntheprise Framework Adoption Program materials.

## v5.4.0 — P1 hardening release

- Added built-in presets: `greenfield-sme-webapp`, `brownfield-modernization`, and `odc-light`.
- Added `syntheprise init --preset <name>` and `syntheprise preset list`.
- Added `syntheprise onboard --scan` for evidence-backed brownfield baseline scaffolding.
- Added dependency-free quality scripts: `check-secrets.py`, `check-dependencies.py`, `check-coverage.py`.
- Added `.syntheprise-quality.yml` coverage/security defaults.
- Added stack-specific GitHub Actions examples for .NET, Node/React, and Python.
- Added security/quality gate hooks and agent skills.
