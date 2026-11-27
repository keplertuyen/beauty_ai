---
change_id: CHANGE-ADMIN-CONSOLE-V2
title: Nâng cấp Admin Console V2 — Left Sidebar Shell, Quản lý toàn diện (Sản phẩm/Upload ảnh, Review, Đơn hàng, Người dùng, Feedback/Support, INCI & Xung đột)
status: approved
owner: tech-lead
created_at: 2026-11-27
doc: change-proposal
precedence: 5
---

# Proposal — CHANGE-ADMIN-CONSOLE-V2

## 1. Bối cảnh & Mục tiêu
Trang Admin hiện tại chỉ có thanh tab ngang với 3 mục cơ bản (Sản phẩm, Đơn hàng COD, Biểu đồ). Cần nâng cấp thành **Admin Console V2** chuyên nghiệp, trực quan với **Left Sidebar App Shell**, bổ sung đầy đủ nghiệp vụ cốt lõi:
1. **Tổng quan (Dashboard Overview):** KPI cards (Doanh thu, Đơn chờ xử lý, Sản phẩm, Người dùng, Feedback mới), khối việc cần xử lý ngay, biểu đồ phân tích.
2. **Sản phẩm (CRUD + Upload ảnh):** Hỗ trợ nhập URL hoặc upload ảnh từ máy kèm live preview, quản lý tên, giá, thành phần INCI, tồn kho, trạng thái.
3. **Đánh giá & Review (Moderation):** Xem, lọc theo sao/sản phẩm/trạng thái, ẩn/hiện hoặc xóa review spam; tự động tính lại `avg_rating` và `reviews_count` của sản phẩm.
4. **Đơn hàng / Giao hàng:** Tìm kiếm/lọc theo trạng thái & từ khóa, Drawer xem chi tiết từng sản phẩm, cập nhật trạng thái giao hàng, mã vận đơn (`tracking_number`) và ghi chú vận chuyển (`admin_notes`).
5. **Quản lý Người dùng:** Tìm kiếm, lọc vai trò/trạng thái, xem số đơn & tổng chi tiêu, khóa/mở khóa tài khoản, phân quyền (`Customer` / `Admin`, chặn tự khóa/hạ quyền chính mình). **Tuân thủ `NFR-PRIV-08`**: tuyệt đối không trả về `SkinProfile` hay `UserAllergy`.
6. **Hỗ trợ & Feedback (`support_tickets`):** Kết nối form liên hệ từ `SupportCenter.jsx` vào DB (sinh mã `#SP-XXXX`) và xây dựng hộp thư Support Inbox trong Admin (lọc trạng thái, ghi chú phản hồi, cập nhật trạng thái).
7. **Trí tuệ Mỹ phẩm (Thành phần INCI & Quy tắc Xung đột):** CRUD từ điển thành phần (`ingredients`) và quy tắc xung đột hoạt chất (`conflict_rules`).

## 2. Quy mô Đợt 1 vs Đợt 2
- **Đợt 1 (triển khai ngay):** Toàn bộ 7 mục cốt lõi trên + Left Sidebar App Shell.
- **Đợt 2 (tiếp theo):** Cấu hình tỷ giá USD/VND (`app_settings`) & Quản lý Thương hiệu / Danh mục (CRUD).
