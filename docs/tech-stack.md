---
doc: tech-stack
title: Tech Stack & Third-party Inventory
status: template
precedence: 2
owner: SA / TA
last_reviewed: <YYYY-MM-DD>
---

# Tech Stack & Third-party Inventory (contract, precedence 2)

> The single canonical home for the project's third-party libraries, platforms, and services. This is a precedence-2 contract: when any other doc mentions a dependency version, license, or tier, this table wins. Seed it from the project's dependency manifests (e.g. package/lock files, container definitions) and keep it current in the SAME change that adds or upgrades a top-level dependency.

## Inventory

| Name | Layer | Version pin | License | Purpose | Tier | Risk / Notes | ADR link |
|---|---|---|---|---|---|---|---|
| `<example-lib>` | BE / FE / Infra / Provider | `^0.0.0` | MIT | `<what it is used for>` | 1 | `<known risk, or —>` | `<ADR-000, or —>` |

_Replace the placeholder row with the project's real dependencies. Keep one row per top-level dependency; transitive dependencies are not listed here._

## Integrations

> External integrations (data/LLM providers, third-party services, queues, stores)
> with a lifecycle status, tracked so `syntheprise integrations` can reconcile the declared
> state against the code. This complements the inventory above: the inventory lists
> *what* the project depends on; this table tracks the *lifecycle* of the integrations
> that sit behind the provider/adapter seam (see `.agents/rules/provider-abstraction.md`).

| Name | Kind | Adapter | Status | Since | Notes |
|---|---|---|---|---|---|
| `<example-provider>` | provider | `src/providers/<example>_provider.py` | planned | `<YYYY-MM>` | `<what it integrates, or —>` |

_Replace the placeholder row with the project's real integrations, one per row._

- **Kind** — `provider` (external data/LLM), `service`, `queue`, `store`, `llm`, or `other`.
- **Adapter** — repo-relative path to the adapter file/dir behind the seam, or `—` when none yet.
- **Status** — lifecycle: `planned` → `active` → `deprecated` → `removed`.
- **Since** — the month the integration reached its current status.
- `syntheprise integrations` flags drift: an `active` integration whose adapter path is missing (or undeclared), or a `removed` one whose adapter still lingers. It is advisory (exit 0); `--strict` exits 1 on drift.

## Column guide

- **Name** — the package, platform, or service identifier.
- **Layer** — where it sits (backend, frontend, infrastructure, external data/LLM provider, dev-only).
- **Version pin** — the constraint actually declared in the manifest.
- **License** — the effective license. Mark `(verify)` when it is assumed from common knowledge and needs confirmation on the next major upgrade.
- **Purpose** — one line on why it is in the stack.
- **Tier** — the lowest project tier at which the dependency is required (`0`, `1`, `1+`, `2`).
- **Risk / Notes** — fragility, licensing caveats, upgrade constraints, or `—` when none.
- **ADR link** — the ADR that justifies the choice, when one exists.

## Maintenance rules

- Adding or upgrading a top-level dependency ⇒ update this table in the SAME change. A major-version upgrade is a governed change and needs approval per the safety rules.
- `scripts/check-dependencies.py` (quality gate) reconciles the project's top-level manifests against this table and flags drift.
- Behavior that belongs to another contract (for example an external-provider call policy or an LLM chain) stays in that contract; this table is inventory only — one fact, one place.

## Composed Stack Technology

### backend.dotnet

- .NET SDK 10.0.302 (LTS channel)
- ASP.NET Core minimal API
- OCI container build using the .NET 10 SDK/runtime images

### web.react-vite

- React 19.2.8
- Vite 8.1.5
- TypeScript 7.0.2

### mobile.react-native-expo

- Expo SDK 57.0.8
- React Native 0.86.0
- React 19.2.8
- TypeScript 7.0.2

### contract.openapi-http

- OpenAPI Specification 3.1
- OpenAPI Generator 7.22.0 (`typescript-fetch`)

### infra.compose-local

- Docker Compose application model
- Linux/macOS local support and Linux CI
