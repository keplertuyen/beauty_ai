---
doc: state-2026-11-08-sprint-3-4-routine-reviews-admin
title: State Snapshot — 2026-11-08 — Sprint 3 & Sprint 4 Implementation Completed
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-11-08
---

# state_2026-11-08_sprint-3-4-routine-reviews-admin

## Đang ở đâu
- **Phase:** Phase 1 MVP (Week 3 & Week 4)
- **Repo:** `keplertuyen/beauty_ai` (main)
- **Trạng thái:** Hoàn tất toàn bộ các tính năng từ Sprint 3 (T3.1 - T3.4) sang Sprint 4 (T4.1 - T4.4), sẵn sàng cho Demo đồ án và launch Production.

## Phiên này đã làm gì
1. **T3.4 — Tích hợp Reviews 1M trên trang PDP & B-Tree Index:**
   - Hoàn thiện truy vấn `GET /api/v1/products/{id}/reviews` tối ưu với chỉ mục kép B-Tree `idx_reviews_product_skin` (hơn 1.094.187 bản ghi đánh giá, phản hồi dưới 20ms).
   - Thêm tab lọc theo loại da ("All Reviews", "Oily Skin", "Dry Skin", "Combination Skin", "Normal Skin").
   - Banner cá nhân hóa 1 chạm: "Xem người có DA [LOẠI DA] nói gì" tự động lọc theo hồ sơ Digital Skin ID của khách đang đăng nhập.
   - Thêm phân trang đánh giá (Pagination / Page Navigation) và hỗ trợ gửi review qua `POST /api/v1/products/{id}/reviews` & `POST /api/v1/reviews`.
2. **T4.1 — Routine Generator & Nút "Chat-to-Cart" (1-Click Checkout):**
   - Triển khai CSDL bảng `saved_routines` và entity `SavedRoutine`.
   - Xây dựng dịch vụ `RoutineService` và API `POST /api/v1/routines/generate`, `POST /api/v1/routines/save`, `GET /api/v1/routines/my-routines`, `DELETE /api/v1/routines/{id}`.
   - Thuật toán tự động sinh chu trình AM (Cleanse ➔ Tone/Antioxidant ➔ Day Moisturizer ➔ Sun Protection) và PM (Double Cleanse ➔ Targeted Active Treatment ➔ Night Recovery Cream) loại trừ tuyệt đối chất dị ứng trong Blacklist.
   - Kiểm tra xung đột hoạt chất nội bộ (Zero Active Ingredient Conflicts) qua 12 luật lâm sàng.
   - Trang giao diện `RoutineView.jsx` với nút **"Thêm Cả Bộ Vào Giỏ Hàng" (Chat-to-Cart)** đưa toàn bộ sản phẩm của chu trình vào giỏ hàng trong 1 lần nhấn.
3. **T4.2 — Tích hợp Trợ lý Da liễu AI Gemini API (`GeminiSkincareProvider`):**
   - Thiết kế interface `IAiSkincareProvider` tại tầng Application và cài đặt `GeminiSkincareProvider` tại tầng Infrastructure Adapter (tuân thủ nghiêm ngặt bài kiểm thử kiến trúc `ProviderLibrariesOnlyInAdapterLayerTests`).
   - Endpoint `POST /api/v1/ai/consult` kết nối Google Gemini API với System Prompt chuẩn y khoa:
     + Rào chắn dị ứng: Không bao giờ giới thiệu sản phẩm chứa thành phần trong Allergy Blacklist.
     + Rào chắn y khoa: Tuyệt đối không chẩn đoán bệnh lý da liễu nặng (chàm, vảy nến, u nang); hướng dẫn khám bác sĩ chuyên khoa.
     + Grounding: Chỉ gợi ý sản phẩm thực tế có trong kho hàng kèm giá USD ($).
     + Cơ chế dự phòng (Rule-based Fallback) vận hành trơn tru khi offline hoặc không có API key.
   - Cập nhật `ExpertConsult.jsx` hiển thị thẻ sản phẩm tương tác trực tiếp với nút "Thêm vào giỏ" ngay trong khung chat.
4. **T4.3 — Admin Dashboard tinh gọn:**
   - Endpoint `GET /api/v1/admin/dashboard` & `GET /api/v1/admin/kpis` hiển thị 4 thẻ KPI cốt lõi (Tổng sản phẩm, Tổng đơn hàng, Doanh thu USD, Đơn chờ xử lý).
   - Quản lý đơn hàng COD: Endpoint `GET /api/v1/admin/orders` và `PATCH /api/v1/admin/orders/{id}/status` cho phép chuyển trạng thái đơn hàng (`Pending` ➔ `Delivering` ➔ `Completed` ➔ `Cancelled`).
   - Bổ sung sản phẩm mới và nạp chuỗi INCI bao bì: Endpoint `POST /api/v1/admin/products` tự động chuẩn hóa hoạt chất.
5. **T4.4 — Tổng duyệt Demo, Build & Quality Gates:**
   - 100% các bài kiểm thử `BeautyAI.ArchitectureTests` (11/11) và `BeautyAI.UnitTests` (26/26) XANH.
   - Frontend Vite build thành công không có bất kỳ lỗi nào (`tsc -b && vite build` hoàn tất nhanh chóng).

## Kế hoạch tiếp theo
- Khởi động backend API và frontend server phục vụ người dùng trải nghiệm thực tế.
- Chuẩn bị slide thuyết trình và demo kịch bản hoàn chỉnh cho đồ án.
