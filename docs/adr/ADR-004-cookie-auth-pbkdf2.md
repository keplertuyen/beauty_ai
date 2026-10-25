---
doc: adr-adr-004
title: ADR-004 — Xác thực: Cookie httpOnly + băm mật khẩu PBKDF2
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-004 — Xác thực: Cookie httpOnly + băm mật khẩu PBKDF2


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `CON-04`: *"Authentication đơn giản với username và password lưu ở local database"*. PRD v2.0 đề xuất JWT. Cần giải thích rõ "đơn giản" nghĩa là gì. |

**Diễn giải ràng buộc:**

| "Đơn giản" NGHĨA LÀ | "Đơn giản" KHÔNG NGHĨA LÀ |
|---|---|
| ✅ Không OAuth / SSO / nhà cung cấp danh tính ngoài | ❌ Lưu mật khẩu dạng rõ |
| ✅ Không xác thực hai yếu tố | ❌ Băm MD5/SHA1 không muối |
| ✅ Không liên kết tài khoản xã hội | ❌ Bỏ kiểm tra quyền phía máy chủ |
| ✅ Bảng `users` tự quản trong DB cục bộ | ❌ Để mật khẩu trong log hay thông báo lỗi |

**Các phương án cho cơ chế phiên:**

| | Cookie httpOnly ✅ | JWT trong `localStorage` | JWT trong bộ nhớ + refresh token cookie |
|---|---|---|---|
| Chống đánh cắp token qua XSS | ✅ **JavaScript không đọc được cookie httpOnly** | ❌ **XSS đọc được token ngay** | 🔸 Một phần |
| Độ phức tạp triển khai | ✅ **Thấp nhất** — ASP.NET Core có sẵn | Trung bình | **Cao** (phải tự xử lý luồng làm mới, đua tranh, xoay token) |
| Vô hiệu hóa phiên khi đổi mật khẩu (`BR-AUTH-05`) | ✅ **Dễ** (phiên ở phía máy chủ, đổi `security_stamp` là xong) | ❌ **Khó** — JWT không thu hồi được trước khi hết hạn | 🔸 Cần danh sách thu hồi |
| Cần CORS với `credentials` khi dev (cổng khác nhau) | ⚠️ Có, nhưng cấu hình một lần | Không | Không |
| Phù hợp "đơn giản" | ✅ | 🔸 | ❌ |

**Quyết định:**

| Thành phần | Lựa chọn |
|---|---|
| **Băm mật khẩu** | `PasswordHasher<AppUser>` của ASP.NET Core (`Microsoft.Extensions.Identity.Core`) — **PBKDF2-HMAC-SHA512, 100.000 vòng lặp, muối 128-bit, định dạng v3**. Có sẵn trong nền tảng, **không cần thư viện bên thứ ba**, và tự động nâng cấp định dạng băm khi .NET nâng ngưỡng |
| **Phiên** | **Cookie xác thực của ASP.NET Core**: `HttpOnly=true`, `SameSite=Lax`, `Secure=true` (ở môi trường HTTPS), hạn 7 ngày trượt (`BR-AUTH-05`) |
| **Vô hiệu hóa phiên** | Cột `security_stamp` trên `users`; đổi mật khẩu → đổi stamp → mọi cookie cũ bị từ chối ở middleware xác thực (`BR-AUTH-05`) |
| **Chống dò mật khẩu** | Cột `failed_login_count` + `lockout_until` trên `users`; 5 lần sai → khóa 15 phút (`BR-AUTH-04`) |
| **Phân quyền** | Policy-based authorization của ASP.NET Core: policy `RequireAdmin`, `RequireCustomer`; **kiểm tra chủ sở hữu** trong Application layer (`NFR-SEC-03`) |

> **Không dùng ASP.NET Core Identity đầy đủ** (toàn bộ hệ thống UI/store/claims) — chỉ dùng `PasswordHasher`. Lý do: Identity đầy đủ mang theo nhiều bảng và khái niệm không cần thiết → vi phạm nguyên tắc chống over-engineering. **Chỉ lấy đúng thứ cần: hàm băm đã được kiểm nghiệm.**

**Hệ quả:** Frontend **không lưu bất kỳ token nào trong JavaScript**. Mọi lệnh gọi API dùng `credentials: 'include'`. Cần cấu hình CORS cho `http://localhost:5173` ở môi trường dev. Cần token chống CSRF cho các phương thức thay đổi dữ liệu (`NFR-SEC-04`).

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-08 (mật khẩu không bao giờ ở dạng rõ)
