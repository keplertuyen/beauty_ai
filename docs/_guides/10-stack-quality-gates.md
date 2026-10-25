---
doc: guide-stack-quality-gates
title: Stack-Specific Quality Gates
status: stable
precedence: 5
owner: TA/QA Lead
last_reviewed: 2026-07-26
---

# Stack-Specific Quality Gates

Syntheprise Framework ships generic quality gates plus example GitHub Actions for common Syntheprise stacks.

## Built-in checks
```bash
python scripts/doctor.py --quality-gate
python scripts/check-secrets.py
python scripts/check-dependencies.py
python scripts/check-dependencies.py --strict
python scripts/check-component-lifecycle.py
python scripts/check-workflow-security.py
python scripts/check-coverage.py
./syntheprise sync --check
```

## Example workflows
| Stack | Workflow example |
|---|---|
| .NET | `.github/workflows/quality-gate-dotnet.yml` |
| Node / React | `.github/workflows/quality-gate-node-react.yml` |
| Python | `.github/workflows/quality-gate-python.yml` |

## Coverage policy
Defaults live in `.syntheprise-quality.yml`. Projects may tighten thresholds after baseline stabilization. Brownfield projects may start with lower thresholds, but missing high-risk characterization tests must be visible.

## Dependency policy
The dependency checker is intentionally dependency-free. It flags obvious risky patterns such as wildcard versions, `latest`, unpinned Python requirements, or floating package versions. Use native scanners (`npm audit`, `dotnet list package --vulnerable`, `pip-audit`, Snyk, Dependabot) where available.

`--strict` blocks risky declarations while leaving tech-stack inventory drift
advisory. The catalog CI additionally validates component/blueprint freshness,
time-bounded security exceptions, workflow permissions and non-floating action
references. A weekly Linux matrix reruns every certified blueprint independently.
See `17-component-lifecycle.md`.
