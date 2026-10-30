---
doc: state-2026-10-30-analyzer-category-redesign
title: State Snapshot — 2026-10-30 — Category-Aware Ingredient Analyzer & 3-Tier INCI Display Complete
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-30
---

# state_2026-10-30_analyzer-category-redesign

## Đang ở đâu
- **Phase:** Phase 1 MVP (Week 2 / 4)
- **Repo:** `keplertuyen/beauty_ai` (main)
- **Trạng thái:** Hoàn thành `CHANGE-ANALYZER-CATEGORY` — Thiết kế lại toàn diện Trang Phân tích INCI (`IngredientAnalyzer`), Trang Chi tiết Sản phẩm (`ProductDetail`), và Thẻ Sản phẩm (`ProductCard`) theo cấu trúc 3 tầng (3-Tier Progressive Disclosure) & Kết luận dạng chữ (Text Verdict).

## Phiên này đã làm gì
1. **Loại bỏ hoàn toàn điểm số `%` và `Safety Score /5` (Tuân thủ tuyệt đối `INV-01`):**
   - Gỡ bỏ `FormulaRating` / `[JsonPropertyName("safety_score")]` trong `ToolDtos.cs` và `<SafetyScore />` trong `IngredientAnalyzer.jsx`.
   - Tăng cường `NoSafetyScoreAnywhereTests.cs` để quét cả thuộc tính `[JsonPropertyName]` chống lách luật `INV-01`.
   - Đồng bộ toàn hệ thống (`ProductCard`, `ProductDetail`, `IngredientAnalyzer`, `Compare`) sang **Text Verdict** (`Good Match`, `Match with Notes`, `Not Suitable — Allergy Alert`, `Insufficient INCI Data`, `Accessory / Tool`, `Complete Skin ID to Check`).
2. **Xác thực bắt buộc & Popup Hoàn tất Skin ID 30 giây (`SkinIdQuickModal.jsx`):**
   - Đặt `[Authorize]` cho `POST /api/v1/tools/analyze-inci` và `GET /api/v1/tools/skintype-guide`.
   - Khách chưa đăng nhập bấm *"Deep Formula Analysis"* hoặc vào `/ingredient-analyzer` sẽ được mời đăng nhập và tự động chuyển hướng lại sau khi đăng nhập.
   - Khách đã đăng nhập nhưng chưa thiết lập hồ sơ da được hiển thị **Popup 30-Second Digital Skin ID** ngay tại chỗ để chọn loại da và danh sách dị ứng.
3. **Xử lý 2 tầng cho 945 sản phẩm thiếu thành phần:**
   - Làm sạch chuỗi giả `"No ingredients listed"` trong PostgreSQL `products.ingredient_list_raw` và `scripts/seed_full_database.py`.
   - **Nhóm A (`Tools & Brushes` — 55 dụng cụ vật lý):** Ẩn tab INCI và nút *"Deep Formula Analysis"* trên PDP; giữ lại trên bộ lọc `"Safe for me"` với nhãn `Accessory / Tool`.
   - **Nhóm B (890 mỹ phẩm thiếu INCI từ hãng):** Ẩn nút *"Deep Formula Analysis"*, hiển thị thông báo `Insufficient INCI Data` minh bạch trên PDP, và **loại trừ khỏi bộ lọc `"Safe for me"`** trong `ProductRepository.cs`.
4. **Cơ sở tri thức `CosmeticKnowledgeBase.cs` & Phân loại Hương liệu 3 tầng:**
   - Xây dựng từ điển hơn 120+ hoạt chất cốt lõi + luật nhận diện tự động + từ điển đồng nghĩa dị ứng (`AllergenSynonyms`).
   - Phân biệt rõ: (1) Chiết xuất/nước hoa thực vật dịu nhẹ (`Rosa Damascena Flower Water`, `Vanilla`, `Aloe`, `Cica`) + Cồn béo dưỡng ẩm (`Cetearyl Alcohol`, `Cetyl Alcohol`) — không bao giờ báo cảnh báo giả; (2) Tinh dầu cảm giác (`Peppermint`, `Menthol`); (3) Hương liệu tổng hợp & 26 chất dị ứng hương liệu EU (`Parfum`, `Limonene`, `Linalool`...).
5. **Hiển thị INCI 3 tầng (3-Tier Progressive Disclosure) trên cả PDP và Analyzer:**
   - **Tier 1:** Kết luận cá nhân hóa + Đối chiếu dị ứng.
   - **Tier 2:** Dải **3–6 Key Notable Ingredients** (tên thân thiện + tên INCI + giải thích 1 dòng) + **Functional Role Grouping** (gom nhóm nền, sắc tố, bảo quản, hương liệu kèm số lượng).
   - **Tier 3:** Danh sách INCI đầy đủ thu gọn mặc định (`View Full Packaging INCI List`).

## Kế hoạch tiếp theo
- Tiếp tục các nhiệm vụ tiếp theo trong Phase 1 (Giỏ hàng kiểm tra xung đột hoạt chất & Tư vấn AI).
