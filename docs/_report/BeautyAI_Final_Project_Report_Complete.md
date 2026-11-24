---
title: "An AI-Agent Document-Driven Software Development Lifecycle: Design and Implementation of BeautyAI — An Ingredient-Aware Cosmetics E-Commerce Platform"
subtitle: "BSc (Hons) Computing — Final Year Project Report (University of Greenwich)"
author: "[Your Full Name] — Student ID: [Your Student ID]"
date: "November 2026"
---

\newpage

# DECLARATION OF ORIGINALITY

I hereby declare that this dissertation and the software product described herein are the result of my own independent work, except where explicitly acknowledged in the AI Reflection (AIR) statement and References section. No part of this work has been previously submitted for any other degree or qualification at the University of Greenwich or any other institution.

- **Student Name:** [Your Full Name]
- **Student ID:** [Your Student ID]
- **Supervisor:** [Supervisor Name]
- **Date:** November 2026

\newpage


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


\newpage


# CHAPTER 1: INTRODUCTION

## 1.1 Background and Context

The global retail sector has experienced a profound digital transformation over the past decade, with cosmetic and personal care products emerging as one of the fastest-growing categories in electronic commerce. In Vietnam, consumer expenditure on beauty and personal care across major e-commerce platforms approached USD 3 billion in 2025, demonstrating an annual growth rate of approximately 30%. Market consolidation has increasingly favoured official brand flagships, which account for nearly two-thirds of total category turnover. This empirical distribution indicates that modern digital consumers prioritise institutional trust, authenticity, and product suitability over aggressive price discounting.

Simultaneously, a structural paradigm shift has emerged within consumer purchasing behaviour. The contemporary consumer base is no longer swayed solely by conventional brand prestige or superficial marketing narratives. Instead, an educated demographic of "skintellectuals" actively investigates cosmetic chemistry, scrutinising formulations, active concentrations, and physiological compatibility before committing to a purchase. Despite this heightened consumer awareness, a critical information asymmetry persists within online retail. Packaging labels present the International Nomenclature of Cosmetic Ingredients (INCI) as dense, unstandardised technical strings that are virtually indecipherable to non-specialists. Consumers face substantial risks of purchasing products containing personal allergens, combining incompatible active chemicals, or relying on crowd-sourced star ratings written by reviewers with diametrically opposed biological skin types.

In parallel, software engineering practices are undergoing a monumental transition driven by agentic artificial intelligence. The integration of autonomous AI coding agents into Integrated Development Environments (IDEs) promises substantial productivity multipliers. However, in the absence of rigorous architectural governance, rapid automated code generation frequently leads to architectural drift, hallucinated dependencies, and catastrophic degradation of domain constraints. This project addresses the intersection of these two domains: delivering an ingredient-aware e-commerce platform grounded in dermatological science, constructed through an empirical, specification-driven software development lifecycle (SDLC) tailored for human-agent collaboration.

---

## 1.2 Problem Statement

The motivation for the BeautyAI platform stems from four acute user-facing dilemmas and a concurrent software engineering challenge:

- **Pervasive Ingredient Illegibility:** Traditional storefronts treat INCI disclosures as passive legal disclaimers rather than interactive functional data. Consumers cannot readily evaluate active percentages, functional roles (e.g., humectants, barrier lipids, synthetic fragrances), or comedogenic thresholds.
- **Systemic Allergy Hazards:** E-commerce architectures lack systemic cross-checking against personal dermatological contraindications. A consumer with an established allergy to specific preservatives, synthetic perfumes, or denatured alcohol must manually cross-reference 40-line chemical disclosures on every product detail page.
- **Severe Active-Ingredient Clashes:** The unguided layering of potent dermatological actives—such as concurrently applying unbuffered Alpha/Beta Hydroxy Acids with high-strength Retinoids, or combining Benzoyl Peroxide with free-form Tretinoin—frequently induces epidermal barrier destruction and severe irritant contact dermatitis. Existing shopping carts process these combinations without cautionary scheduling or biological warnings.
- **The "Safety Score" Fallacy in Existing Tooling:** Commercial scanning utilities (such as Yuka, Think Dirty, or EWG Skin Deep) attempt to address ingredient anxiety by assigning a single, universal numerical "hazard" or "safety" score. Cosmetic scientists comprehensively reject this methodology as scientifically flawed and alarmist. Grounded in the classical pharmacological axiom of Paracelsus (*dosis sola facit venenum*), an ingredient's safety cannot be evaluated in isolation from its formulation matrix, delivery vehicle, exposure concentration, and individual user pathology. Universal hazard scores create unjustified brand disparagement and induce unwarranted consumer anxiety.

From an engineering perspective, the challenge required designing, implementing, and verifying an enterprise-grade, high-performance platform within a compressed four-week timeframe. Achieving this as a Solo Developer demanded an SDLC that could orchestrate autonomous AI coding agents without sacrificing architectural boundaries, relational integrity, or automated quality assurance.

---

## 1.3 Aims and Objectives

### Project Aim
The primary aim of this project is to design, operationalise, and critically evaluate an **AI-Agent Document-Driven Software Development Lifecycle (SDLC)** by implementing and delivering a production-ready Phase 1 Minimum Viable Product (MVP) of **BeautyAI**—an intelligent, ingredient-aware cosmetics e-commerce platform featuring a personalised skincare assistant.

### SMART Objectives
To fulfil this aim, six specific, measurable, achievable, realistic, and time-bound (SMART) objectives were established:

**Table 1.1: SMART Project Objectives and Measurable Success Criteria**

| Objective ID | Objective Description | Target Success Criteria & Verification Mechanism |
|---|---|---|
| **O1** | Formulate the AI-Agent SDLC Model | Define an eight-stage lifecycle (a–h) detailing explicit inputs, outputs, human-agent RACI governance, and quality check gates. Verified by formal process documentation in Chapter 3. |
| **O2** | Construct the Governed Document Hierarchy | Establish a seven-level constitutional precedence ladder spanning BRD, PRD, Technical Solutions, Master Plan, and Playbook. Verified through complete traceability linking business rules to code. |
| **O3** | Engineer the Phase 1 Core E-Commerce MVP | Implement 13 functional modules covering catalog search, 3-tier INCI inspection, Digital Skin ID, Smart Conflict Detection, AM/PM Routine Generation with 1-Click Routine-to-Cart, COD Checkout, and Admin Console. Verified against 8,494 products and 1.09M reviews. |
| **O4** | Automate Architectural & Domain Quality Gates | Machine-enforce Clean Architecture and domain invariants (specifically INV-01 prohibiting universal safety scores) via automated test suites. Verified by achieving **12/12 Architecture Tests** and **46/46 Unit Tests** passing (100% green). |
| **O5** | Maintain Continuous Traceability & Synchronisation | Ensure zero specification drift between code, documentation, and external AI agents using State Snapshots and isolated Git worktrees. Verified by clean execution of `./syntheprise gate` and CI workflows. |
| **O6** | Execute Critical Empirical Evaluation | Benchmark database query latency under big-data loads, validate LLM grounding boundaries, and critically evaluate the software lifecycle. Verified by measurable profiling metrics and defect post-mortems. |

---

## 1.4 Project Scope and Boundaries

To ensure strict delivery within the academic schedule while preserving architectural integrity, the project enacted a clear operational boundary between **Phase 1 (MVP)** and **Phase 2 (Future Roadmap)**:

**Table 1.2: Phase 1 In-Scope Deliverables vs. Phase 2 Deferred Capabilities**

| Functional Area | In-Scope Phase 1 Deliverables (Production-Ready MVP) | Deferred Phase 2 Scope (Strategic Roadmap) |
|---|---|---|
| **Linguistic & Monetary System** | Standardised 100% English user interface and United States Dollar (USD `$`) currency, aligned natively with the global Sephora dataset. | Vietnamese localisation (i18n), dynamic dual-currency toggles (VND/USD), and historical exchange-rate tracking. |
| **Catalog & Product Intelligence** | Multi-level category hierarchy, keyword/active ingredient search, skin-type filters, price slider, and the *"Safe For My Skin"* zero-allergen filter. | Certification badges (Vegan, Cruelty-Free, Clean) and complex boolean exclusion filters ("Free-of"). |
| **Product Detail & INCI Intelligence** | Three-tier progressive disclosure INCI layout, text-based `Suitability Verdict`, red allergy alert banner, and 1.09M review filtering by skin type. | Interactive algorithm-weight breakdown modal and precomputed Apriori cross-sell associations ("Frequently Bought Together"). |
| **Skin Identity & Personalisation** | 30-second unified Digital Skin ID (skin type, sensitivity, concerns, goals, budget) and personal Allergy Blacklist. | Longitudinal skin condition tracking over time and camera-based computer-vision skin diagnostic imaging. |
| **Active Conflict Engine** | Smart Conflict Detector evaluating 12 curated dermatological rules across shopping carts and routines, providing non-blocking scheduling advice. | Administrative conflict rule builder GUI and customer scanning of products currently owned at home. |
| **Routine Construction** | Automatic AM/PM Routine Generator, strict allergen filtering, mandatory morning SPF enforcement, and 1-Click *"Chat-to-Cart"*. | Multi-step interactive skin diagnostic quiz, routine PDF compilation, and social sharing workflows. |
| **External AI Chatbot** | *Architectural seam & safety policy prepared (`IAiSkincareProvider`, `ADR-005`, `docs/llm-policy.md`) for clean future extensibility.* | **Deferred to Phase 2:** Conversational LLM skincare chatbot (`Lumi`), multi-turn RAG grounding, medical safety evaluation, and Zalo Official Account specialist handoff (deferred to prioritise deterministic clinical accuracy within the 4-week schedule). |
| **Commerce & Administration** | Persistent shopping cart, Cash on Delivery (COD) order placement, order history, and full Admin Console Product CRUD with Soft Delete (`Discontinued`) & Restore. | Multi-tier promotional vouchers, integrated payment gateways (VNPay), and automated transactional emails. |

---

## 1.5 Project Plan and Execution Timeline

The implementation was executed across four intensive weekly sprints spanning 28 calendar days (160 scheduled development hours plus a 20-hour contingency buffer). Development proceeded strictly within an isolated local infrastructure driven by Docker Compose and the Syntheprise Framework:

- **Sprint 1 (Days 1–7) — Data Engine, Schema Architecture, and Core Security:** Provisioned the 10-table physical schema on PostgreSQL 17. Executed automated ETL pipelines to seed 8,494 Sephora products, parse INCI nomenclature, populate 12 active conflict rules, and stream 1.09 million customer reviews into indexed tables. Implemented PBKDF2 cryptographic hashing (600,000 iterations), JWT authentication, and the unified Digital Skin ID domain entity.
- **Sprint 2 (Days 8–15) — Frontend Integration and Core INCI Intelligence:** Integrated the React 19 single-page application. Implemented the catalog query engine and the *"Safe For My Skin"* allergen exclusion toggle. Delivered the Product Detail Page (PDP) featuring the 3-Tier INCI progressive disclosure mechanism, deterministic Suitability Verdicts, and the standalone INCI Analyzer with category-aware target care area resolution.
- **Sprint 3 (Days 16–22) — Commerce Pipelines, Active Conflicts, and Big Data Reviews:** Developed the persistent cart engine and the pairwise Smart Conflict Detector. Integrated checkout supporting atomic Cash on Delivery (COD) order placement and user order history. Optimised review pagination queries across 1.09 million records via composite B-Tree indexes, enabling instant review filtering by author skin type.
- **Sprint 4 (Days 23–28) — Routine Automation, Admin Console CRUD, and Final Verification:** Engineered the AM/PM Routine Generator with 1-Click Routine-to-Cart functionality and `saved_routines` persistence. Delivered the comprehensive 3-tab Admin Console supporting real-time database analytics and complete Product CRUD with soft delete (`Discontinued`) and one-click restoration. Formally scoped the conversational LLM chatbot (`M12`) to Phase 2 while preserving the `IAiSkincareProvider` Clean Architecture seam.

```text
[Mermaid Diagram #1 — Paste into https://mermaid.live to export high-res PNG]
flowchart LR
    W1["Sprint 1 (W1)<br/>Data & Backend Core<br/>QG1: 10 Tables, ETL, PBKDF2, JWT"] --> W2["Sprint 2 (W2)<br/>Frontend & INCI<br/>QG2: React 19, 3-Tier INCI, Text Verdict"]
    W2 --> W3["Sprint 3 (W3)<br/>Commerce & Reviews<br/>QG3: COD Orders, Conflict Check, <15ms Reviews"]
    W3 --> W4["Sprint 4 (W4)<br/>Routine, Admin CRUD & QA<br/>QG4: Routine Builder, Admin CRUD, 12 Arch + 46 Unit"]
```
*Figure 1.1: Four-Week Sprint Schedule and Milestone Quality Gates.*

---

## 1.6 Summary of Project Outcomes

Upon conclusion of the Phase 1 lifecycle, the project delivered three tangible, production-grade assets:

1. **An Empirical, Governed AI-Agent SDLC:** A fully documented, reusable software engineering methodology defining human-agent responsibilities across eight lifecycle stages. The framework demonstrates that by enforcing a strict document precedence hierarchy and machine-checking domain invariants, a solo developer can harness AI coding agents at scale without succumbing to architectural drift.
2. **A Production-Grade Technical Specification Chain:** A synchronised, 26-document engineering archive comprising formal Business Requirements (BRD), Product Specifications (PRD), 14 Architecture Decision Records (ADRs), database contracts, API definitions, security runbooks, and atomic state snapshots tracking every code modification.
3. **The Fully Operational BeautyAI Platform:** A robust, high-performance web application consisting of a `.NET 10` Clean Architecture backend (**28 core Phase 1 RESTful API endpoints across 8 active controllers**, plus the Phase 2 `IAiSkincareProvider` architectural seam), a `React 19` / TypeScript / Vite frontend, and a containerised `PostgreSQL 17` database. The platform operates over **8,494 authentic Sephora products**, **1.09 million reviews**, and **378+ verified high-resolution WebP images**. Quality is guaranteed by **12/12 Architecture Tests** and **46/46 Unit Tests** passing (100% green), zero compiler warnings, and clean static verification under `./syntheprise gate`.

---

## 1.7 Overview of the Report

The remainder of this report is structured in strict accordance with the University of Greenwich undergraduate engineering standards:

- **Chapter 2 (Literature Review):** Critically examines the theoretical and empirical foundations of cosmetics e-commerce, critiques universal hazard scores, evaluates recommender algorithms and active conflict evidence, analyses LLM grounding techniques, assesses AI coding agents, and contextualises Vietnamese legal compliance.
- **Chapter 3 (Software Development Methodologies & The Proposed SDLC):** Evaluates traditional development models (Waterfall, Spiral, RAD, Agile), details the proposed eight-stage AI-Agent Document-Driven SDLC, and formalises governance mechanisms including the 7-level precedence ladder, system invariants, and the human-agent RACI matrix.
- **Chapter 4 (Technology and Tools):** Justifies the chosen engineering stack (`.NET 10`, `PostgreSQL 17`, `React 19`, `Google Gemini 2.5 Flash`, `NetArchTest`, `Docker Compose`) and outlines the rationale behind the 14 Architecture Decision Records (`ADR-001` to `ADR-014`).
- **Chapter 5 (Software Product Requirements):** Benchmarks existing market competitors, formalises business goals and user personas, models functional requirements (`M01`–`M15`) through Given/When/Then acceptance criteria, and specifies the system use cases, database ERD, and streamlined sitemap.
- **Chapter 6 (Design and Implementation of the Product):** Details the Clean Architecture layer implementations, the deterministic Suitability Verdict cascade, the Smart Conflict Detector, Gemini catalog grounding, the `CHANGE-ANALYZER-CATEGORY` refactoring case study, and core code implementations.
- **Chapter 7 (Evaluation and Results):** Compares outcomes against initial objectives `O1`–`O6`, presents automated testing metrics (12 Architecture Tests, 46 Unit Tests), details big-data query optimisation benchmarks (reducing catalog latency from `33,584 ms` to `80 ms`), and critically examines active conflict nuances and project limitations.
- **Chapter 8 (Conclusions and Further Development):** Reflects upon personal engineering and ethical learnings, summarises core academic contributions, and presents the strategic engineering roadmap for Phase 2.


\newpage


# CHAPTER 2: LITERATURE REVIEW

## 2.1 Introduction

The design and implementation of an ingredient-aware electronic commerce platform occupy a multidisciplinary nexus comprising cosmetic dermatology, information retrieval, applied artificial intelligence, and software engineering methodology. Developing computational solutions within this domain necessitates reconciling empirical pharmacological realities with the operational constraints of consumer-facing digital storefronts.

This chapter critically reviews the foundational literature across seven thematic pillars:
1. Economic and behavioural dimensions of cosmetic e-commerce;
2. The scientific epistemologies of cosmetic ingredient transparency and the critique of numerical "safety scoring";
3. The computational mechanics and limitations of algorithmic recommender systems;
4. The dermatological evidence governing active-ingredient incompatibilities;
5. The deployment of Large Language Models (LLMs) with retrieval grounding and domain-specific guardrails;
6. The software engineering paradigms governing autonomous AI coding agents; and
7. The prevailing national and international regulatory frameworks.

By synthesising these diverse bodies of scholarship, this review identifies the critical technological and methodological gap that BeautyAI seeks to bridge.

---

## 2.2 Cosmetics E-Commerce and Information Asymmetry

Electronic commerce in personal care products exhibits structural dynamics fundamentally distinct from conventional fast-moving consumer goods (FMCG). Grounded in the economics of information formulated by Akerlof (1970) and extended to digital commerce by Bakos (1997), cosmetic formulations represent quintessential "experience goods" that frequently veer into "credence goods" (Darby and Karni, 1973). While a consumer can observe the aesthetic packaging or olfactory profile of a cosmetic serum, its biological efficacy, dermal penetrative capability, and propensity to provoke sub-clinical irritation remain imperceptible prior to transactional commitment.

Historically, cosmetic retail mitigated this informational deficit through tactile, in-person advisory interactions at brick-and-mortar beauty counters. The rapid migration toward digital distribution channels—accelerated by social commerce platforms and direct-to-consumer (D2C) brands—has detached the purchasing event from personalised human expertise. Consequently, modern digital consumers frequently fall victim to the "skintellectual paradox" (Smith et al., 2021): while consumers possess unprecedented access to chemical nomenclature, their analytical literacy remains constrained.

Digital storefronts exacerbate this friction by treating mandatory International Nomenclature of Cosmetic Ingredients (INCI) disclosures as passive, static regulatory texts rather than searchable, relational domain entities. Consumers are left to navigate uncurated user-generated reviews, which are systematically distorted by "crowd-sourced perception bias"—evaluations authored by individuals whose biological sebum excretion rates, stratum corneum integrity, and environmental exposures diverge diametrically from those of the reader.

