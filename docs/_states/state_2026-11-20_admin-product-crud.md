---
doc: state-2026-11-20-admin-product-crud
title: State Snapshot — 2026-11-20 — Admin Product CRUD, Soft Delete & Admin Role Guard
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-11-20
---

# state_2026-11-20_admin-product-crud

## Đang ở đâu
- **Phase:** Phase 1 MVP — Admin Console Product CRUD Enhancement (`CHANGE-ADMIN-PRODUCT-CRUD`)
- **Branch / Worktree:** `change/change-admin-product-crud` (`/Users/trucuyen/Documents/beauty_ai-change-admin-product-crud`)
- **Trạng thái:** Hoàn tất toàn bộ CRUD sản phẩm cho Admin Console (Create, Read/Search/Filter/Paginate, Update, Soft Delete / Discontinue, Restore), phân quyền `[Authorize(Roles = "Admin")]` và khởi tạo tài khoản Admin từ biến môi trường.

## Phiên này đã làm gì
1. **ADR & Change Spec (`CHANGE-ADMIN-PRODUCT-CRUD`, `ADR-014`):**
   - Thiết kế cơ chế xoá logic (soft delete) qua cột `selling_status` (`Active` | `Draft` | `Discontinued`) và `updated_at` trên bảng `products` nhằm bảo toàn tuyệt đối đánh giá (`reviews`) và lịch sử đơn hàng (`order_items`).
   - Tạo script migration idempotent `docs/db-schema/migrations/2026-11-20_product_selling_status.sql` và cập nhật `docs/db-schema/schema_phase_1.sql`.
2. **Backend (`IAdminProductService` / `AdminProductService`, `AdminController`, `ProductRepository`):**
   - Bổ sung đầy đủ các endpoint quản trị sản phẩm:
     + `GET /api/v1/admin/products` (tìm kiếm, lọc brand/category/status, phân trang).
     + `GET /api/v1/admin/products/{id}` (xem chi tiết sản phẩm ở mọi trạng thái).
     + `POST /api/v1/admin/products` (validate chặt chẽ, không fallback âm thầm khi sai brand/category, tự sinh `slug` duy nhất, đồng bộ `product_ingredients`).
     + `PUT /api/v1/admin/products/{id}` (cập nhật thông tin, ghi `UpdatedAtUtc`, tự động đồng bộ lại `product_ingredients` khi chuỗi INCI thay đổi).
     + `DELETE /api/v1/admin/products/{id}` (chuyển `SellingStatus = "Discontinued"`, ẩn khỏi catalog/PDP/similar và chặn đặt hàng mới trong `OrderService`).
     + `PATCH /api/v1/admin/products/{id}/restore` (khôi phục sản phẩm về `Active` giữ nguyên ID và lịch sử).
3. **Bảo mật & Khởi tạo Admin (`[Authorize(Roles = "Admin")]`, `AdminBootstrapper`):**
   - Áp dụng `[Authorize(Roles = "Admin")]` cho toàn bộ `AdminController`.
   - Thêm `AdminBootstrapper` tự động tạo hoặc nâng cấp tài khoản Admin từ biến môi trường `ADMIN_EMAIL` và `ADMIN_PASSWORD` (>= 8 ký tự, băm PBKDF2, tự nâng cấp hash bcrypt cũ trong `seed_data.sql`).
4. **Frontend (`AdminProductSection.jsx`, `ProductFormModal.jsx`, `AdminDashboard.jsx`):**
   - Xây dựng khu vực **Quản Lý Danh Mục Sản Phẩm** trên `/admin` với bảng danh sách tách riêng 2 cột Thương hiệu và Danh mục, ô tìm kiếm nhanh (gõ và nhấn `Enter`, không còn nút Search thừa), bộ lọc Thương hiệu / Danh mục / Trạng thái và phân trang.
   - Tinh gọn giao diện Admin theo phong cách tối giản (loại bỏ toàn bộ icon/emoji gây rối mắt, chia 3 tab làm việc rõ ràng: `Product Catalog (CRUD)`, `COD Orders`, `Analytics & Charts`).
   - Nâng cấp `GET /api/v1/admin/dashboard` sang truy vấn `GetAdminAnalyticsAsync` tính toán trực tiếp trên 100% dữ liệu thật trong PostgreSQL (Top 10 sản phẩm xếp hạng theo tổng số lượng đánh giá & điểm trung bình thực tế từ bảng `reviews`, phân bố danh mục/thương hiệu/mức giá trên toàn bộ 8,494 sản phẩm).
   - Xây dựng `ProductFormModal` dùng chung cho Thêm mới & Chỉnh sửa với danh sách Brand/Category lấy trực tiếp từ API, chọn loại da phù hợp, trạng thái bán, tồn kho, dung tích và chuỗi INCI.
   - Thêm hộp thoại xác nhận Ngừng bán và nút Khôi phục 1 chạm.
5. **Kiểm thử & Quality Gate:**
   - 46/46 Unit Tests (`BeautyAI.UnitTests`) và 12/12 Architecture Tests (`BeautyAI.ArchitectureTests`) XANH.
   - Frontend build (`tsc -b && vite build`) thành công.

## Kế hoạch tiếp theo
- Chạy `./syntheprise gate` và sẵn sàng merge / archive change khi cần.
