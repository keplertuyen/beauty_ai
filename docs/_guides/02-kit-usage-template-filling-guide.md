---
doc: kit-usage-template-filling-guide
title: Syntheprise Framework Starter Kit Usage and Template Filling Guide
status: stable
precedence: 6
owner: Delivery / SA / PMO
last_reviewed: 2026-06-17
---

# Syntheprise Framework Starter Kit Usage and Template Filling Guide

This guide explains how to fill and maintain the **Syntheprise Framework Starter Kit** for a real project using **Syntheprise Framework - The Human-Governed Agentic Development Framework.**.

The goal is not to fill every template for every project. The goal is to create enough reliable context for humans and AI agents to deliver safely.

---

## 1. Naming standards

Use these names consistently:

| Purpose | Standard name |
|---|---|
| Official framework name | Syntheprise Framework - The Human-Governed Agentic Development Framework. |
| Short internal name | Syntheprise Framework |
| Repo/package name | `syntheprise-framework` |
| Template/tooling package | Syntheprise Framework Starter Kit |
| Current implementation | Syntheprise Framework V5 Core |
| Internal rollout program | Syntheprise Framework Adoption Program |
| Release zip | `syntheprise-framework.zip` |

---

## 2. Fill order

For most Tier 1 projects, fill in this order:

1. `project-charter.md`
2. `requirements.md`
3. `core-principles.md`
4. `AGENTS.md`
5. `docs/architecture.md`
6. `docs/adr/0001-architecture-baseline.md`
7. `docs/testing-strategy.md`
8. `docs/qa-governance.md`
9. `docs/traceability.md`
10. `docs/_plans/MASTER-PLAN-template.md`
11. Relevant AI adapter files
12. Change folder when a change request appears

For Tier 0, keep it lean. For Tier 2, fill the contracts, runbooks, security policy, observability, backup/restore, incident response, and release checklist.

---

## 3. Core files

### 3.1 `project-charter.md`

**Owner:** PM / Delivery Manager, with BA and SA/TA input.
**Purpose:** define project identity, business goal, delivery model, tier, stakeholders, scope boundary, governance, and Syntheprise Framework operating rules.

Minimum content:

- `<Project Name>`
- Sponsor / customer / internal owner
- Delivery model: project-based, ODC, maintenance, or internal product
- Tier: 0, 1, or 2
- Business goals and success metrics
- In-scope and out-of-scope
- Key risks and escalation path
- AI agent usage policy
- Required quality gates

### 3.2 `requirements.md`

**Owner:** BA.
**Purpose:** source of truth for business requirements and acceptance criteria.

Rules:

- Use IDs: `FR-001`, `NFR-001`, `BR-001`, `AC-001`.
- Keep requirements technology-neutral.
- Put architecture in `docs/architecture.md`, not in requirements.
- Mark assumptions explicitly.
- Every Must-have FR needs acceptance criteria.

### 3.3 `core-principles.md`

**Owner:** SA/TA or Tech Lead.
**Purpose:** define engineering principles and project invariants.

Include:

- Architecture boundaries
- Data ownership rules
- Security principles
- API compatibility rules
- Testing principles
- AI-agent behavior constraints

### 3.4 `AGENTS.md`

**Owner:** SA/TA or Tech Lead.
**Purpose:** canonical instruction file for AI agents.

It must include:

- Precedence ladder
- Context map
- Protected files/actions
- Allowed workflows
- Review requirements
- Testing expectations
- Escalation rules

### 3.5 `CLAUDE.md`

**Owner:** Tech Lead.
**Purpose:** Claude Code entry context. It delegates canonical governance to `AGENTS.md` and should not become a second constitution.

---

## 4. Architecture and contracts

### 4.1 `docs/architecture.md`

**Owner:** SA/TA.
**Purpose:** source of truth for system architecture.

Include components, boundaries, data flow, integration points, deployment view, major risks, and ADR links.

### 4.2 `docs/adr/*`

Use ADRs for decisions that affect architecture, technology stack, data model, API contracts, security, deployment, or long-term maintainability.