---

## 2.3 Ingredient Transparency and the "Safety Score" Controversy

### 2.3.1 Pharmacological Epistemology: The Dose Makes the Poison

In response to heightened consumer vigilance regarding chemical exposures, commercial software developers introduced mobile scanning applications such as Yuka, Think Dirty, and Environmental Working Group (EWG) Healthy Living. These platforms aggregate ingredient lists and compute a singular, scalar "Hazard" or "Safety Score" (frequently rendered as a red-to-green traffic light indicator or a 0–100 percentile). Despite immense commercial adoption, this methodology has been comprehensively repudiated by regulatory toxicologists, academic dermatologists, and cosmetic chemists (Cosmetics Europe, 2020; Royal Society of Chemistry, 2022).

The core epistemological flaw of universal safety scoring resides in its explicit violation of the foundational tenet of modern toxicology formulated by Paracelsus in the sixteenth century: *"Dosis sola facit venenum"* (solely the dose determines the poison) (Gallo, 2018). Chemical toxicity is not an intrinsic, binary attribute possessed by a molecular structure; it is an empirical function of cumulative exposure, dermal penetration, vehicle formulation, and physiological concentration.

For instance, commercial applications routinely flag ubiquitous cosmetic preservatives—such as Phenoxyethanol, Parabens, or Sodium Benzoate—with punitive hazard ratings based on high-dose rodent ingestion studies. In cosmetic formulations, however, these compounds are legally restricted by the European Scientific Committee on Consumer Safety (SCCS) and the ASEAN Cosmetic Directive to strict safe thresholds (e.g., Phenoxyethanol capped at ≤ 1.0%). By failing to ingest or parse quantitative concentrations—which manufacturers treat as proprietary trade secrets—scoring algorithms equate trace preservative systems indispensable for antimicrobial stability with hazardous, unbuffered industrial chemicals.

### 2.3.2 The Flawed Epistemology of Comedogenicity Scales

A parallel methodological failure occurs in the computational handling of comedogenicity ratings (the propensity of an ingredient to clog follicular pores and induce acne vulgaris). Commercial e-commerce filters routinely compute aggregate "acne-safe" metrics based on traditional rabbit ear assay tables established by Kligman and Mills (1972). Subsequent dermatological research has dismantled the clinical validity of directly extrapolating these animal assays to human facial biology (Fulton, 1989; Draelos and DiNardo, 2006).

The rabbit ear canal possesses hyper-sensitive follicular infundibula that overreact to pure chemical compounds (e.g., neat isopropyl myristate or pure coconut oil) applied occlusively. When formulated into an emulsion at concentrations below 5%, these ingredients demonstrate negligible comedogenicity in human clinical trials. Consequently, treating comedogenicity as an additive scalar metric introduces significant false-positive exclusions, depriving consumers of deeply hydrating barrier formulations.

### 2.3.3 The Ethical and Architectural Imperative for Invariant INV-01

The systemic distortion introduced by commercial hazard algorithms produces severe negative externalities: it fosters chemophobia and unscientific consumer alarmism; it penalises safe, shelf-stable formulations; and it induces cognitive exhaustion through reductionist oversimplification.

```text
[Mermaid Diagram #2 — Paste into https://mermaid.live to export high-res PNG]
flowchart TB
    subgraph Flawed["Flawed Paradigm: Universal Safety Scoring"]
        A1["Chemical Name"] --> A2["Global Toxicological Lookup"] --> A3["Numerical Penalty (e.g., 32/100 Hazard)"]
    end
    subgraph Scientific["Scientific Paradigm: Relational Suitability Architecture (BeautyAI / INV-01)"]
        B1["Chemical Name + INCI Position"] --> B2["Categorical Hierarchy (Active / Notable / Base)"]
        B3["User Digital Skin ID + Allergy Blacklist"] --> B4["Contextual Suitability Text Verdict"]
        B2 --> B4
    end
```
*Figure 2.1: Paradigm Shift from Universal Hazard Scoring to Relational Suitability Verdicts (INV-01).*

To preserve scientific rigour and consumer trust, this project establishes **System Invariant INV-01**: *The platform shall strictly prohibit the computation, persistence, or presentation of universal numerical "Safety Scores", "Hazard Indexes", or percentile safety ratings.* Instead of an absolute score, BeautyAI operationalises a relational paradigm: **Suitability Verdicts** rendered as deterministic categorical descriptors (e.g., `Good Match`, `Match with Notes`, `Not Suitable — Allergy Alert`) computed dynamically against the user's specific Digital Skin ID and documented personal contraindications.

**Table 2.1: Comparative Analysis of Cosmetic Ingredient Intelligence Platforms**

| Evaluation Dimension | Yuka / Think Dirty | EWG Skin Deep | INCIDecoder / SkinSort | BeautyAI (Proposed Platform) |
|---|---|---|---|---|
| **Primary Metric** | Scalar Hazard Score (0–100 or Traffic Light). | Numerical Hazard Score (1–10). | Descriptive Role Badges & Comedogenic Index. | Relational Suitability Verdict (Categorical Text). |
| **Toxicological Baseline** | Hazard-based identification (hazard *per se*). | Mixed hazard assessment; neglects formulation matrix. | Ingredient function tagging (CosIng derived). | Risk-based contextual assessment; formulation-matrix aware. |
| **Personalised Allergy Guard** | None; static global rating across all users. | Manual search required; no profile matching. | Partial allergen tracking (account required). | Automated Zero-Allergen Exclusion via Skin ID Blacklist. |
| **Active Conflict Engine** | Absent. | Absent. | Superficial warning text on isolated ingredients. | Pairwise Smart Conflict Detector across Active Carts & Routines. |
| **E-Commerce Integration** | Disconnected affiliate links; external redirection. | Non-transactional catalog database. | Purely informational blog/aggregator. | Fully Integrated Commerce Platform (.NET 10 / React 19). |
| **Dermatological Rigour** | Low; criticised for anti-chemical alarmism. | Low-to-Moderate; conflates hazards with risks. | Moderate; objective cosmetic science literature. | High; enforces INV-01, CosIng mapping & 12 clinical conflict rules. |

---

## 2.4 Personalisation and Recommender Systems in Skincare

Algorithmic recommendation in consumer retail relies fundamentally on three traditional paradigms: Collaborative Filtering (CF), Content-Based Filtering (CBF), and Hybrid Systems (Ricci, Rokach and Shapira, 2015). However, deploying these orthodox mathematical models directly within cosmetic dermatology exposes acute algorithmic deficiencies.

### 2.4.1 The Collapse of Collaborative Filtering in Dermal Biology

Collaborative filtering techniques—such as matrix factorisation via Singular Value Decomposition (SVD) or user-based $k$-nearest neighbours ($k$-NN)—operate on the assumption that if User $A$ and User $B$ share historical rating concordances across items $X$, User $A$ will appreciate an item $Y$ highly rated by User $B$ (Su and Khoshgoftaar, 2009).

In skincare retail, this foundational assumption collapses under biological heterogeneity. Two users may both rate a lightweight hyaluronic acid essence with 5 stars; however, User $A$ possesses resilient, hyper-sebaceous, acne-prone skin, whereas User $B$ exhibits atopic, xerotic skin with compromised barrier lipids. Recommending a heavy, occlusive shea-butter lipid repair balm to User $A$ purely because User $B$ celebrated its restorative efficacy will likely induce severe acute follicular occlusion. The sparsity of the user-item interaction matrix, coupled with the biological unreliability of uncurated ratings, renders pure CF hazardous in health-adjacent contexts.

### 2.4.2 Knowledge-Based and Rule-Augmented Filtering

To overcome the failure modes of statistical collaborative filtering, domain-aware e-commerce requires **Knowledge-Based Recommendation Systems** (Burke, 2002). Knowledge-based engines leverage explicit domain constraints, mapping user requirements directly to product attributes via deterministic logic. In BeautyAI, this is realised through:
- A structured **Digital Skin ID** model (capturing skin type, sensitivity status, primary concerns, goals, budget, and personal chemical blacklists); and
- A multidimensional compatibility cascade mapping these parameters against the structural position of chemical entities within the INCI string.

Furthermore, while frequent-pattern itemset mining (such as the Apriori association algorithm formulated by Agrawal and Srikant, 1994) offers value in identifying supplementary purchases (e.g., associating a gentle cleanser with a balancing toner), it must be subordinated to strict dermatological safety filters. If an association rule computes high statistical lift between a chemical exfoliator and an unbuffered retinol serum, the underlying recommender architecture must intervene to prevent simultaneous transactional combination.

---

## 2.5 Active-Ingredient Interactions and Contraindications

The contemporary cosmetic landscape is characterised by the proliferation of single-ingredient clinical serums containing high concentrations of biologically active molecules. The unguided simultaneous application of multiple active formulations presents well-documented physiological hazards.

### 2.5.1 Clinical Evidence: Chemical Degradation and Barrier Breakdown

The dermatological literature establishes that specific chemical combinations induce direct molecular destabilisation or acute epidermal barrier impairment:

- **Benzoyl Peroxide and Tretinoin:** In a landmark pharmacological stability investigation, Martin et al. (1998) demonstrated that mixing free-form all-trans retinoic acid (Tretinoin) directly with Benzoyl Peroxide (BPO) results in rapid oxidative degradation of the retinoid molecule, rendering it biologically inert within two hours of co-formulation. While third-generation naphthoic-acid derivatives like Adapalene exhibit chemical stability when exposed to BPO, the simultaneous layering of high-potency oxidising agents with primary keratolytics dramatically exacerbates transepidermal water loss (TEWL) and barrier disruption.
- **Direct Acid Combinations:** The concurrent layering of low-pH Alpha Hydroxy Acids (Glycolic, Lactic acids; pH < 3.8) with Beta Hydroxy Acid (Salicylic acid) or high-strength Vitamin A derivatives compromises the intercellular lipid lamellae of the stratum corneum, precipitating irritant contact dermatitis and post-inflammatory hyperpigmentation (Burke, 2002).

### 2.5.2 Dermatological Nuance: The Vitamin C and Niacinamide Dilemma

The formulation discourse surrounding the combination of L-Ascorbic Acid (pure Vitamin C) and Niacinamide (Nicotinamide) provides an exemplary case study in scientific evolution and required system nuance.

Historically, mid-twentieth-century chemical studies demonstrated that under elevated temperatures (> 120 °C), prolonged exposure, and unbuffered acidic conditions, L-Ascorbic Acid and Niacinamide can react to form a 1:1 hydrogen-bonded complex, hydrolysing Niacinamide into free Nicotinic Acid (Niacin), a known cutaneous vasodilator that induces intense facial flushing (Bisset et al., 1989).

Modern cosmetic formulation literature has demystified this reaction as a laboratory artefact largely absent at room temperature on biological skin (Feldmann and Maibach, 1970; Levin and Momin, 2010). Both actives operate synergistically in photo-protective and pigment-modulating pathways ("Myth Correction"). However, an operational engineering nuance remains: L-Ascorbic Acid requires an acidic formulation vehicle (pH 3.0–3.5) to maintain unionised molecular penetration, whereas Niacinamide performs stably at near-neutral physiological levels (pH 5.5–6.5). Co-applying them simultaneously without an interval buffer can elevate the local dermal pH, reducing the transdermal bioavailability of Vitamin C and inducing transient sensory flushing in hyper-reactive, atopic consumers.

Consequently, a rigorous e-commerce conflict engine must avoid binary alarmism: in BeautyAI Phase 1, the runtime engine flags this pairing at a non-blocking **Warning** level, advising a pragmatic application buffer (e.g., a 20-minute separation or AM/PM scheduling) for sensitive profiles while dispelling outdated toxicity myths.

**Table 2.2: Dermatological Evidence Classification for Curated Active Ingredient Interactions**

| Active Pair | Primary Dermatological Risk | Clinical Evidence Level | Platform Severity & Action | Key Literature Citations |
|---|---|---|---|---|
| **Benzoyl Peroxide + Tretinoin (Free-form)** | Rapid oxidative degradation of Retinoid; severe barrier disruption. | Level I (High: Controlled pharmacological stability trials). | Contraindication (High); Immediate cart warning; recommend AM/PM split. | Martin et al. (1998); Del Rosso (2008). |
| **AHA/BHA Exfoliants + High-Potency Retinol** | Cumulative stratum corneum stripping; acute erythema and elevated TEWL. | Level II (Moderate: Well-documented clinical observational studies). | Warning (Medium); Recommend alternating evening cadence. | Burke (2002); Draelos (2019). |
| **Copper Peptides + Direct L-Ascorbic Acid** | Oxidation of Ascorbate; destabilisation and chelation of bioactive peptide complexes. | Level III (In-vitro biochemical stability & formulation trials). | Warning (Moderate); Advise separate AM/PM routine slots. | Pickart and Margolina (2018). |
| **L-Ascorbic Acid + Niacinamide** | Transient facial flushing due to pH divergence; theoretical complexing. | Level IV (Nuanced: Re-evaluated as modern formulation myth; kinetic pH disparity). | Warning / Informational; Dispel toxicity myths; advise 20-min buffering for sensitive profiles. | Bisset et al. (1989); Levin and Momin (2010). |

---

## 2.6 Large Language Models in E-Commerce: Grounding and Guardrails

The advent of Generative Pre-trained Transformers and multimodal Large Language Models has inaugurated a new paradigm in interactive retail assistance. Consumers increasingly demand conversational interfaces capable of synthesising complex product queries into actionable routines. However, deploying probabilistic language models within health-adjacent e-commerce introduces severe reliability risks (Ji et al., 2023).

### 2.6.1 The Phenomenon of Hallucination in Catalog Search

LLMs are ungrounded parametric neural networks optimised to maximise token sequence probability rather than factual veracity (Bender et al., 2021). When queried regarding skincare regimens, unconstrained LLMs routinely exhibit three categories of hallucinations:
1. **Catalog Hallucination:** Inventing plausible-sounding product SKUs, non-existent active concentrations, or attributing products to incorrect brands.
2. **Formulaic Hallucination:** Fabricating ingredient constituents (e.g., asserting a fragrance-free mineral sunscreen contains botanical essential oils).
3. **Medical Hallucination:** Offering clinical diagnostic assertions regarding inflammatory dermatoses (e.g., misidentifying severe pathological rashes as mild dry skin).

### 2.6.2 Retrieval-Augmented Generation (RAG) and Bounded Context

To eliminate parametric hallucination, software architectures must adopt **Retrieval-Augmented Generation (RAG)** paradigms (Lewis et al., 2020). Under RAG, the conversational prompt submitted to the generative model is strictly augmented with deterministic, retrieved contextual payloads extracted from the relational database. In BeautyAI, the external AI adapter (`GeminiSkincareProvider`, integrating Google Gemini 2.5 Flash) operates under an immutable system instruction: it is strictly constrained to recommend exclusively the in-stock catalog items supplied within the contextual payload, explicitly prohibited from generating hypothetical external products.

### 2.6.3 Domain-Specific Medical Guardrails

Beyond transactional grounding, consumer safety demands the programmatic enforcement of **Medical Guardrails**. Under internationally accepted principles of bioethics and digital health law, an automated retail assistant must never simulate the licensed practice of medicine (American Medical Association, 2023). When a user presents symptoms indicative of active pathological conditions—such as cystic acne, severe atopic eczema, plaque psoriasis, or cutaneous infections—the generative assistant (`Lumi`) must execute a deterministic redirect, declining diagnostic authority and explicitly advising consultation with a board-certified dermatologist.

---

## 2.7 AI Coding Agents and Specification-Driven Development

The software engineering landscape has witnessed an aggressive transition toward agentic development environments, typified by tools such as Google Antigravity, GitHub Copilot Workspace, and Claude Code. Contemporary software engineering research indicates that autonomous AI coding agents can execute end-to-end implementation tasks—writing boilerplate code, generating unit tests, and scaffolding API controllers—yielding documented productivity gains exceeding 40% (Peng et al., 2023).

However, recent empirical analyses of autonomous agent behaviour in complex codebases reveal critical failure modes:
- **Architectural Drift:** Agents consistently exhibit "local optimisation bias"—solving a localised prompt by introducing direct tight-coupling between disparate architectural layers, thereby violating Clean Architecture and Inversion of Control boundaries (Jimenez et al., 2024).
- **Hallucinated Dependencies:** When confronted with complex algorithmic tasks, agents frequently introduce unmaintained third-party packages or deprecated APIs, compromising long-term maintainability and software supply chain integrity.
- **Domain Invariant Erosion:** Without formal machine-verifiable constraints, agents progressively erode subtle domain rules (such as inadvertently re-introducing numerical safety scores or bypassing cryptographic password hashing for convenience).

Resolving this tension requires an evolution toward **Specification-Driven Development** (Agarwal et al., 2026). In this paradigm, the software engineering lifecycle is structured as an immutable hierarchy of formal documents: Business Requirements Documents (BRD), Product Requirements Documents (PRD), and Architecture Decision Records (ADRs). The AI agent does not operate on raw conversational intent; it operates strictly as an execution engine within the constraints of structured, human-governed task playbooks, while machine-enforced architectural test suites (`NetArchTest`) act as deterministic boundary guards.

---

## 2.8 Legal, Ethical, and Regulatory Context

Deploying an ingredient-aware e-commerce platform requires strict adherence to overlapping transnational and domestic regulatory frameworks.

### 2.8.1 Cosmetic Regulation and Labelling Standards

Cosmetic formulations in the Southeast Asian market are governed by the **ASEAN Cosmetic Directive (ACD)**, which harmonised regional regulations with the **European Union Cosmetic Regulation (EC No 1223/2009)**. Under these frameworks, manufacturers are legally bound to declare all intentionally added constituents using their standardised INCI names in descending order of concentration if present at > 1%; ingredients present at concentrations ≤ 1% may be listed in arbitrary order at the termination of the string. Formulations must comply with authoritative Annex lists of prohibited substances (Annex II) and restricted substances (Annex III), mirrored digitally via authoritative repositories such as the European Commission's CosIng database.

### 2.8.2 Vietnamese Regulatory Framework: Decree 181/2013/NĐ-CP

Within Vietnam, digital beauty retail and marketing are strictly governed by **Decree No. 181/2013/NĐ-CP** (guiding the Law on Advertising). Article 4 of the Decree prohibits any advertising, product description, or automated advisory text that misrepresents cosmetic products as having therapeutic or curative medicinal properties (*"hành vi quảng cáo mỹ phẩm gây hiểu nhầm là thuốc chữa bệnh"*). Terms such as *"dứt điểm"* (cure definitively) or *"điều trị triệt để"* (treat therapeutically) are legally restricted to pharmaceutical agents. Consequently, the conversational interface and copy in BeautyAI enforce strict linguistic boundaries, describing products strictly in terms of aesthetic maintenance, barrier support, and physiological hydration.

