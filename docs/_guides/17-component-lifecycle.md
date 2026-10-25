---
doc: component-lifecycle-guide
title: Component and Certified Blueprint Lifecycle
status: stable
precedence: 5
owner: Syntheprise Framework Maintainers
last_reviewed: 2026-07-26
---

# Component and Certified Blueprint Lifecycle

## Policy

Manifest v2 components declare a pinned version, `current-stable` policy,
owner, verification date and lifecycle object:

```json
{
  "last_verified": "2026-07-26",
  "lifecycle": {
    "status": "supported",
    "support_until": null,
    "replacement": null,
    "evidence": "https://official.example/releases"
  }
}
```

Allowed states are `supported`, `maintenance`, `deprecated` and `eol`.
Deprecated/EOL entries require a replacement. EOL entries, expired support
windows, malformed metadata and stale verification fail closed.

The checked-in `presets/components/lifecycle-policy.json` controls maximum
verification ages. This keeps CI deterministic and auditable. Network-based
version discovery may propose an update, but it cannot silently change a pin or
make a merge decision.

## Scheduled compatibility

`.github/workflows/composable-stack-catalog.yml` runs weekly and on relevant
changes. Its matrix includes all five certified blueprints. Each blueprint is
reported separately (`fail-fast: false`) and runs scaffold, build, test,
generated-contract drift and API health evidence on Linux.

## Security policy

The catalog gate runs:

```bash
python scripts/check-component-lifecycle.py
python scripts/check-workflow-security.py
python scripts/check-dependencies.py --strict
python scripts/check-secrets.py
```

Security exceptions live in `presets/security-exceptions.json`. Every exception
requires a unique ID, target, advisory, owner, reason, creation date and expiry.
The maximum duration is policy-controlled; malformed, excessive or expired
exceptions block CI. An empty exception list is preferred.

## Triage and refresh

1. Open the failed job and identify its component or blueprint.
2. Confirm the upstream lifecycle/version from the manifest's official evidence
   URL.
3. Reproduce the isolated blueprint locally on Linux or macOS.
4. Update the pin, lockfiles, verification date and evidence in one reviewed
   change.
5. Run the lifecycle/security gates and full certified matrix.
6. Promote new CI evidence into the blueprint manifest only after the run passes.

If a compatibility update is unsafe, mark the component `deprecated`, name its
replacement and document the migration. Do not extend a verification date
without rerunning evidence.

## Rollback

Revert the component/policy change and its generated lockfiles together.
Point-in-time certified versions remain reproducible. Never bypass an EOL or
expired-exception failure by weakening the global policy.
