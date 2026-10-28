---
doc: prompt-routine-generator
title: Prompt Sinh Chu Trình Routine AM/PM Từ Digital Skin ID
status: stable
precedence: 5
owner: AI Lead / Tech Lead
last_reviewed: 2026-10-28
---

# PROMPT SINH CHU TRÌNH DƯỠNG DA AM/PM (ROUTINE BUILDER)

> **Mục đích:** Xây dựng chu trình dưỡng da cá nhân hóa buổi sáng (AM) và buổi tối (PM) từ 3 khối dữ liệu của Digital Skin ID.
> **Phương thức hoạt động:** Sử dụng kết hợp Gemini Structured Outputs (JSON Schema) và Rules Engine kiểm tra xung đột hoạt chất y khoa.

---

## 📝 Cấu Trúc Prompt Đầu Vào (Input Prompt)

```text
Build a personalized, scientifically balanced daily AM and PM skincare routine based on the following user profile:

[USER PROFILE]
- Skin Type: {SkinType}
- Allergy Blacklist: {Allergies}
- Skin Concerns: {SkinConcerns}
- Primary Skincare Goal: {PrimaryGoal}
- Budget Level: {BudgetLevel}

[CANDIDATE PRODUCTS POOL]
{CandidateProductsJson}

[ROUTINE BUILDING CONSTRAINTS]
1. AM Routine must prioritize: Cleansing (Gentle) -> Hydration/Antioxidant -> Moisturizing -> Sun Protection (SPF).
2. PM Routine must prioritize: Double Cleansing -> Targeted Treatment (Actives) -> Barrier Recovery/Moisturizing.
3. CONFLICT CHECK: Do NOT schedule conflicting ingredients (e.g., Retinol and High-strength BHA) in the same PM routine.
4. ALLERGY EXCLUSION: Every selected product must be 100% free of all ingredients listed in the Allergy Blacklist.
5. Return ONLY a valid JSON object matching the schema below.
```

---

## 📦 JSON Schema Đầu Ra Chuẩn (Response Schema)

```json
{
  "type": "object",
  "properties": {
    "amRoutine": {
      "type": "array",
      "description": "List of products for morning routine in order of application",
      "items": {
        "type": "object",
        "properties": {
          "stepOrder": { "type": "integer" },
          "stepCategory": { "type": "string", "enum": ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"] },
          "productId": { "type": "integer" },
          "productName": { "type": "string" },
          "usageInstructions": { "type": "string" },
          "keyBenefit": { "type": "string" }
        },
        "required": ["stepOrder", "stepCategory", "productId", "productName", "usageInstructions", "keyBenefit"]
      }
    },
    "pmRoutine": {
      "type": "array",
      "description": "List of products for evening routine in order of application",
      "items": {
        "type": "object",
        "properties": {
          "stepOrder": { "type": "integer" },
          "stepCategory": { "type": "string", "enum": ["Cleanser", "Toner", "Serum/Treatment", "Moisturizer", "Night Care"] },
          "productId": { "type": "integer" },
          "productName": { "type": "string" },
          "usageInstructions": { "type": "string" },
          "keyBenefit": { "type": "string" }
        },
        "required": ["stepOrder", "stepCategory", "productId", "productName", "usageInstructions", "keyBenefit"]
      }
    },
    "scientificSummary": {
      "type": "string",
      "description": "2-3 sentences explaining why this routine suits the user's specific skin type and goals without irritating their skin."
    },
    "estimatedTotalCostUsd": {
      "type": "number",
      "description": "Sum of candidate product prices in USD"
    }
  },
  "required": ["amRoutine", "pmRoutine", "scientificSummary", "estimatedTotalCostUsd"]
}
```
