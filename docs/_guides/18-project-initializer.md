---
doc: guide-project-initializer
title: One-command project initializer — syntheprise new + kickoff
status: stable
precedence: 6
owner: Delivery Excellence
last_reviewed: 2026-07-26
---

# One-command project initializer (`syntheprise new` + `syntheprise kickoff`)

> Informational guide. Authority for behavior lives in `scripts/syntheprise.py`, `.agents/workflows/kickoff.md`, and ADR-0002.

Download Syntheprise Framework, then create a runnable, stack-tailored project and fill its
business logic with two commands. The philosophy is unchanged:
**AI drafts. Humans decide.** — nothing is finalized without your approval, and
the AI never invents domain facts.

## The flow

```bash
# 1. Scaffold: a runnable skeleton for your stack + a guided intake inbox
./syntheprise new ../my-app --blueprint python-react-rn \
  --tier 1 --adapter all --mode team

# 2. Fill docs/_intake/ with what describes your product
#    (see ../my-app/docs/_intake/README.md — all files optional)

# 3. Let the AI draft your Syntheprise Framework docs from the intake, for your approval
cd ../my-app
syntheprise kickoff
```

### Discover v6 components and blueprints

Shows manifest-v2 components and the five ready-to-use certified blueprints:

```bash
./syntheprise stack list --kind component
./syntheprise blueprint list
```

### `syntheprise new <target> --blueprint <name> ...`

This is the shortest supported v6 path. A blueprint selects one backend,
optional web/mobile consumers, OpenAPI contract and local orchestration with
dated build/test/health evidence.

### `syntheprise new <target> --backend <name> [--web <name>] [--mobile <name>]`

Use this when no certified blueprint matches. Review resolution without writes:

```bash
./syntheprise new ../my-app \
  --backend python-fastapi --web vanilla-js --mobile flutter \
  --tier 1 --adapter all --mode team --plan
```

Use the official `--web` selector. Custom compositions are compatibility-checked
but are not automatically certified.

### Legacy `--stack`

`syntheprise new <target> --stack <name>` remains available for v1 projects
during the transition.

All initializer forms are deterministic and:
Deterministic, no AI. It:
- copies the base Syntheprise Framework kit at the resolved tier + adapter,
- applies the **stack pack**: a runnable `skeleton/` (dependency manifest, app
  dir, hello-world + `/health`), plus stack-filled `docs/tech-stack.md` and an
  `docs/architecture.md` scaffold,
- creates `docs/_intake/` — an inbox whose `README.md` tells you exactly what to
  prepare and where,
- sets the project markers and generates the tool adapters.

In v6.0.1, the plan also lists `required_tools`. After a successful scaffold,
the CLI checks those executable names on PATH and warns if any are absent. This
check is advisory and deliberately runs after atomic deployment: it never
installs packages, executes a manifest setup hook, removes the generated
project, or changes the successful exit code.

If `--tier` is omitted, the stack's default tier is used. `syntheprise init` remains the
low-level primitive; `new` = init + stack pack + intake.

### Fill `docs/_intake/`
Drop in whatever describes the product — a requirements brief, tech-stack notes,
domain rules, constraints, UI/UX mockups, integrations. Everything is optional;
more input yields better drafts. See the inbox's own `README.md`.

### `syntheprise kickoff`
Runs the `/kickoff` workflow with your AI agent. The agent reads everything in
`docs/_intake/`, extracts the content, and **drafts** the canonical docs —
`requirements.md`, `project-charter.md`, `docs/architecture.md`,
`docs/tech-stack.md`, `docs/domain-rules.md`, `docs/design-system.md`, and seeds
`docs/traceability.md` — presenting each for your approval. It drafts **only**
from your intake materials and lists anything missing instead of guessing.

After you approve, the project's `syntheprise gate` runs clean and you are in the normal
Syntheprise Framework delivery loop.

## Adding a new v2 component

A component is one folder — no CLI change needed:

```text
presets/components/<role>/<name>/
  manifest.json     # schema v2, role, capabilities, required_tools, lifecycle
  README.md
  skeleton/         # runnable implementation under its declared output
  docs/             # owned documentation fragments
```

Compose reusable components in a thin folder under `presets/blueprints/`.
`doctor.py`, lifecycle checks and the catalog workflow validate manifests,
ownership, support metadata and certification evidence. See guide 19.