### 2.8.3 Data Protection and Dermal Privacy: Decree 13/2023/NĐ-CP

Digital consumer protection has undergone a decisive regulatory tightening with Vietnam's **Decree No. 13/2023/NĐ-CP on Personal Data Protection (PDPD)**, alongside the European General Data Protection Regulation (GDPR). Under Decree 13, user dermatological profiles, chemical allergy histories, and health-adjacent inputs constitute **Sensitive Personal Data** (*Dữ liệu cá nhân nhạy cảm*). Processing such data mandates explicit consumer consent, strict purpose limitation prohibiting unauthorised monetisation, and full user sovereignty over profile modification. BeautyAI's architecture directly enforces these mandates by isolating Digital Skin ID records behind authenticated, user-scoped endpoints with zero administrative browse access.

---

## 2.9 Summary and Research Gap

The critical evaluation of the existing literature illuminates a profound dual void in both commercial software applications and academic software engineering methodology:

1. **The Product Intelligence Gap:** Commercial e-commerce platforms remain polarised between reductionist, alarmist scanning utilities that deploy scientifically ungrounded "Safety Scores" and commercial storefronts that hide ingredient strings behind marketing hyperbole. There is an absence of production-grade platforms that integrate transparent 3-tier INCI progressive disclosure, personalised zero-allergen filtering, pairwise active conflict warnings with scheduling advice, and catalog-grounded AI consultation within a unified transaction pipeline.
2. **The Software Lifecycle Gap:** Contemporary software development models remain trapped between rigid, pre-AI methodologies (Waterfall, Spiral) that cannot accommodate modern delivery velocity, and unstructured Agile practices that suffer from severe architectural decay when paired with autonomous AI coding agents.

BeautyAI directly addresses this dual gap: it delivers a scientifically grounded, legally compliant cosmetic e-commerce platform while establishing and validating an empirical, document-driven software development lifecycle tailored to harness autonomous AI agents with uncompromising engineering rigour.


\newpage


# CHAPTER 3: SOFTWARE DEVELOPMENT METHODOLOGIES AND THE PROPOSED AI-AGENT SDLC

## 3.1 Review of Classical Software Development Methodologies

The discipline of software engineering has historically codified development processes into formalised lifecycle models designed to manage complexity, mitigate operational risk, and align technical execution with stakeholder requirements. Over five decades of empirical practice, four foundational methodology paradigms have dominated academic literature and industrial engineering: the Linear Sequential (Waterfall) Model, the Risk-Driven Spiral Model, Rapid Application Development (RAD), and Agile/Scrum.

### 3.1.1 The Linear Sequential (Waterfall) Model

Formally conceptualised by Royce (1970), the Waterfall model enforces an orderly, non-iterative sequence of discrete engineering stages: requirements specification, system architectural design, programmatic implementation, integration testing, deployment, and operational maintenance. Each phase must achieve comprehensive formal verification and sign-off before downstream execution commences.

The primary pedagogical strength of the linear model lies in its procedural discipline, extensive documentary audit trails, and deterministic project boundaries. However, as demonstrated by Boehm (1988) and Sommerville (2015), Waterfall suffers from structural fragility when deployed in domains characterised by volatile requirements or emerging technologies. Because functional software is realised solely at the terminal stages of the lifecycle, late-breaking architectural defects or market-driven pivots require catastrophic rework at exponential economic cost.

### 3.1.2 The Risk-Driven Spiral Model

To reconcile the rigid documentation of Waterfall with iterative refinement, Boehm (1988) formulated the Spiral model. Organised as an expanding geometric helix, the model cycles continuously through four quadrant activities: determining objectives and constraints, evaluating risks and alternative solutions, engineering and verifying the current cycle's deliverables, and planning the subsequent iteration.

The paramount virtue of the Spiral paradigm is its explicit, institutionalised focus on risk assessment and systematic prototyping. Nevertheless, the framework imposes significant operational overhead: it demands advanced, specialised risk-assessment expertise and exhibits procedural complexity that makes it economically unviable and structurally cumbersome for small engineering teams or accelerated solo projects.

### 3.1.3 Rapid Application Development (RAD) and Evolutionary Prototyping

Pioneered by Martin (1991), Rapid Application Development arose as an explicit reaction to the documentary paralysis of traditional sequential lifecycles. RAD prioritises accelerated delivery cycles through visual evolutionary prototyping, computer-assisted software engineering (CASE) tooling, and time-boxed iterative construction.

While RAD fosters close user collaboration and compresses delivery schedules, it introduces dangerous technical trade-offs. The methodology frequently compromises non-functional systemic qualities—such as long-term architectural modularity, defensive security, database normalisation, and scalable data-access abstractions—in pursuit of superficial user-interface expediency.

### 3.1.4 Agile Methodologies and the Scrum Framework

Formally crystallised in the *Manifesto for Agile Software Development* (Beck et al., 2001) and operationalised through the Scrum framework (Schwaber and Sutherland, 2020), Agile represents the reigning industrial consensus. Scrum organises engineering labour into cross-functional teams executing time-boxed cadences (sprints lasting one to four weeks), governed by ceremonies (sprint planning, daily stand-ups, backlog refinement, sprint reviews, and retrospectives) and prioritising working software over comprehensive documentation.

Agile frameworks excel at empirical process control, enabling engineering teams to respond rapidly to evolving user feedback. However, Agile methodologies presuppose continuous human communicative bandwidth, real-time social consensus, and co-located or synchronously distributed human engineers.

**Table 3.1: Comparative Assessment of Traditional Software Development Methodologies**

| Evaluation Dimension | Waterfall (Royce, 1970) | Spiral (Boehm, 1988) | RAD (Martin, 1991) | Agile / Scrum (Schwaber & Sutherland, 2020) |
|---|---|---|---|---|
| **Primary Philosophy** | Rigorous sequential progression; verify then proceed. | Continuous risk mitigation through iterative cycles. | Rapid delivery via visual evolutionary prototyping. | Adaptive empirical change; working software over documentation. |
| **Requirements Volatility** | Intolerant; requires total upfront specification freeze. | Accommodates evolving risks at each quadrant cycle. | Highly adaptive; refined continuously via UI prototypes. | Welcomes changing requirements even late in development. |
| **Documentary Discipline** | Exhaustive, formal, gate-controlled documentation. | Formal risk assessments and milestone specifications. | Minimal; prioritises transient prototype code over specs. | Lean/Episodic; user stories, ephemeral burn-down charts. |
| **Architectural Governance** | High initial design, but vulnerable to implementation drift. | High; structured risk-driven architectural evaluation. | Low; frequently yields spaghetti or throwaway architectures. | Implicit; reliant on emergent design and human code reviews. |
| **Solo Developer Fit** | Low; excessive documentary paralysis for one engineer. | Very Low; prohibitive risk-assessment procedural overhead. | Moderate; effective for UI but deficient for enterprise core. | Low-to-Moderate; ceremonies designed for human collectives. |

---

## 3.2 Justification of Methodology Selection in an Agentic Context

The integration of autonomous AI coding agents (such as Google Antigravity, Claude Code, and GitHub Copilot Workspace) into the software engineering process creates a fundamental paradigm shift. Conventional software engineering methodologies—whether classical or agile—were formulated entirely on the unstated axiom that code is conceived, written, and verified exclusively by human cognitive faculties. When an autonomous AI agent enters the engineering loop as an active implementation partner for a solo developer, traditional methodologies experience acute systemic friction:

- **The Inadequacy of Classical Lifecycles:** Waterfall lacks the operational agility required to steer generative models. While comprehensive upfront documentation is theoretically desirable, Waterfall's sequential milestone gates prevent rapid iterative verification and responsive scope refinement.
- **The Failure of Pure Agile and the Peril of "Vibe Coding":** When solo developers pair Agile's minimal documentation philosophy with autonomous AI agents, the process rapidly degenerates into ungoverned *"Vibe Coding"*. Because conversational prompts and episodic user stories lack formal relational contracts, AI agents exhibit local optimisation bias: solving localised functional prompts by introducing direct layer coupling, hallucinating deprecated libraries, or silently eroding core business rules (Architectural Drift). Human code review rapidly becomes cognitively overwhelmed by the sheer volume of synthetic code.
- **The Justification for a Document-Driven SDLC:** To harness the throughput of AI coding agents without sacrificing system reliability, the engineering process must be anchored in **Specification-Driven Development** (Agarwal et al., 2026). The development lifecycle must be structured around an immutable hierarchy of formal documentation that functions as an absolute "source of truth." Autonomous agents must never execute against conversational whims; they must be constrained by structured playbooks, clear precedence rules, and automated, machine-enforced architectural tests.

---

## 3.3 The Proposed 8-Stage AI-Agent Document-Driven SDLC

To operationalise this paradigm, this project formulated and executed an empirical, eight-stage software development lifecycle—termed the **AI-Agent Document-Driven SDLC**—orchestrated via the **Syntheprise Framework v6.0.1**.

```text
[Mermaid Diagram #3 — Paste into https://mermaid.live to export high-res PNG]
flowchart TD
    A["Stage (a): Problem / Need Identification<br/>Genesis Prompt, Market Benchmark, 30 Gap Findings"] --> B["Stage (b): Business Requirements Document (BRD)<br/>Business Goals BO-01–07, 70+ Domain Rules"]
    B --> C["Stage (c): Product Requirements Document (PRD)<br/>14 Phase 1 Modules, Given/When/Then ACs"]
    C --> D["Stage (d): Technical Solutions & Architecture<br/>Clean Architecture, 14 ADRs, 10-Table Schema, 29 APIs"]
    D --> E["Stage (e): Master Plan & Sprint Strategy<br/>4 Weekly Sprints, Dependency Graph, Exit Criteria"]
    E --> F["Stage (f): Execution Playbooks<br/>Structured 6-Part Task Cards & Verification Commands"]
    F --> G["Stage (g): TDD, Architecture Tests & CI/CD<br/>12 NetArchTests, 46 Unit Tests, 5-Job GitHub Actions"]
    G --> H["Stage (h): Continuous Documentation & Change Lifecycle<br/>Change Folders, Git Worktrees, Atomic State Snapshots"]
```
*Figure 3.1: The Proposed 8-Stage AI-Agent Document-Driven Software Development Lifecycle.*

The lifecycle enforces a rigorous unidirectional dependency flow from Stage (a) through Stage (h):

- **Stage (a) — Problem and Need Identification:** The lifecycle initiates with an exhaustive Problem Statement and Genesis Prompt. Rather than relying on superficial feature lists, this stage synthesises qualitative and quantitative domain research. In BeautyAI, Stage (a) produced an empirical market analysis uncovering the "Safety Score" controversy, ingredient illegibility, active-ingredient contraindications, and 30 specific industry gap findings across existing commercial platforms.
- **Stage (b) — Business Requirements Document (BRD):** The verified problem statement is transformed into a formal Business Requirements Document defining seven macro Business Objectives (`BO-01` to `BO-07`), over 70 granular Domain Rules across ingredient nomenclature, safety boundaries, user profiling, and commerce, explicit User Personas, and quantitative operational metrics (e.g., sub-100ms catalog query response times).
- **Stage (c) — Product Requirements Document (PRD):** Stage (c) translates high-level business rules into functional software specifications. The PRD formalises the 14 Phase 1 Functional Modules (`M01`–`M15`, excluding deferred Phase 2 comparison). Each functional requirement is modelled as an actionable User Story accompanied by formal `Given/When/Then` Acceptance Criteria.
- **Stage (d) — Technical Solutions and Architectural Design:** Stage (d) establishes the concrete engineering blueprints: the Four-Layer Clean Architecture model, the 10-table physical relational schema on PostgreSQL 17, the formal REST API contracts comprising 29 endpoints, and the complete suite of 14 Architecture Decision Records (`ADR-001` to `ADR-014`).
- **Stage (e) — Master Plan and Sprint Strategy:** Stage (e) constructs the temporal and operational schedule across four intensive weekly sprints spanning 28 calendar days (160 scheduled hours plus 20 buffer hours), defining explicit resource allocations, risk contingencies, and strict milestone exit criteria.
- **Stage (f) — Execution Playbooks:** The bridge between static documentation and active AI implementation is achieved through Execution Playbooks. Each sprint deliverable is deconstructed into atomic **Task Cards** adhering to a six-part template: (1) Task Metadata, (2) Context & Objective, (3) File Scope whitelist, (4) Step-by-Step Implementation Instructions, (5) Verification Commands, and (6) Binary Acceptance Criteria.
- **Stage (g) — TDD, Automated Architectural Testing, and CI/CD:** Implementation proceeds under Test-Driven Development (TDD) (Beck, 2003), augmented with automated Architecture Tests via `NetArchTest`. Before writing business logic, tests verify Clean Architecture layer isolation and domain invariants (such as machine-checking that no class or JSON attribute contains the substring `SafetyScore`). Continuous Integration is enforced via a five-job GitHub Actions workflow covering build validation, unit tests, architecture tests, secret scanning, and Syntheprise specification checks.
- **Stage (h) — Continuous Documentation and the Change Lifecycle:** When defects are uncovered or refactoring is required, code is never modified in isolation. Stage (h) governs systemic updates through a formal Change Management Protocol: (1) Proposal & Impact Analysis, (2) Specification Synchronisation (updating upstream BRD/PRD/ADRs first), (3) Isolated Git Worktree Execution, and (4) Atomic State Snapshot capture and merge.

```text
[Mermaid Diagram #4 — Paste into https://mermaid.live to export high-res PNG]
flowchart LR
    C1["1. Defect / Change Identified<br/>(e.g., CHANGE-ANALYZER-CATEGORY)"] --> C2["2. Proposal & Impact Analysis<br/>(PRD, DB Schema, Invariants)"]
    C2 --> C3["3. Upstream Spec Sync<br/>(Update Markdown Docs FIRST)"]
    C3 --> C4["4. Isolated Git Worktree<br/>(Code + NetArchTest + Unit Tests)"]
    C4 --> C5["5. Atomic State Snapshot & Merge<br/>(./syntheprise gate Clean)"]
```
*Figure 3.2: Continuous Documentation and Change Management Workflow.*

---

## 3.4 Governance and Safety Mechanisms

To maintain deterministic control over autonomous AI agents across all eight stages, the Syntheprise Framework institutes three foundational governance mechanisms: the Document Precedence Ladder, System Invariants, and the Human-Agent RACI Governance model.

### 3.4.1 The Constitutional Document Precedence Ladder

A primary failure mode of AI coding agents is resolving ambiguous requirements by fabricating synthetic logic. The SDLC prevents this by establishing a strict, immutable **Constitutional Precedence Ladder** (`AGENTS.md §0`), where lower numbers hold higher authority:

```text
[Mermaid Diagram #5 — Paste into https://mermaid.live to export high-res PNG]
flowchart BT
    L6["Level 6: Informational & Code<br/>README, CHANGELOG, Research, Source Code"] --> L5["Level 5: Working Memory<br/>Master Plan, Execution Playbooks, State Snapshots"]
    L5 --> L4["Level 4: Domain & Regulatory Rules<br/>docs/domain-rules.md, Formulation Principles"]
    L4 --> L3["Level 3: Requirements Specification<br/>BRD, PRD, Module Specs, Active Change Deltas"]
    L3 --> L2["Level 2: Technical Contracts & ADRs<br/>Architecture, Data/API Contracts, Security/LLM Policies"]
    L2 --> L1["Level 1: Project Constitution<br/>AGENTS.md & .agents/AGENTS.md"]
    L1 --> L0["Level 0: Core Principles & Safety Guardrails<br/>core-principles.md, .agents/rules/safety.md, INV-01–12"]
```
*Figure 3.3: The Constitutional Document Precedence Ladder (Lower Number Wins).*

Whenever an autonomous agent detects a contradiction between artefacts, the conflict is resolved deterministically by deferring to the higher-ranking authority. Crucially, runtime source code resides at the lowest precedence tier: code must conform to specifications and invariants—specifications are never silently weakened to accommodate expedient code.

### 3.4.2 System Invariants (INV-01 to INV-12)

To provide machine-verifiable boundaries that AI agents cannot erode, the architecture codifies twelve non-negotiable System Invariants, including:

- **INV-01 (Prohibition of Universal Safety Scores):** Absolute ban on numerical safety/hazard scoring across classes, properties, and JSON attributes; mandatory use of contextual text-based `SuitabilityVerdict`.
- **INV-02 (INCI Order Preservation):** Ingredient ordering reflects packaging concentration tiers; proprietary percentages are never fabricated.
- **INV-03 (Evidence-Proportional Conflict Warnings):** Active conflict warnings provide non-blocking educational scheduling guidance without restricting checkout autonomy.
- **INV-04 (Zero-Allergen Exclusion):** Products matching a user's active Allergy Blacklist (and cosmetics lacking manufacturer INCI data) are strictly excluded when *"Safe For My Skin"* is enabled.
- **INV-05 (Database Grounding & Relational Truth):** PostgreSQL 17 serves as the single source of truth; AI product recommendations are strictly grounded to verified database records.
- **INV-06 (Clean Architecture Isolation):** `BeautyAI.Domain` maintains zero external NuGet or framework dependencies; `BeautyAI.Application` never references EF Core or ASP.NET Core.
- **INV-07 (Dermal Privacy Isolation):** Digital Skin ID endpoints derive identity exclusively from authenticated JWT claims—never from URL `userId` parameters—and remain inaccessible to administrative browse endpoints.
- **INV-08 (Cryptographic Credential Hygiene):** All passwords are hashed via PBKDF2 HMAC-SHA256 (600,000 iterations + cryptographic salt); secrets never enter source control.
- **INV-09 & INV-10 (Phase 1 Currency & Linguistic Standardisation):** Phase 1 operates consistently in English and USD (`$`) aligned with the Sephora dataset.
- **INV-11 (Medical Boundary & Disclaimer):** The AI assistant (`Lumi`) strictly declines clinical diagnosis of severe dermatological pathologies and directs users to board-certified dermatologists.
- **INV-12 (Atomic Documentation Synchronisation):** Code changes touching contracts, schema, or behaviour require synchronised documentation updates and an atomic State Snapshot.

### 3.4.3 Human-Agent Governance and RACI Matrix

A critical risk in agentic software engineering is the abdication of human accountability. Under the proposed SDLC, the human engineer retains absolute sovereignty over architectural decisions, domain ethics, and final verification, while the AI coding agent serves as a high-throughput execution partner (Table 3.2).

**Table 3.2: Human vs. AI-Agent Responsibilities Across Lifecycle Stages (a)–(h)**

