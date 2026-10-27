---
doc: security-policy
title: Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân (Security Policy) — BeautyAI Platform
status: draft
precedence: 2
owner: Security Lead / Tech Lead
last_reviewed: 2026-10-27
---

# CHÍNH SÁCH BẢO MẬT & BẢO VỆ DỮ LIỆU — BeautyAI Platform

> Nguồn chân lý về luồng xác thực JWT Bearer Token, mã hóa mật khẩu PBKDF2 HMAC-SHA256 chuẩn OWASP, kiểm soát truy cập RBAC, header bảo mật và bảo vệ dữ liệu PII da liễu theo Nghị định 13/2023/NĐ-CP (Precedence 2 — Contracts).
> Bắt buộc tuân thủ: INV-04, INV-07, INV-08.

---

# 11. THIẾT KẾ BẢO MẬT & XÁC THỰC

## 11.1. Luồng xác thực & Băm Mật Khẩu
Hệ thống sử dụng thuật toán băm mật khẩu chuẩn OWASP PBKDF2 qua interface `IPasswordHasher` / `Pbkdf2PasswordHasher`:
- **Thuật toán băm**: PBKDF2 với HMAC-SHA256.
- **Số vòng lặp (Iterations)**: 600.000 vòng (khuyến nghị chính thức của OWASP cho HMAC-SHA256).
- **Muối ngẫu nhiên (Salt)**: 128-bit (16 bytes) tạo bằng bộ sinh số ngẫu nhiên mật mã (`RandomNumberGenerator.GetBytes`).
- **Khóa dẫn xuất (Key)**: 256-bit (32 bytes).
- **Định dạng lưu trữ**: `pbkdf2:sha256:600000:<salt_base64>:<key_base64>`.
- **So sánh mật khẩu an toàn**: Sử dụng `CryptographicOperations.FixedTimeEquals` chống tấn công đo thời gian (Timing Attacks).

Cơ chế Token được cấp qua `IJwtTokenGenerator` / `JwtTokenGenerator`:
- Ký bằng thuật toán `HmacSha256` với khóa bí mật `JWT_SECRET` (tối thiểu 256-bit).
- Claims chuẩn: `sub` (UserId), `email`, `name`, `role` (Customer/Admin), `jti`.
- Thời hạn hiệu lực: 7 ngày (`JWT_EXPIRATION_DAYS`).

```text
┌─ ĐĂNG KÝ ────────────────────────────────────────────────────────┐
│ ① chuẩn hóa email về chữ thường (kiểu citext bảo đảm ở DB)       │
│ ② kiểm tra chính sách mật khẩu (BR-AUTH-03):                     │
│      ≥8 ký tự · có chữ · có số · không thuộc 100 mật khẩu phổ biến│
│ ③ PasswordHasher.HashPassword()  → PBKDF2-HMAC-SHA512,           │
│      100.000 vòng, muối 128-bit, định dạng v3                    │
│ ④ sinh securityStamp = chuỗi ngẫu nhiên 32 byte base64url        │
│ ⑤ INSERT; cấp cookie xác thực                                     │
└──────────────────────────────────────────────────────────────────┘

┌─ ĐĂNG NHẬP ──────────────────────────────────────────────────────┐
│ ① tra người dùng theo email (citext)                             │
│ ② ⚠️ NẾU KHÔNG TÌM THẤY: vẫn thực hiện một phép băm giả           │
│      (hash dummy) rồi trả lỗi chung                              │
│      → chống tấn công đo thời gian để dò email tồn tại            │
│ ③ kiểm tra lockout_until > now → 423 AUTH_LOCKED_OUT             │
│ ④ VerifyHashedPassword()                                          │
│      • Failed   → failed_login_count++; nếu ≥5 thì                │
│                   lockout_until = now + 15 phút; trả 401          │
│      • Success  → failed_login_count = 0; lockout_until = NULL    │
│      • SuccessRehashNeeded → băm LẠI bằng tham số mới và lưu      │
│        (cơ chế nâng cấp băm miễn phí của ASP.NET Core)            │
│ ⑤ nếu must_change_password → trả 403 AUTH_MUST_CHANGE_PASSWORD    │
│ ⑥ cấp cookie: HttpOnly · SameSite=Lax · Secure(prod) · 7 ngày trượt│
│      claims: sub=userId · role · stamp=securityStamp              │
└──────────────────────────────────────────────────────────────────┘

┌─ MỖI YÊU CẦU CÓ XÁC THỰC ────────────────────────────────────────┐
│ SecurityStampCheckMiddleware:                                     │
│   so sánh claim `stamp` với app_users.security_stamp trong DB      │
│   (đệm trong tiến trình 60 giây để không truy vấn mỗi request)     │
│   khác nhau → từ chối cookie, buộc đăng nhập lại                  │
│   ⟸ ĐÂY là cách thực hiện BR-AUTH-05 (đổi mật khẩu vô hiệu phiên) │
└──────────────────────────────────────────────────────────────────┘
```

