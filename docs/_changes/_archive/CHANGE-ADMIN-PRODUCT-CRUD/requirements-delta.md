---
doc: requirements-delta
title: CHANGE-ADMIN-PRODUCT-CRUD — Requirements Delta
status: approved
precedence: 3
owner: ba
last_reviewed: 2026-11-20
---

# Requirements Delta

## MODIFIED Requirements

### FR-ADM-02 — Quản lý sản phẩm (Must)
- Current behavior: chỉ có `POST /admin/products`; không liệt kê / sửa / ngừng bán; brand/category sai tên bị thay âm thầm.
- New behavior: Admin tìm, xem, tạo, sửa, ngừng bán và khôi phục sản phẩm. "Xoá" là **ngừng bán** (soft delete) — dữ liệu, review và lịch sử đơn được giữ nguyên.
- Acceptance Criteria (bổ sung, đánh số tiếp theo AC hiện có trong M14):
  - **AC-ADM-02-05** GIVEN Admin WHEN mở danh sách quản trị THEN thấy mọi sản phẩm (kể cả `Draft`, `Discontinued`), lọc được theo từ khoá / brand / category / trạng thái, có phân trang.
  - **AC-ADM-02-06** GIVEN dữ liệu hợp lệ WHEN tạo sản phẩm THEN trả 201, `code` và `slug` duy nhất, trạng thái mặc định `Active` (hoặc `Draft` nếu Admin chọn).
  - **AC-ADM-02-07** GIVEN tên rỗng, giá ≤ 0, tồn kho < 0, INCI rỗng, loại da ngoài danh sách cho phép, brand/category không tồn tại hoặc trạng thái không hợp lệ WHEN tạo/sửa THEN trả 400 kèm thông báo lỗi rõ; **không** thay bằng giá trị mặc định.
  - **AC-ADM-02-08** GIVEN sản phẩm tồn tại WHEN Admin sửa THEN thông tin mới có hiệu lực ngay, `updated_at` được cập nhật; đơn hàng cũ giữ nguyên giá (BR-ORDER-05, ADR-010).
  - **AC-ADM-02-09** GIVEN Admin đổi danh sách INCI WHEN lưu THEN liên kết `product_ingredients` được dựng lại theo INCI mới (khớp từ điển thành phần, giữ thứ tự); INCI không đổi thì không đụng tới liên kết.
  - **AC-ADM-02-10** GIVEN sản phẩm `Active` WHEN Admin "xoá" THEN trạng thái thành `Discontinued`; khách không còn thấy ở catalog / PDP (404) / gợi ý tương tự và không đặt mua được; review & đơn hàng cũ vẫn còn.
  - **AC-ADM-02-11** GIVEN sản phẩm `Discontinued` WHEN Admin khôi phục THEN trạng thái về `Active`, cùng ID / review như trước.
  - **AC-ADM-02-12** GIVEN id không tồn tại WHEN xem/sửa/xoá/khôi phục THEN trả 404.

### NFR-SEC-02 / E2E-08 — Kiểm soát quyền truy cập API Admin
- Current behavior: `/api/v1/admin/*` không yêu cầu xác thực.
- New behavior:
  - **AC-SEC-ADM-01** GIVEN không có token WHEN gọi bất kỳ endpoint `/api/v1/admin/*` THEN 401.
  - **AC-SEC-ADM-02** GIVEN token role `Customer` WHEN gọi `/api/v1/admin/*` THEN 403.
  - **AC-SEC-ADM-03** GIVEN token role `Admin` THEN được phép.

## ADDED Requirements

### FR-ADM-17 — Khởi tạo tài khoản Admin (Must)
- Description: Khi khởi động API, nếu cấu hình `ADMIN_EMAIL` và `ADMIN_PASSWORD`, hệ thống đảm bảo có tài khoản Admin tương ứng.
- Acceptance Criteria:
  - **AC-ADM-17-01** GIVEN email chưa tồn tại THEN tạo user role `Admin`, mật khẩu băm PBKDF2 (ADR-004).
  - **AC-ADM-17-02** GIVEN email đã tồn tại THEN đảm bảo role `Admin` và `is_active = true`; **không** ghi đè mật khẩu.
  - **AC-ADM-17-03** GIVEN thiếu một trong hai biến THEN bỏ qua, ghi log cảnh báo, API vẫn khởi động.
  - **AC-ADM-17-04** GIVEN mật khẩu < 8 ký tự THEN từ chối khởi tạo (log lỗi, không tạo user).
  - **AC-ADM-17-05** Mật khẩu không bao giờ được ghi ra log.

## Non-functional impact
| NFR | Impact | Test / Evidence |
|---|---|---|
| Security | Đóng lỗ hổng truy cập API Admin; admin bootstrap không lộ mật khẩu | `AdminAuthorizationTests`, `AdminBootstrapperTests` |
| Performance | Catalog thêm điều kiện `selling_status = 'Active'` (có index) | Migration tạo index |
| Observability | Log cảnh báo khi không cấu hình Admin | Review |
| Privacy | Đơn hàng (PII) chỉ Admin xem được | `AdminAuthorizationTests` |
