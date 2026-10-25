---
doc: phase-plan-p8
title: Phase 8 Plan — ADMIN CONSOLE, ĐÁNH GIÁ & HỖ TRỢ
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 8 — ADMIN CONSOLE, ĐÁNH GIÁ & HỖ TRỢ

# 10. PHASE 8 — ADMIN CONSOLE, ĐÁNH GIÁ & HỖ TRỢ

| | |
|---|---|
| **Mục tiêu** | ✅ **HOÀN CHỈNH TÍNH NĂNG** — sàn vận hành được bởi một quản trị viên |
| **Khối lượng** | **72 giờ** · 18 ngày |
| **Module** | M13 (5 FR) · M14 (16 FR) · M15 (6 FR) |

### `WG-P8-01` — Nhật ký kiểm toán & khung Admin · **10h**

| Task | Giờ | FR/BR |
|---|---|---|
| ⭐ **`AuditInterceptor`** — `SaveChangesInterceptor` ghi TỰ ĐỘNG mọi thay đổi | 3,5 | `BR-SEC-05`, `FR-ADM-16` |
| `AdminShell` + điều hướng 11 trang con + tách gói JS riêng | 3 | `NFR-PERF-11` |
| `GET /admin/dashboard` + `DashboardPage` (KPI, biểu đồ) | 3 | `FR-ADM-01` |
| ⭐ `AuditLogPage` + lọc theo người/hành động/khoảng ngày | 0,5 | `FR-ADM-16` |

> ⭐ **Vì sao `AuditInterceptor` thay vì ghi log ở từng chỗ:** `BR-SEC-05` yêu cầu **mọi** hành động thay đổi dữ liệu của Admin được ghi nhật ký. Nếu để Dev (hoặc AI agent) tự nhớ gọi `_audit.Log(...)` ở từng nơi thì **chắc chắn sẽ thiếu**. Chặn ở tầng hạ tầng là cách duy nhất đạt được chữ "mọi".

### `WG-P8-02` — Quản lý danh mục, sản phẩm, thành phần · **16h**

| Task | Giờ | FR |
|---|---|---|
| CRUD sản phẩm + **sửa giá KHÔNG ảnh hưởng đơn cũ** + tự chuyển `NHAP` khi thiếu dữ liệu | 4 | `FR-ADM-02` |
| CRUD danh mục & thương hiệu + **chặn xóa khi còn sản phẩm** | 2,5 | `FR-ADM-03` |
| ⭐ CRUD từ điển thành phần + **lọc "chưa đánh giá" sắp theo số SP chứa nó** | 3,5 | `FR-ADM-04` AC-04 |
| Tính lại dữ liệu dẫn xuất ở tiến trình nền khi sửa từ điển | 2 | `FR-ADM-04` AC-03 |
| ⭐ CRUD quy tắc xung đột — **chặn lưu nếu không có nguồn / nếu cấp B-C ở mức CAO** | 2,5 | `FR-CONF-06`, `INV-03` |
| CRUD nhóm hoạt chất | 1,5 | `BR-CONF-01` |

> ⭐ **"Lọc thành phần chưa đánh giá, sắp theo số sản phẩm chứa nó"** (`FR-ADM-04` AC-04) là tính năng nhỏ nhưng có tác động lớn: nó biến việc mở rộng từ điển từ *"còn 5.000 thành phần chưa làm"* thành *"làm 20 thành phần tiếp theo này sẽ tăng tỷ lệ phủ thêm 4%"*. Đó là khác biệt giữa một việc bất khả thi và một việc làm được.

### `WG-P8-03` — Quản lý đơn hàng, voucher, tỷ giá, cấu hình · **14h**

| Task | Giờ | FR |
|---|---|---|
| Quản lý đơn: tìm theo mã/email/trạng thái/ngày + xem cảnh báo xung đột đã hiện | 3 | `FR-ADM-06` |
| Đổi trạng thái đơn theo máy trạng thái + **lý do bắt buộc khi hủy đơn đã thanh toán** | 2,5 | `FR-ORD-08` |
| CRUD voucher + chặn mã trùng | 2,5 | `FR-ADM-07` |
| ⭐ Cập nhật tỷ giá + lịch sử + **xác nhận lần hai khi lệch > 20%** | 2,5 | `FR-ADM-08` |
| Trang cấu hình hệ thống (toàn bộ khóa `app_settings`, **có mô tả ý nghĩa**) | 2 | `FR-ADM-09` |
| Đặt lại mật khẩu cho khách + cờ buộc đổi | 1,5 | `FR-AUTH-06` |

### `WG-P8-04` — Quản lý chatbot, hội thoại, chuyển tiếp · **10h**

| Task | Giờ | FR |
|---|---|---|
| CRUD ý định Tầng 1 + **có hiệu lực ngay, không cần triển khai lại** | 3 | `FR-ADM-10` AC-02 |
| ⭐ Quản lý vùng chặn — **chặn XÓA vùng chặn hệ thống** | 1,5 | `FR-ADM-10` AC-03 |
| ⭐ `ConversationLogPage` — **đã ẩn danh hóa**, không thấy email/tên/blacklist | 3 | `FR-ADM-14`, `INV-07` |
| `HandoffQueuePage` + tra mã + đổi trạng thái xử lý | 2,5 | `FR-ADM-15` |

