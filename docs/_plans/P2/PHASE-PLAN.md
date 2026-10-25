---
doc: phase-plan-p2
title: Phase 2 Plan — TÀI KHOẢN, XÁC THỰC & VỎ ỨNG DỤNG
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 2 — TÀI KHOẢN, XÁC THỰC & VỎ ỨNG DỤNG

# 4. PHASE 2 — TÀI KHOẢN, XÁC THỰC & VỎ ỨNG DỤNG

| | |
|---|---|
| **Mục tiêu** | ✅ **BẢN CHẠY ĐƯỢC ĐẦU TIÊN** — mở trình duyệt, đăng ký, đăng nhập, điều hướng, thấy danh sách sản phẩm thô |
| **Khối lượng** | **32 giờ** · 8 ngày |
| **Module** | M01 (7 FR) |
| **Trong phạm vi** | Xác thực cookie · băm PBKDF2 · khóa tạm · phân quyền · vỏ React (navbar, footer, routing) · chuyển hệ thống thiết kế từ prototype · sinh client OpenAPI |
| **Ngoài phạm vi** | Smart Filter · PDP đầy đủ · giỏ hàng |

### `WG-P2-01` — Xác thực backend · **12h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `AuthServiceTests`, `LockoutTrackerTests` | 2 | QA-first |
| `PasswordHasherAdapter` dùng `PasswordHasher<AppUser>` (PBKDF2) | 1,5 | `BR-AUTH-02`, `INV-08` |
| Đăng ký + chính sách mật khẩu + danh sách 100 mật khẩu phổ biến | 2 | `FR-AUTH-01`, `BR-AUTH-03` |
| Đăng nhập + **phép băm giả chống đo thời gian** + khóa tạm 5/15 phút | 2,5 | `FR-AUTH-02`, `BR-AUTH-04` |
| Cookie httpOnly + `SecurityStampCheckMiddleware` | 2 | ADR-004, `BR-AUTH-05` |
| Policy phân quyền + token CSRF | 1,5 | `FR-AUTH-07`, `NFR-SEC-04` |
| ⭐ `PasswordHashStorageTests` — truy vấn DB xác minh không có mật khẩu dạng rõ | 0,5 | `DC-19` |

### `WG-P2-02` — Vỏ ứng dụng React & hệ thống thiết kế · **12h**

| Task | Giờ | Ghi chú |
|---|---|---|
| Chuyển `css/style.css` của prototype → `styles/tokens.css` + `base.css` + `components.css` | 3 | **ADR-007 — giữ nguyên, không chuyển Tailwind** |
| Thiết lập Vite + TS strict + React Router v7 + TanStack Query + Zustand | 2 | `TD` §10.1 |
| Sinh `schema.d.ts` từ OpenAPI; cấu hình `openapi-fetch` với `credentials: 'include'` | 2 | ADR-008 |
| Component vỏ: `Navbar` · `Footer` · `MobileMenu` · `CurrencyToggle` · `ToastHost` | 3 | Chuyển từ prototype |
| Component phản hồi: `Skeleton` · `EmptyState` · `ErrorState` · `DegradedBanner` | 2 | ⚠️ **`UI-05` — làm SỚM để mọi trang sau dùng được** |

> 🔑 **Vì sao làm 4 component trạng thái ngay Phase 2:** `UI-05` yêu cầu **mọi** màn hình xử lý đủ 4 trạng thái. Nếu không có component chuẩn từ đầu, mỗi trang sẽ tự làm một kiểu, và khi rà soát ở P9 sẽ phải sửa 28 trang. Làm trước tốn 2 giờ, làm sau tốn 10 giờ.

### `WG-P2-03` — Trang xác thực & trang hồ sơ cơ bản · **8h**

| Task | Giờ | FR |
|---|---|---|
| `LoginPage` · `RegisterPage` (trang độc lập, không chỉ modal) | 2,5 | `G-23`, `FR-AUTH-01`, `02` |
| `ChangePasswordPage` + luồng **buộc đổi mật khẩu** | 1,5 | `FR-AUTH-04`, `FR-AUTH-06` AC-02 |
| `AuthGate` (bảo vệ route) + `authStore` (không chứa token) | 1,5 | `FE-03` |
| Trang hồ sơ cơ bản: sửa họ tên, điện thoại, địa chỉ mặc định | 2 | `FR-AUTH-05` |
| Trang 404 + trang lỗi hệ thống | 0,5 | `FR-SUP-06` |

## 4.1. Tiêu chí hoàn thành Phase 2

```text
☐ Mở http://localhost:5173 → đăng ký → đăng nhập → thấy tên mình trên navbar
☐ Sai mật khẩu 5 lần → bị khóa 15 phút (kiểm chứng bằng tay + test)
☐ Thông báo lỗi đăng nhập KHÔNG tiết lộ email có tồn tại hay không
☐ Truy vấn DB: cột password_hash là giá trị băm, KHÔNG phải mật khẩu
☐ Đổi mật khẩu → phiên ở tab khác bị đăng xuất (BR-AUTH-05)
☐ CUSTOMER gọi /api/v1/admin/* → 403 (cả giao diện và API trực tiếp)
☐ Đổi tiền tệ trên navbar hoạt động (dù chưa có giá thật)
☐ 4 component trạng thái (loading/empty/error/degraded) đã có và dùng được
☐ Hệ thống thiết kế hiển thị đúng như prototype (so sánh ảnh)
☐ Coverage ≥ 70% dòng · ./syntheprise gate XANH
```

---


