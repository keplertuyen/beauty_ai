# MASTER OUTLINE — FINAL PROJECT REPORT (BEAUTYAI)

> **Chuẩn học thuật:** University of Greenwich — School of Computing & Digital Media (GDM Final Report Template & Undergraduate Project Report Structure Guide)
> **Project Title:** *An AI-Agent Document-Driven Software Development Lifecycle: Design and Implementation of BeautyAI — An Ingredient-Aware Cosmetics E-Commerce Platform with a Personalised Skincare Assistant*
> **Dung lượng chính văn dự kiến:** ~11.500 – 12.000 từ (~40–45 trang, không tính Front Matter, References và Appendices)
> **Định dạng văn bản:** Font Arial / Times New Roman 12pt, line spacing 1.5, Harvard Referencing Style

---

## Nguyên tắc chân lý xuyên suốt (Source of Truth)
- **Hiện trạng thực tế Phase 1 (23/11/2026):** `.NET 10` (Clean Architecture 4 layers), `React 19 + TypeScript + Vite`, `PostgreSQL 17` (10 core tables, Docker Compose), `Google Gemini 2.5 Flash` + Scientific Rule-Based Fallback, 8.494 sản phẩm Sephora, 1.09 triệu reviews, 378+ ảnh 800x800px WebP cục bộ, 29 RESTful API endpoints, tiền tệ 100% USD (`$`), **12/12 Architecture Tests & 46/46 Unit Tests XANH**, `./syntheprise gate` Clean.
- **Bất biến INV-01:** Tuyệt đối không dùng khái niệm `SafetyScore` hay điểm số `%` chung chung; sử dụng `SuitabilityVerdict` dạng chữ (`Good Match`, `Match with Notes`, `Not Suitable — Allergy Alert`, `Insufficient INCI Data`, `Accessory / Tool`).
- **Hiệu đính Vitamin C + Niacinamide:** Ghi nhận cả 2 vế — trong runtime Phase 1 là cảnh báo `Warning` (khuyên dùng cách 20 phút cho da nhạy cảm do chênh lệch pH), đồng thời phân tích phản biện góc nhìn *Myth Correction* trong y văn hiện đại (Chapter 2, 6, 7).
- **AI Persona:** Lumi đóng vai trò `AI Skincare Advisor` với rào chắn y khoa nghiêm ngặt (`Medical Guardrails`), tuyệt đối không chẩn đoán bệnh lý lâm sàng hay kê đơn thuốc.

---

## Bảng tổng hợp phân bổ số từ & trang

| Phần / Chương | Tiêu đề (Title) | Số từ dự kiến | Số trang dự kiến | Trạng thái |
|---|---|---:|---:|---|
| **Front Matter** | Cover Page, Declaration, AI Reflection (AIR), Abstract, Acknowledgements, TOC, Lists | — | 6–8 trang | Pending |
| **Chapter 1** | Introduction | ~1.100 từ | 4–5 trang | In Progress |
| **Chapter 2** | Literature Review | ~1.900 từ | 6–7 trang | Pending |
| **Chapter 3** | Software Development Methodologies & The Proposed AI-Agent SDLC | ~1.600 từ | 5–6 trang | Pending |
| **Chapter 4** | Technology and Tools | ~1.100 từ | 3–4 trang | Pending |
| **Chapter 5** | Software Product Requirements | ~1.600 từ | 5–6 trang | Pending |
| **Chapter 6** | Design and Implementation of the Product | ~2.100 từ | 7–8 trang | Pending |
| **Chapter 7** | Evaluation and Results | ~1.600 từ | 5–6 trang | Pending |
| **Chapter 8** | Conclusions and Further Development | ~900 từ | 2–3 trang | Pending |
| **Back Matter** | References (Harvard Style) & Appendices A–G | — | 15–20 trang | Pending |
| **TỔNG CỘNG** | **Main Body (Chapters 1 – 8)** | **~11.900 từ** | **~40–45 trang** | |

---

## Chi tiết từng phần & Danh mục Figure / Table

