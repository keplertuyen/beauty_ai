<!-- Syntheprise Framework Pull Request. Keep it to one thin slice. -->

## What & why
<!-- One or two sentences. Link the change/requirement ID. -->
- Change ID:
- Requirement / AC:

## Type
- [ ] CR (feature/behavior)  - [ ] BUG (bugfix)  - [ ] TECH (refactor/infra)  - [ ] FASTLANE (Tier-0)  - [ ] Docs only

## Definition of Done
- [ ] Acceptance criteria exist for changed behavior
- [ ] QA-first: acceptance test designed **before** implementation; no test weakened to pass
- [ ] `./syntheprise gate` is green (doctor + traceability + doc-drift + adapter parity)
- [ ] If I edited `.agents/`, I ran `./syntheprise sync` (generated files updated)
- [ ] `docs/traceability.md` updated; ADR/docs updated if architecture/behavior changed
- [ ] No secrets committed
- [ ] Change folder complete (proposal/design/test-plan/tasks/review) if non-trivial

## Reviewer notes
<!-- Anything the reviewer should focus on. Separation of duties: author is not the sole approver for Must-level behavior. -->
