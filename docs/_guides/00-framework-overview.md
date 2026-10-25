---
doc: syntheprise-framework-overview
title: Syntheprise Framework - The Human-Governed Agentic Development Framework. — Complete Framework Overview
status: stable
precedence: 6
owner: Delivery / PMO / Architecture
last_reviewed: 2026-07-26
version: v6.0.1
---

# Syntheprise Framework - The Human-Governed Agentic Development Framework.

## Complete Framework Overview

**Official framework name:** Syntheprise Framework - The Human-Governed Agentic Development Framework.
**Short name:** Syntheprise Framework
**Repo/package name:** `syntheprise-framework`
**Template/tooling package:** Syntheprise Framework Starter Kit
**Current implementation:** Syntheprise Framework v6.0.1
**Internal rollout program:** Syntheprise Framework Adoption Program

---

## 1. Executive summary

Syntheprise Framework - The Human-Governed Agentic Development Framework. is Syntheprise's company-wide software delivery framework for building, maintaining, and governing software projects with AI Agents.

Syntheprise Framework standardizes how a project team captures requirements, designs architecture, plans delivery, collaborates with AI Agents, validates quality, manages change, preserves traceability, and proves release readiness.

Syntheprise Framework is not just a prompt set. It is a governed operating framework that combines:

- source-of-truth documentation,
- role-based delivery governance,
- Dev-AI pair development,
- QA-first test design,
- change/delta spec management,
- traceability,
- quality gates,
- automation scripts,
- AI tool adapters,
- project presets,
- and company rollout guidance.

The core operating principle is:

```text
AI drafts. Humans decide. Tests prove. Docs govern.
```

---

## 2. What Syntheprise Framework is

Syntheprise Framework is a reusable, tool-neutral software delivery framework designed to help project teams use AI Agents safely and productively.

It provides a structured repository template and operating model for:

- project kickoff,
- discovery,
- requirements,
- architecture,
- planning,
- Dev-AI pair development,
- QA-first validation,
- sprint execution,
- release governance,
- maintenance,
- brownfield modernization,
- ODC delivery,
- and continuous improvement.

Syntheprise Framework supports teams using AI coding agents such as:

- Antigravity,
- Claude Code,
- GPT Codex,
- and other AI assistants that can read project instructions and work inside a repository.

---

## 3. What Syntheprise Framework is not

Syntheprise Framework is not:

- a waterfall methodology,
- a replacement for PM, BA, TA, Dev, QA, or DevOps judgment,
- a rigid bureaucracy that every project must use at the same weight,
- a magic prompt that makes AI build correctly without governance,
- a substitute for testing, review, security, or release sign-off,
- a one-tool-only workflow locked to a specific AI platform.

Syntheprise Framework scales by risk and project type. A small spike should use a lightweight path. A production system should use full governance. Process should control risk, not suffocate delivery.

---

## 4. Why Syntheprise Framework exists

AI Agents can accelerate software delivery, but they also introduce new risks:

1. **Context fragmentation**
   AI reads only part of the project context unless the repository is organized clearly.

2. **Source-of-truth conflict**
   Requirements, architecture, and implementation may drift if the same fact appears in multiple places.

3. **Confirmation bias in testing**
   A Dev Agent may write tests that simply confirm the implementation it just created, rather than validating the intended behavior.

4. **Silent architecture drift**
   AI may change API, data model, security, or deployment behavior without escalation.

5. **Weak traceability**
   Teams may lose the link between business goal, requirement, test, code, PR, release, and evidence.

6. **Uncontrolled change in brownfield systems**
   Existing systems often have undocumented behavior. AI can break hidden assumptions if current behavior is not captured first.

Syntheprise Framework exists to make AI-assisted delivery professional, governable, repeatable, and scalable.

---

## 5. Who should use Syntheprise Framework

Syntheprise Framework is designed for software delivery teams that include one or more of the following roles:

| Role | How Syntheprise Framework helps |
|---|---|
| Sponsor / Customer | Clarifies goals, scope, priorities, acceptance, and release readiness. |
| PM / Delivery Manager | Provides planning structure, status visibility, risk control, quality gates, and delivery evidence. |
| BA | Structures discovery, requirements, acceptance criteria, module requirements, and traceability. |
| TA / SA | Captures architecture, ADRs, NFRs, contracts, integration boundaries, and security rules. |
| Dev / Dev Lead | Guides Dev-AI pair development, thin-slice implementation, unit tests, refactoring, and code review. |
| QA / QA Lead | Defines QA-first test design, regression strategy, release evidence, and quality validation. |
| DevOps / Security | Enforces CI/CD, environment readiness, security gates, deployment checks, and observability. |
| AI Agent | Accelerates analysis, drafting, implementation, testing, review, documentation, and impact tracing. |