## 11.2. Mô hình phân quyền

| Lớp | Cơ chế | Thực thi |
|---|---|---|
| **Lớp 1 — Xác thực** | `[Authorize]` / `RequireAuthorization()` trên endpoint | Chặn khách chưa đăng nhập |
| **Lớp 2 — Vai trò** | Policy `RequireAdmin`, `RequireCustomer` | `FR-AUTH-07` AC-01 |
| **Lớp 3 — Chủ sở hữu** | Kiểm tra trong **Application layer** bằng `ICurrentUser` | `NFR-SEC-03`, `FR-AUTH-07` AC-02 |
| **Lớp 4 — Cấu trúc** | **Endpoint không nhận tham số `userId`** cho dữ liệu cá nhân (§7.2) | Làm `RISK-18` **không thể xảy ra** |

**Mẫu kiểm tra chủ sở hữu (áp dụng nhất quán):**

```csharp
// Application layer — KHÔNG phụ thuộc HttpContext
public async Task<OrderDto> GetOrderAsync(string orderCode, CancellationToken ct)
{
    var order = await _repo.FindByCodeAsync(orderCode, ct);

    // ⚠️ Gộp "không tồn tại" và "không thuộc quyền" thành CÙNG một phản hồi.
    //    Phân biệt hai trường hợp này sẽ tiết lộ sự tồn tại của đơn hàng.
    if (order is null || order.UserId != _currentUser.Id)
        throw new NotFoundException();      // → 404 NOT_FOUND (FR-AUTH-07 AC-02)

    return _mapper.ToDto(order);
}
```

## 11.3. Danh mục kiểm soát bảo mật

| Mối đe dọa | Biện pháp | Vị trí |
|---|---|---|
| **Đánh cắp mật khẩu từ DB** | PBKDF2-HMAC-SHA512 100k vòng + muối | `PasswordHasherAdapter` |
| **Dò mật khẩu (brute force)** | Khóa tạm 5 lần/15 phút + giới hạn tần suất endpoint | `LockoutTracker` + middleware |
| **Dò email tồn tại** | Thông báo lỗi chung + phép băm giả chống đo thời gian | `AuthService` |
| **Đánh cắp phiên qua XSS** | Cookie httpOnly — JavaScript **không đọc được** | ADR-004 |
| **CSRF** | Token CSRF cho mọi phương thức thay đổi dữ liệu + `SameSite=Lax` | Middleware |
| **Truy cập dữ liệu người khác** | 4 lớp phân quyền ở §11.2 | Application layer |
| **Tiêm SQL** | EF Core tham số hóa; Dapper **chỉ** dùng tham số, **không** nối chuỗi | `Infrastructure` |
| **XSS lưu trữ** | React mã hóa đầu ra theo mặc định; **tuyệt đối không dùng `dangerouslySetInnerHTML`** cho nội dung người dùng | Frontend |
| **Prompt injection** | Nội dung người dùng là dữ liệu; chặng 1/6/7 của đường ống AI | `ChatOrchestrator` |
| **Rò rỉ dữ liệu nhạy cảm ra nước ngoài** | `DeIdentificationService` bắt buộc trong đường ống | `INV-04` |
| **Chữ ký thanh toán giả** | Xác minh chữ ký **trước khi** đọc nội dung nghiệp vụ | `SignatureVerifier` |
| **Gọi lặp webhook** | Xử lý idempotent theo mã giao dịch | `PaymentCoordinator` |
| **Tồn kho âm do đồng thời** | Cập nhật có điều kiện nguyên tử trong DB | `InventoryService` |
| **Lộ bí mật qua log** | `SensitiveDataMasker` + kiểm tra bí mật trong CI | `Infrastructure` + CI |
| **Lộ thông tin qua thông báo lỗi** | `ProblemDetails` handler; không dấu vết ngăn xếp | Middleware |
| **Tải tệp độc hại** | Chỉ nhận ảnh; kiểm tra magic bytes, không chỉ phần mở rộng; giới hạn 5MB | Admin upload |
| **Nội dung dán vào quá dài gây DoS** | Giới hạn 5.000 ký tự cho phân tích INCI; giới hạn kích thước thân yêu cầu | `FR-ING-01` AC-03 |
| **Phụ thuộc có lỗ hổng** | Ghim phiên bản + kiểm tra lỗ hổng trong CI | `.syntheprise-quality.yml` |

