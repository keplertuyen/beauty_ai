---
doc: quickstart
title: Quick Start — Syntheprise Framework Starter Kit
status: stable
precedence: 6
owner: Delivery / PMO / Architecture
last_reviewed: 2026-06-17
---

# Quick Start — Syntheprise Framework Starter Kit

## 0. Read this first

If you are new to Syntheprise Framework, start with the complete overview before running the CLI:

```text
1. SYNTHEPRISE-FRAMEWORK-OVERVIEW.md
2. docs/_guides/00-framework-overview.md
3. README.md
4. docs/_guides/01-agentic-ai-delivery-process.md
5. docs/_guides/03-raci-and-prompt-playbook.md
```

The overview explains the framework purpose, target users, repository architecture, folder/file responsibilities, Dev-AI Pair Development model, quality gates, limitations, and roadmap.

---


This one-page guide explains how to start a real project with **Syntheprise Framework - The Human-Governed Agentic Development Framework.**.

**Core rule:** AI drafts. Humans decide. Tests prove. Docs govern.

---

## 1. Day-0 project setup

1. Copy the Syntheprise Framework Starter Kit into the project repository.
2. Rename the repository/package to the project repository name, or keep `syntheprise-framework` if maintaining the framework itself.
3. Fill `project-charter.md` with project name, sponsor, tier, scope boundary, stakeholders, and delivery model.
4. Fill `requirements.md` from discovery notes. Do not mix architecture into requirements.
5. Select the primary AI adapter: Antigravity, GPT Codex, or Claude Code.
6. Fill `AGENTS.md` with project-specific rules, precedence, protected files, and context map.
7. Create or confirm `docs/architecture.md` and `docs/adr/0001-architecture-baseline.md` for Tier 1+ projects.
8. Create `docs/traceability.md` before the first sprint/build loop.
9. QA/BA create the first test matrix for Must-have requirements before Dev Agent implementation.
10. Run `python scripts/doctor.py --template`.

---

## 2. Build loop

```text
Select task -> /plan -> human approval -> QA test design -> thin-slice implementation -> test gate -> review -> traceability update -> worklog/state update
```

Never ask an agent to "build the whole app." Use small, reviewable slices.

---

## 3. New project path

```text
1. Charter
2. Requirements
3. Architecture baseline
4. ADR-0001
5. Testing strategy
6. QA governance
7. Traceability matrix
8. Master Plan
9. Adapter setup
10. First thin-slice implementation
```

---

## 4. Existing project path

```text
1. Create a current-system scan
2. Capture current behavior into requirements and contracts
3. Create an architecture baseline
4. Add AGENTS.md and safety rules
5. Start all future changes through docs/_changes/<CHANGE-ID>/
6. Archive completed changes after release and sync source-of-truth documents
```

Do not start by asking the agent to refactor the system. First make the current behavior visible.

---

## 5. Who owns what

| Area | Accountable owner |
|---|---|
| Project charter and delivery governance | PM / Delivery Manager |
| Requirements and business rules | BA / Product Owner |
| Architecture and technical decisions | SA / TA / Tech Lead |
| Test strategy and test design | QA Lead |
| Code implementation | Dev / Dev Lead |
| CI/CD and deployment | DevOps |
| AI usage governance | SA / PMO / Delivery Excellence |

AI may draft, analyze, propose, and generate. Humans approve.

---

## 6. Escalate immediately when

- Scope changes outside the approved task.
- Architecture, API, data, security, or deployment behavior changes.
- A destructive command is needed.
- A migration, schema, or protected file may be changed.
- A test fails for an unclear reason.
- Secrets, PII, production data, or client-confidential data may be exposed.

Escalation path: Dev/QA -> Tech Lead/TA -> SA -> PM -> Sponsor.

---

## 7. The most important V5 Core rule

QA designs behavior tests before Dev implementation. Dev Agent may add unit tests, but it must not rewrite acceptance tests just to make its own implementation pass. Green tests are useful only when the tests are meaningful.
