---
doc: v6-legacy-assessment-guide
title: v6 Legacy Project Assessment
status: stable
precedence: 5
owner: Syntheprise Framework Maintainers
last_reviewed: 2026-07-26
---

# v6 Legacy Project Assessment

Run the assessment before any migration:

```bash
syntheprise upgrade assess --path ../existing-project
syntheprise upgrade assess --path ../existing-project --json
```

The command is read-only. It detects a manifest-v2 stack lock or the legacy
`.syntheprise-stack` marker, applies the reviewed
`scripts/legacy-upgrade-map.json`, and reports:

- detected kit/stack/manifest version;
- target v2 components and recommended certified blueprint;
- semantic blockers;
- ordered migration steps;
- `mutates_project: false`.

Unknown/ambiguous projects return an actionable unsupported result and exit 2.
Known backend legacy packs are ready for a controlled scaffold comparison.
Frontend-only packs require backend selection. `nextjs-fullstack` requires
manual BFF separation because the v6 Next.js component is an external API
consumer by default.

## Safe migration sequence

1. Commit or back up the legacy project.
2. Run the assessment and review every blocker.
3. Scaffold the recommended v2 composition into a new empty directory.
4. Compare environment, API and generated-client contracts.
5. Move business code explicitly; do not overwrite the legacy project.
6. Run build, test, contract-drift and health checks.
7. Use `syntheprise upgrade --from <v6-kit>` separately for managed kit files,
   first as a dry-run and only then with explicit `--apply`.

Automatic major-version rewriting is intentionally unsupported.