## 11.4. Header bảo mật HTTP

```csharp
app.Use(async (ctx, next) => {
    var h = ctx.Response.Headers;
    h["X-Content-Type-Options"]   = "nosniff";
    h["X-Frame-Options"]          = "DENY";
    h["Referrer-Policy"]          = "strict-origin-when-cross-origin";
    h["Permissions-Policy"]       = "camera=(), microphone=(), geolocation=()";
    h["Content-Security-Policy"]  =
        "default-src 'self'; " +
        "img-src 'self' data:; " +                                    // ảnh CỤC BỘ (DQ-08)
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "script-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'";
    await next();
});
```

> 💡 **Lưu ý:** chính sách `img-src 'self'` **chỉ khả thi vì** đã có quyết định tải ảnh sản phẩm về cục bộ (`DQ-08`, `CMP-29`). Nếu vẫn tham chiếu CDN bên thứ ba như prototype hiện tại (`G-27`), CSP phải mở rộng — vừa yếu hơn về bảo mật, vừa phụ thuộc bên ngoài. Hai quyết định này củng cố nhau.

## 11.5. Quản lý bí mật

| Nguyên tắc | Thực hiện |
|---|---|
| Bí mật **không bao giờ** trong mã nguồn | `.env` trong `.gitignore`; `.env.example` chỉ có khóa, không có giá trị |
| Bí mật **không bao giờ** trong log | `SensitiveDataMasker` lọc theo tên khóa (`*ApiKey*`, `*Secret*`, `*Password*`, `*Token*`, `ConnectionStrings*`) |
| Bí mật **không bao giờ** trong thông báo lỗi | `ProblemDetails` handler loại bỏ chi tiết nội bộ |
| Kiểm tra tự động | `gitleaks` (hoặc tương đương) trong CI — **fail build** nếu phát hiện |
| Bí mật bị lộ ⟹ coi như đã bị xâm phạm | Quy trình: dừng việc, **thu hồi và cấp lại khóa**, ghi vào `docs/_review/` (`.agents/rules/safety.md`) |

## 11.6. Bảo vệ dữ liệu cá nhân — thực hiện kỹ thuật

| Nghĩa vụ | Thực hiện kỹ thuật |
|---|---|
| Đồng ý riêng cho dữ liệu nhạy cảm (`CMP-08`) | Công tắc `allow_ai_sharing` **mặc định `FALSE`** ở tầng DB, không chỉ ở giao diện |
| Ẩn danh hóa trước khi gửi xuyên biên giới (`CMP-09`) | `DeIdentificationService` **bắt buộc trong đường ống**; không có đường nào bỏ qua (`INV-04`) |
| Quyền xóa (`CMP-11`) | `DELETE /skin-profile` thực hiện **xóa vật lý** qua `ON DELETE CASCADE`, không gắn cờ ẩn |
| Giới hạn thời gian lưu (`CMP-13`) | `ConversationPurgeWorker` chạy hằng ngày, xóa theo `expires_at` (có index) |
| Che dữ liệu trong log (`NFR-PRIV-10`) | `SensitiveDataMasker` + nội dung hội thoại được che **trước khi lưu DB** |
| Admin không đọc được hồ sơ da (`INV-07`) | **Không tồn tại endpoint**; kiểm chứng bằng `E2E-08` và rà soát danh mục API |
| Minh bạch bên thứ ba (`CMP-12`) | Trang `/chinh-sach-du-lieu-ca-nhan` liệt kê **cụ thể**: Gemini (ngữ cảnh đã ẩn danh), Zalo (chỉ mã phiên), VNPay (mã đơn + số tiền) |

---