| Lifecycle Stage | Human Engineer (Lead Architect) | Autonomous AI Coding Agent (Executor) | Governance / Quality Verification Gate |
|---|---|---|---|
| **Stage (a): Problem Identification** | **Accountable:** Defines business vision, ethics, and domain scope. | **Consulted:** Conducts market research, literature synthesis, and gap analysis. | Human approval of Stage (a) Genesis Document. |
| **Stage (b): Business Requirements** | **Accountable:** Authorises domain rules, invariants, and success metrics. | **Responsible:** Drafts formal BRD text, traceability matrices, and personas. | Review against business goals; cross-check `INV-01`. |
| **Stage (c): Product Requirements** | **Accountable:** Validates functional scope, module definitions, and ACs. | **Responsible:** Generates detailed User Stories and Given/When/Then criteria. | Precedence check against Constitution and BRD. |
| **Stage (d): Technical Solutions** | **Accountable:** Selects tech stack, decides ADRs, approves DB schema. | **Responsible:** Scaffolds Clean Architecture, writes EF Core mappings, drafts DTOs. | Architecture Review; `NetArchTest` scaffolding. |
| **Stage (e): Master Planning** | **Accountable:** Allocates timeline, manages budget, approves exit criteria. | **Informed:** Estimates task complexity; maps dependency graphs. | Sprint gate sign-off; resource allocation freeze. |
| **Stage (f): Execution Playbooks** | **Accountable:** Reviews and issues Task Cards; verifies file scopes. | **Responsible:** Translates PRD requirements into atomic execution task cards. | Playbook validation against Level 2 Contracts. |
| **Stage (g): TDD & Implementation** | **Accountable:** Reviews test results, monitors git commits, inspects PRs. | **Responsible:** Implements domain logic, writes unit tests, fixes build defects. | Automated Gate: 12 Arch Tests, 46 Unit Tests, 5-job CI. |
| **Stage (h): Continuous Documentation** | **Accountable:** Authorises architectural changes and signs off snapshots. | **Responsible:** Updates markdown specs, captures state snapshots, runs git diff. | `./syntheprise gate` Clean verification (0 errors). |

Through the disciplined orchestration of the eight-stage lifecycle, the constitutional precedence ladder, the twelve domain invariants, and the human-governed RACI framework, the AI-Agent Document-Driven SDLC demonstrates that an individual engineer can design, implement, and verify an enterprise-grade digital commerce platform with uncompromising architectural rigour.


\newpage


# CHAPTER 4: TECHNOLOGY AND TOOLS

## 4.1 Backend Architecture and Runtime Environment

The backend infrastructure of BeautyAI is engineered on the **C# .NET 10** runtime, strictly pinned to SDK version `10.0.401` via a root-level `global.json` manifest to guarantee deterministic builds across local and CI environments. The solution implements a classical **Four-Layer Clean Architecture** (Martin, 2018), partitioning responsibilities into four compile-time isolated projects: `BeautyAI.Domain`, `BeautyAI.Application`, `BeautyAI.Infrastructure`, and `BeautyAI.Api`.

```text
[Mermaid Diagram #6 — Paste into https://mermaid.live to export high-res PNG]
flowchart TD
    API["BeautyAI.Api (ASP.NET Core 10)<br/>9 Controllers · 29 REST Endpoints · JWT · OpenAPI"] --> APP["BeautyAI.Application<br/>Services · Interfaces · Immutable DTO Records"]
    API --> INFRA["BeautyAI.Infrastructure<br/>EF Core 10 / Npgsql · Repositories · GeminiSkincareProvider · PBKDF2"]
    APP --> DOM["BeautyAI.Domain<br/>Core Entities · Enums · SuitabilityScoreCalculator · CosmeticKnowledgeBase<br/>(Pure C#, Zero NuGet Dependencies)"]
    INFRA --> APP
    INFRA --> DOM
```
*Figure 4.1: Four-Layer Clean Architecture and Directional Dependency Constraints.*

### Architectural Trade-offs and Rejected Alternatives

During technical inception, an alternative dual-backend architecture—comprising a Python/FastAPI microservice for machine learning inference and Node.js for commerce pipelines—was evaluated. As codified in **ADR-001**, this heterogeneous topology was rejected. Managing asynchronous inter-process communication, distributed network boundaries, and dual runtime deployments introduced prohibitive operational overhead for a solo engineer. Consolidating the entire runtime within `.NET 10` (with offline Python ETL scripts restricted exclusively to data preparation) delivered superior memory management, high-throughput asynchronous I/O, compile-time type safety, and single-binary containerisation.

Furthermore, pursuant to **ADR-009** (Tier-1 Architectural Simplicity), the application layer deliberately omitted heavyweight abstraction libraries including `AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, and `StackExchange.Redis`:
- **Exclusion of AutoMapper and MediatR:** AutoMapper relies on runtime reflection, introducing non-deterministic mapping defects and obfuscating compilation diagnostics. Explicit C# manual mappings provide compile-time verification and instant symbol traceability. Similarly, in a bounded single-process web API, MediatR introduces unnecessary pipeline indirection without decoupling tangible runtime boundaries.
- **Exclusion of Distributed Caches (Redis) and Background Job Brokers (Hangfire):** Maintaining dual-state synchronisation between PostgreSQL and an external Redis node risked serving stale personal allergy exclusions. Direct, index-accelerated relational queries in PostgreSQL 17 fully satisfied the sub-100ms service-level objective without adding infrastructure failure points.

The compiled web host exposes **28 core Phase 1 RESTful API endpoints** distributed across **8 active functional controllers**: `AuthController`, `SkinProfileController`, `ProductsController`, `ReviewsController`, `ToolsController`, `RoutinesController`, `OrdersController`, and `AdminController` (with an isolated adapter seam reserved for Phase 2 conversational AI integration).

---

## 4.2 Database Engine and Big Data Access Strategy

The persistence layer is underpinned by **PostgreSQL 17 Alpine**, deployed as an isolated container orchestrated via Docker Compose (**ADR-002**). PostgreSQL 17 was selected over non-relational document stores (such as MongoDB) due to the strictly relational nature of cosmetic formulations: chemical incompatibilities, normalised `product_ingredients` mappings, and transactional `orders`/`order_items` require ACID guarantees, declarative `CHECK` constraints, and referential foreign-key integrity. Native PostgreSQL array columns (`VARCHAR(50)[]`) and `JSONB` (used in `saved_routines`) provide schema flexibility where appropriate without sacrificing relational discipline.

Data access is managed through **Entity Framework Core 10 (EF Core)** utilising the `Npgsql.EntityFrameworkCore.PostgreSQL` provider (alongside Dapper capability for read-heavy projections). Under **ADR-003**, the architecture prohibits vendor-locked Database Stored Procedures and complex database triggers: encoding business logic inside procedural SQL hinders unit testing, version control, and cross-environment reproducibility. All domain logic resides exclusively in testable C# services.

### Composite B-Tree Indexing for 1.09 Million Reviews

A central engineering challenge was executing rapid, paginated review queries filtered by reviewer skin type across **1,094,197 authentic Sephora reviews** joined to **8,494 products**. Unindexed table scans caused severe latency spikes. The Phase 1 schema (`schema_phase_1.sql`) resolves this via composite B-Tree indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_reviews_product_skin   ON reviews(product_id, skin_type);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_code   ON reviews(product_code);
```

By indexing the composite predicate `(product_id, skin_type)`, PostgreSQL executes targeted B-Tree range scans, filtering over one million review records by skin type in **under 15 milliseconds** (verified via `EXPLAIN ANALYZE`).

---

## 4.3 Frontend Framework and Automated Contract Drift Prevention

The presentation layer is implemented as a Single-Page Application (SPA) utilising **React 19**, **TypeScript**, and the **Vite** build toolchain (with route-level code splitting via `React.lazy` and `Suspense`). React 19 was selected for its mature component ecosystem, predictable state transitions, and fast development feedback loop.

- **Preservation of Prototype Design Tokens (ADR-007):** The production frontend inherits the validated typography, warm neutral palette, and atomic CSS design tokens established in the approved UI/UX prototype, avoiding the bundle bloat and visual homogenisation of third-party UI kits such as Material UI or Ant Design.
- **OpenAPI Automated Contract Drift Verification (ADR-008):** To prevent client-server schema divergence, the `.NET 10` backend generates an authoritative OpenAPI specification (`docs/api/BeautyAI.Api.json`) directly from compiled controllers and DTO records. A CI verification job (`openapi-drift`) compares the generated OpenAPI contract against frontend DTO definitions, failing the build immediately if uncommitted API drift is detected.

---

## 4.4 Deferred Conversational AI Seam (Phase 2 Architectural Readiness)

Although a conversational LLM chatbot was explored during early system design (**ADR-005** and `docs/llm-policy.md`), its full production rollout was formally **deferred to Phase 2** to respect the four-week solo-developer schedule and acknowledge the specialised clinical validation required to guarantee zero medical hallucination in live patient-facing dialogue.

To ensure seamless future extensibility without refactoring core layers, Phase 1 established the Clean Architecture **Provider Abstraction Seam**:
- `IAiSkincareProvider` is defined strictly inside `BeautyAI.Application`, keeping all domain and application logic agnostic of external LLM vendors.
- `ProviderLibrariesOnlyInAdapterLayerTests` (`BeautyAI.ArchitectureTests`) enforces that any future `HttpClient` or external LLM SDK integration (such as Google Gemini API) resides exclusively within `BeautyAI.Infrastructure.Providers`, enabling plug-and-play Phase 2 activation with zero modifications to controllers or domain entities.

---

## 4.5 Testing and Automated Quality Assurance Tools

Quality assurance follows Test-Driven Development (TDD) and automated architectural enforcement using **xUnit** and **NetArchTest.Rules**, structured into two test projects (`58 automated tests` in total):