### Front Matter (Số trang La Mã: i, ii, iii...)
- **Cover Page**: Theo mẫu chuẩn University of Greenwich.
- **Declaration of Originality**: Bản cam đoan công trình độc lập.
- **AI Reflection (AIR)**: Giải trình sử dụng Generative AI theo quy định Greenwich 2026/2027 (vai trò của Google Antigravity, NotebookLM/Claude và quyền quyết định/kiểm chứng của sinh viên).
- **Abstract** (~300–350 từ): Bối cảnh, 2 đóng góp (AI-Agent Document-Driven SDLC 8 chặng + BeautyAI Phase 1 MVP với 5 USP), và kết quả định lượng (12/12 Arch Tests, 46/46 Unit Tests, Catalog `33.584ms -> 80ms`, Reviews `< 15ms`).
- **Preface & Acknowledgements**, **Table of Contents**, **List of Figures**, **List of Tables**, **List of Abbreviations**.

### Chapter 1: Introduction (~1.100 từ)
- `1.1` Background & Context
- `1.2` Problem Statement
- `1.3` Aims and Objectives (1 Aim + 6 SMART Objectives `O1–O6`)
- `1.4` Project Scope & Boundaries (Phase 1 MVP vs. Phase 2 Deferred)
- `1.5` Project Plan & Timeline (4-week Sprint roadmap, 160h + 20h buffer)
- `1.6` Project Outcomes
- `1.7` Overview of Report
- **Tables & Figures:** `Table 1.1` (SMART Objectives), `Table 1.2` (Phase 1 vs. Phase 2 Scope Matrix), `Figure 1.1` (4-Week Sprint Schedule & Quality Gates).

### Chapter 2: Literature Review (~1.900 từ)
- `2.1` Introduction
- `2.2` Cosmetics E-Commerce & Information Asymmetry
- `2.3` Ingredient Transparency & The "Safety Score" Controversy (Paracelsus, Kligman & Mills 1972, phản biện Yuka/EWG/Think Dirty, cơ sở `INV-01`)
- `2.4` Personalisation & Recommender Systems in Skincare
- `2.5` Active-Ingredient Interactions & Conflicts (Martin et al. 1998; Vitamin C + Niacinamide Myth Correction)
- `2.6` Large Language Models in E-Commerce: Grounding & Guardrails (Ji et al. 2023; RAG, Catalog Grounding)
- `2.7` AI Coding Agents & Specification-Driven Development (Peng et al. 2023; Jimenez et al. 2024; Agarwal et al. 2026)
- `2.8` Legal, Ethical & Regulatory Context (ASEAN/EU CosIng, NĐ 181/2013/NĐ-CP, NĐ 13/2023/NĐ-CP)
- `2.9` Summary & Research Gap
- **Tables:** `Table 2.1` (Platform Comparison), `Table 2.2` (Dermatological Evidence Classification).

### Chapter 3: Software Development Methodologies & The Proposed AI-Agent SDLC (~1.600 từ)
- `3.1` Review of Classical Methodologies (Waterfall, Spiral, RAD, Agile/Scrum)
- `3.2` Justification of Methodology Selection
- `3.3` The Proposed AI-Agent Document-Driven SDLC (Stages `a–h` với Syntheprise Framework v6.0.1)
- `3.4` Governance & Safety Mechanisms (7-Level Precedence Ladder, 12 System Invariants `INV-01`–`INV-12`, Human-Agent RACI)
- **Figures & Tables:** `Figure 3.1` (8-Stage AI-Agent SDLC), `Figure 3.2` (7-Level Precedence Ladder), `Figure 3.3` (Change Management Workflow), `Table 3.1` (Human vs. Agent RACI), `Table 3.2` (Methodology Comparison).

