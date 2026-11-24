---
doc: adr-adr-015
title: ADR-015 — Pluggable Dify RAG Adapter for Phase 1 Demo Chatbot
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-11-24
---

# ADR-015 — Pluggable Dify RAG Adapter for Phase 1 Demo Chatbot

| | |
|---|---|
| **Status** | Accepted |
| **Context** | Phase 1 demo needs a working Retrieval-Augmented Generation (RAG) skincare chatbot in `/expert-consult` with transparent knowledge retrieval over curated BeautyAI skincare products (~98 products + routine/conflict guides), low setup cost, and zero frontend breaking changes. |

## Decision

Add `DifySkincareProvider` (`src/BeautyAI.Infrastructure/Providers/DifySkincareProvider.cs`) implementing `IAiSkincareProvider` alongside `GeminiSkincareProvider`:

1. **Provider Selection via Config (`AI_PROVIDER`):**
   - `AI_PROVIDER=dify` (or auto-selected when `DIFY_API_KEY` is configured and `AI_PROVIDER` is unset) routes `POST /api/v1/ai/consult` to `DifySkincareProvider`.
   - `AI_PROVIDER=gemini` keeps `GeminiSkincareProvider` active.
2. **Backend-Only Proxy (`AGENTS.md §2.3`, `§2.5`):**
   - Frontend never calls Dify directly; `DIFY_API_KEY` stays strictly in server `.env` / Render env vars.
   - Uses standard `HttpClient` inside `BeautyAI.Infrastructure.Providers` (no third-party SDK added).
3. **Preserved Safety Invariants (`ADR-005`, `docs/llm-policy.md`):**
   - **Stage 1 Medical Guardrail:** Deterministic medical/pathology check runs in `AiController` *before* calling Dify; blocked queries return `is_pathology=true` + Zalo handoff with empty product list.
   - **Stage 4 De-Identification (`INV-04`):** Only anonymized skin attributes (`skinType`, `concerns`, `allergies`, `budget`) are sent to Dify; `user` field is fixed to `beautyai-anon-session`.
   - **Stage 6 DB Grounding (`INV-05`):** Product cards (`recommendedProducts`) are matched back against real PostgreSQL rows (by Product Code, Name, then Brand) so prices, images, and Add-to-Cart always reflect DB truth.
   - **Graceful Degradation (`BR-AI-05`):** Missing key, timeout (15s), or upstream errors fall back to English rule-based guidance without exposing HTTP codes or provider errors.
4. **Demo Knowledge Base Scope:**
   - Curated via `scripts/export_dify_knowledge.py` into `docs/_data/dify/beautyai_demo_knowledge.md` (~98 skincare products + 4 routine/conflict/safety chunks, delimited by `---`).
   - Phase 1 response language remains **English only (USD)**.

## Consequences

- **Pros:** Rapid RAG demo capability, visual retrieval inspection in Dify Cloud, cheap LLM routing (e.g., SiliconFlow DeepSeek or Gemini Free Tier), clean adapter seam with zero frontend rewrite.
- **Cons:** Demo knowledge file is a static snapshot (~98 products) rather than live DB sync; full production Phase 2 should move to live tool-calling or automated index sync.