Syntheprise Framework is especially useful for Syntheprise because Syntheprise delivers software services across multiple delivery models: greenfield projects, brownfield modernization, ODC streams, and client-specific delivery environments.

---

## 6. Supported project types

### 6.1 Greenfield project

Use Syntheprise Framework when starting a new project from scratch.

Recommended preset:

```bash
./syntheprise init <target> --preset greenfield-sme-webapp --adapter all
```

Typical Syntheprise Framework focus:

- discovery,
- requirement baseline,
- architecture baseline,
- QA-first testing strategy,
- work-group planning,
- Dev-AI pair development,
- quality gates,
- release readiness.

### 6.2 Brownfield / existing project

Use Syntheprise Framework when onboarding or modernizing an existing system.

Recommended preset:

```bash
./syntheprise init <target> --preset brownfield-modernization --adapter all
./syntheprise onboard --scan
```

Typical Syntheprise Framework focus:

- current behavior baseline,
- reverse-spec,
- architecture recovery,
- risk and dependency discovery,
- delta spec for changes,
- controlled refactoring,
- regression safety.

### 6.3 ODC / client delivery stream

Use Syntheprise Framework as an internal delivery wrapper when Syntheprise works inside a client process.

Recommended preset:

```bash
./syntheprise init <target> --preset odc-light --adapter all
```

Typical Syntheprise Framework focus:

- AI usage boundaries,
- client context,
- lightweight documentation,
- worklog/state tracking,
- QA discipline,
- traceability evidence,
- weekly reporting and handover.

---

## 7. Syntheprise Framework core philosophy

Syntheprise Framework is built on a few non-negotiable principles:

1. **AI drafts first; humans approve.**
   AI can propose, summarize, generate, and review. Humans own final judgment.

2. **Docs govern; chat does not.**
   Important decisions must land in project documents, not disappear in conversation history.

3. **One fact, one place.**
   Each fact has one authoritative home. Other documents link to it instead of duplicating it.

4. **Small slices beat big-bang generation.**
   Work should be divided into thin, reviewable, testable slices.

5. **QA-first reduces confirmation bias.**
   Acceptance criteria and test scenarios should be approved before implementation.

6. **No silent architecture change.**
   Architecture, data, API, security, and deployment changes require explicit review.

7. **Traceability proves delivery.**
   The team must be able to show how business intent became tested software.

8. **Evidence matters.**
   Worklog, review records, test evidence, dashboards, and release checklists are part of professional delivery.

---

## 8. Organizational architecture

Syntheprise Framework assumes a role-based delivery organization:

```text
Sponsor / Customer
        |
PM / Delivery Manager
        |
BA + TA/SA + Dev/Dev Lead + QA/QA Lead + DevOps/Security
        |
AI Agent Co-Pilot Layer
```

Human roles own accountability. AI Agents accelerate execution.

### 8.1 Sponsor / Customer

Owns business goals, priority, budget, acceptance, and major decisions.

### 8.2 PM / Delivery Manager

Owns delivery flow, scope, timeline, risk, communication, reporting, and approval coordination.

### 8.3 BA

Owns discovery, business analysis, requirements, acceptance criteria, workflow clarification, and traceability support.

### 8.4 TA / SA

Owns architecture, technical boundaries, NFRs, API/data contracts, security design, ADRs, and technical risk control.

### 8.5 Dev / Dev Lead

Owns implementation, integration, refactoring, unit tests, code review, merge readiness, and engineering quality.

### 8.6 QA / QA Lead

Owns QA-first test design, test strategy, regression planning, defect validation, release evidence, and quality sign-off.

### 8.7 DevOps / Security

Owns CI/CD, environment readiness, deployment, monitoring, rollback, security gates, secrets, dependencies, and observability.

### 8.8 AI Agent

AI Agents assist with:

- summarizing inputs,
- drafting requirements,
- proposing architecture options,
- generating test scenarios,
- implementing code,
- reviewing diffs,
- tracing impact,
- updating documentation,
- generating dashboards and reports.

