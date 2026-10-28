---
doc: state-2026-10-28-task-2-2-catalog-safe-for-me
title: State Snapshot — 2026-10-28 — Task 2.2 Catalog & Safe For Me Filter Complete
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-28
---

# state_2026-10-28_task-2-2-catalog-safe-for-me

## Đang ở đâu
- **Phase:** Phase 1 MVP (Week 2 / 4)
- **Repo:** `keplertuyen/beauty_ai` (main)
- **Trạng thái:** Hoàn thành xuất sắc Nhiệm vụ 2.2 — Hoàn thiện Trang Catalog & Bộ Lọc "Safe For My Skin" (Core USP).

## Phiên này đã làm gì
1. **Chuẩn hóa 100% English & Tiền tệ USD ($):**
   - Đã gỡ bỏ toàn bộ logic song ngữ / chuyển đổi tiền tệ VND khỏi giao diện và client API.
   - Khóa cứng `lang = 'en'`, `currency = 'USD'`, formatPrice hiển thị `$X.XX`.
   - Đánh dấu `docs/prompt/02_gemini_advisor_vi.md` là deferred sang Phase 2.
2. **Xây dựng Backend Catalog API & Zero-Allergy Filtering:**
   - Tạo thực thể Domain: `Product`, `Brand`, `Category`, `Ingredient`, `ProductIngredient`, `Review`.
   - Cài đặt `SuitabilityScoreCalculator` (tuân thủ tuyệt đối bất biến INV-01, không sinh `SafetyScore`, chỉ dùng `SuitabilityScore` 0–100% và cờ dị ứng).
   - Đăng ký và cấu hình EF Core trong `BeautyAIDbContext` ánh xạ 10 bảng PostgreSQL hiện hữu.
   - Hiện thực `ProductRepository` & `ProductService`: Xử lý lọc text, category, brand, skinType, giá USD, và logic **Zero-Tolerance Allergy Exclusion** (`SafeForMe = true`).
   - Xây dựng `ProductsController.cs`:
     - `GET /api/v1/products`: Tìm kiếm, phân trang, lọc loại da, lọc `safe_for_me`.
     - `GET /api/v1/products/{id}`: Chi tiết sản phẩm.
     - `GET /api/v1/products/categories`: Danh mục sản phẩm.
     - `GET /api/v1/products/brands`: Thương hiệu sản phẩm.
3. **Nâng cấp Giao diện Frontend React (`Products.jsx` & `ProductCard.jsx`):**
   - Tích hợp công tắc Toggle USP: `🛡️ Safe For My Skin (Auto-exclude Allergens)` có kiểm tra Digital Skin ID.
   - Tích hợp bộ lọc nhanh `Skin Type` (All, Oily, Dry, Combination, Normal, Sensitive).
   - Nâng cấp `ProductCard.jsx`: Hiển thị huy hiệu `✨ XX% MATCH` và cảnh báo dị ứng `⚠️ ALLERGY`.
4. **Kiểm thử & Đảm bảo chất lượng:**
   - 11 Architecture Tests: PASSED (Bất biến INV-01, Clean Architecture).
   - 20 Unit Tests: PASSED (Logic loại trừ dị ứng, tính điểm tương thích, xác thực, mật khẩu PBKDF2).
   - Frontend TypeScript & Vite build: PASSED (245ms).

## Kế hoạch tiếp theo
- Chuyển sang **Nhiệm vụ 2.3 trong Playbook Phase 1: Hoàn thiện Trang PDP, Bảng INCI & Cảnh Báo Dị Ứng Đỏ**.
