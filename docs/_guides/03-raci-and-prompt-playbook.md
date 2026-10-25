---
doc: raci-and-prompt-playbook
title: Syntheprise Framework RACI and Prompt Playbook
status: stable
precedence: 6
owner: Delivery / PMO / Tech Lead
last_reviewed: 2026-06-17
---

# Syntheprise Framework RACI and Prompt Playbook

This playbook defines role ownership, approval rules, prompt patterns, and review gates for **Syntheprise Framework - The Human-Governed Agentic Development Framework.**.

---

## 1. RACI legend

- **R** — Responsible: performs the work.
- **A** — Accountable: owns the outcome and approval.
- **C** — Consulted: provides input.
- **I** — Informed: kept updated.

---

## 2. Overall RACI

| Activity | Sponsor | PM | BA | SA/TA | Dev Lead | Dev | QA Lead | QA | DevOps | AI Agent |
|---|---|---|---|---|---|---|---|---|---|---|
| Opportunity assessment | A | R | C | C | I | I | I | I | I | R draft |
| Discovery workshop | I | A | R | C | I | I | C | C | I | R notes |
| Requirements baseline | C | A | R | C | C | I | C | C | I | R draft/gap |
| Architecture baseline | I | C | C | A/R | C | I | C | I | C | R options |
| ADR approval | I | C | C | A/R | C | I | C | I | C | R draft |
| Test strategy | I | C | C | C | C | C | A/R | R | C | R draft |
| QA test design | I | C | R/C | C | C | I | A | R | I | R draft |
| Change proposal | C | A | R | R | C | I | C | C | C | R analysis |
| Change design | I | C | C | A/R | R | C | C | I | C | R draft |
| Implementation | I | I | C | C | A | R | C | I | I | R assist |
| Code review | I | I | I | C | A/R | C | C | C | I | R assist |
| Test execution | I | I | I | C | C | C | A | R | C | R assist |
| Traceability update | I | A | R | C | C | C | R | C | I | R draft |
| Release readiness | C | A/R | C | C | C | I | A/R | R | R | R checklist |
| UX design brief (`/ux-design`) * | I | C | C | C | C | I | C | I | I | R draft |
| Release baseline (`/release-baseline`) | I | A | I | I | C | I | C | I | R | R assist |
| Production deployment | I | A | I | C | C | I | C | C | R | C only |

\* Accountable/Responsible for the "UX design brief" belongs to the **UI/UX Designer** persona (see `.agents/agents.md`). No dedicated column is added to avoid churning the table: in team mode the designer is a real person; in solo mode the owner wears the designer hat.

---

## 3. Ownership by file

| File / Folder | Accountable owner | AI may do | Human approval |
|---|---|---|---|
| `project-charter.md` | PM | Draft/update | PM + Sponsor if scope/budget affected |
| `requirements.md` | BA | Draft/gap analysis | BA / Product Owner |
| `core-principles.md` | SA/TA | Suggest | SA/TA |
| `AGENTS.md` | SA/TA / Tech Lead | Draft/update | SA/TA / Tech Lead |
| `docs/architecture.md` | SA/TA | Draft options | SA/TA |
| `docs/adr/*` | SA/TA | Draft | SA/TA |
| `docs/testing-strategy.md` | QA Lead | Draft | QA Lead |
| `docs/qa-governance.md` | QA Lead | Draft | QA Lead |
| `docs/test-matrix-template.md` | QA Lead | Draft cases | QA Lead |
| `docs/traceability.md` | BA/QA/PM | Draft/update | BA/QA/PM depending on row |
| `docs/_changes/*` | PM/BA/SA/QA by section | Draft | Change owner + relevant leads |
| `docs/_plans/*` | PM / Tech Lead | Draft/update | PM / Tech Lead |
| `docs/_review/*` | Reviewer | Draft findings | Reviewer |
| `.adapters/*` | Tech Lead | Suggest | Tech Lead |
| `.agents/*` | Tech Lead / SA | Draft/update | Tech Lead / SA |
| `.codex/*`, `.claude/*` | Tech Lead | Draft/update | Tech Lead |
| CI workflows and quality gates | DevOps / Tech Lead | Draft/update | DevOps / Tech Lead |

---

## 4. Prompt principles

A good Syntheprise Framework prompt states:

1. Role.
2. Task.
3. Source-of-truth files to read.
4. Scope boundaries.
5. Files allowed to change.
6. Tests to run or design.
7. Required output format.
8. Approval gate.

### Standard prompt skeleton

```text
Role: You are {ROLE}.
Task: {TASK}.
Context: Read {FILES}. Treat AGENTS.md as the canonical rule source.
Constraints:
- Follow the Syntheprise Framework precedence ladder.
- Do not invent facts.
- Do not change scope beyond {SCOPE}.
- Ask before changing architecture, API, data, security, deployment, or protected files.
- Keep changes small and reviewable.
Output: {EXPECTED_OUTPUT}.
Approval gate: {APPROVAL_RULE}.
```