AI does not own final approval.

---

## 9. Repository architecture overview

Syntheprise Framework is organized as a repository-level operating framework:

```text
syntheprise-framework/
├── syntheprise
├── VERSION
├── README.md
├── SYNTHEPRISE-FRAMEWORK-OVERVIEW.md
├── AGENTS.md
├── CLAUDE.md
├── core-principles.md
├── project-charter.md
├── requirements.md
├── CHANGELOG.md
├── UPGRADES.md
├── docs/
├── .agents/
├── .adapters/
├── .claude/
├── .codex/
├── scripts/
├── tests/
└── .github/workflows/
```

At a high level:

| Area | Purpose |
|---|---|
| Root markdown files | Human and AI entry points, governance, principles, requirements, framework overview. |
| `docs/` | Source-of-truth documentation system and delivery evidence. |
| `.agents/` | Canonical AI-agent-neutral workflows, skills, and rules. |
| `.adapters/` | Tool-specific guidance for Antigravity, Claude Code, and GPT Codex. |
| `.claude/` | Generated Claude Code commands, settings, skills, and hooks. |
| `.codex/` | Generated Codex prompts, agents, and config. |
| `scripts/` | Automation, CLI, quality gates, scanner, and validation tools. |
| `tests/` | Project test home and quality evidence. |
| `.github/workflows/` | CI examples for stack-specific quality gates. |

---

## 10. Root file catalog

| File / Folder | Function |
|---|---|
| `syntheprise` | CLI entry point for init, presets, change, onboard, sync, gate, dashboard, push-tasks, and upgrade. |
| `VERSION` | Current framework version. |
| `README.md` | First landing page for humans. |
| `SYNTHEPRISE-FRAMEWORK-OVERVIEW.md` | Root-level entry point for this complete framework overview. |
| `AGENTS.md` | Canonical AI Agent constitution and project operating rules. |
| `CLAUDE.md` | Claude Code entry context; delegates to `AGENTS.md`. |
| `core-principles.md` | Engineering principles, invariants, and guardrails. |
| `project-charter.md` | Governance model, tiering, ownership, scope, source-of-truth rules. |
| `requirements.md` | Requirement baseline and core business source of truth. |
| `CHANGELOG.md` | Framework release history. |
| `UPGRADES.md` | Upgrade and migration notes. |
| `docs/` | Main documentation system. |
| `.agents/` | Canonical AI operating layer. |
| `.adapters/` | Adapter guidance for supported tools. |
| `.claude/` | Claude Code generated layer. |
| `.codex/` | GPT Codex generated layer. |
| `scripts/` | Automation and quality gate scripts. |
| `tests/` | Test home and evidence. |
| `.github/workflows/` | CI and quality gate examples. |

---

## 11. Documentation architecture

The `docs/` folder is the source-of-truth documentation system.

### 11.1 Core project documents

| File | Function |
|---|---|
| `docs/architecture.md` | System architecture baseline and major components. |
| `docs/api-contract.md` | API contract reference and integration behavior. |
| `docs/data-contracts.md` | Data contract reference and schema-level assumptions. |
| `docs/testing-strategy.md` | Overall testing strategy and test levels. |
| `docs/qa-governance.md` | QA-first operating rules and QA ownership. |
| `docs/traceability.md` | Business goal -> requirement -> test -> task/PR -> release mapping. |
| `docs/security-policy.md` | Security controls and risk boundaries. |
| `docs/llm-policy.md` | LLM and AI Agent usage policy. |
| `docs/release-checklist.md` | Release readiness and go/no-go checklist. |
| `docs/domain-rules.md` | Business/domain rules that must not be guessed. |
| `docs/design-system.md` | UI/UX and design system rules where relevant. |
| `docs/observability-runbook.md` | Monitoring, logging, and observability expectations. |
| `docs/incident-response.md` | Incident handling process. |
| `docs/backup-restore.md` | Backup and restore expectations. |

### 11.2 Documentation subfolders

