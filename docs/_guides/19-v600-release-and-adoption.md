---
doc: guide-v600-release-adoption
title: "Syntheprise Framework v6.0.0 — Composable Stack Adoption"
status: stable
precedence: 6
owner: Delivery Excellence
last_reviewed: 2026-07-26
---

# Syntheprise Framework v6.0.0 — Composable Stack Adoption

v6 adds ready-to-use polyglot solution templates without maintaining every
backend/web/mobile combination as a copied full-stack pack.

## Fastest supported start

Choose one of the five certified blueprints:

```bash
./syntheprise blueprint list
./syntheprise new ../my-product \
  --blueprint python-react-rn \
  --tier 1 --adapter all --mode team
```

Available certified blueprints:

| Blueprint | Backend | Web | Mobile |
|---|---|---|---|
| `dotnet-react-rn` | .NET | React + Vite | React Native + Expo |
| `java-angular-flutter` | Java + Spring | Angular | Flutter |
| `node-next-rn` | Node.js | Next.js | React Native + Expo |
| `python-react-rn` | Python + FastAPI | React + Vite | React Native + Expo |
| `rust-react-rn` | Rust + Axum | React + Vite | React Native + Expo |

`python-react-rn` is the certified Python default because it minimizes client
toolchain duplication for common data/AI teams. Flutter remains a production
component and is certified in `java-angular-flutter`.

## Compose a custom compatible solution

```bash
./syntheprise stack list --kind component
./syntheprise new ../my-product \
  --backend python-fastapi \
  --web vanilla-js \
  --mobile flutter \
  --tier 1 --adapter all --mode team \
  --plan
```

Review the plan, then rerun without `--plan` to materialize. Use `--web`;
`--frontend` is not an official alias. A solution requires exactly one backend
and allows zero or one web and zero or one mobile component.

Custom compatible compositions are validated for roles, capabilities, paths,
ports and collisions, but they are not automatically certified. Certification
belongs to the five named blueprints and their dated CI evidence.

Since v6.0.1, the plan exposes the sorted `required_tools` union. Scaffolding
checks those executables on PATH after the project is created and emits an
advisory warning for missing tools. It never performs automatic dependency
installation or executes manifest-provided setup hooks.

## Contract and operation model

- OpenAPI is the only checked-in HTTP contract.
- Web/mobile clients consume generated code; hand-copied DTOs are not the
  contract source.
- Root `scripts/build` and `scripts/test` orchestrate ecosystem-native commands.
- Generated-client drift and `/health` smoke are release gates.
- Next.js consumes the external API by default; enable BFF only through an
  explicit capability.

## Existing projects

Start with a no-write assessment:

```bash
./syntheprise upgrade assess --path ../existing-project
./syntheprise upgrade assess --path ../existing-project --json
```

Review detected version, stack mapping, blockers and ordered steps before using
the separate provenance-aware `upgrade --from` operation. Unknown or ambiguous
projects receive an unsupported result and remain byte-for-byte unchanged.

Legacy `syntheprise new --stack <name>` remains available during the v6
transition.

## Support and evidence

- Local development: Linux and macOS.
- CI/certification: Linux.
- Component policy: `current-stable`, with owner/support/verification metadata.
- Weekly CI rechecks all five certified blueprints.
- Windows-native development, app-store publishing, production deployment and
  full Cartesian certification are outside v6.0.0.

See `docs/_guides/17-component-lifecycle.md`,
`docs/_guides/18-v6-legacy-assessment.md` and
`docs/_review/2026-07-26-v600-pilot-release-readiness.md`.
