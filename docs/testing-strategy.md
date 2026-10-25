---
doc: testing-strategy
title: Testing Strategy
status: stable
precedence: 2
owner: qa-lead
last_reviewed: 2026-06-17
---

# Testing Strategy

## Principle
Test design precedes implementation for Must-level behavior. AI agents may accelerate test creation, but QA owns test intent and meaningful coverage.

## Required layers
| Layer | Purpose | Required when |
|---|---|---|
| Unit | Validate isolated business logic | Any changed logic |
| Contract | Validate API/payload/schema compatibility | API, DTO, event, DB contract changes |
| Integration | Validate service/database/provider boundary | Persistence, external service, job/queue behavior |
| E2E | Validate user or business workflow | Critical user journeys and Tier 2 flows |
| Golden cases | Validate deterministic examples for LLM/non-deterministic behavior | AI/LLM behavior or heuristic outputs |
| Manual exploratory | Discover usability/workflow issues | New UI, high ambiguity, pre-release check |

## QA-first workflow
1. BA/QA writes acceptance criteria.
2. QA creates or updates `docs/test-matrix-template.md` instance or equivalent project test matrix.
3. Dev implements code and technical tests.
4. Reviewer checks tests and code against the requirement.
5. `/quality-gate` runs before Done.

## Minimum gates
- Tier 0: local tests and worklog evidence.
- Tier 1: unit + relevant contract/integration tests, traceability for Must requirements.
- Tier 2: full traceability, regression evidence, security checks, release checklist.

## Test quality checklist
- The test fails against the old/incorrect behavior.
- The expected result maps to acceptance criteria, not implementation detail.
- Edge and negative cases are covered.
- Mocks do not hide the behavior being tested.
- Tests run offline unless explicitly marked integration/external.

## Execution Report (evidence of running)
Strong test design without execution evidence is **not Done**. Every change, at close-out, must record an Execution Report:

- **Run date** — when the layers were executed.
- **Environment** — where they ran (local, CI, staging), including relevant versions.
- **Per-layer results** — pass/fail counts for each layer that applies (unit, contract, integration, E2E, golden cases, manual exploratory).
- **Evidence links** — CI run URLs, logs, screenshots, or artifacts backing the results.
- **Defects** — any issues found and their disposition (fixed / accepted / deferred).

The full change template carries this as an "Execution Report" table in `test-plan.md`; lite/hotfix change folders may use a trimmed "Execution evidence" note. A green test design with no record of an actual run does not satisfy the Definition of Done.
