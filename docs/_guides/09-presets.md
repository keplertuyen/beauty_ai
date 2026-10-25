---
doc: guide-presets
title: Syntheprise Framework Presets
status: stable
precedence: 5
owner: delivery-excellence
last_reviewed: 2026-06-17
---

# Syntheprise Framework Presets

Presets reduce day-one friction by applying a project-type overlay on top of the Syntheprise Framework Starter Kit.

## Available presets
| Preset | Default tier | Best for |
|---|---:|---|
| `greenfield-sme-webapp` | 1 | New SME web apps, portals, dashboards, CRM/ERP modules. |
| `brownfield-modernization` | 2 | Existing systems, modernization, rescue, migration, undocumented codebases. |
| `odc-light` | 0 | ODC/client-managed delivery streams where Syntheprise needs internal AI/QA governance. |

## Commands
```bash
./syntheprise init <target> --preset greenfield-sme-webapp --adapter all
./syntheprise init <target> --preset brownfield-modernization --adapter all
./syntheprise init <target> --preset odc-light --adapter all
./syntheprise preset list
```

If `--tier` is omitted, Syntheprise Framework uses the preset default tier. If `--tier` is supplied, it overrides the preset default.

## Preset rule
A preset may add templates and stricter quality defaults, but it must not weaken Syntheprise Framework's non-negotiables: QA-first test design, traceability, safe change control, and quality gates.