| Folder | Function |
|---|---|
| `docs/_guides/` | Framework usage guides: overview, quickstart, delivery process, RACI, CLI, presets, brownfield onboarding, quality gates. |
| `docs/_changes/` | Change/Delta Spec lifecycle with CHANGE, BUGFIX, FASTLANE templates and archive. |
| `docs/_plans/` | Master plan, phase plan, and work-group plan templates. |
| `docs/_states/` | State snapshots and worklog memory. |
| `docs/_review/` | Review records and evidence. |
| `docs/_requirements/` | Optional module-level requirement templates. |
| `docs/adr/` | Architecture Decision Records. |
| `docs/company-rollout/` | Syntheprise Framework Adoption Program materials: training, role playbooks, pilot checklist, rollout metrics. |
| `docs/_dashboard/` | Generated status dashboard. |
| `docs/_baseline/` | Brownfield discovery baseline; typically scaffolded inside a project by `syntheprise onboard`. |
| `docs/db-schema/` | Database schema documentation when relevant. |

---

## 12. Source-of-truth and precedence model

Syntheprise Framework prevents documentation conflict with a source-of-truth model.

Typical precedence:

```text
1. AGENTS.md / project operating rules
2. project-charter.md / core-principles.md
3. requirements.md
4. docs/architecture.md and ADRs
5. API/data/security/testing contracts
6. plans, states, reviews, dashboards
7. chat history and informal notes
```

Rules:

- Requirements define what and why.
- Architecture defines how the system is structured.
- ADRs record major decisions.
- Contracts define boundaries.
- Plans define execution.
- States and reviews preserve evidence.
- Chat is useful but not authoritative.

When two documents conflict, the higher-precedence document wins until a human updates the source of truth.

---

## 13. AI Agent operating model

Syntheprise Framework uses a canonical neutral agent layer and generates tool-specific layers.

```text
.agents/
  workflows/
  skills/
  rules/
        |
        | syntheprise sync
        v
.claude/
.codex/
.adapters/
```

### 13.1 `.agents/`

Canonical AI operating layer.

| Folder | Function |
|---|---|
| `.agents/workflows/` | Reusable workflows such as intake, discovery, requirements, architecture, plan, change, review, quality-gate, onboard-existing, dashboard. |
| `.agents/skills/` | Reusable AI capabilities such as read-context, test-design, qa-test-design, implement-slice, doc-sync, security-review, architecture-review, reverse-spec, brownfield-scanner. |
| `.agents/rules/` | Code style and safety rules. |

### 13.2 `.adapters/`

Tool-specific adapter guidance for:

- Antigravity,
- Claude Code,
- GPT Codex.

### 13.3 `.claude/`

Generated Claude Code layer, including:

- settings,
- commands,
- skills,
- hooks.

### 13.4 `.codex/`

Generated GPT Codex layer, including:

- config,
- prompts,
- agents.

### 13.5 `syntheprise sync`

`syntheprise sync` ensures tool-specific outputs remain consistent with `.agents/`.

```bash
./syntheprise sync
./syntheprise sync --check
```

Rule:

```text
.agents is canonical.
.claude and .codex are generated / synchronized outputs.
```

---

## 14. Dev-AI Pair Development model

Dev-AI Pair Development is the core execution mechanism of Syntheprise Framework.

It is a controlled pairing loop between human engineering judgment and AI execution speed.

### 14.1 Human Engineering Control lane

Humans:

1. select task or slice,
2. provide context, constraints, and coding rules,
3. approve acceptance criteria and test scenarios,
4. approve the AI execution plan,
5. review code and behavior,
6. decide fix, accept, or iterate,
7. approve the merge candidate.

### 14.2 AI Agent Execution lane

AI Agent:

1. reads context,
2. drafts test scenarios or unit tests,
3. generates code to satisfy tests,
4. runs checks and analyzes impact,
5. refactors based on feedback,
6. updates docs, traceability, and worklog,
7. prepares the merge package.

### 14.3 Pairing principle

```text
Human steers. AI executes. QA validates. Evidence is captured.
```

The loop repeats for every sprint, work-group, and meaningful task.

---

## 15. QA-first and TDD operating model

Syntheprise Framework separates test design from implementation to reduce AI confirmation bias.

For Must-have behavior:

```text
Requirement -> Acceptance Criteria -> QA Test Design -> Human Review -> Dev-AI Implementation -> QA Verification -> Traceability Update
```

Rules:

- BA and QA define or approve acceptance criteria before implementation.
- AI may draft test scenarios, but QA/human reviewers validate them.
- Dev Agent must not weaken acceptance tests to make its implementation pass.
- Unit tests may be added by Dev/AI, but behavior-level acceptance tests must remain requirement-driven.
- Regression impact must be reviewed before release.

Key files:

