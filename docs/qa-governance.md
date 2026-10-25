---
doc: qa-governance
title: QA Governance — Independent Test Design and Human-Governed Agentic Development Controls
status: stable
precedence: 2
owner: qa-lead
last_reviewed: 2026-06-17
---

# QA Governance

## Purpose
Prevent confirmation bias in AI-assisted development by separating test design from implementation.

## Core policy
For all Must-level behavior and all Tier 1/Tier 2 changes:

1. BA/QA defines acceptance criteria and test cases before Dev implementation.
2. Dev implements against approved behavior and may add lower-level technical tests.
3. Dev must not remove, weaken, or rewrite QA acceptance tests without QA approval.
4. Review must inspect both code and tests.
5. A task with passing but meaningless tests is not Done.

## Roles
| Role | Responsibility |
|---|---|
| BA | Clarifies business rule and acceptance criteria |
| QA | Designs test matrix and acceptance test cases |
| TA/SA | Confirms architectural and non-functional coverage |
| Dev | Implements code and technical tests |
| PM | Enforces workflow and status reporting |
| Reviewer | Checks requirement/test/code alignment |

## Required test design output
Each changed behavior needs:

- Requirement or change ID.
- Acceptance criteria using clear GIVEN/WHEN/THEN or WHEN/IF/THEN statements.
- Happy path test.
- Edge/negative tests.
- Data fixture or mock strategy.
- Automation layer: unit, contract, integration, E2E, golden case, or manual exploratory.
- Owner and status.

## Anti-patterns
- Writing tests only after implementation and only around current code behavior.
- Testing only happy paths for Must-level behavior.
- Hiding requirement ambiguity by choosing convenient assumptions.
- Marking Done when tests pass but traceability is missing.
- Letting one agent design, implement, and approve the same slice with no independent review.

## Minimum gate by tier
| Tier | Test design requirement |
|---|---|
| Tier 0 | Short test note in worklog is acceptable |
| Tier 1 | Test matrix required for Must requirements |
| Tier 2 | Test matrix, traceability, review sign-off, regression evidence required |