### Prompts to avoid

```text
Build the whole app.
Refactor everything.
Fix all bugs.
Read the whole repo and do whatever is needed.
Make it production-ready.
```

These prompts are too broad. They invite scope creep, hidden architecture changes, and unverifiable output.

---

## 5. Prompt library

### 5.1 Discovery to requirements

```text
You are a senior BA. Convert the discovery notes below into a requirement draft.
Use FR/NFR/BR/AC IDs. Do not invent facts. Mark assumptions and open questions.
Do not include architecture decisions in requirements.
Input: {DISCOVERY_NOTES}
```

### 5.2 Requirement review

```text
You are a BA + QA reviewer. Review requirements.md for ambiguity, contradictions, missing acceptance criteria,
untestable statements, missing NFRs, and architecture leakage.
Output a table: Issue, Severity, Evidence, Recommendation.
```

### 5.3 Architecture options

```text
You are a Software Architect. Based on requirements.md, core-principles.md, and known constraints,
produce three architecture options with components, data flow, integration, deployment implications,
trade-offs, risks, and a recommendation. Do not modify files.
```

### 5.4 Change proposal

```text
Run the /change-propose workflow for {CHANGE_ID}.
Create proposal.md and requirements-delta.md under docs/_changes/{CHANGE_ID}/.
Separate ADDED, MODIFIED, and REMOVED requirements. Link impacted FR/NFR/ADR when known.
Do not implement anything.
```

### 5.5 QA test design

```text
You are QA Lead. Design tests for {FEATURE_OR_CHANGE} before implementation.
Read requirements.md, docs/qa-governance.md, docs/testing-strategy.md, and docs/traceability.md.
Output a test matrix with Test ID, linked requirement, scenario, preconditions, steps, expected result,
priority, test level, automation candidate, and owner.
```

### 5.6 Implementation thin slice

```text
You are an AI pair engineer. Implement task {TASK_ID} from the approved plan only.
Read AGENTS.md, the approved plan, linked requirements, linked tests, and relevant contracts.
Do not change architecture/API/data/security/deployment without approval.
After implementation, report changed files, tests run, results, risks, and docs impacted.
```

### 5.7 Code review

```text
You are a senior reviewer. Review the diff against AGENTS.md, code-style rules, safety rules,
requirements, architecture, test matrix, and traceability.
Find bugs, security issues, scope creep, missing tests, contract violations, and doc drift.
Output Critical/High/Medium/Low findings with evidence.
```

### 5.8 UX design brief

```text
You are the UI/UX Designer persona. For {SCREEN_OR_FEATURE}, run /ux-design:
read design-system.md + the UI/UX standards rule + the active version in docs/_ui-ux_design/,
produce a design brief (goal, user flow, wireframe/mockup, loading/empty/error/degraded states,
i18n where relevant, accessibility), save it to the governed location, fill the "UI/UX impact" section,
then STOP for approval before any implementation task is created.
```

### 5.9 Release baseline

```text
You are the DevOps persona. Run /release-baseline for the batch {CHANGE_IDS}:
verify all PRs merged and changes archived, pull the default branch, deploy, migrate, smoke check,
pick semver per docs/_guides/16-release-versioning.md, update CHANGELOG.md,
STOP for owner confirmation before tagging, then record the rollback point.
```

### 5.10 Traceability update

```text
Update docs/traceability.md for {TASK_OR_CHANGE}.
Link business goal, FR/NFR, acceptance criteria, test cases, implementation task, PR/commit if known,
and release note if relevant. Do not invent unknown links; mark them TBD.
```

---

## 6. Review gates

### Requirement gate

- Business goal is clear.
- FR/NFR IDs exist.
- Must-have FRs have acceptance criteria.
- Open questions are recorded.
- Out-of-scope is explicit.
- Requirements do not contain architecture decisions.

### Architecture gate

- Architecture fits the selected tier.
- Component boundaries are clear.
- Data/API/security/deployment impacts are visible.
- ADRs exist for major decisions.
- Trade-offs and risks are recorded.

### QA gate

- QA-first test design exists for Must-have behavior.
- Acceptance tests are not rewritten by the Dev Agent to fit implementation.
- Test evidence exists.
- Regression impact is understood.

### Implementation gate

- The task has an approved plan.
- Code changes stay in scope.
- Tests pass or failures are explained and fixed.
- Protected files are not changed without approval.
- Traceability and docs are updated when needed.

### Release gate

- Scope is confirmed.
- Blocking defects are resolved or explicitly accepted.
- Regression passes.
- Rollback/backup/monitoring are ready when relevant.
- Release notes are accurate.
- Required sign-off is recorded.

---

## 7. Escalation rules

Escalate when a task requires out-of-scope work, architecture/API/data/security/deployment changes, destructive commands, protected file changes, unclear test failures, data-loss risk, secret exposure risk, production impact, or a release-blocking issue.

Default escalation path:

```text
Dev/QA -> Dev Lead/QA Lead -> TA/SA -> PM -> Sponsor
```
