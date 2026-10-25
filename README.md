---
doc: readme
title: Syntheprise Framework - The Human-Governed Agentic Development Framework.
status: stable
precedence: 5
owner: Delivery / PMO / Architecture
last_reviewed: 2026-07-26
---

# **Syntheprise Framework -** *The Human-Governed Agentic Development Framework.*

**Short name:** Syntheprise Framework
**Company:** Syntheprise
**Website:** [www.syntheprise.ai](https://www.syntheprise.ai)
**Contact:** [tm@syntheprise.ai](mailto:tm@syntheprise.ai)
**Repo/package name:** `syntheprise-framework`
**Current implementation:** Syntheprise Framework v6.0.1
**Template/tooling package:** Syntheprise Framework Starter Kit
**Company rollout program:** Syntheprise Framework Adoption Program
**Release zip:** `syntheprise-framework.zip`

> **Open source — licensed under Apache-2.0.** Community use and contributions welcome.
> See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md) ·
> Security: [`SECURITY.md`](SECURITY.md) · Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

Syntheprise Framework is Syntheprise's human-governed software delivery framework
for building, maintaining, and governing software projects with AI coding agents.
It standardizes requirements, architecture, QA-first test design, traceability,
change management, quality gates, and tool adapters for Antigravity, GPT Codex,
and Claude Code.

Syntheprise Framework is not a prompt collection. It is a governed development framework: documents define the source of truth, humans make decisions, AI accelerates execution, and quality gates provide evidence.

---

## Start here

If you are new to Syntheprise Framework, read these files in order:

```text
1. SYNTHEPRISE-FRAMEWORK-OVERVIEW.md
2. docs/_guides/00-framework-overview.md
3. docs/_guides/00-quickstart.md
4. docs/_guides/01-agentic-ai-delivery-process.md
5. docs/_guides/03-raci-and-prompt-playbook.md
```

`docs/_guides/00-framework-overview.md` is the complete overview document. It explains what Syntheprise Framework is, why it exists, who uses it, how the repository is organized, how each folder/file group works, how Dev-AI Pair Development operates, what the quality gates enforce, current limitations, and the future roadmap.

---

## What Syntheprise Framework provides

Company-ready controls (governance core, all from V5):

1. **Change/Delta Spec model** — every meaningful change is captured under `docs/_changes/<CHANGE-ID>/` with proposal, delta requirements, design, test plan, tasks, review, and archive flow.
2. **QA-first test design** — QA/BA define acceptance tests before Dev or Dev Agent implementation, reducing confirmation bias.
3. **Traceability matrix** — business goals, requirements, acceptance criteria, tests, implementation tasks, PRs, and release notes are linked in `docs/traceability.md`.
4. **Quality gate scripts** — `doctor.py`, traceability checks, doc-drift checks, and protected-action policy create enforceable project hygiene.
5. **Agent adapters** — tool-specific instructions for Antigravity, GPT Codex, and Claude Code.
6. **Syntheprise Framework Adoption Program** — rollout, training, pilot checklist, role playbooks, and adoption metrics for company-wide deployment.

DevEx layer added in **v5.3** (see `docs/_guides/08-syntheprise-cli.md`):

7. **`syntheprise` CLI** — one entry point: `init`, `sync`, `gate`, `change`, `onboard`, `dashboard`, `push-tasks`, `upgrade`.
8. **Runnable per-tool slash-commands** generated from canonical `.agents/` via `syntheprise sync`, with CI drift checks.
9. **Tier-0 fast lane** for solo/PoC, **brownfield onboarding** (`/onboard-existing` + `reverse-spec`), **Bugfix Spec**, **status dashboard**, and **tracker export** (GitHub/Jira/Linear).
10. **CI gate on every PR/push** + change-completeness enforcement.

---

## Recommended start path (v6.0.1)

For a new project, prefer a certified composable blueprint:

```bash
# from the framework repo
./syntheprise blueprint list
./syntheprise new <your-project-repo> --blueprint python-react-rn --tier 1 --adapter all --mode team
cd <your-project-repo>
./scripts/build
./scripts/test
```

To compose a compatible custom solution, use exactly one `--backend`, optional
`--web`, and optional `--mobile`; review with `--plan` before materializing.
Certification applies to the five named blueprints, not every compatible
combination. See
[`docs/_guides/19-v600-release-and-adoption.md`](docs/_guides/19-v600-release-and-adoption.md).

Solo / PoC fast lane:

```bash
./syntheprise init my-poc --tier 0 --adapter claude
cd my-poc && syntheprise change new "first-slice" --type FASTLANE && syntheprise gate
```

Existing (brownfield) system:

```bash
syntheprise onboard                        # scaffold docs/_baseline, then run /onboard-existing
```

