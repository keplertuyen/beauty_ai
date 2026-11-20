---
doc: change-proposal
title: CHANGE-ADMIN-PRODUCT-CRUD — Proposal
status: approved
precedence: 3
owner: pm-ba
last_reviewed: 2026-11-20
---

# Change Proposal

## Change ID
CHANGE-ADMIN-PRODUCT-CRUD

## Summary
Hoàn thiện CRUD sản phẩm cho Admin Console: danh sách quản trị (tìm kiếm, lọc, phân trang), xem chi tiết, sửa, "xoá" (ngừng bán — soft delete) và khôi phục; đồng thời đóng lỗ hổng phân quyền của toàn bộ `/api/v1/admin/*` và bổ sung tài khoản Admin khởi tạo từ biến môi trường.

## Business reason
- Trước change: Admin chỉ **tạo** được sản phẩm; không sửa / ngừng bán được → không vận hành được danh mục (`FR-ADM-02`, BO-07).
- `AdminController` **không có `[Authorize]`** → bất kỳ ai cũng xem được đơn hàng (PII: tên, SĐT, địa chỉ), đổi trạng thái đơn, tạo sản phẩm. Vi phạm `NFR-SEC-02/03`, E2E-08.
- Seed hiện tại không có tài khoản Admin đăng nhập được (hash trong `seed_data.sql` là bcrypt, hệ thống dùng PBKDF2 — ADR-004).

## Scope
### In scope
- API: `GET/POST /admin/products`, `GET/PUT/DELETE /admin/products/{id}`, `PATCH /admin/products/{id}/restore`.
- Trạng thái bán `selling_status` (`Active` / `Draft` / `Discontinued`) — DELETE = chuyển `Discontinued`; khách chỉ thấy `Active`.
- Đồng bộ lại bảng `product_ingredients` khi danh sách INCI thay đổi (create + update).
- Sửa lỗi Create: brand/category không tồn tại → 400 (không fallback âm thầm); slug luôn duy nhất.
- `[Authorize(Roles = "Admin")]` cho toàn bộ `AdminController`.
- Bootstrap Admin từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`ADMIN_FULL_NAME` tuỳ chọn).
- Frontend: khu "Quản lý sản phẩm" (bảng + bộ lọc + phân trang + form Thêm/Sửa dùng chung + xác nhận ngừng bán + khôi phục).

### Out of scope (follow-up)
- CRUD Brand / Category (`FR-ADM-03`).
- Giá khuyến mãi, nhãn đặc tính (`FR-ADM-02` AC-01 — cột chưa tồn tại trong schema Phase 1).
- Nhật ký kiểm toán (`FR-ADM-02` AC-04, `NFR-SEC-09`) — cần bảng `audit_logs` riêng; ghi nhận là **gap Must** cần change kế tiếp.
- Upload ảnh (`POST /admin/products/{id}/image`) — vẫn nhập URL.
- Xoá cứng (hard delete) — không cung cấp.

## Affected users / systems
- Admin (Admin Console), Customer (catalog/PDP/similar/checkout chỉ thấy sản phẩm `Active`).
- Database: thêm cột `products.selling_status`, `products.updated_at`.

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Bật `[Authorize]` làm trang `/admin` báo lỗi nếu chưa có Admin | High | Bootstrap Admin từ env; UI hiển thị thông báo "cần đăng nhập Admin" khi 401/403 |
| DB chưa chạy migration → EF lỗi cột không tồn tại | High | Script migration idempotent `docs/db-schema/migrations/2026-11-20_product_selling_status.sql`; ghi rõ trong design/rollout |
| Saved routine / giỏ hàng chứa sản phẩm vừa ngừng bán | Medium | Routine bỏ qua SP không còn bán; checkout trả lỗi rõ "không còn kinh doanh" |
| Sửa INCI làm dữ liệu phân tích cũ | Medium | Re-sync `product_ingredients` trong cùng transaction |

## Approval
| Role | Name | Status | Date |
|---|---|---|---|
| Owner (solo) | trucuyen | Approved (crud_plan.md) | 2026-11-20 |
