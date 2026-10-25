---
doc: changelog
title: BeautyAI Platform Changelog
status: stable
precedence: 6
owner: Delivery / PMO / Architecture
last_reviewed: 2026-10-25
---

# Changelog — BeautyAI Platform

All notable changes to the BeautyAI Platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha.1] — 2026-10-25 — Phase 1 Project Inception & Architecture Baseline

### Added
- **Core Repository Scaffolding:** Initialized Clean Architecture solution (`BeautyAI.slnx`) with .NET 10 SDK (`10.0.401`) and React 19 + TypeScript + Vite frontend.
- **Architectural Constraints (INV-01):** Established 6 automated architecture test suites (`BeautyAI.ArchitectureTests`) enforcing zero Domain dependencies, EF Core decoupling, external provider isolation, forbidden packages ban, and machine enforcement preventing any `SafetyScore`/`HazardScore` attributes.
- **Documentation & Specifications:** Integrated BRD (`docs/_brd/beautyai_brd.md`), PRD (`docs/_prd/beautyai_prd.md`), UI/UX design prototypes (`docs/_ui-ux_design/frontend`), Technical Solutions (`docs/_tech-solutions/beautyai_tech_solutions.md`), Master Plan (`docs/_plans/beautyai_plan.md`), and Execution Playbook (`docs/_playbook/beautyai_playbook.md`).
- **Architectural Decision Records (ADRs):** Authored 13 standalone ADRs (`ADR-001` through `ADR-013`) governing database engine, authentication, AI pipelines, API contracts, and local Docker deployments.
- **Continuous Integration (CI):** 5-job GitHub Actions workflow (`.github/workflows/quality-gate.yml`) validating backend, frontend, OpenAPI DTO drift, security vulnerabilities, and repository governance.
- **Database Baseline:** PostgreSQL 17 containerized development environment with local healthchecks.