### `WG-P8-05` — Báo cáo & xuất Excel · **10h**

| Task | Giờ | FR |
|---|---|---|
| Báo cáo doanh thu (Dapper + SQL trong tệp có phiên bản) theo ngày/tháng/quý | 3 | `FR-ADM-11` |
| ⚠️ **Doanh thu tính bằng VND ĐÃ ĐÓNG BĂNG theo từng đơn**, không quy đổi lại | 1 | `FR-ADM-11` AC-02 |
| Báo cáo sản phẩm & tồn kho + **tỷ lệ phủ hồ sơ INCI** | 2 | `FR-ADM-12`, `BO-04` |
| Báo cáo sử dụng AI: tỷ lệ theo tầng · chi phí tích lũy · số lần bịa sản phẩm | 2 | `BO-05`, `RISK-03`, `RISK-04` |
| Xuất Excel đơn hàng & sản phẩm + **kiểm tra tiếng Việt không lỗi font** | 2 | `FR-ADM-13` |

### `WG-P8-06` — Đánh giá & Trung tâm hỗ trợ · **12h**

| Task | Giờ | FR |
|---|---|---|
| Viết đánh giá + ⚠️ **xác minh ĐÃ MUA (đơn `DA_GIAO`)** + sửa đánh giá cũ | 3 | `FR-REV-03` |
| Bình chọn hữu ích + kiểm duyệt (ẩn, **không xóa vật lý**) | 2 | `FR-REV-04`, `05` |
| Trung tâm hỗ trợ + FAQ accordion + tìm trong FAQ | 2 | `FR-SUP-01` |
| ⭐ **Trang phương pháp tính Điểm Phù Hợp** (công khai cách tính) | 1,5 | **`FR-SUP-02`** |
| ⭐ **Trang tiêu chí xếp hạng thuật toán** — **NGHĨA VỤ PHÁP LÝ** | 1,5 | **`CMP-20`, `FR-PDP-13`** |
| ⭐ **Trang chính sách dữ liệu cá nhân** — nêu rõ bên thứ ba nhận dữ liệu | 1,5 | **`FR-SUP-03`, `CMP-12`** |
| Thông báo trong ứng dụng + form yêu cầu hỗ trợ | 0,5 | `FR-SUP-04`, `05` |

> ⭐ **Ba trang nội dung ở cuối WG này là nghĩa vụ pháp lý, không phải trang phụ.** `CMP-20` (công khai tiêu chí thuật toán) và `CMP-12` (minh bạch bên thứ ba) là yêu cầu của pháp luật thương mại điện tử và bảo vệ dữ liệu cá nhân. **Không được để placeholder.**

## 10.1. Tiêu chí hoàn thành Phase 8

```text
☐ Đăng nhập Admin → bảng điều khiển tải ≤ 2s với đầy đủ KPI
☐ Sửa giá sản phẩm → giá mới hiện ở phía khách NGAY; đơn cũ KHÔNG ĐỔI
☐ ⭐ Đổi tỷ giá lệch > 20% → yêu cầu xác nhận lần hai; xem được lịch sử
☐ ⭐ Thử tạo quy tắc xung đột không có nguồn → BỊ TỪ CHỐI
☐ ⭐ Thử tạo quy tắc cấp B ở mức CAO → BỊ TỪ CHỐI
☐ ⭐ Thử xóa vùng chặn "CHAN_DOAN_BENH" → BỊ TỪ CHỐI (bất biến hệ thống)
☐ Thử chuyển trạng thái đơn không hợp lệ → bị từ chối, nêu chuyển đổi được phép
☐ Hủy đơn đã thanh toán mà không nhập lý do → bị từ chối
☐ ⭐ Xem nhật ký hội thoại → KHÔNG thấy email/tên/SĐT/blacklist của khách (INV-07)
☐ ⭐ Mở mọi trang Admin, thử mọi chức năng → KHÔNG có đường nào đọc được hồ sơ da
☐ Xem nhật ký kiểm toán → thấy ĐẦY ĐỦ mọi thay đổi vừa làm, có giá trị trước/sau
☐ Xuất Excel → mở bằng Excel/Numbers → tiếng Việt hiển thị ĐÚNG
☐ Viết đánh giá khi chưa mua → bị từ chối với lý do rõ
☐ Viết đánh giá cho SP đã mua (đơn DA_GIAO) → thành công, có nhãn loại da
☐ ⭐ Ba trang pháp lý (phương pháp tính · tiêu chí xếp hạng · chính sách dữ liệu)
   có nội dung THẬT, không placeholder
☐ Mọi chỉ số trên giao diện bấm được để xem cách tính               (UI-08)
☐ Coverage ≥ 70% · gate XANH
```

---