- `docs/testing-strategy.md`
- `docs/qa-governance.md`
- `docs/test-matrix-template.md`
- `docs/traceability.md`

---

## 16. Change/Delta Spec model

All meaningful changes should go through `docs/_changes/`.

Syntheprise Framework supports three change types:

| Type | Use case |
|---|---|
| `CHANGE` | Standard feature, enhancement, or behavior change. |
| `BUGFIX` | Defect repair with current behavior, expected behavior, test, fix, and evidence. |
| `FASTLANE` | Lightweight solo/PoC path for low-risk small slices. |

Standard CHANGE structure:

```text
docs/_changes/<CHANGE-ID>/
├── proposal.md
├── requirements-delta.md
├── design.md
├── test-plan.md
├── tasks.md
└── review.md
```

Change lifecycle:

```text
Propose -> Design -> Test Plan -> Tasks -> Implement -> Review -> Archive -> Sync back to source of truth
```

Brownfield rule:

```text
Do not change unknown behavior. Capture current behavior first, then apply a delta.
```

---

## 17. Traceability and evidence model

Traceability connects business intent to tested delivery.

Core chain:

```text
Business Goal -> Requirement -> Acceptance Criteria -> Test Case -> Task / PR -> Release Note
```

Evidence sources:

| Evidence | Location |
|---|---|
| Requirements | `requirements.md`, `docs/_requirements/` |
| Tests | `docs/test-matrix-template.md`, test files, QA evidence |
| Implementation tasks | `docs/_plans/`, tracker exports, PRs |
| Reviews | `docs/_review/` |
| State snapshots | `docs/_states/` |
| Dashboard | `docs/_dashboard/` |
| Releases | `docs/release-checklist.md`, release notes |

Traceability is not paperwork. It is the proof that the team delivered the intended behavior.

---

## 18. Quality gates and automation

Syntheprise Framework includes quality gates that can run locally or in CI.

### 18.1 CLI

```bash
./syntheprise init
./syntheprise preset list
./syntheprise change
./syntheprise onboard --scan
./syntheprise sync
./syntheprise gate
./syntheprise dashboard
./syntheprise push-tasks
```

### 18.2 Quality gate scripts

| Script | Function |
|---|---|
| `scripts/doctor.py` | Repository health, template validation, quality gate validation. |
| `scripts/check-traceability.py` | Verifies requirement/test/task traceability. |
| `scripts/check-doc-drift.py` | Detects documentation drift. |
| `scripts/check-change-completeness.py` | Validates change package completeness. |
| `scripts/check-secrets.py` | Scans for secrets and credentials. |
| `scripts/check-dependencies.py` | Checks dependency hygiene. |
| `scripts/check-coverage.py` | Checks coverage thresholds. |
| `scripts/sync-agent-adapters.py` | Synchronizes agent adapters. |
| `scripts/protected-action-policy.py` | Helps prevent unsafe/destructive actions. |

### 18.3 CI examples

Syntheprise Framework includes CI examples for:

- .NET,
- Node/React,
- Python.

These examples demonstrate how to combine normal stack tests with `syntheprise gate`.

---

## 19. CLI and presets

Syntheprise Framework supports presets to reduce day-one friction.

### 19.1 List presets

```bash
./syntheprise preset list
```

### 19.2 Greenfield SME web app

```bash
./syntheprise init <target> --preset greenfield-sme-webapp --adapter all
```

Use for new end-to-end web applications.

### 19.3 Brownfield modernization

```bash
./syntheprise init <target> --preset brownfield-modernization --adapter all
./syntheprise onboard --scan
```

Use for legacy systems, modernization, refactoring, and maintenance.

### 19.4 ODC light

```bash
./syntheprise init <target> --preset odc-light --adapter all
```

Use for ODC streams or client-controlled projects where Syntheprise Framework acts as Syntheprise's internal delivery wrapper.

---

## 20. End-to-end project lifecycle

A development team typically applies Syntheprise Framework through the following lifecycle:

```text
1. Intake and opportunity assessment
2. Discovery and business analysis
3. Requirements baseline
4. Syntheprise Framework initialization and kickoff
5. Architecture and delivery planning
6. Sprint 0 / environment readiness
7. Sprint or work-group delivery loop
8. Parallel project control activities
9. Review and quality gates
10. Release and go-live
11. Operate, feedback, and continuous improvement
12. Project closure and handover
```

### 20.1 Project startup

