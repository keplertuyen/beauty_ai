---
doc: test-matrix-template
title: Test Matrix Template
status: template
precedence: 2
owner: qa-lead
last_reviewed: 2026-06-17
---

# Test Matrix Template

| Test ID | Requirement / Change ID | Acceptance Criteria | Test Layer | Scenario | Data / Fixture | Expected Result | Automation | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|
| TC-001 | FR-001 | AC-001 | Unit / Contract / Integration / E2E | Happy path | Sample fixture | Expected output | Automated / Manual | QA | Draft |

## Test layers
- Unit: isolated logic.
- Contract: API/schema/payload compatibility.
- Integration: service + database/provider boundary.
- E2E: user journey or business workflow.
- Golden case: deterministic sample for LLM or non-deterministic behavior.
- Manual exploratory: only when automation is not viable or not yet cost-effective.

## Required coverage for Must behavior
- At least one happy path.
- At least one negative or edge path.
- Contract coverage if public API or shared payload changes.
- Regression coverage if defect fix.
