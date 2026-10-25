---
doc: agentic-ai-delivery-process-guide
title: Agentic AI Delivery Process — Syntheprise Framework V5 Core
status: stable
precedence: 6
owner: Delivery / SA / PMO
last_reviewed: 2026-06-17
---

# Agentic AI Delivery Process — Syntheprise Framework V5 Core

This guide defines how Syntheprise teams deliver software using **Syntheprise Framework - The Human-Governed Agentic Development Framework.** with AI coding agents such as Antigravity, GPT Codex, and Claude Code.

Syntheprise Framework is designed for multi-role delivery teams: one or more Devs, QAs, BAs, TAs/SAs, and one PM. It supports new projects, existing projects, project-based delivery, and ODC streams.

---

## 1. Operating mindset

The traditional model relies on individual engineers to interpret requirements, design, code, test, and document. The AI-assisted model increases speed, but it also increases the cost of unclear governance. Syntheprise Framework solves this with explicit source-of-truth documents, role ownership, test-first behavior validation, traceability, and quality gates.

Core principles:

1. **Human owns judgment. AI owns acceleration.** AI proposes; humans decide.
2. **Documents are source of truth. Chat is not.** Decisions must land in requirements, contracts, ADRs, or plans.
3. **Small slices beat big-bang generation.** Use Work-Groups and small tasks.
4. **QA-first test design reduces confirmation bias.** Acceptance tests should exist before implementation.
5. **No silent architecture change.** Architecture, API, data, security, and deployment changes need review.
6. **Traceability is not paperwork.** It is how the team proves that business intent reached tested software.

---

## 2. Roles

| Role | Main responsibility | AI support | Cannot be delegated to AI |
|---|---|---|---|
| Sponsor / CEO | Business goals, priority, budget, major scope decisions | Summaries, options, risk comparison | Business commitment and strategic decisions |
| PM / Delivery Manager | Timeline, scope, risk, communication, delivery status | Plans, reports, RAID log drafts | Customer commitment without team validation |
| BA | Discovery, requirements, journeys, business rules, acceptance criteria | Requirement drafts, gap analysis, story decomposition | Final business interpretation and scope confirmation |
| SA / TA | Architecture, NFRs, integration, data/API contracts, security boundary | Architecture options, ADR drafts, technical reviews | Architecture and security decisions |
| Dev / Dev Lead | Implementation, unit tests, refactoring within approved scope | Code generation, test generation, diff explanation | Merging code the team does not understand |
| QA / QA Lead | Test strategy, test design, regression, release quality evidence | Test matrix drafts, automation drafts, risk-based coverage | Accepting unproven behavior |
| DevOps | CI/CD, environments, release, monitoring, rollback | Pipeline/runbook drafts | Unreviewed production actions |
| AI Agent | Accelerate analysis, coding, testing, documentation | Read context, plan, implement, review, update docs | Scope, architecture, security, or production decisions |

---

## 3. Delivery lifecycle

```text
0. Intake / Opportunity
1. Discovery and requirement capture
2. Requirement baseline
3. Syntheprise Framework Starter Kit initialization
4. Architecture and delivery planning
5. Kickoff
6. Iterative build loop
7. Release / go-live
8. Maintenance and change requests
```

Each phase produces a concrete artifact. If the artifact is not good enough, the team does not proceed based on optimism.

---

## 4. Tiering model

| Stage | Tier 0 — Spike/PoC | Tier 1 — MVP/team project | Tier 2 — production/scale |
|---|---|---|---|
| Discovery | Lightweight notes | Workshop + structured notes | Full stakeholder and workflow analysis |
| Requirements | Compact requirements | Requirements + module decomposition | Full requirements + traceability |
| Architecture | Minimal note | Architecture baseline + ADR-0001 | Architecture, contracts, NFRs, runbooks |
| Planning | Simple plan | Master Plan + Phase Plan | Master/Phase/WG plans with gates |
| Testing | Basic evidence | Test strategy + QA matrix | Risk-based test strategy, automation, release evidence |
| Change control | Lightweight CR | Change folder for major changes | Formal Change/Delta lifecycle |
| Quality gate | Template check | Strict check before merge/release | Strict CI gate plus traceability/doc-drift checks |

Use the lightest tier that matches risk. Process should control risk, not suffocate delivery.

---

## 5. Syntheprise Framework V5 Core operating model

### 5.1 Change/Delta Spec

All meaningful behavior changes, large refactors, and brownfield changes should use:

```text
docs/_changes/<CHANGE-ID>/
  proposal.md
  requirements-delta.md
  design.md
  test-plan.md
  tasks.md
  review.md
```

The change remains separate while under discussion or implementation. After approval and release, it is archived and relevant facts are synced back into the canonical source-of-truth documents.

### 5.2 QA-first test design

For Must-have behavior:

```text
BA/QA defines acceptance criteria and test matrix -> Human review -> Dev Agent implements -> QA verifies -> Traceability updated
```

The Dev Agent may add unit and integration tests, but it must not change acceptance tests to justify its own implementation.

For frontend-affecting changes the same discipline applies to design: a design brief via `/ux-design` (saved under `docs/_ui-ux_design/` governance) and the "UI/UX impact" section in the change folder must be approved BEFORE implementation tasks are created — design-first is the UI analog of QA-first.

### 5.3 Traceability

`docs/traceability.md` links:

```text
Business Goal -> Requirement -> Acceptance Criteria -> Test Case -> Implementation Task -> PR/Commit -> Release Note
```

Traceability should be updated per Work-Group or Change Request, not only at the end of the project.

### 5.4 Quality gates

Use:

```bash
python scripts/doctor.py --template
python scripts/doctor.py --quality-gate
python scripts/check-traceability.py
python scripts/check-doc-drift.py --changed-only
```

Template mode allows placeholders. Quality-gate mode is for real projects after the kit has been filled.

### 5.5 Agent adapters

Syntheprise Framework has one canonical rule set and multiple tool-specific adapters:

| Tool | Primary files |
|---|---|
| Antigravity | `.agents/`, `.agents/skills/`, `.agents/workflows/`, `.adapters/antigravity/` |
| GPT Codex | `AGENTS.md`, `.codex/config.toml`, `.codex/agents/`, `.adapters/codex/` |
| Claude Code | `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/`, `.adapters/claude-code/` |

---

## 6. Iterative build loop

```text
1. Select Work-Group or task
2. Load only the necessary context
3. Produce a plan
4. Human reviews and approves the plan
5. QA confirms or creates test design
6. Dev Agent implements a thin slice
7. Run relevant tests
8. QA reviews behavior and evidence
9. Reviewer checks code, scope, security, and docs
10. Update traceability, worklog, and state
```

---

## 7. Release readiness

A release is ready only when:

- Scope is confirmed.
- All release-blocking requirements are implemented.
- Acceptance tests and regression tests pass.
- Traceability is updated.
- Data migration, rollback, backup, and monitoring are reviewed when relevant.
- Release notes are accurate.
- Human sign-off is recorded for Tier 1+ and Tier 2 projects.

---

## 8. Maintenance and change requests

For brownfield projects, do not let the agent rewrite history. First capture current behavior, then change it through a delta:

```text
current behavior baseline -> change proposal -> requirements delta -> design/test/tasks -> implementation -> review -> archive -> source-of-truth sync
```

This is how Syntheprise Framework keeps maintenance controlled instead of letting every sprint become archeology with a keyboard.