The team clarifies goals, stakeholders, constraints, scope, and success criteria.

Outputs:

- intake pack,
- discovery notes,
- requirement baseline,
- SYNTHEPRISE-initialized project,
- architecture baseline,
- master/phase plan,
- Sprint 0 readiness.

### 20.2 Sprint / work-group loop

For each sprint or work-group:

1. PM and team select priority slices.
2. BA/QA confirm acceptance criteria.
3. TA/SA confirms architecture constraints.
4. Dev and AI Agent create an execution plan.
5. Human approves the plan.
6. AI Agent implements a thin slice.
7. Tests and quality gates run.
8. Dev/QA/TA review results.
9. Traceability, worklog, dashboard, and review evidence are updated.
10. The team decides fix, accept, iterate, or merge.

### 20.3 Parallel project control

Across all sprints:

- backlog refinement,
- daily coordination,
- risk/issue/dependency management,
- architecture review,
- ADR updates,
- QA regression planning,
- dashboard/status reporting,
- change request handling,
- stakeholder review,
- documentation synchronization.

### 20.4 Release and completion

Final delivery includes:

```text
Completed product + documentation + evidence + operational handover
```

Release stages:

1. Sprint review / UAT readiness
2. Release readiness and sign-off
3. Production deployment / go-live
4. Hypercare / stabilization
5. Operate, feedback, and continuous improvement
6. Project closure and handover

---

## 21. Role-based usage guide

### 21.1 PM / Delivery Manager

Read first:

1. `README.md`
2. this overview
3. `docs/_guides/00-quickstart.md`
4. `docs/_guides/01-agentic-ai-delivery-process.md`
5. `docs/_guides/03-raci-and-prompt-playbook.md`

Use Syntheprise Framework to manage:

- kickoff,
- project tier,
- timeline,
- approval gates,
- risks,
- status,
- dashboard,
- release readiness.

### 21.2 BA

Use Syntheprise Framework to manage:

- discovery notes,
- requirements,
- acceptance criteria,
- module requirements,
- business rules,
- traceability.

Key files:

- `requirements.md`
- `docs/domain-rules.md`
- `docs/_requirements/`
- `docs/traceability.md`
- `docs/test-matrix-template.md`

### 21.3 TA / SA

Use Syntheprise Framework to manage:

- architecture,
- NFRs,
- API/data contracts,
- ADRs,
- security boundaries,
- technical risk.

Key files:

- `docs/architecture.md`
- `docs/adr/`
- `docs/api-contract.md`
- `docs/data-contracts.md`
- `docs/security-policy.md`

### 21.4 Dev / Dev Lead

Use Syntheprise Framework to manage:

- Dev-AI pair development,
- implementation plan,
- unit tests,
- refactoring,
- code review,
- merge readiness.

Key files:

- `AGENTS.md`
- `core-principles.md`
- `.agents/workflows/`
- `.agents/skills/`
- `docs/_plans/`
- `docs/_states/`

### 21.5 QA / QA Lead

Use Syntheprise Framework to manage:

- QA-first test design,
- regression,
- test matrix,
- release evidence,
- defect verification.

Key files:

- `docs/testing-strategy.md`
- `docs/qa-governance.md`
- `docs/test-matrix-template.md`
- `docs/_review/`
- `docs/release-checklist.md`

### 21.6 DevOps / Security

Use Syntheprise Framework to manage:

- CI/CD,
- environments,
- secrets,
- dependency checks,
- coverage checks,
- deployment readiness,
- observability.

Key files:

- `.github/workflows/`
- `scripts/check-secrets.py`
- `scripts/check-dependencies.py`
- `scripts/check-coverage.py`
- `docs/security-policy.md`
- `docs/observability-runbook.md`
- `docs/backup-restore.md`

---

## 22. Adoption and rollout model

Syntheprise Framework includes company rollout materials under:

```text
docs/company-rollout/
```

This folder supports the Syntheprise Framework Adoption Program.

| File | Purpose |
|---|---|
| `training-plan.md` | Training path for delivery roles. |
| `role-playbooks.md` | Role-specific adoption guidance. |
| `pilot-checklist.md` | Pilot selection and readiness checklist. |
| `adoption-metrics.md` | Adoption and delivery improvement metrics. |
| `rollout-plan.md` | Company-wide rollout plan. |
| `README.md` | Overview of rollout materials. |

Recommended rollout path:

