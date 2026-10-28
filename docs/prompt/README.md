---
doc: prompt-index
title: Thư Viện Prompt & Chỉ Thị Hệ Thống — BeautyAI Platform
status: stable
precedence: 5
owner: AI Lead / Tech Lead
last_reviewed: 2026-10-28
---

# THƯ VIỆN PROMPT TẬP TRUNG — BeautyAI Platform (`docs/prompt/`)

> Thư mục tập trung toàn bộ các System Prompts, Structured Prompts và Workflow Prompts được sử dụng trong toàn bộ hệ thống BeautyAI (bao gồm cả Phase 1 MVP và định hướng Phase 2).

---

## 📑 Danh Mục Prompt Hệ Thống

| Tệp Prompt | Mục Đích & Phạm Vi Áp Dụng | Mô Hình / Tầng | Ngôn Ngữ |
|---|---|---|---|
| [`01_gemini_advisor_en.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/01_gemini_advisor_en.md) | **System Prompt chính thức của Phase 1** cho Trợ lý Tư vấn Da & Mỹ phẩm tích hợp Gemini API (Grounding với Digital Skin ID & Catalog 300 sản phẩm). | Gemini 1.5 / 2.0 Flash | English (USD) |
| [`02_gemini_advisor_vi.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/02_gemini_advisor_vi.md) | **System Prompt Tiếng Việt chuẩn y tế** (Tuân thủ Nghị định 181/2013/NĐ-CP, cấm từ ngữ "chữa trị", disclaimer an toàn). | Gemini Flash | Tiếng Việt (VNĐ) |
| [`03_routine_generator.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/03_routine_generator.md) | **Prompt sinh chu trình Routine AM/PM** tự động từ 3 khối Digital Skin ID (Loại da, Blacklist dị ứng, Vấn đề da & Ngân sách). | Gemini / Rules Engine | Song ngữ (EN/VI) |
| [`04_inci_analyzer.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/04_inci_analyzer.md) | **Prompt bóc tách & giải mã thành phần INCI** từ đoạn văn bản/nhãn mỹ phẩm người dùng dán vào, xếp nhóm công năng & cảnh báo kích ứng. | Gemini API | Song ngữ (EN/VI) |
| [`05_chat_to_cart_intent.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/05_chat_to_cart_intent.md) | **Prompt phân loại ý định (Intent Recognition) & Chat-to-Cart** ("Thêm sản phẩm X vào giỏ", "Mua cả chu trình", hỏi giá, tìm sản phẩm thay thế). | Gemini Function Calling | Song ngữ (EN/VI) |
| [`06_ai_agent_workflows.md`](file:///Users/trucuyen/Documents/beauty_ai/docs/prompt/06_ai_agent_workflows.md) | **Tổng hợp các prompt điều phối phát triển dự án** (Kickoff, QA Test Design, Review, Architecture Options, Quality Gate). | AI Coding Assistants | Song ngữ |

---

## 🔒 Nguyên Tắc Vàng Khi Thiết Kế Prompt Trong BeautyAI
1. **INV-01 (No Safety Score):** Tuyệt đối không bao giờ yêu cầu mô hình chấm điểm "an toàn" hay "độc hại" (SafetyScore/HazardScore). Chỉ sử dụng khái niệm **Suitability Score** (Điểm phù hợp với làn da) và **Allergy Blacklist**.
2. **INV-04 (De-identification):** Prompt gửi tới bên thứ 3 (Google Gemini) TUYỆT ĐỐI KHÔNG chứa thông tin PII định danh (Họ tên thật, Email, SĐT, Địa chỉ). Chỉ gửi ngữ cảnh ẩn danh: `{ SkinType, AllergyList, Concerns, Budget }`.
3. **INV-05 (Catalog Grounding):** LLM là nguồn ngôn ngữ tự nhiên, CSDL PostgreSQL là nguồn sự thật. Mô hình CHỈ ĐƯỢC đề xuất sản phẩm có trong danh mục được cung cấp kèm ID và giá chính xác.
4. **Zero-Allergy Tolerance:** Vùng cấm kỵ an toàn — mô hình bị cấm tuyệt đối gợi ý sản phẩm chứa bất kỳ thành phần nào trong Blacklist của khách hàng.