### 4.3 `docs/data-contracts.md`

Define canonical data ownership, entity contracts, schema expectations, migration rules, and data retention.

### 4.4 `docs/api-contract.md`

Define external/internal API contracts, compatibility expectations, versioning, error format, authentication/authorization assumptions, and breaking-change policy.

---

## 5. QA and test files

### 5.1 `docs/testing-strategy.md`

**Owner:** QA Lead.
Defines levels of testing, risk-based priorities, automation approach, regression scope, test environments, and release evidence.

### 5.2 `docs/qa-governance.md`

**Owner:** QA Lead.
Defines QA-first test design and the separation between test design and implementation.

Minimum rules:

- BA/QA define acceptance criteria and test matrix before implementation.
- Dev Agent must not rewrite acceptance tests to make its code pass.
- Test failures are fixed or explained; they are not bypassed.
- Release readiness requires test evidence.

### 5.3 `docs/test-matrix-template.md`

Use this for test design per requirement, feature, module, Work-Group, or Change Request.

### 5.4 `docs/traceability.md`

**Owner:** BA/QA/PM jointly.
Links business goals, requirements, acceptance criteria, test cases, implementation tasks, PRs, and release notes.

---

## 6. Change/Delta Spec files

Use `docs/_changes/<CHANGE-ID>/` for meaningful behavior changes.

Required files:

| File | Purpose |
|---|---|
| `proposal.md` | Why the change is needed, scope, value, risk |
| `requirements-delta.md` | ADDED / MODIFIED / REMOVED requirements |
| `design.md` | Technical approach and impacted components |
| `test-plan.md` | QA-first test plan for the change |
| `tasks.md` | Implementation task breakdown |
| `review.md` | Review findings, test evidence, archive decision |

After release, archive the change and sync accepted facts into canonical documents.

---

## 7. Planning files

Use the plan hierarchy when needed:

```text
MASTER-PLAN -> PHASE-PLAN -> WG-PLAN -> task plan
```

Do not duplicate requirements in plans. Plans should link to requirements and ADRs.

---

## 8. Agent adapters

### 8.1 Antigravity

Use `.agents/`, `.agents/skills/`, `.agents/workflows/`, and `.adapters/antigravity/`.

### 8.2 GPT Codex

Use `AGENTS.md`, `.codex/config.toml`, `.codex/hooks.json`, `.codex/agents/`, and `.adapters/codex/`.

### 8.3 Claude Code

Use `CLAUDE.md`, `.claude/settings.json`, `.claude/skills/`, and `.adapters/claude-code/`.

Rule: adapters may translate Syntheprise Framework rules into tool-specific format, but they must not override the canonical governance in `AGENTS.md`.

---

## 9. Quality gates

Use template mode while initializing:

```bash
python scripts/doctor.py --template
```

Use quality-gate mode after the project is filled:

```bash
python scripts/doctor.py --quality-gate
python scripts/check-traceability.py
python scripts/check-doc-drift.py --changed-only
```

CI should fail when required documents are missing, placeholders remain in real project mode, protected files are changed without approval, traceability is incomplete, or tests fail.

---

## 10. Prompt pattern

Use this structure for most AI-agent tasks:

```text
Role: You are {ROLE}.
Task: {TASK}.
Context: {FILES_OR_CONTENT}.
Constraints:
- Follow AGENTS.md and the Syntheprise Framework precedence ladder.
- Do not invent facts.
- Do not change scope beyond the approved task.
- Ask before changing architecture, API, data, security, deployment, or protected files.
Output: {EXPECTED_OUTPUT}.
Approval gate: Do not implement before the plan is approved when the task is risky.
```

---

## 11. Definition of good enough

A filled Syntheprise Framework project is good enough when:

- A new team member can understand the project in under one hour.
- An AI agent can locate the correct source of truth without guessing.
- Must-have requirements have acceptance criteria and tests.
- Architecture decisions are recorded.
- Risky changes follow the Change/Delta lifecycle.
- Quality gates can run locally and in CI.
- The team knows who approves each artifact.