```text
1. Train PM/BA/TA/Dev/QA leads
2. Pilot on one greenfield project
3. Pilot on one brownfield project
4. Pilot on one ODC stream
5. Collect friction and metrics
6. Update Syntheprise Framework
7. Standardize into company delivery practice
```

---

## 23. Current limitations

Syntheprise Framework v5.4.1 is strong enough for pilot and internal standardization, but it still has limitations:

1. **No full enterprise dashboard backend yet**
   Current dashboard generation is lightweight and repository-based.

2. **No deep Jira/GitHub/Azure DevOps API integration yet**
   Tracker export and task push are still framework-level utilities, not a full PM system integration.

3. **Brownfield scanner is useful but not a full static analysis platform**
   It scaffolds baseline discovery and scans repository evidence, but does not replace code architecture analysis tools.

4. **Quality gates are generic by default**
   Stack-specific gates need project customization for .NET, Node/React, Python, mobile, data, or AI systems.

5. **AI tool behavior still varies by platform**
   Antigravity, Claude Code, GPT Codex, and other agents may interpret instructions differently.

6. **Human discipline remains required**
   Syntheprise Framework reduces chaos, but it cannot compensate for poor review, unclear ownership, or skipped gates.

---

## 24. Future roadmap

Potential future improvements:

### 24.1 Syntheprise Framework v5.x improvements

- More presets:
  - mobile app,
  - AI chatbot/RAG,
  - data platform,
  - enterprise integration,
  - cloud migration,
  - legacy modernization deep mode.
- More stack-specific CI templates.
- More project dashboard reports.
- Better release note generation.
- More client-facing report templates.

### 24.2 Syntheprise Framework v6 direction

- Full CLI installer and package manager support.
- Deeper Jira/GitHub/Azure DevOps integration.
- Automated traceability extraction from PRs and commits.
- Real project health dashboard.
- Stronger brownfield codebase scanner.
- Agent performance analytics.
- Organization-level governance dashboard.
- Reusable client-facing delivery evidence packs.

---

## 25. Quick start checklist

### For a new project

```bash
./syntheprise preset list
./syntheprise init <target> --preset greenfield-sme-webapp --adapter all
cd <target>
python scripts/doctor.py --template
```

Then fill:

```text
project-charter.md
requirements.md
core-principles.md
AGENTS.md
docs/architecture.md
docs/testing-strategy.md
docs/qa-governance.md
docs/traceability.md
docs/_plans/
```

Then run:

```bash
./syntheprise gate
```

### For an existing project

```bash
./syntheprise init <target> --preset brownfield-modernization --adapter all
cd <target>
./syntheprise onboard --scan
```

Then capture current behavior before changing it.

### For an ODC stream

```bash
./syntheprise init <target> --preset odc-light --adapter all
```

Then align Syntheprise Framework with the client's existing process and use it as Syntheprise's internal AI delivery governance layer.

---

## 26. Glossary

| Term | Meaning |
|---|---|
| Syntheprise Framework | Syntheprise Framework - The Human-Governed Agentic Development Framework. |
| Syntheprise Framework Starter Kit | The template/tooling package used to initialize a project. |
| Syntheprise Framework Adoption Program | Internal rollout and training program. |
| AI Agent | AI tool that can analyze, plan, code, test, review, or update docs. |
| Dev-AI Pair Development | Controlled pairing loop where humans steer and AI executes. |
| QA-first | Test design and acceptance criteria are approved before implementation. |
| Change/Delta Spec | Structured change package describing what changes and why. |
| Traceability | Link from business goal to requirement, test, task/PR, and release. |
| Quality Gate | Automated or human checkpoint proving readiness. |
| Brownfield | Existing system with current behavior and technical debt. |
| Greenfield | New project starting from scratch. |
| ODC | Offshore Development Center or client delivery stream. |
| ADR | Architecture Decision Record. |
| Work-group | A planned slice of project work grouped around a deliverable. |

---

## 27. Final summary

Syntheprise Framework exists to make AI-assisted software delivery professional.

It gives Syntheprise teams a shared way to:

- understand the project,
- organize delivery roles,
- control AI Agent behavior,
- maintain source-of-truth documents,
- design tests before implementation,
- implement in small slices,
- validate quality,
- manage changes,
- prove traceability,
- release safely,
- and scale AI usage across teams and projects.

The simplest summary is still:

```text
AI drafts. Humans decide. Tests prove. Docs govern.
```
