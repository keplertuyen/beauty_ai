---
doc: traceability-matrix
title: Traceability Matrix
status: stable
precedence: 2
owner: pm-qa-lead
last_reviewed: 2026-07-26
---

# Traceability Matrix

## Purpose
Create a single chain from business intent to verified delivery.

## Matrix
| Business Goal | Requirement ID | Acceptance Criteria ID | Test Case ID | Implementation Task / WG | PR / Commit | Release | Status |
|---|---|---|---|---|---|---|---|
| BG-001 | FR-001 | AC-001 | TC-001 | WG-P1-01-T1 | PR-001 | R1 | Draft (example) |
| BG-CSP-01 Safe composability | FR-CSP-001 | AC-CSP-001,002 | TC-CSP-01,02 | CR-2026-014 T4 | b2a439b, 35cd7ee / PR #3 | v6 Phase 1 | Verified |
| BG-CSP-01 Safe composability | FR-CSP-002 | AC-CSP-003,004 | TC-CSP-03,04 | CR-2026-014 T5,T7 | 35cd7ee / PR #3 | v6 Phase 1 | Verified |
| BG-CSP-01 Safe composability | FR-CSP-003 | AC-CSP-005,006 | TC-CSP-05,06 | CR-2026-014 T5 | 35cd7ee / PR #3 | v6 Phase 1 | Verified |
| BG-CSP-02 Machine-readable planning | FR-CSP-006 | AC-CSP-011,012 | TC-CSP-11,12 | CR-2026-014 T6,T7 | 35cd7ee / PR #3 | v6 Phase 1 | Verified |
| BG-CSP-03 Safe migration | FR-CSP-008 / FR-INIT-01 | AC-CSP-015,016,019 | TC-CSP-17,18,19 | CR-2026-014 T6,T7 | 35cd7ee / PR #3 | v6 Phase 1 | Verified |
| BG-CSP-04 Runnable pilot | FR-CSP2-001,004 | AC-CSP2-001,002,009,010 | TC-CSP2-01,04 | CR-2026-015 T5,T6 | PR #4 / run 30163014352 | v6 Phase 2 | Verified |
| BG-CSP-04 Runnable pilot | FR-CSP2-002 | AC-CSP2-003,004,005 | TC-CSP2-02 | CR-2026-015 T4 | PR #4 | v6 Phase 2 | Verified |
| BG-CSP-05 Contract integrity | FR-CSP2-003 | AC-CSP2-006,007,008 | TC-CSP2-03 | CR-2026-015 T5,T6 | PR #4 / run 30163014352 | v6 Phase 2 | Verified |
| BG-CSP-06 Operable locally | FR-CSP2-005,006 | AC-CSP2-011..015 | TC-CSP2-05,06 | CR-2026-015 T7,T8 | PR #4 / run 30163014352 | v6 Phase 2 | Verified |
| BG-GOV-02 Monotonic lifecycle IDs | FR-CHANGE-SEQ-01 | AC-CSP2-016,017 | TC-CSP2-07 | CR-2026-015 T3 | Phase 2 PR | v6 Phase 2 | Verified |
| BG-CSP-07 Complete technology catalog | FR-CSP3-001 | AC-CSP3-001..003 | TC-CSP3-01,02 | CR-2026-016 T3..T6 | PR #6/#7 / run 30172418504 | v6 Phase 3 | Verified |
| BG-CSP-08 Generated client portability | FR-CSP3-002 | AC-CSP3-004..006 | TC-CSP3-03 | CR-2026-016 T6,T7 | PR #6/#7 / run 30172418504 | v6 Phase 3 | Verified |
| BG-CSP-09 Certified blueprint matrix | FR-CSP3-003 | AC-CSP3-007..009 | TC-CSP3-04,05 | CR-2026-016 T8,T9 | PR #6/#7 / run 30172418504 | v6 Phase 3 | Verified |
| BG-CSP-10 Approved platform semantics | FR-CSP3-004 | AC-CSP3-010..013 | TC-CSP3-06,07 | CR-2026-016 T3,T5,T9 | PR #6/#7 / run 30172418504 | v6 Phase 3 | Verified |
| BG-CSP-03 Safe migration | FR-CSP3-005 | AC-CSP3-014..016 | TC-CSP3-08,09 | CR-2026-016 T9,T10 | PR #6/#7 / run 30172418504 | v6 Phase 3 | Verified |
| BG-CSP-11 Sustainable certification | FR-VLC-001,002 | AC-VLC-001..004 | TC-VLC-001..003,009 | CR-2026-017 T3..T5 | PR #9 / run 30182840270 | v6 Phase 4 | Verified |
| BG-CSP-12 Supply-chain safety | FR-VLC-003 | AC-VLC-005,006 | TC-VLC-004,005 | CR-2026-017 T3,T6 | PR #9 / run 30182840270 | v6 Phase 4 | Verified |
| BG-CSP-03 Safe migration | FR-VLC-004 | AC-VLC-007,008 | TC-VLC-006,007 | CR-2026-017 T7 | PR #9 / run 30182840270 | v6 Phase 4 | Verified |
| BG-CSP-13 Operable lifecycle | FR-VLC-005 | AC-VLC-009 | TC-VLC-008 | CR-2026-017 T8 | PR #9 / run 30182840270 | v6 Phase 4 | Verified |
| BG-CSP-14 Representative adoption | FR-REL-001 | AC-REL-001,002 | TC-REL-001,002 | CR-2026-018 T3 | PR #10 / run 30183528085 | v6.0.0 | Verified |
| BG-CSP-15 Auditable major release | FR-REL-002 | AC-REL-003,004 | TC-REL-003,004 | CR-2026-018 T4,T7 | PR #10 / run 30183528085 | v6.0.0 | Verified |
| BG-CSP-16 Safe v6 adoption | FR-REL-003 | AC-REL-005,006 | TC-REL-005,006 | CR-2026-018 T5 | PR #10 | v6.0.0 | Verified |
| BG-CSP-17 Controlled release | FR-REL-004 | AC-REL-007,008 | TC-REL-007,008 | CR-2026-018 T6,T10 | PR #10 + release baseline | v6.0.0 | Verified readiness |
| BG-CSP-18 Visible toolchain prerequisites | FR-TPF-001 | AC-TPF-001,002 | TC-TPF-001,002 | CR-2026-019 T3,T5,T7 | PR #12 | v6.0.1 | Verified |
| BG-CSP-18 Visible toolchain prerequisites | FR-TPF-002 | AC-TPF-003..005 | TC-TPF-003..005 | CR-2026-019 T4,T6 | PR #12 | v6.0.1 | Verified |
| BG-CSP-18 Visible toolchain prerequisites | FR-TPF-003 | AC-TPF-006,007 | TC-TPF-006,007 | CR-2026-019 T3,T4,T8 | PR #12 | v6.0.1 | Verified |

## Rules
- Every Must-level FR must have at least one AC and one test case before implementation starts.
- Every change request must link to one or more requirements or deltas.
- Every production release must include only rows with verified status or documented exception.
- Exceptions require PM + QA Lead + TA/SA approval.

## Status values
- Draft
- Ready for implementation
- Implemented
- Verified
- Released
- Deferred
- Exception approved
