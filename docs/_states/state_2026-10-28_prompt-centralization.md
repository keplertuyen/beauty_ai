---
doc: state-2026-10-28-prompt-centralization
title: State Snapshot — 2026-10-28 — Gom Nhóm & Tập Trung Toàn Bộ Prompts Hệ Thống
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-28
---

# state_2026-10-28_prompt-centralization

## Đang ở đâu
- **Phase:** Phase 1 MVP (Week 1 / 4)
- **Repo:** `keplertuyen/beauty_ai` (main)
- **Trạng thái:** Toàn bộ prompts của hệ thống đã được gom và phân loại tập trung vào thư mục `docs/prompt/`.

## Phiên này đã làm gì
1. **Thiết lập thư mục tập trung `docs/prompt/`:**
   - [`README.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/README.md): Bản đồ tra cứu và 4 nguyên tắc vàng thiết kế Prompt (INV-01 Không chấm điểm an toàn, INV-04 Ẩn danh hóa PII, INV-05 Grounding CSDL, Zero-Allergy Tolerance).
   - [`01_gemini_advisor_en.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/01_gemini_advisor_en.md): System Prompt tiếng Anh chuẩn Phase 1 tích hợp Gemini API (Grounding Digital Skin ID & CSDL 300 sản phẩm Sephora, USD).
   - [`02_gemini_advisor_vi.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/02_gemini_advisor_vi.md): System Prompt tiếng Việt chuẩn y tế (Tuân thủ Nghị định 181/2013/NĐ-CP, cấm từ ngữ chữa trị/điều trị dứt điểm).
   - [`03_routine_generator.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/03_routine_generator.md): Prompt sinh chu trình AM/PM từ Digital Skin ID kèm JSON Schema đầu ra chuẩn.
   - [`04_inci_analyzer.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/04_inci_analyzer.md): Prompt bóc tách và phân loại thành phần INCI, xếp nhóm công năng, đánh giá comedogenic/irritation ratings.
   - [`05_chat_to_cart_intent.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/05_chat_to_cart_intent.md): Prompt nhận diện ý định mua hàng & định nghĩa Tool Schema cho Chat-to-Cart.
   - [`06_ai_agent_workflows.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/06_ai_agent_workflows.md): Tổng hợp prompt điều phối AI Agents và slash-commands của Syntheprise Framework.

## Trạng thái gate
- `./scripts/test`: XANH (11 Architecture Tests + 13 Unit Tests + Frontend TS build pass)
- `./syntheprise gate`: XANH (15/15 checks PASSED)