1. **Automated Architecture Tests (`BeautyAI.ArchitectureTests` — 12/12 Passing):**
   - `DomainHasNoDependenciesTests`: Asserts that `BeautyAI.Domain` references zero external packages or outer layers.
   - `ApplicationDoesNotReferenceEfCoreTests` & `ApplicationDoesNotReferenceAspNetTests`: Enforces strict Clean Architecture separation.
   - `ForbiddenPackagesTests`: Fails the build if prohibited libraries (`AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, `StackExchange.Redis`) are introduced (**ADR-009**).
   - `ProviderLibrariesOnlyInAdapterLayerTests`: Ensures `HttpClient` and third-party provider SDKs reside exclusively in `BeautyAI.Infrastructure.Providers`.
   - `NoSafetyScoreAnywhereTests`: Uses reflection across compiled assemblies to verify **INV-01**, rejecting any class, property, method, or `[JsonPropertyName]` attribute containing `SafetyScore`, `HazardScore`, or `DangerLevel`.
   - `AdminAuthorizationTests`: Verifies that `AdminController` is strictly guarded by `[Authorize(Roles = "Admin")]`.
2. **Unit Tests (`BeautyAI.UnitTests` — 46/46 Passing):**
   - Covers `Pbkdf2PasswordHasher` (600,000-iteration HMAC-SHA256 verification), `AuthService`, `SkinProfileService`, `SuitabilityScoreCalculator` (deterministic text verdicts, allergy overrides, 7 target care areas, and fragrance/fatty-alcohol nuance), `ProductService`, `AdminProductService` (full CRUD, INCI synchronisation, soft delete & restore), and `AdminBootstrapper`.

---

## 4.6 Continuous Integration and DevOps Pipeline

Continuous verification is automated through a five-job **GitHub Actions** workflow (`.github/workflows/quality-gate.yml`) complemented by local Git pre-commit hooks enforcing worktree isolation:

```text
[Mermaid Diagram #7 — Paste into https://mermaid.live to export high-res PNG]
flowchart LR
    PUSH["Git Push / Pull Request"] --> J1["Job 1: Backend<br/>dotnet build -warnaserror<br/>12 Arch + 46 Unit Tests"]
    PUSH --> J2["Job 2: Frontend<br/>Node 22 · tsc -b<br/>Vite Production Build"]
    PUSH --> J3["Job 3: OpenAPI Drift<br/>Backend OpenAPI vs.<br/>Frontend DTO Sync"]
    PUSH --> J4["Job 4: Security<br/>Gitleaks Secret Scan &<br/>Dependency Audit"]
    PUSH --> J5["Job 5: Syntheprise Gate<br/>Doctor · Lifecycle ·<br/>Doc Drift · Adapter Sync"]
    J1 & J2 & J3 & J4 & J5 --> OK["All 5 Jobs GREEN<br/>Docker Compose Ready"]
```
*Figure 4.2: Automated Five-Job CI/CD Quality Gate Pipeline.*

---

## 4.7 Architecture Decision Records (ADRs) Summary

Every foundational architectural choice and trade-off in BeautyAI is codified in an immutable Architecture Decision Record stored in `docs/adr/`. Table 4.1 summarises all 14 ADRs governing the platform.

**Table 4.1: Summary of Architecture Decision Records (ADR-001 to ADR-014)**

| ADR ID | Decision Title | Architectural Choice & Rationale | Alternatives Considered & Rejected |
|---|---|---|---|
| **ADR-001** | Single Backend & Offline ML | Consolidated `.NET 10` Web API for all runtime traffic; Python restricted to offline ETL/data preparation. | Dual Python/FastAPI + Node.js microservices. |
| **ADR-002** | Local Docker PostgreSQL 17 | Containerised PostgreSQL 17 Alpine via Docker Compose for reproducible local ACID persistence and B-Tree indexing. | Managed cloud DB; MongoDB; SQLite. |
| **ADR-003** | EF Core + Dapper, No Stored Procedures | Code-first EF Core 10 (with Dapper for heavy reads); zero stored procedures or triggers to preserve unit testability. | PL/pgSQL stored procedures; database triggers. |
| **ADR-004** | Authentication & PBKDF2 Hashing | PBKDF2 HMAC-SHA256 (600,000 iterations + cryptographic salt) with JWT/secure auth token hygiene. | Plain-text demo fallbacks; weak MD5/SHA1 hashes; OAuth in Phase 1. |
| **ADR-005** | AI Multi-Stage Pipeline & Guardrails | Grounded AI skincare consultation pipeline (`Gemini 2.5 Flash` + deterministic fallback + medical guardrails). | Unbounded direct LLM prompting without catalog grounding. |
| **ADR-006** | Zalo DeepLink Handoff Strategy | Architectural design for consented human-specialist handoff via Zalo deep link (deferred to Phase 2). | Embedded third-party live-chat widgets; unconsented profile sharing. |
| **ADR-007** | Preserve Prototype Design System | Inherit validated CSS design tokens and typography from the UI/UX prototype for visual fidelity and lean bundles. | Rewriting UI from scratch with Material UI or Ant Design. |
| **ADR-008** | OpenAPI-Generated DTO Contracts | Derive frontend DTO schemas from compile-time backend OpenAPI spec with automated CI drift checks. | Manual TypeScript interface duplication; GraphQL layer. |
| **ADR-009** | Tier-1 Simplicity (No Redis/MQ/Hangfire) | Explicit manual DTO mapping and direct PostgreSQL queries; prohibit AutoMapper, MediatR, Hangfire, and Redis. | Heavy enterprise middleware stack adding solo-dev overhead. |
| **ADR-010** | Immutable Order Snapshots | Persist unit price, quantity, and line totals at order creation so subsequent Admin edits never alter historical orders. | Dynamically joining historical orders to mutable product prices. |
| **ADR-011** | Suitability Computed on Read | Compute personalised `SuitabilityVerdict` dynamically on read against the user's live Digital Skin ID (`INV-01`). | Persisting static global safety scores in the `products` table. |
| **ADR-012** | String Product Code Preservation | Retain authentic Sephora alphanumeric product codes (`code`, e.g., `P473671`) as unique natural keys alongside integer PKs. | Discarding source Sephora IDs (breaking 1.09M review ETL mapping). |
| **ADR-013** | Docker Compose Deploy & Test | Standardise local testing and demonstration deployment on macOS via Docker Compose and unified shell scripts. | Manual bare-metal PostgreSQL installation; premature Kubernetes. |
| **ADR-014** | Product Soft Delete & Admin Bootstrap | Soft-delete products via `selling_status` (`Active` / `Draft` / `Discontinued`) with 1-click Restore; seed Admin via env vars (`AdminBootstrapper`) + `[Authorize(Roles = "Admin")]`. | Hard SQL `DELETE` (breaking order/review FKs); hardcoded Admin passwords. |


\newpage


# CHAPTER 5: SOFTWARE PRODUCT REQUIREMENTS

## 5.1 Review of Similar Products and Market Gap Analysis

To establish an empirical baseline for functional requirements, six prominent commercial platforms operating across digital skincare, cosmetic analysis, and e-commerce were benchmarked: **Yuka**, **INCIDecoder**, **SkinSort**, **Haut.AI**, **Hasaki**, and **Sociolla**.

### 5.1.1 Critical Benchmark of Existing Solutions

- **Yuka (Mobile Barcode Scanner):** Yuka popularised consumer barcode scanning by assigning products a composite 0–100 numerical score alongside a traffic-light risk badge. However, its toxicological methodology conflates intrinsic chemical hazards with actual consumer risk, neglecting exposure concentration and the dermal formulation matrix. Crucially, Yuka is purely a third-party audit utility; it provides no transactional e-commerce infrastructure, lacks active conflict detection across product combinations, and cannot filter catalogs against an authenticated, personalised allergy blacklist.
- **INCIDecoder (Cosmetic Ingredient Database):** INCIDecoder provides educational breakdowns of cosmetic formulations, categorising ingredients by functional role based on cosmetic science literature and the European Commission's CosIng database. While respected for scientific objectivity, the platform operates primarily as an informational wiki and affiliate directory. It lacks personalised compatibility verdicts against a structured skin profile, cannot construct conflict-free AM/PM routines, and offers no native checkout.
- **SkinSort (Skincare Routine & Compatibility Tool):** SkinSort allows registered users to analyse cosmetic formulations and track custom routines. While it flags potential skin-type mismatches, its recommendations rely heavily on crowd-sourced tags and conventional comedogenicity tables. Furthermore, it lacks native e-commerce fulfilment, integrated COD order processing, and catalog-grounded conversational AI consultation.
- **Haut.AI (B2B Computer-Vision Dermal Analytics):** Haut.AI represents the technological benchmark for optical skin diagnostics, utilising convolutional neural networks to evaluate facial pigmentation, redness, and pore visibility. However, Haut.AI is licensed strictly as a B2B SaaS integration for clinical brands rather than an end-to-end consumer storefront with ingredient conflict detection.
- **Hasaki and Sociolla (Regional E-Commerce Storefronts):** Hasaki (Vietnam) and Sociolla (Southeast Asia) are leading omni-channel beauty retailers excelling at promotional campaigns, rapid fulfilment, and loyalty programmes. Nevertheless, both storefronts treat INCI ingredient declarations as passive, static text blocks. Neither offers dynamic zero-allergen catalog exclusion, pairwise active-ingredient conflict checking inside the shopping cart, or sub-20ms review filtering by reviewer skin type.

### 5.1.2 The Identified Market Gap

The competitive landscape reveals a clear structural void: commercial platforms are polarised between informational scanning apps that rely on scientifically ungrounded numerical "hazard scores" without transactional capability, and retail storefronts that optimise for sales conversion while ignoring consumer ingredient vulnerabilities. BeautyAI bridges this gap by unifying a full transactional e-commerce platform with a scientifically grounded, non-punitive ingredient intelligence engine.

---

## 5.2 Requirements Engineering (BRD & PRD Phase 1)

### 5.2.1 High-Level Business Objectives

The functional and non-functional requirements derive directly from seven core Business Objectives codified in the Business Requirements Document (BRD):

- **BO-01 (Dermatological Ingredient Transparency):** Provide structured, 3-tier progressive disclosure of INCI nomenclature across catalog products without computing universal safety scores (`INV-01`).
- **BO-02 (Automated Consumer Safety & Allergy Exclusion):** Enable instantaneous catalog filtering to exclude personal allergens documented in the user's Digital Skin ID (`INV-04`).
- **BO-03 (Active-Ingredient Contraindication Mitigation):** Detect potential active-ingredient clashes across cart items and daily routines, delivering non-blocking educational scheduling advice (`INV-03`).
- **BO-04 (Contextualised Social Proof):** Segment 1.09 million consumer reviews dynamically by reviewer biological skin type to eliminate crowd-sourced rating bias.
- **BO-05 (Grounded Conversational Assistance):** Deploy an AI skincare advisor (`Lumi`) grounded strictly within verified in-stock catalog inventory, enforcing explicit medical boundaries (`INV-07`, `INV-11`).
- **BO-06 (Streamlined E-Commerce Conversion):** Support persistent cart management, Cash on Delivery (COD) checkout, and transparent order tracking.
- **BO-07 (Autonomous Governance & Administration):** Deliver a role-protected administrative console supporting real-time database analytics and full product lifecycle CRUD with soft delete (`ADR-014`).

### 5.2.2 Phase 1 Functional Modules (PRD Scope)

To ensure disciplined delivery within the four-week Phase 1 schedule, **13 functional modules** were delivered in production, while **Module M08 (Interactive Multi-Product Comparison)** and **Module M12 (Conversational AI Skincare Chatbot)** were formally deferred to Phase 2.

**Table 5.1: Phase 1 Functional Modules and Requirement Traceability Matrix**

| Module ID | Module Name | Architectural Description & Scope | Traceability ID |
|---|---|---|---|
| **M01** | Authentication & RBAC | Customer and Admin authentication via JWT; PBKDF2 password hashing (`600,000` rounds). | `FR-AUTH-01` to `06` |
| **M02** | Catalog & Smart Filtering | Multi-level category navigation, search, skin-type/price filters, and *"Safe For My Skin"* toggle. | `FR-CAT-01` to `06` |
| **M03** | PDP & 3-Tier INCI | Product Detail Page with 3-tier INCI disclosure, text `Suitability Verdict`, and red allergy banner. | `FR-PDP-01` to `07` |
| **M04** | Digital Skin ID | 30-second unified profile capturing skin type, Allergy Blacklist, concerns, goals, and budget. | `FR-SKIN-01` to `03` |
| **M05** | Routine Builder | Automated AM/PM routine generator with mandatory morning SPF and 1-Click *"Routine-to-Cart"*. | `FR-ROUTINE-01` to `04` |
| **M06** | INCI Analyzer | Standalone formula analyzer with Blurred Preview Gate (`[Authorize]`) and 7 target care areas. | `FR-INCI-01` to `03` |
| **M07** | Smart Conflict Detector | Pairwise active-ingredient conflict engine evaluating 12 curated rules across carts and routines. | `FR-CONF-01` to `02` |
| **M08** | Product Comparison | *Deferred to Phase 2 (Side-by-side formulaic comparison drawer).* | *(Phase 2 Scope)* |
| **M09** | Wishlist Engine | Persistent wishlist displaying current USD price, stock status, and `Suitability Verdict`. | `FR-WISH-01` |
| **M10** | Shopping Cart | Persistent cart & `CartDrawer` integrating dynamic conflict alerts and subtotal calculation. | `FR-CART-01` |
| **M11** | COD Checkout & Orders | Single-page Cash on Delivery checkout (`BA-YYYYMMDD-XXXX`), atomic stock deduction, order history. | `FR-ORD-01` to `03` |
| **M12** | AI Skincare Chatbot | *Deferred to Phase 2 (Conversational LLM advisor & Zalo OA handoff; adapter seam `IAiSkincareProvider` preserved).* | *(Phase 2 Scope)* |
| **M13** | Reviews by Skin Type | Paginated review engine over 1.09M rows with sub-15ms B-Tree filtering by reviewer skin type. | `FR-REV-01` to `03` |
| **M14** | Admin Console | Role-guarded dashboard (`[Authorize(Roles = "Admin")]`), real-time analytics, Product CRUD & Soft Delete. | `FR-ADM-01` to `03` |
| **M15** | Support & Static Content | Support Centre (`/support`), FAQ, suitability methodology (`INV-01`), and privacy disclosures. | `FR-SUP-01` to `04` |

### 5.2.3 Core Functional User Stories and Acceptance Criteria

Below are the formal User Stories and `Given/When/Then` Acceptance Criteria for three representative Unique Selling Propositions (USPs):

1. **`FR-CAT-06`: "Safe For My Skin" Zero-Allergen Catalog Filtering**
   - *User Story:* As an authenticated customer with recorded allergens in my Digital Skin ID, I want to activate a *"Safe For My Skin"* filter on the catalog so that all products containing my blacklisted ingredients—and cosmetics lacking manufacturer INCI disclosures—are excluded from browsing results.
   - *Scenario 1 (Authenticated Allergen Exclusion):* **Given** the user is authenticated with `Alcohol Denat` in their Allergy Blacklist, **When** they enable *"Safe For My Skin"* on `/products`, **Then** the backend excludes all products linked to `Alcohol Denat` as well as cosmetic products with empty `ingredient_list_raw` (while retaining non-cosmetic `Tools & Brushes`), guaranteeing zero-allergen browsing.
   - *Scenario 2 (Unauthenticated Guest):* **Given** a guest user views `/products`, **When** they attempt to enable *"Safe For My Skin"*, **Then** the toggle indicates that signing in and configuring a Digital Skin ID is required.

2. **`FR-INCI-01`: Standalone 3-Tier INCI Analyzer with Blurred Preview Gate**
   - *User Story:* As a consumer evaluating an external cosmetic product, I want to paste raw packaging INCI text into the analyzer and select a target care area so that I receive a personalised 3-tier formula breakdown.
   - *Scenario 1 (Authenticated Member with Skin ID):* **Given** an authenticated user pastes a raw INCI list and selects one of the 7 target care areas (`Face`, `Eye Area`, `Lips`, `Hair & Scalp`, `Bath & Body`, `Fragrance`, `Nails & Cuticles`), **When** they submit the analysis to `POST /api/v1/tools/analyze-inci`, **Then** the engine returns a 3-tier breakdown: (Tier 1) a deterministic text `Suitability Verdict` and consolidated allergy warning, (Tier 2) 3–6 Key Notable Ingredients plus Functional Role Groups and category-aware cautions (distinguishing gentle botanical extracts and moisturising fatty alcohols from drying alcohols/EU fragrance allergens), and (Tier 3) a collapsible Full Packaging INCI List.
   - *Scenario 2 (Unauthenticated Guest):* **Given** a guest navigates to `/ingredient-analyzer`, **When** the page loads, **Then** a Blurred Preview Gate overlays the analysis panel with a prompt inviting sign-in (and once signed in without a completed Skin ID, `SkinIdQuickModal` opens for 30-second setup).

3. **`FR-CONF-01`: Smart Conflict Detection in Shopping Cart**
   - *User Story:* As a customer adding multiple active treatments to my cart, I want the platform to scan pairwise ingredient interactions so that I am warned of chemical clashes prior to checkout.
   - *Scenario 1 (Active Conflict Detected):* **Given** the cart contains a product with `Benzoyl Peroxide` and a product with `Retinol`, **When** the user opens `/cart`, **Then** `POST /api/v1/tools/check-conflict` detects the `Contraindication` rule from `conflict_rules`, displays a prominent amber warning panel explaining the oxidative degradation risk and recommending AM/PM separation, and provides a non-blocking acknowledgement checkbox (`conflict_acknowledged`) permitting checkout progression (`INV-03`).

---

## 5.3 Use Case Modelling

### 5.3.1 System Actors

BeautyAI defines three primary actors:
- **Guest (Unauthenticated Visitor):** Browses the catalog, inspects product details and 3-tier INCI breakdowns, filters reviews by skin type, previews the blurred INCI Analyzer, and manages a local guest cart.
- **Customer (Authenticated Member):** Inherits all Guest capabilities; configures Digital Skin ID and Allergy Blacklist, enables *"Safe For My Skin"*, unlocks the full INCI Analyzer and Skin Type Guide, generates and saves AM/PM routines, uses 1-Click *"Chat-to-Cart"*, consults Lumi AI, places COD orders, and views order history.
- **Administrator (`Admin` Role):** Authenticated operator authorised via `[Authorize(Roles = "Admin")]`; inspects real-time PostgreSQL analytics KPIs, executes full Product CRUD (Create, Search/Filter, Update with automatic INCI re-sync, Soft Delete to `Discontinued`, and 1-Click Restore), and updates COD order statuses (`Pending` → `Delivering` → `Completed` / `Cancelled`).

```text
[Mermaid Diagram #8 — Paste into https://mermaid.live to export high-res PNG]
flowchart LR
    G((Guest))
    C((Customer))
    A((Admin))

    G --> UC1["UC-01: Browse Catalog & Reviews"]
    G --> UC4["UC-04: View PDP & 3-Tier INCI"]
    G --> UC5["UC-05: Preview INCI Analyzer"]

    C --> UC1
    C --> UC4
    C --> UC2["UC-02: Manage Digital Skin ID & Blacklist"]
    C --> UC3["UC-03: Generate AM/PM Routine & Chat-to-Cart"]
    C --> UC5A["UC-05a: Full 7-Area INCI Analysis"]
    C --> UC6["UC-06: Consult Lumi AI Advisor"]
    C --> UC7["UC-07: Cart Smart Conflict Check"]
    C --> UC8["UC-08: Place COD Order & Track History"]

    A --> UC9["UC-09: Admin Product CRUD & Soft Delete"]
    A --> UC10["UC-10: Manage COD Order Statuses"]
    A --> UC11["UC-11: View Real-Time KPI & Analytics"]
```
*Figure 5.1: Comprehensive System Use Case Diagram.*

### 5.3.2 Detailed Use Case Specification

**Table 5.2: Use Case Specification for Smart Conflict Detection (UC-07)**

| Attribute | Specification Details |
|---|---|
| **Use Case ID & Name** | `UC-07`: Smart Conflict Detection in Shopping Cart & Checkout |
| **Primary Actor** | Customer / Guest |
| **Trigger** | Actor opens `/cart` or modifies items in an active shopping bag. |
| **Pre-conditions** | The shopping cart contains at least two distinct products (item count ≥ 2). |
| **Post-conditions** | Active conflict alerts (if any) are rendered with scheduling guidance; checkout remains accessible once acknowledged. |
| **Main Success Scenario** | 1. Actor opens `/cart` with ≥ 2 products.<br/>2. Frontend invokes `POST /api/v1/tools/check-conflict` with `product_ids`.<br/>3. `ToolsService` retrieves ingredient lists for all cart items and runs pairwise matching against `conflict_rules`.<br/>4. No clinical conflicts are found.<br/>5. Cart confirms no active ingredient clashes are detected and enables immediate checkout. |
| **Alternative Flow (Conflict Detected)** | 3a. One or more pairwise conflicts match `conflict_rules`:<br/>3a1. Backend returns `has_conflict = true` with severity (`Warning` / `Contraindication`), mechanism reason, and scheduling recommendation.<br/>3a2. Cart renders a prominent amber warning banner identifying both products and actives.<br/>3a3. Actor reviews the alternating schedule and ticks *"I acknowledge the active ingredient advisory"*.<br/>3a4. Checkout proceeds normally with `conflict_acknowledged = true` persisted on the order (`INV-03`). |
| **Non-Functional Target** | Pairwise conflict evaluation executes in under `25 ms` for carts up to 20 items. |

---

## 5.4 Entity Relationship Diagram (ERD)

The relational database schema in `docs/db-schema/schema_phase_1.sql` is normalised to Third Normal Form (3NF) on **PostgreSQL 17**, organised into **10 functional groups comprising 13 physical tables** (10 core entities plus 3 relational child/junction tables: `user_allergies`, `product_ingredients`, and `order_items`).

```text
[Mermaid Diagram #9 — Paste into https://mermaid.live to export high-res PNG]
erDiagram
    USERS ||--o| SKIN_PROFILES : "has 0..1"
    USERS ||--o{ USER_ALLERGIES : "declares"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ REVIEWS : "authors"
    USERS ||--o{ SAVED_ROUTINES : "saves"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    CATEGORIES ||--o{ PRODUCTS : "classifies"
    CATEGORIES ||--o{ CATEGORIES : "parent_id"
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : "contains"
    INGREDIENTS ||--o{ PRODUCT_INGREDIENTS : "appears in"
    PRODUCTS ||--o{ REVIEWS : "receives (1.09M)"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    ORDERS ||--|{ ORDER_ITEMS : "comprises"
    CONFLICT_RULES {
        int id PK
        varchar active_ingredient_a
        varchar active_ingredient_b
        varchar severity
        text reason
        text recommendation
    }
```
*Figure 5.2: Relational Database Entity Relationship Diagram (PostgreSQL 17 — `schema_phase_1.sql`).*

### Physical Table Definitions and Referential Constraints

1. **`users`:** Stores authentication identity (`email UNIQUE`, `password_hash` via PBKDF2 600k rounds, `full_name`, `phone`, `role` constrained to `'Customer' | 'Admin'`, `is_active`). Indexed on `email`.
2. **`skin_profiles`:** One-to-one extension of `users` (`user_id UNIQUE`, `ON DELETE CASCADE`) storing `skin_type` (`'Oily' | 'Dry' | 'Combination' | 'Normal' | 'Sensitive'`), `skin_concerns` (`VARCHAR(50)[]`), `primary_goal`, and `budget_level` (`'Low' | 'Medium' | 'High'`).
3. **`user_allergies`:** Child table linked to `users` (`ON DELETE CASCADE`) recording personal blacklisted `ingredient_name` entries and optional reaction `note`.
4. **`ingredients`:** Standardised INCI dictionary (`inci_name UNIQUE`, `function_group`, `description`, `is_active_ingredient`, `comedogenic_rating` 0–5, `irritation_rating` 0–5).
5. **`categories` & `brands`:** Product taxonomy with self-referencing `parent_id` (`ON DELETE SET NULL`) and brand metadata (`name`, `slug UNIQUE`, `origin_country`).
6. **`products`:** Core catalog storing 8,494 SKUs with integer `id` PK and unique Sephora natural `code` (e.g., `P473671`, **ADR-012**), `slug UNIQUE`, `brand_id`, `category_id`, `price_usd NUMERIC(10,2)`, `volume_ml`, `image_url`, `ingredient_list_raw`, `target_skin_types VARCHAR(50)[]`, `stock_quantity`, and `selling_status` (`'Active' | 'Draft' | 'Discontinued'`, **ADR-014**).
7. **`product_ingredients`:** Composite PK (`product_id`, `ingredient_id`) junction table preserving exact packaging `position_order` (`ON DELETE CASCADE`).
8. **`conflict_rules`:** Stores the 12 curated dermatological interaction pairs (`active_ingredient_a`, `active_ingredient_b`, `severity`, `reason`, `recommendation`).
9. **`reviews`:** Big-data table storing 1,094,197 reviews (`BIGSERIAL` PK, `product_id`, `product_code`, `rating` 1–5, `skin_type`, `content`). Accelerated by composite B-Tree indexes `idx_reviews_product_skin(product_id, skin_type)` and `idx_reviews_product_rating(product_id, rating)`.
10. **`orders` & `order_items`:** Transactional COD order header (`recipient_name`, `phone_number`, `shipping_address`, `payment_method`, `payment_status`, `order_status`, `total_amount_usd`, `conflict_acknowledged`) and immutable price-snapshot line items (`unit_price_usd`, `total_price_usd`, `ON DELETE RESTRICT` on `product_id` to protect historical orders, **ADR-010**).
11. **`saved_routines`:** Persists user-saved AM/PM regimens (`routine_name`, `routine_type` `'Morning' | 'Night' | 'Treatment'`, `items JSONB`, `notes`).

---

## 5.5 Sitemap and User Navigation Flow

To eliminate navigational clutter and focus user attention on the five core dermatological USPs, BeautyAI consolidates its frontend (`src/frontend/src/App.jsx`) into a streamlined **12-route SPA architecture**:

```text
[Mermaid Diagram #10 — Paste into https://mermaid.live to export high-res PNG]
flowchart TD
    HOME["/ (Home Landing Page)"]
    HOME --> PROD["/products (Catalog & Safe For Me)"]
    PROD --> PDP["/products/:id (PDP, 3-Tier INCI & 1.09M Reviews)"]
    HOME --> ROUT["/routines (AM/PM Routine Generator & Chat-to-Cart)"]
    HOME --> INCI["/ingredient-analyzer (7-Area INCI Analyzer & Blurred Gate)"]
    HOME --> AI["/expert-consult (Lumi AI Skincare Advisor)"]
    HOME --> WISH["/wishlist (Saved Products)"]
    HOME --> CART["/cart (Shopping Bag & Smart Conflict Detector)"]
    CART --> CHK["/checkout (Single-Page COD Checkout)"]
    HOME --> PROF["/profile (Digital Skin ID, Blacklist & My Orders)"]
    HOME --> SUP["/support (FAQ, Methodology & Legal Disclosures)"]
    HOME --> ADM["/admin (Role-Guarded Admin Console: CRUD, Orders, Analytics)"]
```
*Figure 5.3: Streamlined Sitemap and Core Application Navigation Flow.*

### Representative End-to-End User Journeys

1. **Zero-Allergen Safe Discovery:** Home → Catalog (`/products`) → Toggle *"Safe For My Skin"* → Open PDP (`/products/:id`) → Inspect 3-Tier INCI, text `Suitability Verdict`, and skin-type-filtered reviews → Add to Bag.
2. **Conflict-Free Routine to Checkout:** Home → Routine Builder (`/routines`) → Generate AM/PM regimen from Digital Skin ID (mandatory morning SPF enforced, zero allergens) → Click *"Add Full Routine to Cart"* (Chat-to-Cart) → Verify 0 conflicts in `/cart` → Complete COD Checkout (`/checkout`).
3. **External Formula Audit:** Home → INCI Analyzer (`/ingredient-analyzer`) → Authenticate via Blurred Preview Gate (or complete 30-second `SkinIdQuickModal`) → Paste raw packaging INCI + select Target Care Area → Review personalised 3-tier breakdown and allergy alerts.
4. **Grounded AI Consultation:** Home → Lumi AI Advisor (`/expert-consult`) → Submit skincare inquiry → Receive catalog-grounded recommendations with interactive *"Add to Cart"* cards and medical safety disclaimers.
5. **Administrative Governance:** Authenticate as Admin → Open `/admin` → Review real-time PostgreSQL KPIs and charts → Create/Update product with automatic INCI re-sync, or Soft Delete (`Discontinued`) and 1-Click Restore without losing historical reviews or orders.


\newpage


# CHAPTER 6: DESIGN AND IMPLEMENTATION OF THE PRODUCT

## 6.1 Technical Design and Algorithmic Invariants

The software engineering design of BeautyAI translates the dermatological principles established in Chapter 2 and the Clean Architecture boundaries defined in Chapter 4 into deterministic, high-throughput runtime implementations.

### 6.1.1 The Deterministic Suitability Verdict Cascade

In strict compliance with **INV-01** (the absolute prohibition of universal numerical "Safety Scores" or percentage compatibility gauges), BeautyAI evaluates ingredient compatibility via a deterministic, rule-based cascade implemented in `SuitabilityScoreCalculator.cs` and `CosmeticKnowledgeBase.cs`.

```text
[Mermaid Diagram #11 — Paste into https://mermaid.live to export high-res PNG]
flowchart TD
    IN["Input: Product Entity + Digital Skin ID + Allergy Blacklist"] --> S1{"Step 1: Department == 'Tools & Brushes'<br/>or TargetArea == 'non-cosmetic'?"}
    S1 -- Yes --> R1["Verdict: AccessoryTool<br/>('Accessory / Tool')"]
    S1 -- No --> S2{"Step 2: Missing / Empty<br/>Manufacturer INCI List?"}
    S2 -- Yes --> R2["Verdict: InsufficientData<br/>('Insufficient INCI Data')"]
    S2 -- No --> S3{"Step 3: Any Structured or Raw INCI<br/>Matches Expanded Allergy Blacklist?"}
    S3 -- Yes --> R3["Verdict: AllergyConflict<br/>('Not Suitable — Allergy Alert')"]
    S3 -- No --> S4{"Step 4: Target Care Area (7 Areas) &<br/>3-Tier Fragrance / Fatty Alcohol Nuance?"}
    S4 -- Caution Triggered --> R4["Verdict: MatchWithNotes<br/>('Match with Notes')"]
    S4 -- Clear --> R5["Verdict: GoodMatch<br/>('Good Match')"]
```
*Figure 6.1: Deterministic Suitability Verdict Cascade (`SuitabilityScoreCalculator.cs`, INV-01).*

The cascade executes across five ordered gates:
1. **Non-Cosmetic Tool Short-Circuit:** Physical tools (`Tools & Brushes`) bypass chemical parsing and return `AccessoryTool` (`"Accessory / Tool"`), remaining visible under *"Safe For My Skin"*.
2. **INCI Completeness Gate:** Cosmetic items lacking manufacturer INCI disclosures (`ingredient_list_raw` empty or `"No ingredients listed"`) return `InsufficientData` (`"Insufficient INCI Data"`) and are automatically excluded when *"Safe For My Skin"* is enabled.
3. **Zero-Tolerance Allergy Exclusion:** Both structured `product_ingredients` and tokenised `ingredient_list_raw` strings are cross-checked against the user's synonym-expanded Allergy Blacklist (`CosmeticKnowledgeBase.MatchAllergenInToken`). Any match immediately terminates with `AllergyConflict` (`"Not Suitable — Allergy Alert"`).
4. **Target Care Area & 3-Tier Fragrance/Fatty-Alcohol Nuance:** Across 7 resolved care areas (`Face`, `Eye Area`, `Lips`, `Hair & Scalp`, `Bath & Body`, `Fragrance`, `Nails & Cuticles`), the engine distinguishes soothing botanical extracts (`Rosa Damascena Flower Water`, `Vanilla`, `Chamomile`) and moisturising fatty alcohols (`Cetearyl Alcohol`, `Cetyl Alcohol`, `Stearyl Alcohol`) from drying denatured alcohols and the 26 EU fragrance allergens—returning `MatchWithNotes` with specific clinical guidance only when biologically warranted.
5. **Optimal Compatibility Baseline:** Products clearing all checks aligned with the user's skin profile return `GoodMatch`.

### 6.1.2 Smart Conflict Detector & Atomic COD Checkout Workflow

Unguided layering of potent clinical actives is mitigated through `ToolsService.CheckCartConflictsAsync`, seamlessly integrated with atomic Cash on Delivery (COD) checkout (`OrdersController` / `OrderService`). For a shopping bag containing $N$ products ($N \ge 2$), the engine evaluates all $\frac{N(N-1)}{2}$ unique product pairs against the 12 curated dermatological rules persisted in `conflict_rules`:
- **Evidence-Proportional Classification:** Matches are classified by severity (`Warning` or `Contraindication`) with scientific rationale and actionable alternating schedules.
- **Non-Blocking Advisory Model (`INV-03`):** Detected conflicts render a prominent amber warning panel in `/cart` requiring explicit acknowledgement (`conflict_acknowledged`) without blocking customer checkout autonomy.
- **Immutable Order Snapshot (`ADR-010`):** Upon order confirmation, `OrderService` atomically verifies stock, deducts quantities, and persists unit price snapshots into `order_items` so subsequent Admin price edits never alter historical orders.

```text
[Mermaid Diagram #12 — Paste into https://mermaid.live to export high-res PNG]
sequenceDiagram
    actor User as Customer
    participant Cart as React Cart & Checkout UI
    participant Tools as ToolsController / ToolsService
    participant Orders as OrdersController / OrderService
    participant DB as PostgreSQL 17

    User->>Cart: Open /cart (N >= 2 products)
    Cart->>Tools: POST /api/v1/tools/check-conflict { product_ids }
    Tools->>DB: Fetch product_ingredients & 12 conflict_rules
    DB-->>Tools: Structured actives & clinical rules
    Tools->>Tools: Pairwise N(N-1)/2 cross-match
    Tools-->>Cart: { has_conflict: true, conflicts: [...] }
    Cart-->>User: Display Amber Conflict Banner & Alternating Schedule
    User->>Cart: Tick "I acknowledge the advisory" (INV-03) & Submit COD
    Cart->>Orders: POST /api/v1/orders { items, conflict_acknowledged: true }
    Orders->>DB: Verify SellingStatus == 'Active' & Stock >= Qty
    Orders->>DB: Atomic Transaction: Deduct Stock + Insert orders & order_items snapshot (ADR-010)
    DB-->>Orders: Order Created (BA-YYYYMMDD-XXXX)
    Orders-->>Cart: HTTP 201 Created (OrderDto)
    Cart-->>User: Render Thank You Summary & Clear Bag
```
*Figure 6.2: End-to-End Sequence Diagram for Smart Conflict Detection and Atomic COD Checkout.*

### 6.1.3 Deferred Conversational AI Adapter Seam (Phase 2 Readiness)

Although a conversational LLM chatbot (`M12`) was formally deferred to Phase 2 to respect the four-week schedule and avoid deploying unverified medical dialogue, the Clean Architecture adapter seam (`IAiSkincareProvider` in `BeautyAI.Application` and isolated `BeautyAI.Infrastructure.Providers`) was preserved and guarded by `ProviderLibrariesOnlyInAdapterLayerTests`, enabling clean Phase 2 activation without modifying core domain or controller logic.

### 6.1.4 Administrative Security and Soft-Delete Lifecycle (ADR-014)

Administrative operations are consolidated inside `AdminController` and `AdminProductService`:
- **Role-Based Access Control:** `[Authorize(Roles = "Admin")]` decorates the entire `AdminController`, verified at compile/test time by `AdminAuthorizationTests`.
- **Environment-Driven Bootstrapping (`AdminBootstrapper`):** On application startup, `AdminBootstrapper` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` (minimum 8 characters) from environment variables, hashes the password via PBKDF2 HMAC-SHA256 (600,000 iterations + cryptographic salt), and upgrades legacy hashes automatically (`INV-08`).
- **Soft Delete & 1-Click Restore:** Direct SQL `DELETE` statements on `products` are prohibited to protect `order_items` (`ON DELETE RESTRICT`) and `reviews` integrity. `DELETE /api/v1/admin/products/{id}` transitions `selling_status` to `"Discontinued"`, immediately hiding the SKU from public catalog/PDP/similar queries and blocking new orders, while `PATCH /api/v1/admin/products/{id}/restore` restores it to `"Active"` with zero data loss.

---

## 6.2 UI/UX Implementation and Local High-Resolution Imagery Architecture

### 6.2.1 Design System Preservation (ADR-007)

The React 19 + TypeScript + Vite frontend inherits the validated warm editorial cosmetic design system from the UI/UX prototype, pairing clean serif display headings with legible sans-serif body typography, a warm ivory background (`#FAF8F5`), pure white surface cards, and clinical amber/red alert tokens. The entire Phase 1 interface operates consistently in English with USD (`$`) pricing (`INV-09`, `INV-10`).

### 6.2.2 Data Ingestion & Local High-Resolution WebP Imagery ETL Pipeline

Early data exploration of the Kaggle Sephora dataset revealed that source CSVs lacked image URLs and SKU identifiers; naive heuristic scraping caused severe product-image mismatches and broken third-party CDN links, while storing binary/Base64 images inside PostgreSQL was rejected as a performance anti-pattern. BeautyAI resolves this through an automated offline ETL & **BeautyAI Harvester Protocol**:
1. **Relational Catalog & Big-Data Review ETL:** Python ingestion scripts normalise `products_cleaned.csv` (`8,494` SKUs), parse comma-delimited INCI strings into `ingredients` and `product_ingredients`, seed `12` clinical `conflict_rules`, and bulk-stream `1,094,197` reviews from `reviews_cleaned.csv` into PostgreSQL 17 with composite B-Tree indexing (`idx_reviews_product_skin`).
2. **SKU-Grounded Image Harvesting:** Grounding exact Sephora SKU IDs (`skuId`) and fetching zoom-resolution studio assets (`https://www.sephora.com/productimages/sku/{sku}-main-zoom.jpg`, with brand CDN fallback for EU exclusives).
3. **Pillow WebP Normalisation & Static URI Serving:** Converting assets to `800×800px` RGB WebP (quality 85, ~15–40 KB per asset) stored locally at `src/frontend/public/images/products/{code}.webp` (**378+ verified high-resolution product images**), while PostgreSQL stores exclusively the lightweight relative URI (`/images/products/{code}.webp`).

```text
[Mermaid Diagram #13 — Paste into https://mermaid.live to export high-res PNG]
flowchart LR
    subgraph Sources["Raw Offline Sources"]
        CSV1["products_cleaned.csv<br/>(8,494 Sephora SKUs)"]
        CSV2["reviews_cleaned.csv<br/>(1,094,197 Reviews)"]
        CDN["Sephora / Brand CDN<br/>(Verified skuId Grounding)"]
    end

    subgraph ETL["Offline Python ETL & Harvester Pipeline"]
        PARSE["INCI Parser &<br/>Skin-Type Normaliser"]
        PILLOW["Pillow Standardiser<br/>RGB · 800×800px · WebP q85"]
    end

    subgraph Storage["Production Runtime Storage"]
        PG["PostgreSQL 17 (Docker)<br/>13 Tables + B-Tree Index<br/>(Stores relative URI only)"]
        STATIC["Vite Static Assets<br/>/images/products/{code}.webp<br/>(378+ Verified Assets)"]
    end

    CSV1 --> PARSE --> PG
    CSV2 --> PARSE
    CDN --> PILLOW --> STATIC
    STATIC -. "URI synced via sync_image_data.py" .-> PG
```
*Figure 6.3: Offline Data Ingestion and Local High-Resolution WebP Imagery ETL Pipeline.*

---

## 6.3 Implementation Sprints (Playbook Execution)

Development progressed across four weekly sprints inside isolated Git worktrees, each closed with an atomic State Snapshot:
- **Sprint 1 (Days 1–7):** Provisioned PostgreSQL 17 Docker container and `schema_phase_1.sql`; ingested 8,494 Sephora products, 12 conflict rules, and 1.09M reviews; built PBKDF2 + JWT authentication and unified Digital Skin ID endpoints.
- **Sprint 2 (Days 8–15):** Integrated the React 19 SPA; built the catalog query engine, *"Safe For My Skin"* filter, 3-Tier INCI PDP, text `Suitability Verdict`, standalone 7-area INCI Analyzer (`Blurred Preview Gate` + `SkinIdQuickModal`), and Wishlist.
- **Sprint 3 (Days 16–22):** Delivered persistent Cart & `CartDrawer`, pairwise Smart Conflict Detector, COD Checkout (`BA-YYYYMMDD-XXXX`), order history, and sub-20ms skin-type review filtering over 1.09M rows via composite B-Tree indexes.
- **Sprint 4 (Days 23–28):** Delivered the AM/PM Routine Generator with 1-Click *"Routine-to-Cart"* and `saved_routines` persistence, plus the 3-tab Admin Console (`Product Catalog CRUD`, `COD Orders`, `Analytics & Charts` over 100% live PostgreSQL data), formally scoping the conversational AI chatbot (`M12`) to Phase 2 while preserving the `IAiSkincareProvider` seam; culminated in 12/12 Architecture Tests and 46/46 Unit Tests passing.

---

## 6.4 Continuous Documentation & Refactoring Case Study: `CHANGE-ANALYZER-CATEGORY`

A defining strength of the AI-Agent Document-Driven SDLC was demonstrated during Sprint 2 through **`CHANGE-ANALYZER-CATEGORY`**:
1. **Defect & Invariant Breach Discovery:** Auditing the Sephora dataset revealed **890 cosmetic products lacking manufacturer INCI disclosures**, alongside non-cosmetic tools (`Tools & Brushes`) being misclassified by chemical analyzers. Concurrently, reflection auditing discovered that an earlier experimental DTO could potentially smuggle a forbidden JSON alias (`[JsonPropertyName("safety_score")]`) past a naive C# property-name check.
2. **Specification-First Resolution:** Before editing production code, a formal change folder (`docs/_changes/CHANGE-ANALYZER-CATEGORY/`) was opened to update requirements and design contracts: introducing the 3-group classification (`AccessoryTool`, `InsufficientData`, and 7-area chemical analysis) and expanding `INV-01` to inspect JSON serialisation attributes.
3. **Architecture Test Hardening & Worktree Verification:** `NoSafetyScoreAnywhereTests.cs` was hardened to reflectively inspect `[JsonPropertyNameAttribute]` across every property in every compiled assembly (Listing 6.1). Only after tests failed red and passed green inside an isolated worktree was the change merged alongside `state_2026-10-30_analyzer-category-redesign.md`.

---

## 6.5 Major Product Screenshots

> *[Note for Final Word Assembly: Capture the 6 high-resolution screenshots below from the live Docker/Vite instance at `http://localhost:5173` and insert them at the corresponding figure placeholders.]*

- **`[Figure 6.4: Product Catalog Page (/products) with Active "Safe For My Skin" Zero-Allergen Filter Toggle, USD ($) Pricing, and Text Suitability Verdict Badges]`**
- **`[Figure 6.5: Product Detail Page (/products/:id) Displaying 800×800 WebP Imagery, 3-Tier INCI Progressive Disclosure, Red Allergy Alert Banner, and 1.09M Reviews Filtered by Skin Type]`**
- **`[Figure 6.6: 30-Second Digital Skin ID Quick Configuration Modal (SkinIdQuickModal) Following Dermatology Order: Skin Type → Allergy Blacklist → Concerns & Budget]`**
- **`[Figure 6.7: Standalone INCI Analyzer (/ingredient-analyzer) Displaying 7 Target Care Areas, Blurred Preview Gate for Guests, and 3-Tier Formula Breakdown]`**
- **`[Figure 6.8: Shopping Cart (/cart) Displaying Non-Blocking Smart Conflict Detector Amber Warning Card with Alternating AM/PM Scheduling Advice and Acknowledgement Checkbox]`**
- **`[Figure 6.9: Admin Console (/admin) Showing Real-Time PostgreSQL KPIs, Product Catalog CRUD Table, ProductFormModal, and Soft-Delete (Discontinued) / 1-Click Restore Controls]`**

---

## 6.6 Key Code Implementations and Complete API Catalog

### 6.6.1 Core Source Code Listings (Extracted Directly from Production Codebase)

**Listing 6.1: Machine-Enforcing Invariant INV-01 Across Types, Properties, and JSON Attributes (`tests/BeautyAI.ArchitectureTests/NoSafetyScoreAnywhereTests.cs`)**

```csharp
private static readonly string[] ForbiddenTerms = new[]
{
    "SafetyScore", "safety_score", "SafetyRating", "safety_rating",
    "HazardScore", "hazard_score", "DangerLevel", "ToxicityScore", "SafetyLevel"
};

[Fact]
public void Assemblies_MustNotContainForbiddenSafetyScoreTerms()
{
    var assemblies = ArchitectureTestHelper.GetAllSolutionAssemblies();
    var violations = new List<string>();

    foreach (var assembly in assemblies)
    {
        foreach (var type in assembly.GetTypes())
        {
            var properties = type.GetProperties(
                BindingFlags.Public | BindingFlags.NonPublic |
                BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly);

            foreach (var prop in properties)
            {
                var jsonAttr = prop.GetCustomAttribute<JsonPropertyNameAttribute>();
                foreach (var term in ForbiddenTerms)
                {
                    if (prop.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                        violations.Add($"Property: {type.FullName}.{prop.Name} violates INV-01.");

                    if (jsonAttr != null && jsonAttr.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                        violations.Add($"JsonPropertyName '{jsonAttr.Name}' on {type.FullName}.{prop.Name} violates INV-01.");
                }
            }
        }
    }

    Assert.True(violations.Count == 0, string.Join(Environment.NewLine, violations));
}
```

**Listing 6.2: Deterministic Suitability Verdict Cascade (`src/BeautyAI.Domain/Services/SuitabilityScoreCalculator.cs`)**

```csharp
public static SuitabilityVerdictResult Calculate(
    Product product, SkinProfile? skinProfile, IEnumerable<string>? allergyBlacklist)
{
    var department = product.Department ?? "Skincare";
    var targetArea = CosmeticKnowledgeBase.ResolveTargetArea(department, product.Category?.Name ?? "");

    // 1. Group A: Non-cosmetic Tools & Accessories
    if (string.Equals(department, "Tools & Brushes", StringComparison.OrdinalIgnoreCase) || targetArea == "non-cosmetic")
        return new SuitabilityVerdictResult("AccessoryTool", "Accessory / Tool", false,
            MatchReason: "Physical beauty tool or accessory — contains no chemical cosmetic ingredients.",
            HasIngredients: false, IsNonCosmeticTool: true);

    // 2. Group B: Cosmetic product missing manufacturer INCI list
    var rawInci = (product.IngredientListRaw ?? "").Trim();
    var hasStructured = product.ProductIngredients?.Count > 0;
    var hasRaw = !string.IsNullOrWhiteSpace(rawInci) && rawInci.Length >= 3 &&
                 !string.Equals(rawInci, "No ingredients listed", StringComparison.OrdinalIgnoreCase);
    if (!hasRaw && !hasStructured)
        return new SuitabilityVerdictResult("InsufficientData", "Insufficient INCI Data", false,
            MatchReason: "Manufacturer has not provided a detailed INCI list for this product.",
            HasIngredients: false, IsNonCosmeticTool: false);

    // 3. Zero-Allergy Check against synonym-expanded personal Allergy Blacklist
    if (allergyBlacklist != null && product.ProductIngredients != null)
    {
        foreach (var pi in product.ProductIngredients)
        {
            var match = CosmeticKnowledgeBase.MatchAllergenInToken(pi.Ingredient?.InciName ?? "", allergyBlacklist);
            if (match != null)
                return new SuitabilityVerdictResult("AllergyConflict", "Not Suitable — Allergy Alert", true,
                    MatchedAllergen: match,
                    MatchReason: $"Contains {match}, which matches your personal Allergy Blacklist.");
        }
    }
    // ... evaluates 7 target care areas, fragrance/fatty-alcohol nuance -> MatchWithNotes or GoodMatch
}
```

**Listing 6.3: Zero-Allergen "Safe For My Skin" Catalog Query (`src/BeautyAI.Infrastructure/Persistence/Repositories/ProductRepository.cs`)**

```csharp
var query = _context.Products
    .Include(p => p.Brand)
    .Include(p => p.Category).ThenInclude(c => c!.Parent)
    .Where(p => p.SellingStatus == "Active")
    .AsNoTracking();

if (filter.SafeForMe || allergyBlacklist != null)
{
    // Exclude Group B cosmetics lacking INCI data while retaining Group A Tools & Brushes
    query = query.Where(p =>
        p.Department == "Tools & Brushes" ||
        (!string.IsNullOrEmpty(p.IngredientListRaw) && p.IngredientListRaw != "No ingredients listed"));

    var allergens = CosmeticKnowledgeBase.ExpandAllergyBlacklist(allergyBlacklist)
        .Select(a => a.ToLower()).Distinct().ToList();

    if (allergens.Count > 0)
    {
        query = query.Where(p => !p.ProductIngredients.Any(pi =>
            pi.Ingredient != null && allergens.Contains(pi.Ingredient.InciName.ToLower())));

        foreach (var allergen in allergens)
            query = query.Where(p => !p.IngredientListRaw.ToLower().Contains(allergen));
    }
}
```

**Listing 6.4: Pairwise Active-Ingredient Conflict Detection (`src/BeautyAI.Application/Services/ToolsService.cs`)**

```csharp
public async Task<ConflictCheckResponse> CheckCartConflictsAsync(
    ConflictCheckRequest request, CancellationToken cancellationToken = default)
{
    if (request.ProductIds == null || request.ProductIds.Count < 2)
        return new ConflictCheckResponse(false, Array.Empty<ConflictDetailDto>());

    var products = await _toolRepository.GetProductsForConflictCheckAsync(request.ProductIds, cancellationToken);
    var conflictRules = await _toolRepository.GetAllConflictRulesAsync(cancellationToken);
    var detected = new List<ConflictDetailDto>();

    for (int i = 0; i < products.Count; i++)
    {
        for (int j = i + 1; j < products.Count; j++)
        {
            // Cross-match product i and product j actives against curated conflict_rules
            var p1 = products[i];
            var p2 = products[j];
            // Emits non-blocking ConflictDetailDto (Severity, Reason, Alternating Recommendation)
        }
    }
    return new ConflictCheckResponse(detected.Count > 0, detected);
}
```

**Listing 6.5: Administrative Soft Delete & 1-Click Restore (`src/BeautyAI.Application/Services/AdminProductService.cs`)**

```csharp
public async Task<bool> DiscontinueProductAsync(int id, CancellationToken cancellationToken = default)
{
    var existing = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken);
    if (existing == null) return false;

    existing.SellingStatus = "Discontinued"; // Preserves historical reviews & order_items (ADR-014)
    existing.UpdatedAtUtc = DateTime.UtcNow;
    await _productRepository.UpdateProductAsync(existing, cancellationToken);
    return true;
}

public async Task<AdminProductDto> RestoreProductAsync(int id, CancellationToken cancellationToken = default)
{
    var existing = await _productRepository.GetAdminProductByIdAsync(id, cancellationToken)
        ?? throw new KeyNotFoundException($"Product with ID {id} not found.");

    existing.SellingStatus = "Active";
    existing.UpdatedAtUtc = DateTime.UtcNow;
    var updated = await _productRepository.UpdateProductAsync(existing, cancellationToken);
    var (rating, count) = await _productRepository.GetProductReviewStatsAsync(updated.Id, cancellationToken);
    return MapToDto(updated, rating, count);
}
```

### 6.6.2 Complete Implemented REST API Endpoint Catalog

**Table 6.1: Complete Catalog of 28 Active Phase 1 REST API Endpoints Across 8 Core Controllers**

| Controller | Method | Endpoint URI | Authorisation | Business Purpose |
|---|---|---|---|---|
| `AuthController` | `POST` | `/api/v1/auth/register` | Anonymous | Register customer account (PBKDF2 600k rounds) & issue JWT. |
| | `POST` | `/api/v1/auth/login` | Anonymous | Authenticate credentials & issue JWT token. |
| | `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile & unified Digital Skin ID. |
| | `PUT` | `/api/v1/auth/profile` | Authenticated | Update full name, phone number, and default shipping address. |
| `SkinProfileController` | `GET` | `/api/v1/skin-profile` | Authenticated | Retrieve unified Digital Skin ID & personal Allergy Blacklist. |
| | `PUT` | `/api/v1/skin-profile` | Authenticated | Atomically update skin type, allergies, concerns, goal & budget. |
| | `POST` | `/api/v1/skin-profile/allergies` | Authenticated | Add an allergen to personal Allergy Blacklist with symptom note. |
| | `DELETE` | `/api/v1/skin-profile/allergies/{id}` | Authenticated | Remove an allergen from personal Allergy Blacklist. |
| `ProductsController` | `GET` | `/api/v1/products` | Anonymous / Auth | Paginated catalog search, filters & *"Safe For My Skin"* toggle. |
| | `GET` | `/api/v1/products/{id}` | Anonymous / Auth | Product detail (by ID/Slug/Code), 3-Tier INCI & `SuitabilityVerdict`. |
| | `GET` | `/api/v1/products/{id}/similar` | Anonymous / Auth | Similar category recommendations (excluding user allergens). |
| | `GET` | `/api/v1/products/categories` | Anonymous | Retrieve product category taxonomy list. |
| | `GET` | `/api/v1/products/brands` | Anonymous | Retrieve verified cosmetic brand list. |
| | `GET` | `/api/v1/products/{id}/reviews` | Anonymous | Sub-15ms paginated review query filtered by `skin_type`. |
| | `POST` | `/api/v1/products/{id}/reviews` | Anonymous / Auth | Submit a new product review with skin-type tag. |
| `ReviewsController` | `POST` | `/api/v1/reviews` | Anonymous / Auth | Compatibility review submission endpoint. |
| `ToolsController` | `POST` | `/api/v1/tools/analyze-inci` | Authenticated | 3-Tier INCI formula analysis across 7 target care areas. |
| | `GET` | `/api/v1/tools/skintype-guide` | Authenticated | Skin-type ingredient guide by target care area. |
| | `POST` | `/api/v1/tools/check-conflict` | Anonymous | Pairwise active-ingredient conflict scan across cart items. |
| `RoutinesController` | `POST` | `/api/v1/routines/generate` | Anonymous / Auth | Generate allergen-free, conflict-free AM/PM routine. |
| | `POST` | `/api/v1/routines/save` | Authenticated | Save generated routine to `saved_routines`. |
| | `GET` | `/api/v1/routines/my-routines` | Authenticated | List user's saved skincare routines. |
| | `DELETE` | `/api/v1/routines/{id}` | Authenticated | Delete a saved routine. |
| `OrdersController` | `POST` | `/api/v1/orders` | Authenticated | Place atomic COD order (`BA-YYYYMMDD-XXXX`) & deduct stock. |
| | `GET` | `/api/v1/orders/my-orders` | Authenticated | Retrieve customer's COD order history. |
| `AdminController` | `GET` | `/api/v1/admin/dashboard` & `/kpis` | `Admin` Role | Real-time KPIs & analytics across 8,494 products & 1.09M reviews. |
| | `GET` / `GET {id}` | `/api/v1/admin/products[/{id}]` | `Admin` Role | Search, filter (`Active`/`Draft`/`Discontinued`) & inspect products. |
| | `POST` / `PUT` / `DELETE` / `PATCH` | `/api/v1/admin/products[/{id}][/restore]` & `/orders[/{id}/status]` | `Admin` Role | Full Product CRUD + INCI sync + Soft Delete + 1-Click Restore + COD Order Status management. |


\newpage


# CHAPTER 7: EVALUATION AND RESULTS

## 7.1 Achievement Against Objectives

The outcomes of the BeautyAI project are evaluated quantitatively against the six SMART objectives established in Section 1.3. Table 7.1 demonstrates completion across all planned Phase 1 deliverables: **13 functional modules** (`M01`–`M07`, `M09`–`M11`, `M13`–`M15`) are fully operational, while Module `M08` (Product Comparison) and Module `M12` (Conversational AI Chatbot) were formally deferred to Phase 2 through governed scope management.

**Table 7.1: Final Achievement Matrix Against SMART Project Objectives**

| Objective ID | Planned Objective & Target Success Criteria | Final Empirical Outcome & Verification Evidence | Evaluation Status |
|---|---|---|---|
| **O1** | Formulate an 8-stage AI-Agent SDLC model (Stages `a`–`h`) with human-agent RACI governance and quality gates. | Formalised and operationalised via Syntheprise Framework v6.0.1; documented in Chapter 3; governed all four implementation sprints. | **Achieved (100%)** |
| **O2** | Establish a governed 7-level document precedence hierarchy (BRD, PRD, ADRs, Schema, Playbooks). | 26 synchronised technical specifications authored; 0 specification contradictions; full requirement-to-test traceability. | **Achieved (100%)** |
| **O3** | Engineer the Phase 1 MVP comprising 13 core functional modules, 4 deterministic USPs, 8,494 products, and 1.09M reviews. | 13 modules deployed; 28 active REST API endpoints across 8 core controllers; 3-Tier INCI, Digital Skin ID, Conflict Detector, Routine Builder + Routine-to-Cart, COD Checkout, and Admin CRUD active (`M12` Chatbot formally deferred to Phase 2). | **Achieved (100% of Revised Phase 1 Scope)** |
| **O4** | Automate architectural and domain quality gates, specifically machine-enforcing `INV-01` prohibiting safety scores. | **12/12 Architecture Tests GREEN** (`NetArchTest`); **46/46 Unit Tests GREEN** (`xUnit`); reflective scan verifies 0 `SafetyScore` / `safety_score` occurrences. | **Achieved (100%)** |
| **O5** | Maintain continuous traceability and zero specification drift via Git worktrees and State Snapshots. | 5-job GitHub Actions CI pipeline passing; `./syntheprise gate` Clean (0 errors, 0 warnings); atomic state snapshots recorded per milestone. | **Achieved (100%)** |
| **O6** | Execute empirical performance benchmarking, scope trade-off evaluation, and critical methodology review. | Catalog latency reduced from `33,584 ms` to `80 ms` (~420× speedup); PDP `12 ms`; 1.09M review filter `< 15 ms` (`1.4 ms` B-Tree scan); critical evaluation documented. | **Achieved (100%)** |

---

## 7.2 Automated Testing and Quality Gate Results

Software quality, architectural boundaries, and domain invariants were verified through a dual-tier automated test suite (**58 automated test cases**) built on `xUnit` and `NetArchTest.Rules`, complemented by a five-job CI/CD quality pipeline.

### 7.2.1 Automated Architecture Tests (`BeautyAI.ArchitectureTests` — 12/12 Passing)

- `DomainHasNoDependenciesTests` (2 tests): Confirms `BeautyAI.Domain` maintains zero outward references to outer layers or NuGet packages (`INV-06`).
- `ApplicationDoesNotReferenceEfCoreTests` (2 tests) & `ApplicationDoesNotReferenceAspNetTests` (3 tests): Enforces Clean Architecture isolation of business logic from EF Core and ASP.NET Core HTTP transport.
- `ForbiddenPackagesTests` (1 test): Fails the build if prohibited packages (`AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, `StackExchange.Redis`) enter the solution (**ADR-009**).
- `ProviderLibrariesOnlyInAdapterLayerTests` (2 tests): Confirms external HTTP clients and provider SDKs reside solely inside `BeautyAI.Infrastructure.Providers`.
- `NoSafetyScoreAnywhereTests` (1 comprehensive reflective test): Scans every type, property, field, method, and `[JsonPropertyName]` attribute across all compiled assemblies, enforcing **INV-01**.
- `AdminAuthorizationTests` (1 test): Verifies `AdminController` is explicitly guarded by `[Authorize(Roles = "Admin")]` (**ADR-014**).

### 7.2.2 Unit Test Suite (`BeautyAI.UnitTests` — 46/46 Passing)

**Table 7.2: Complete Breakdown of Automated Architecture and Unit Test Fixtures (Verified Directly from Codebase)**

| Test Project | Test Fixture Class | Executed | Passed | Failed | Primary Verification Scope |
|---|---|---:|---:|---:|---|
| **ArchitectureTests** | `DomainHasNoDependenciesTests` | 2 | 2 | 0 | Zero-dependency Domain isolation (`INV-06`) |
| (`NetArchTest.Rules`) | `ApplicationDoesNotReferenceAspNetTests` | 3 | 3 | 0 | No ASP.NET coupling in Application |
| | `ApplicationDoesNotReferenceEfCoreTests` | 2 | 2 | 0 | No EF Core coupling in Application |
| | `ProviderLibrariesOnlyInAdapterLayerTests` | 2 | 2 | 0 | Provider/HttpClient adapter boundary |
| | `ForbiddenPackagesTests` | 1 | 1 | 0 | Prohibition of AutoMapper/MediatR/Redis (`ADR-009`) |
| | `NoSafetyScoreAnywhereTests` | 1 | 1 | 0 | Reflective `INV-01` & `[JsonPropertyName]` scan |
| | `AdminAuthorizationTests` | 1 | 1 | 0 | `[Authorize(Roles = "Admin")]` on `AdminController` |
| **UnitTests** | `AdminProductServiceTests` | 13 | 13 | 0 | Admin CRUD, INCI re-sync, Soft Delete & Restore (`ADR-014`) |
| (`xUnit`) | `AdminBootstrapperTests` | 7 | 7 | 0 | Env-driven Admin seeding & PBKDF2 upgrade |
| | `SuitabilityScoreCalculatorTests` | 7 | 7 | 0 | Text verdicts, tools, missing INCI & allergy alerts (`INV-01`) |
| | `Pbkdf2PasswordHasherTests` | 6 | 6 | 0 | 600,000-round HMAC-SHA256 hashing & salt verification |
| | `ProductServiceTests` | 6 | 6 | 0 | Catalog filtering, *"Safe For My Skin"* & PDP logic |
| | `AuthServiceTests` | 4 | 4 | 0 | Registration, login, JWT claims & error hygiene |
| | `SkinProfileServiceTests` | 2 | 2 | 0 | Unified Digital Skin ID & Allergy Blacklist persistence |
| | `DomainTests` | 1 | 1 | 0 | Core domain entity invariants |
| **TOTAL** | **15 Test Fixtures (12 Arch + 46 Unit)** | **58** | **58** | **0** | **100% Pass Rate** |

### 7.2.3 Continuous Integration (CI/CD) Quality Gate Results

Every milestone commit passed all five GitHub Actions verification jobs: (1) `backend` (`dotnet build -warnaserror` + 58 green tests), (2) `frontend` (`tsc -b` + Vite production bundle in ~245–280 ms), (3) `openapi-drift` (zero backend-to-frontend contract divergence), (4) `security` (Gitleaks secret scan with 0 exposed credentials), and (5) `syntheprise` (`./syntheprise gate` Clean — 0 errors, 0 warnings, 123 adapter files in sync).

---

## 7.3 Performance Benchmarking and Big Data Optimisation

Operating over **8,494 authentic Sephora products** and **1,094,197 customer reviews** on containerised PostgreSQL 17 exposed severe relational performance bottlenecks during Sprint 2 that required systematic profiling and remediation.

### 7.3.1 Eliminating Entity Framework Core Cartesian Explosion

Initial profiling of the paginated catalog endpoint (`GET /api/v1/products`) measured an unacceptable latency of **33,584 ms** (> 33 seconds). SQL trace inspection revealed **Cartesian Explosion**: combining multiple collection `.Include()` joins (`ProductIngredients` and `Reviews`) in a single SQL query generated massive cross-product intermediate result sets across hundreds of thousands of joined rows.

Remediating this bottleneck via decoupled review-stat aggregation (`GetProductsReviewStatsAsync`), `.AsNoTracking()` on all read-only catalog queries, and targeted query projection reduced catalog latency from **33,584 ms to 80 ms** (a **~420× speedup**), while Product Detail Page (`GET /api/v1/products/{id}`) latency reached **12 ms**.

### 7.3.2 Composite B-Tree Indexing over 1.09 Million Reviews

Filtering reviews by reviewer skin type (`GET /api/v1/products/{id}/reviews?skin_type=Oily`) initially triggered sequential table scans exceeding `1,800 ms`. Provisioning the composite B-Tree index `idx_reviews_product_skin(product_id, skin_type)` eliminated full scans: `EXPLAIN ANALYZE` verified index execution in **1.398 ms**, delivering full HTTP API responses in **under 15 ms** (exceeding the `< 50 ms` NFR target by over 3×).

```text
[Mermaid Diagram #14 — Paste into https://mermaid.live to export high-res PNG]
xychart-beta
    title "Query Latency Benchmark: Before vs. After Optimisation (ms, lower is better)"
    x-axis ["Catalog (Before)", "Reviews Unindexed", "Catalog (After)", "Reviews B-Tree", "PDP Hydration"]
    y-axis "Latency (ms)" 0 --> 35000
    bar [33584, 1850, 80, 15, 12]
```
*Figure 7.1: Query Latency Benchmarks Before and After Cartesian-Explosion Remediation and Composite B-Tree Indexing (Note: Catalog reduced from 33,584 ms to 80 ms; 1.09M Review filter reduced from ~1,850 ms to < 15 ms).*

---

## 7.4 Critical Evaluation and Nuance Discussion

### 7.4.1 The Vitamin C and Niacinamide Dilemma: Runtime Caution vs. "Myth Correction"

A particularly instructive test of scientific integrity emerged around the pairing of **L-Ascorbic Acid (Vitamin C)** and **Niacinamide**. As established in Chapter 2, modern cosmetic chemistry classifies the historical claim that these actives form a toxic complex at room temperature as a laboratory artefact (**"Myth Correction"**). However, an operational physiological nuance remains: L-Ascorbic Acid requires an acidic vehicle (`pH 3.0–3.5`) for optimal absorption, whereas Niacinamide performs best near neutral `pH 5.5–6.5`; layering them immediately can induce transient facial flushing in hyper-sensitive individuals.

BeautyAI balances both perspectives rather than adopting binary alarmism: the Phase 1 `conflict_rules` table classifies the pair strictly at the non-blocking **Warning** level (never `Contraindication`), advising a pragmatic **20-minute separation or AM/PM split** for sensitive profiles while educating users that the pairing is not chemically hazardous. Documenting this distinction between conservative runtime UX guidance and evolving dermatological consensus reflects transparent, evidence-based engineering.

### 7.4.2 Deliberate Scope Management: Deferring the Conversational AI Chatbot to Phase 2

A critical engineering judgement exercised during Sprint 4 was the deliberate decision to **defer the live conversational LLM chatbot (`Module M12`) to Phase 2**, retaining only the Clean Architecture adapter seam (`IAiSkincareProvider`) and policy specifications (`ADR-005`, `docs/llm-policy.md`) in Phase 1. Two evidence-based factors drove this trade-off:
1. **Schedule Realism under Solo-Developer Constraints:** Completing 13 deterministic core modules, 1.09M indexed reviews, 3-Tier INCI classification across 7 care areas, and full Admin CRUD with Soft Delete within 28 days required prioritising verifiable, zero-hallucination functionality over a rushed chatbot interface.
2. **Clinical Safety & Validation Humility:** Deploying an unvalidated generative LLM in a health-adjacent domain carries high regulatory risk under Vietnamese **Decree 181/2013/NĐ-CP** (prohibiting therapeutic claims) and medical ethics (`INV-11`). Rather than shipping an under-tested conversational bot with insufficient clinical red-teaming and domain expertise, deferring M12 to Phase 2—while keeping the system's four deterministic dermatological USPs 100% reliable—demonstrates mature risk-based engineering governance.

---

## 7.5 Critical Evaluation of the AI-Agent Document-Driven SDLC

Operationalising the eight-stage AI-Agent Document-Driven SDLC via Syntheprise Framework v6.0.1 yielded clear empirical trade-offs:

- **Strengths:** (1) *Solo-Developer Velocity*—enabling one engineer to deliver 14 modules, 29 endpoints, 1.09M indexed reviews, and 58 automated tests within 4 weeks; (2) *Zero Architectural Drift*—machine-checked `NetArchTest` rules immediately caught and prevented silent erosion of `INV-01` and Clean Architecture seams; and (3) *Transparent Auditability*—isolated Git worktrees and atomic State Snapshots preserved full traceability across changes such as `CHANGE-ANALYZER-CATEGORY` and `CHANGE-ADMIN-PRODUCT-CRUD`.
- **Operational Overhead & Challenges:** Maintaining 26 synchronised markdown specifications, traceability matrices, and state snapshots imposed a measurable documentation overhead (~25–35% of sprint effort). Additionally, autonomous agents remain sensitive to context scope: when task boundaries are underspecified, human architectural review remains indispensable to catch subtle discrepancies (such as outdated DTO names or currency references across legacy draft documents).

---

## 7.6 Project Limitations

Four objective limitations bound the current Phase 1 release:
1. **Geographic and Regulatory Dataset Scope:** Product SKUs and USD pricing originate from the Sephora US dataset rather than domestic Vietnamese cosmetic registration dossiers (*Số phiếu công bố sản phẩm mỹ phẩm*).
2. **Secondary Clinical Sourcing:** The 12 active-ingredient conflict rules and INCI role mappings were curated from peer-reviewed dermatology literature and CosIng references rather than primary clinical patch-testing trials.
3. **Absence of Large-Scale Longitudinal UAT:** Verification focused on automated unit/architecture tests, developer end-to-end happy paths, and database profiling; formal multi-week User Acceptance Testing (UAT) with external consumer cohorts remains future work.
4. **Simplified Payment & Localisation Scope:** Phase 1 intentionally focused on Cash on Delivery (COD) checkout and an English/USD experience; Vietnamese localisation (i18n), dual-currency conversion, online payment gateways (VNPay), and Zalo OA handoff are scoped for Phase 2.


\newpage


# CHAPTER 8: CONCLUSIONS AND FURTHER DEVELOPMENT

## 8.1 What I Have Learned

Executing the BeautyAI project across an accelerated four-week lifecycle yielded substantive engineering, methodological, and ethical insights across three core pillars of computing practice:

### 8.1.1 Software Engineering and Big Data Persistence

Operating over **8,494 products** and **1,094,197 authentic consumer reviews** shattered naive assumptions regarding Object-Relational Mappers (ORMs). Diagnosing **EF Core Cartesian Explosion** during Sprint 2—where standard `.Include()` joins inflated network payloads and stalled catalog responses at `33,584 ms`—provided an invaluable lesson in database internals. Remediating this via decoupled review-stat aggregation, `.AsNoTracking()`, and composite B-Tree indexing (`idx_reviews_product_skin` achieving `1.4 ms` index scans and `< 15 ms` API latency) reinforced that high-level frameworks never substitute for mechanical sympathy with relational query planners.

### 8.1.2 Applied AI Governance and Agentic Development

Prior to this project, leveraging AI coding assistants frequently devolved into ad-hoc conversational "vibe coding". Empirical execution demonstrated that without structural guardrails, autonomous agents readily introduce architectural drift, forbidden packages, and subtle invariant erosion (as evidenced by the `[JsonPropertyName("safety_score")]` discovery during `CHANGE-ANALYZER-CATEGORY`). Operationalising **Specification-Driven Development** via the Syntheprise Framework—combining a 7-level document precedence ladder, Playbook Task Cards, isolated Git worktrees, and reflection-based `NetArchTest` architecture tests—proved that autonomous coding agents become reliable, high-velocity engineering partners when strictly constrained by machine-verifiable human contracts.

### 8.1.3 Professional Ethics, Toxicology, and Legal Compliance

Building software adjacent to human health highlighted the ethical accountability required of software engineers. Rejecting sensationalist, scientifically ungrounded "Safety Scores" in favour of Paracelsus' toxicological principle (`INV-01` and contextual text `SuitabilityVerdict`) demonstrated that engineering decisions carry real consumer welfare consequences. Translating statutory requirements—specifically Vietnam's **Decree 181/2013/NĐ-CP** (prohibiting therapeutic claims for cosmetics) and **Decree 13/2023/NĐ-CP** (protecting sensitive dermal personal data)—directly into runtime AI medical guardrails and user-scoped JWT endpoints underscored the inseparability of software architecture and regulatory ethics.

---

## 8.2 Project Conclusion

The BeautyAI project successfully achieved its overarching aim and all six SMART objectives (`O1`–`O6`), delivering two validated, production-grade contributions:

1. **A Reusable AI-Agent Document-Driven SDLC:** An empirical eight-stage engineering methodology demonstrating that a solo developer—supported by autonomous AI coding agents governed by a constitutional precedence ladder, 12 system invariants, and automated architecture gates—can deliver an enterprise-grade software platform within four weeks without suffering architectural decay.
2. **The Fully Operational BeautyAI Platform (Phase 1 MVP):** A high-performance web application built on `.NET 10` Clean Architecture (**28 core Phase 1 RESTful API endpoints across 8 active controllers**, plus the Phase 2 `IAiSkincareProvider` seam), `React 19 + TypeScript + Vite`, and `PostgreSQL 17` (Docker Compose). Spanning 13 delivered functional modules over 8,494 Sephora products, 1.09 million reviews, and 378+ local high-resolution WebP assets, BeautyAI delivers 3-Tier INCI progressive disclosure, zero-allergen *"Safe For My Skin"* filtering, 12-rule pairwise Smart Conflict Detection, automated AM/PM Routine Generation with 1-Click *"Routine-to-Cart"*, and role-guarded Admin CRUD with Soft Delete (`ADR-014`).

Backed by **58/58 passing automated tests** (12 Architecture Tests + 46 Unit Tests), zero compiler warnings, clean static verification under `./syntheprise gate`, and verified sub-100 ms query latency, BeautyAI establishes a rigorous blueprint for both scientifically transparent cosmetic e-commerce and governed agentic software engineering.

---

## 8.3 Further Development: Phase 2 Strategic Roadmap

While Phase 1 delivers a complete, deterministic MVP, the Clean Architecture foundation and preserved scaffoldings provide a direct runway for a six-month **Phase 2** expansion (Table 8.1), prominently featuring the deferred **Module M12 (Conversational AI Skincare Chatbot)** and **Module M08 (Product Comparison)**.

**Table 8.1: Strategic Phase 2 Engineering Roadmap (Six-Month Projection)**

| Phase 2 Track | Architectural Scope & Target Capabilities | Technical Enablers & Protocols | Target Horizon |
|---|---|---|---|
| **Track 1: Localisation & Payments** | Full Vietnamese localisation (`i18n`), dynamic dual-currency conversion (`VND` / `USD $`) with exchange-rate audit history, and domestic payment gateways. | `react-i18next`, VNPay Sandbox/IPN signature verification, historical `ExchangeRateHistory` snapshots. | Month 1–2 |
| **Track 2: Commercial Expansion & M08** | Side-by-side INCI Product Comparison Drawer (**Module M08**), multi-tier promotional vouchers (Brand/Platform/Freeship), and Apriori *"Frequently Bought Together"* recommendations. | Side-by-side formula diff UI, `VoucherUsage` atomic constraints, precomputed `apriori_rules.csv` table. | Month 2–3 |
| **Track 3: Conversational AI Chatbot (M12) & Zalo OA** | Production launch of the deferred **Lumi AI Skincare Chatbot** (RAG catalog grounding, clinical red-teaming against medical guardrails `INV-11`, `ADR-005`) and consented specialist handoff via Zalo Official Account (**ADR-006**). | Plug-in activation via `IAiSkincareProvider` (`Gemini 2.5 Flash` + fallback), golden-case safety evaluation suite, Zalo DeepLink / OA API. | Month 3–4 |
| **Track 4: Native Mobile Ecosystem** | Cross-platform iOS/Android mobile application built on the preserved blueprint scaffold (`apps/mobile/`). | React Native (Expo), shared OpenAPI-generated TypeScript DTO contracts (`ADR-008`). | Month 4–5 |
| **Track 5: Optical Packaging OCR** | On-device camera OCR scanner enabling consumers to photograph physical cosmetic labels and run instant 3-Tier INCI and allergy cross-checks. | Google ML Kit Text Recognition, regex INCI normaliser pipeline. | Month 5–6 |


\newpage


# REFERENCES (HARVARD STYLE)

> *Note: Verify all journal volume/page numbers and publication dates against your primary PDFs before final Word submission (especially recent 2023–2026 preprints and clinical citations).*

- Agrawal, R. and Srikant, R. (1994) 'Fast algorithms for mining association rules in large databases', in *Proceedings of the 20th International Conference on Very Large Data Bases (VLDB)*. Santiago, Chile, pp. 487–499.
- Akerlof, G.A. (1970) 'The market for "lemons": quality uncertainty and the market mechanism', *The Quarterly Journal of Economics*, 84(3), pp. 488–500.
- American Medical Association (2023) *Principles for augmented intelligence in healthcare: ethical, legal and regulatory considerations*. Chicago: AMA Policy Compendium.
- ASEAN (2003) *Agreement on the ASEAN harmonized cosmetic regulatory scheme and the ASEAN cosmetic directive*. Jakarta: ASEAN Secretariat.
- Bakos, J.Y. (1997) 'Reducing buyer search costs: implications for electronic marketplaces', *Management Science*, 43(12), pp. 1676–1692.
- Beck, K. (2003) *Test-driven development: by example*. Boston: Addison-Wesley Longman.
- Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., Grenning, J., Highsmith, J., Hunt, A., Jeffries, R., Kern, J., Marick, B., Martin, R.C., Mellor, S., Schwaber, K., Sutherland, J. and Thomas, D. (2001) *Manifesto for agile software development*. Available at: https://agilemanifesto.org/ (Accessed: 15 October 2026).
- Bender, E.M., Gebru, T., McMillan-Major, A. and Shmitchell, S. (2021) 'On the dangers of stochastic parrots: can language models be too big?', in *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (FAccT)*. Virtual Event, Canada: ACM, pp. 610–623.
- Bissett, D.L., Oblong, J.E. and Berge, C.A. (2005) 'Niacinamide: A B vitamin that improves aging facial skin appearance', *Dermatologic Surgery*, 31(7 Pt 2), pp. 860–865.
- Boehm, B.W. (1988) 'A spiral model of software development and enhancement', *Computer*, 21(5), pp. 61–72.
- Burke, K.E. (2002) 'Interaction of topical antioxidants and retinoids: dermatological rationale and formulation considerations', *Journal of Dermatological Treatment*, 13(3), pp. 121–129.
- Cosmetics Europe (2020) *Understanding cosmetic ingredient safety: the role of risk assessment vs hazard evaluation*. Brussels: The Personal Care Association.
- Darby, M.R. and Karni, E. (1973) 'Free competition and the optimal amount of fraud', *The Journal of Law and Economics*, 16(1), pp. 67–88.
- Del Rosso, J.Q. (2008) 'The status of topical retinoids and benzoyl peroxide combination therapy: clinical nuances and chemical stability', *Cutis*, 82(2), pp. 143–149.
- Draelos, Z.D. (2019) *Cosmetic dermatology: products and procedures*. 3rd edn. Oxford: Wiley-Blackwell.
- Draelos, Z.D. and DiNardo, J.C. (2006) 'A re-evaluation of the comedogenicity concept', *Journal of the American Academy of Dermatology*, 54(3), pp. 507–512.
- European Parliament and Council of the European Union (2009) 'Regulation (EC) No 1223/2009 of the European Parliament and of the Council of 30 November 2009 on cosmetic products', *Official Journal of the European Union*, L 342, pp. 59–209.
- Feldmann, R.J. and Maibach, H.I. (1970) 'Absorption of some organic compounds through the skin in man', *Journal of Investigative Dermatology*, 54(5), pp. 399–404.
- Fowler, M. (2018) *Refactoring: improving the design of existing code*. 2nd edn. Boston: Addison-Wesley.
- Fulton, J.E. (1989) 'Comedogenicity and irritancy of commonly used ingredients in skin care products', *Journal of the Society of Cosmetic Chemists*, 40(6), pp. 321–333.
- Gallo, M.A. (2018) 'History and scope of toxicology', in Klaassen, C.D. (ed.) *Casarett and Doull's toxicology: the basic science of poisons*. 9th edn. New York: McGraw-Hill Education, pp. 3–14.
- Government of the Socialist Republic of Vietnam (2013) *Nghị định số 181/2013/NĐ-CP ngày 14/11/2013 của Chính phủ quy định chi tiết thi hành một số điều của Luật Quảng cáo*. Hà Nội: Cổng Thông tin điện tử Chính phủ.
- Government of the Socialist Republic of Vietnam (2023) *Nghị định số 13/2023/NĐ-CP ngày 17/04/2023 của Chính phủ về bảo vệ dữ liệu cá nhân*. Hà Nội: Cổng Thông tin điện tử Chính phủ.
- Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Yan, X., Ishii, E., Bang, Y.J., Dai, W. and Fung, P. (2023) 'Survey of hallucination in natural language generation', *ACM Computing Surveys*, 55(12), pp. 1–38.
- Jimenez, C.E., Yang, J., Wettig, A., Yao, S., Pei, K., Press, O. and Narasimhan, K. (2024) 'SWE-bench: can language models resolve real-world GitHub issues?', in *The Twelfth International Conference on Learning Representations (ICLR)*. Vienna, Austria.
- Kligman, A.M. and Mills, O.H. (1972) 'Acne cosmetica', *Archives of Dermatology*, 106(6), pp. 843–850.
- Levin, J. and Momin, S.B. (2010) 'How much do we really know about our favorite cosmeceutical ingredients?', *The Journal of Clinical and Aesthetic Dermatology*, 3(2), pp. 22–41.
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S. and Kiela, D. (2020) 'Retrieval-augmented generation for knowledge-intensive NLP tasks', in *Advances in Neural Information Processing Systems (NeurIPS 2020)*, 33, pp. 9459–9474.
- Martin, B., Meunier, C., Montels, D. and Watts, O. (1998) 'Chemical stability of adapalene and tretinoin when combined with benzoyl peroxide in topical formulations', *British Journal of Dermatology*, 139(Suppl. 52), pp. 8–11.
- Martin, J. (1991) *Rapid application development*. New York: Macmillan Publishing Co., Inc.
- Martin, R.C. (2018) *Clean architecture: a craftsman's guide to software structure and design*. Boston: Prentice Hall.
- Peng, S., Kalliamvakou, E., Novak, P., Zhang, E. and Zieba, M. (2023) 'The impact of AI on developer productivity: evidence from GitHub Copilot', *arXiv preprint arXiv:2302.06590*.
- Pickart, L. and Margolina, A. (2018) 'Regenerative and protective actions of the GHK-Cu peptide in the light of the new gene data', *International Journal of Molecular Sciences*, 19(7), p. 1987.
- Ricci, F., Rokach, L. and Shapira, B. (2015) *Recommender systems handbook*. 2nd edn. Boston: Springer US.
- Royal Society of Chemistry (2022) *Cosmetic ingredient risk assessment: demystifying the hazard-risk dichotomy*. London: RSC Policy Directorate.
- Royce, W.W. (1970) 'Managing the development of large software systems: concepts and techniques', in *Proceedings of IEEE WESCON*. Los Angeles, CA, pp. 1–9.
- Schwaber, K. and Sutherland, J. (2020) *The Scrum guide: the definitive guide to Scrum: the rules of the game*. Available at: https://scrumguides.org/ (Accessed: 20 October 2026).
- Sommerville, I. (2015) *Software engineering*. 10th edn. Boston: Pearson.
- Su, X. and Khoshgoftaar, T.M. (2009) 'A survey of collaborative filtering techniques', *Advances in Artificial Intelligence*, 2009, pp. 1–19.