### Chapter 4: Technology and Tools (~1.100 từ)
- `4.1` Backend Architecture (`.NET 10`, Clean Architecture 4 layers)
- `4.2` Database & High-Performance Data Engine (`PostgreSQL 17`, Docker Compose, B-Tree Composite Indexes)
- `4.3` Frontend Framework (`React 19`, `Vite`, `TypeScript`, OpenAPI DTOs)
- `4.4` AI Provider & Medical Integration (`Gemini 2.5 Flash`, `GeminiSkincareProvider`, Rule-Based Fallback)
- `4.5` Testing & Automated Quality Assurance (`xUnit`, `NetArchTest` 12 tests, 46 Unit Tests)
- `4.6` CI/CD & DevOps Pipeline (GitHub Actions 5 jobs, Gitleaks, Syntheprise Gate, Worktree hooks)
- `4.7` Architecture Decision Records Summary (`ADR-001` to `ADR-014`)
- **Figures & Tables:** `Figure 4.1` (4-Layer Clean Architecture), `Figure 4.2` (Automated Quality Gate Pipeline), `Table 4.1` (ADR-001 to ADR-014 Summary).

### Chapter 5: Software Product Requirements (~1.600 từ)
- `5.1` Review of Similar Products (Yuka, INCIDecoder, SkinSort, Haut.AI, Hasaki, Sociolla)
- `5.2` Requirements Engineering (BRD `BO-01`–`BO-07`, PRD 14 Modules, User Stories & Given/When/Then ACs)
- `5.3` Use Case Modeling (`Guest`, `Customer`, `Admin`; UC-02, UC-05, UC-07)
- `5.4` Entity Relationship Diagram (10 Core Tables in `PostgreSQL 17` 3NF)
- `5.5` Sitemap & User Flow
- **Figures & Tables:** `Figure 5.1` (System Use Case Diagram), `Figure 5.2` (10-Table ERD), `Figure 5.3` (Streamlined Sitemap & User Flow), `Table 5.1` (14 Modules Traceability), `Table 5.2` (UC-07 Specification).

### Chapter 6: Design and Implementation of the Product (~2.100 từ)
- `6.1` Technical Design & Algorithmic Invariants (`SuitabilityScoreCalculator`, 12-Rule Conflict Detector, Lumi AI Grounding, Admin CRUD & Soft Delete `ADR-014`)
- `6.2` UI/UX Implementation & Design System (100% English & USD, 378+ Local 800x800 WebP Assets)
- `6.3` Implementation Sprints (`Sprint 1` – `Sprint 4` via Playbook & Worktrees)
- `6.4` Continuous Documentation & Refactoring Case Study (`CHANGE-ANALYZER-CATEGORY`)
- `6.5` Major Screenshots (`Figure 6.1` – `Figure 6.6`)
- `6.6` Key Code Snippets (`Listing 6.1` – `Listing 6.6`)
- **Tables:** `Table 6.1` (Complete Catalog of 29 Implemented REST API Endpoints).

### Chapter 7: Evaluation and Results (~1.600 từ)
- `7.1` Achievement Against Objectives (`O1–O6` — 100% Phase 1 completed)
- `7.2` Testing & Quality Results (12/12 Arch Tests, 46/46 Unit Tests, 5-job CI, `./syntheprise gate` Clean)
- `7.3` Performance Benchmarking & Big Data Optimization (Catalog `33.584ms -> 80ms`, PDP `12ms`, 1.09M Reviews `< 15ms`)
- `7.4` Critical Evaluation & Nuance Discussion (Vitamin C + Niacinamide runtime vs. Myth Correction; Lumi AI Persona & Medical Guardrails)
- `7.5` Evaluation of the AI-Agent SDLC
- `7.6` Limitations of the Project
- **Tables & Figures:** `Table 7.1` (Objectives Achievement), `Table 7.2` (Test Results), `Figure 7.1` (Query Performance Benchmark).

### Chapter 8: Conclusions and Further Development (~900 từ)
- `8.1` What I Have Learned (Software Engineering, Applied AI & Agentic Workflow, Ethics & Legal)
- `8.2` Project Conclusion
- `8.3` Further Development (Phase 2 Roadmap: i18n/VND, 10-stage AI pipeline, Zalo OA, React Native Mobile App, OCR)
- **Table:** `Table 8.1` (Phase 2 Strategic Roadmap).

### Back Matter
- **References** (25+ Harvard-style academic references)
- **Appendices A–G**: Approved Proposal, Genesis Prompt, Lifecycle Artefacts Inventory, 12 System Invariants Table, 12 Conflict Rules Table, Example State Snapshot, Complete Verification Evidence (console logs).
