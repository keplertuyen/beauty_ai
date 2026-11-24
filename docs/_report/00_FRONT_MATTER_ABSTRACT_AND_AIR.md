# FRONT MATTER — BEAUTYAI FINAL PROJECT REPORT

> **Programme:** BSc (Hons) Computing — University of Greenwich (School of Computing & Digital Media)
> **Project Title:** *An AI-Agent Document-Driven Software Development Lifecycle: Design and Implementation of BeautyAI — An Ingredient-Aware Cosmetics E-Commerce Platform with a Personalised Skincare Assistant*

---

## Abstract

Modern digital retail in personal care is characterised by an acute information asymmetry: dense International Nomenclature of Cosmetic Ingredients (INCI) declarations remain indecipherable to ordinary consumers, exacerbating risks of allergic contact dermatitis, severe active-ingredient incompatibilities, and reliance on uncurated crowd-sourced star ratings. Concurrently, existing commercial scanning utilities deploy scientifically flawed, alarmist "Safety Scores" that contradict foundational toxicological principles. In parallel, software engineering faces an emerging challenge: integrating autonomous AI coding agents into solo-developer workflows frequently induces architectural drift, hallucinated dependencies, and domain-constraint degradation.

This project delivers two foundational contributions:
1. **The AI-Agent Document-Driven Software Development Lifecycle (SDLC):** An empirical, eight-stage methodology orchestrated via the Syntheprise Framework (`v6.0.1`). By instituting an immutable seven-level document precedence hierarchy, twelve machine-verifiable system invariants (notably `INV-01`, prohibiting universal safety scores), and automated architectural tests, the lifecycle demonstrates how a solo engineer can harness autonomous AI agents with uncompromising architectural rigour.
2. **The BeautyAI Platform (Phase 1 MVP):** A production-ready, ingredient-aware e-commerce web application engineered on **C# .NET 10** (Four-Layer Clean Architecture), **PostgreSQL 17** (Docker Compose), and **React 19** (`TypeScript`, `Vite`).

Operating over an authentic dataset of **8,494 Sephora products**, **1,094,197 consumer reviews**, and **378+ verified 800×800 WebP images**, the platform exposes **28 core RESTful API endpoints** delivering four deterministic dermatological unique selling propositions: a 3-Tier INCI progressive disclosure engine with text-based `Suitability Verdicts`, the *"Safe For My Skin"* zero-allergen catalog filter, a pairwise Smart Conflict Detector evaluating 12 curated clinical rules, and an automated AM/PM routine builder with 1-Click *"Routine-to-Cart"* (while the conversational LLM chatbot and product comparison modules were formally scoped to Phase 2 to safeguard clinical reliability and delivery discipline within the four-week window).

The system achieves **100% test pass rate** across **12 NetArchTest Architecture Tests** and **46 Unit Tests** (`58/58` green), alongside clean static verification under `./syntheprise gate`. Performance benchmarking demonstrates a **~420× query optimisation** (reducing catalog latency from `33,584 ms` to `80 ms` by eliminating EF Core Cartesian explosion), `12 ms` Product Detail Page hydration, and `< 15 ms` review filtering across 1.09 million records (`1.4 ms` composite B-Tree index scan).

---

## AI Reflection (AIR)

*Statement on the Ethical and Methodological Use of Generative Artificial Intelligence (University of Greenwich Academic Integrity Policy 2026/2027)*

In accordance with the academic integrity regulations of the University of Greenwich School of Computing and Digital Media, this reflection transparently discloses the scope, governance, and ethical boundaries surrounding the utilisation of Generative Artificial Intelligence (GenAI) throughout the conception, implementation, and documentation of this undergraduate project.

Generative AI tools were employed strictly as governed engineering accelerators within a human-in-the-loop workflow—never as uncritical authorities or autonomous decision-makers:

1. **Autonomous Coding Agent (Google Antigravity):** Integrated into the IDE primarily during implementation stages under the Syntheprise Framework. Rather than operating on open-ended conversational prompts ("vibe coding"), the agent executed bounded Playbook Task Cards defining explicit file scopes, architectural contracts, and verification commands. All synthetic C# and TypeScript outputs were required to compile with zero warnings (`-warnaserror`), pass **58 automated tests** (including 12 reflection-based `NetArchTest` architecture guards), and undergo manual inspection inside isolated Git worktrees prior to merging.
2. **Research Synthesis and Cross-Document Verification (NotebookLM):** Used as a retrieval-grounded workspace over the project's 26 canonical markdown specifications, University of Greenwich report templates, and earlier dissertation drafts to detect technical drift (e.g., outdated test counts, legacy VND references, and Sprint 3–4 completion discrepancies) and assist with structural outlining. Every factual metric, API route, SQL schema constraint, code listing, and academic citation was subsequently audited directly against the live repository and primary sources.
3. **Deferred Runtime Conversational AI (Phase 2 Architectural Seam):** Although a conversational LLM chatbot (`Lumi`) was initially considered during early ideation, its runtime deployment was formally deferred to Phase 2 due to four-week schedule constraints and the rigorous clinical validation required for safe LLM medical guardrails. Only the Clean Architecture adapter seam (`IAiSkincareProvider`) and policy specifications (`docs/llm-policy.md`, `ADR-005`) were prepared in Phase 1 to support future integration cleanly.

**Authorial Accountability:** The student author retains 100% intellectual responsibility for all architectural decisions (`ADR-001` to `ADR-014`), domain ethics (including the scientific rejection of universal safety scores under `INV-01`), performance profiling, empirical verification, and the final prose of this dissertation. Generative AI served solely as a disciplined engineering instrument under continuous human architectural governance.