Then fill the canonical files (charter → requirements → core-principles → AGENTS →
architecture → testing-strategy → qa-governance → traceability → plans → adapter).
Manual `cp -R` still works, but `syntheprise init` applies tiering and generates adapters for you.

After placeholders are replaced, enforce the gate:

```bash
syntheprise gate                           # doctor --quality-gate + traceability + doc-drift + adapter parity
```

---

## Repository structure

```text
syntheprise-framework/
├── syntheprise                              # CLI wrapper (./syntheprise <command>)
├── VERSION                           # Framework/kit version (source of truth)
├── AGENTS.md                         # Canonical rules for AI agents
├── CLAUDE.md                         # Claude Code entry context, delegates to AGENTS.md
├── README.md                         # Human onboarding
├── SYNTHEPRISE-FRAMEWORK-OVERVIEW.md        # Complete overview entry point
├── core-principles.md                # Engineering principles and invariants
├── project-charter.md                # Project governance, tiering, ownership, scope
├── requirements.md                   # Source of truth for requirements
├── docs/
│   ├── _changes/                     # Change/Delta Spec lifecycle (CHANGE/BUGFIX/FASTLANE templates)
│   ├── _dashboard/                   # Generated team status dashboard + tracker exports
│   ├── _baseline/                    # (per-project) brownfield onboarding artifacts
│   ├── _guides/                      # Syntheprise Framework usage guides (incl. 08-syntheprise-cli)
│   ├── _plans/                       # Master, phase, and work-group plans
│   ├── _requirements/                # Optional module requirement templates
│   ├── _review/                      # Review records
│   ├── _states/                      # Worklog and state snapshots
│   ├── adr/                          # Architecture Decision Records
│   ├── company-rollout/              # Syntheprise Framework Adoption Program materials
│   ├── architecture.md
│   ├── qa-governance.md
│   ├── testing-strategy.md
│   └── traceability.md
├── .agents/                          # Agent-neutral workflows, skills, rules (canonical)
├── .adapters/                        # Antigravity, Codex, Claude Code adapters
├── .codex/                           # Codex config + generated prompts/
├── .claude/                          # Claude Code settings + generated commands/ & skills/
├── scripts/                          # syntheprise CLI + quality gates and validation scripts
└── tests/                            # Project test home
```

> `.claude/commands/`, `.codex/prompts/`, and mirrored `.claude/skills/` are
> **generated** by `syntheprise sync` from `.agents/` — do not edit them by hand.

---

## Core operating principle

```text
AI drafts. Humans decide. Tests prove. Docs govern.
```

Syntheprise Framework is designed to help Syntheprise scale AI-assisted software delivery without losing professional discipline. The goal is faster delivery with stronger traceability, not faster chaos with prettier markdown.

## Syntheprise Framework v5.4.0 P1 additions

Syntheprise Framework now includes project presets, stronger brownfield onboarding, and stack-aware quality gate examples.

```bash
./syntheprise preset list
./syntheprise init ../my-project --preset greenfield-sme-webapp --adapter all
./syntheprise init ../legacy-project --preset brownfield-modernization --adapter all
./syntheprise init ../odc-stream --preset odc-light --adapter all
./syntheprise onboard --scan
python scripts/doctor.py --quality-gate
```

Use presets to reduce day-one friction while keeping Syntheprise Framework's core controls: QA-first test design, traceability, change control, security hygiene, and quality gates.


## Syntheprise Framework v5.5.0 additions

Field-hardened governance distilled from a large real-world delivery and generalized back into the kit:

- **Worktree isolation & concurrency safety** — per-task `git worktree`, a session lock, a pre-commit guard, and the `worktree` / `close-out` / `update-branch` / `setup-hooks` CLI commands.
- **Drift-free adapters** — `syntheprise sync` generates a `source-command-<name>` skill for every workflow and generates `CLAUDE.md` as a mirror of `AGENTS.md`.
- **Change routing** — objective criteria for when a change must go through `docs/_changes/`, an approval-before-execution gate, and an atomic state-snapshot close-out gate.
- **Release lifecycle** — the `/release-baseline` workflow; product version (git tag + `CHANGELOG.md`) is separated from the kit `VERSION`.
- **Solo/team modes** — one `project.mode` switch; personas persist, cadence changes.
- **New contract surfaces** — `docs/tech-stack.md` dependency inventory, governed `docs/_research/` and `docs/_ui-ux_design/` folders, and design-first (`/ux-design`) UI governance.

See [`CHANGELOG.md`](CHANGELOG.md) and [`UPGRADES.md`](UPGRADES.md) for the full list and migration notes.

For onboarding, start with the framework overview:

```text
SYNTHEPRISE-FRAMEWORK-OVERVIEW.md
docs/_guides/00-framework-overview.md
```

Use these files as the first reading path for PM, BA, TA/SA, Dev, QA, DevOps, and new project team members.
