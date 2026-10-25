---
name: qa-test-design
description: Create QA-owned acceptance tests and test matrix before Dev implementation.
---

# Skill: qa-test-design

## When to use
Use before implementing any Must-level behavior, defect fix, or Tier 1/Tier 2 change.

## Procedure
1. Read requirement/change delta and acceptance criteria.
2. Identify ambiguity and ask BA/PM for clarification if it changes expected behavior.
3. Write test cases before implementation.
4. Include happy path, negative path, edge path, and regression path when relevant.
5. Assign each test to a layer: unit, contract, integration, E2E, golden case, or manual exploratory.
6. Update `docs/traceability.md` or `docs/_changes/<CHANGE-ID>/test-plan.md`.
7. Clearly label tests that are not yet automated.

## Output format
Return:
- Requirement/change ID.
- AC list.
- Test matrix rows.
- Automation recommendation.
- Blocking ambiguities.

## Never do
- Do not write tests merely to match existing code.
- Do not weaken acceptance criteria.
- Do not mark tests complete without expected results.
