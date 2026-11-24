---
doc: guide-dify-rag-demo
title: Dify RAG Chatbot Demo Setup Guide (Phase 1 — English)
status: stable
precedence: 6
owner: tech-lead
last_reviewed: 2026-11-24
---

# Dify RAG Chatbot Demo Setup Guide (Phase 1)

This guide walks through connecting **Dify Cloud** (with SiliconFlow DeepSeek or Gemini) to BeautyAI's **Expert Consultation** chatbot (`/expert-consult`) in ~10 minutes.

## 1. Knowledge File (Already Generated)

The curated demo knowledge file is ready at:
- `docs/_data/dify/beautyai_demo_knowledge.md` (~98 top Skincare products across Cleansers, Moisturizers, Treatments, Sunscreen, Masks, Eye Care, and Lip Care + 4 skincare routine, ingredient conflict, and safety chunks).

To regenerate it anytime:
```bash
python3 scripts/export_dify_knowledge.py
```

---

## 2. Configure Dify Cloud

### Step 2.1 — Add a Model Provider
1. Sign in at [cloud.dify.ai](https://cloud.dify.ai).
2. Click your profile avatar (top right) → **Settings** → **Model Provider**.
3. Configure your preferred provider:
   - **Option A (SiliconFlow — DeepSeek, very low cost):** Select **SiliconFlow** → paste your SiliconFlow API Key → enable a DeepSeek chat model (e.g., `deepseek-ai/DeepSeek-V3`) and an embedding model (e.g., `BAAI/bge-m3` or Dify's default).
   - **Option B (Google Gemini — Free Tier):** Select **Gemini** → paste your Google AI Studio API Key.

### Step 2.2 — Create the Knowledge Base
1. Go to the **Knowledge** tab → **Create Knowledge** → **Import from text**.
2. Upload `docs/_data/dify/beautyai_demo_knowledge.md`.
3. In **Chunk Settings**:
   - Select **Custom**
   - **Delimiter:** `---`
   - **Maximum chunk length:** `1000` tokens
   - **Chunk overlap:** `0` (each product is already self-contained between `---`)
4. **Index Method:** High Quality (or Economy if you don't want to configure an embedding model).
5. Click **Save & Process** and wait until status shows **Available**.

### Step 2.3 — Create the Chatbot App
1. Go to **Studio** → **Create from Blank** → select **Chatbot** → name it `BeautyAI Lumi Demo`.
2. In **Context** (Knowledge), click **Add** and attach the Knowledge Base created in Step 2.2.
3. Paste the **System Prompt (Instructions)** below (English-only Phase 1):

```text
You are Lumi, the AI Skincare Advisor for BeautyAI.
You MUST respond strictly in clear, friendly, evidence-based English, and always display product prices in USD ($).

ROLE & SAFETY BOUNDARIES:
- You are a cosmetic skincare advisor, NOT a doctor, pharmacist, or dermatologist.
- Never diagnose or prescribe treatments for medical skin diseases (eczema, psoriasis, fungal infections, infected cystic acne, severe allergic reactions, or steroid/corticoid damage). Advise consulting a board-certified dermatologist.
- Never claim products "cure", "heal", or provide "100% guaranteed" results. Use cosmetic phrasing such as "helps support", "helps soothe", or "suitable for".

GROUNDING RULES:
- ONLY recommend products retrieved from the attached BeautyAI Knowledge context. Never invent products or prices.
- Whenever you recommend a product, include its exact Brand, Product Name, Product Code (e.g., P427406), and Price in USD ($).
- If an [Anonymized Skin Profile] is provided in the user message, respect their Skin Type, Concerns, Budget, and STRICTLY EXCLUDE any product containing ingredients listed under "Ingredients to Strictly Avoid (Allergies)".
- If no matching product is found in the Knowledge context, honestly say so and suggest exploring the BeautyAI catalog or consulting a specialist.

FORMAT:
- Keep answers concise, structured with bullet points (2-3 recommended products max per reply), and explain briefly why each product fits.
- End every consultation with a brief one-line cosmetic disclaimer.
```

4. Click **Publish** → **Update**.
5. In the left sidebar, open **API Access** → click **API Key** → **Create new secret key** (format `app-xxxxxxxx...`) and note the **API Server** URL (usually `https://api.dify.ai/v1`).

---

## 3. Connect BeautyAI Backend

### Local Development (`.env`)
Add these lines to your local `.env` (never commit `.env`):
```env
AI_PROVIDER=dify
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-secret-key
```

### Production (Render — `beautyai-api`)
In Render Dashboard → `beautyai-api` → **Environment**, add:
- `AI_PROVIDER` = `dify`
- `DIFY_API_URL` = `https://api.dify.ai/v1`
- `DIFY_API_KEY` = `app-your-dify-secret-key`

Redeploy `beautyai-api`, then test directly on `https://beauty-ai-lyart.vercel.app/expert-consult`!
