---
doc: api-contract
title: Hợp Đồng Giao Diện Lập Trình (API Contract & Endpoints) — BeautyAI Platform
status: draft
precedence: 2
owner: SA / Backend Lead
last_reviewed: 2026-10-27
---

# HỢP ĐỒNG API & DANH MỤC ENDPOINT — BeautyAI Platform

> Nguồn chân lý về quy ước REST, danh mục endpoint và từ điển mã lỗi (Precedence 2 — Contracts).
> Thực thi ADR-008: OpenAPI sinh từ code backend C#, DTO frontend sinh tự động từ OpenAPI.

---

# 7. HỢP ĐỒNG API

> **Nguồn chân lý cuối cùng là tệp `docs/api/BeautyAI.Api.json` sinh từ code** (ADR-008). Bảng dưới là hợp đồng thiết kế; khi code đã tồn tại, OpenAPI thắng, và tài liệu này phải được cập nhật trong cùng change.

## 7.1. Quy ước chung

| Hạng mục | Quy ước |
|---|---|
| **Tiền tố** | `/api/v1/...` |
| **Xác thực** | JWT Bearer Token trong header `Authorization: Bearer <token>` (cấp khi Register/Login, hạn 7 ngày) |
| **Chống CSRF** | Token CSRF trong header `X-CSRF-TOKEN` cho mọi phương thức `POST`/`PUT`/`PATCH`/`DELETE` khi dùng Cookie |
| **Định dạng lỗi** | `{ "message": "Thông điệp lỗi chi tiết" }` |
| **Mã lỗi** | Chuỗi hằng, viết HOA_GẠCH_DƯỚI, **ổn định** (frontend dựa vào `code`, không dựa vào `message`) |
| **Phân trang** | `?page=1&pageSize=24`, **tối đa `pageSize=100`** (`NFR-SCALE-03`). Phản hồi: `{ "items": [...], "page", "pageSize", "totalItems", "totalPages" }` |
| **Sắp xếp** | `?sort=relevance\|rating\|loves\|price_asc\|price_desc\|newest` |
| **Tiền tệ** | Mọi giá trị tiền trong phản hồi giai đoạn Phase 1 dùng chuẩn USD (`priceUsd`). Hỗ trợ hiển thị VNĐ quy đổi ở giao diện |
| **Thời gian** | ISO-8601 UTC, vd `2026-10-27T06:30:00Z` (`BR-DATA-02`) |
| **Idempotency** | `POST /orders` và các thao tác tạo quan trọng nhận header `Idempotency-Key` (`NFR-REL-02`) |
| **Giới hạn tần suất** | `429` kèm header `Retry-After` (`NFR-SEC-07`) |
| **Không bao giờ trả về** | `passwordHash`, `securityStamp`, bí mật, dấu vết ngăn xếp (`NFR-SEC-06`, `INV-08`) |

## 7.2. Danh mục endpoint

### Hệ thống & Giám sát (`/health`) — WG-P1-04

| Method | Đường dẫn | Quyền | FR | Ghi chú |
|---|---|---|---|---|
| `GET` | `/health` | ALL | — | Trả về `HealthResponse { status: "ok", service: "beautyai-api" }` để kiểm tra độ sẵn sàng và OpenAPI DTO drift check (ADR-008) |

### Xác thực & Tài khoản (`/api/v1/auth`) — C1

| Method | Đường dẫn | Quyền | FR | Ghi chú |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | GUEST | `FR-AUTH-01` | Đăng ký tài khoản, băm mật khẩu PBKDF2 (HMAC-SHA256, 600k vòng lặp), tự tạo Skin Profile rỗng, trả JWT |
| `POST` | `/api/v1/auth/login` | GUEST | `FR-AUTH-02` | Đăng nhập tài khoản, xác thực mật khẩu qua PBKDF2, trả JWT |
| `GET` | `/api/v1/auth/me` | CUSTOMER/ADMIN | `FR-AUTH-05` | Lấy thông tin tài khoản hiện tại kèm trọn bộ hồ sơ Digital Skin ID thống nhất |
| `PUT` | `/api/v1/auth/profile` | CUSTOMER/ADMIN | `FR-AUTH-05` | Cập nhật họ tên, số điện thoại, địa chỉ nhận hàng |

### Hồ sơ Digital Skin ID Thống Nhất (`/api/v1/skin-profile`) — C4

| Method | Đường dẫn | Quyền | FR | Ghi chú |
|---|---|---|---|---|
| `GET` | `/api/v1/skin-profile` | CUSTOMER/ADMIN | `FR-SKIN-01` | Lấy trọn bộ hồ sơ Digital Skin ID: 1. Loại da ➔ 2. Blacklist Dị ứng ➔ 3. Vấn đề da & Mục tiêu |
| `PUT` | `/api/v1/skin-profile` | CUSTOMER/ADMIN | `FR-SKIN-01` | Cập nhật đồng bộ toàn bộ hồ sơ Digital Skin ID và danh sách dị ứng trong 1 transaction |
| `POST` | `/api/v1/skin-profile/allergies` | CUSTOMER/ADMIN | `FR-SKIN-02` | Thêm một hoạt chất dị ứng vào Blacklist cá nhân kèm ghi chú triệu chứng |
| `DELETE` | `/api/v1/skin-profile/allergies/{id}` | CUSTOMER/ADMIN | `FR-SKIN-02` | Xóa hoạt chất dị ứng khỏi Blacklist cá nhân |
| `POST` | `/auth/login` | GUEST | `FR-AUTH-02` | Thông báo lỗi **không** tiết lộ email tồn tại |
| `POST` | `/auth/logout` | CUSTOMER/ADMIN | `FR-AUTH-03` | |
| `GET` | `/auth/me` | CUSTOMER/ADMIN | `FR-AUTH-05` | Trả về profile cơ bản + `mustChangePassword` |
| `PUT` | `/auth/me` | CUSTOMER/ADMIN | `FR-AUTH-05` | Email **không** sửa được |
| `POST` | `/auth/change-password` | CUSTOMER/ADMIN | `FR-AUTH-04` | Đổi `securityStamp` → vô hiệu phiên khác |
| `POST` | `/auth/csrf` | ALL | — | Cấp token CSRF |

### Danh mục & tìm kiếm (`/api/v1/products`, `/api/v1/catalog`) — C2

| Method | Đường dẫn | Quyền | FR | Mô tả Phase 1 |
|---|---|---|---|---|
| `GET` | `/api/v1/products` | ALL | `FR-CAT-01` | Lọc sản phẩm Phase 1 (`query`, `category`, `brand`, `skinType`, `min_price`, `max_price`, `min_rating`, `sort_by`, `safe_for_me`, `page`, `per_page`) |
| `GET` | `/api/v1/products/{id}` | ALL | `FR-PDP-01` | Chi tiết sản phẩm theo ID hoặc Slug hoặc Code |
| `GET` | `/api/v1/products/{id}/similar` | ALL | `FR-PDP-08` | Sản phẩm tương tự cùng danh mục (loại trừ dị ứng của user) |
| `GET` | `/api/v1/products/categories` | ALL | `FR-CAT-02` | Danh sách danh mục sản phẩm |
| `GET` | `/api/v1/products/brands` | ALL | `FR-CAT-04` | Danh sách thương hiệu mỹ phẩm |
| `GET` | `/catalog/products` | ALL | `FR-CAT-01`, `04`→`10` | |
| `GET` | `/catalog/products/{slug}` | ALL | `FR-PDP-01`→`04` | |
| `GET` | `/catalog/products/{id}/similar` | ALL | `FR-PDP-08` |
| `GET` | `/catalog/products/{id}/bought-together` | ALL | `FR-PDP-09` |
| `GET` | `/catalog/products/{id}/explain` | ALL | `FR-PDP-13` |
| `GET` | `/catalog/search/suggest?q=` | ALL | `FR-CAT-03` AC-02 |
| `GET` | `/catalog/categories` | ALL | `FR-CAT-02` |
| `GET` | `/catalog/brands` | ALL | `FR-CAT-04` |
| `GET` | `/catalog/filters` | ALL | `FR-CAT-06` AC-03 — trả về hoạt chất kèm **số lượng sản phẩm** |
| `GET` | `/catalog/compare?ids=` | ALL | `FR-CMP-02` |
| `GET` | `/catalog/ranking-criteria` | ALL | **`CMP-20`** — công khai tiêu chí thuật toán |

**Tham số truy vấn của `GET /catalog/products`:**

```text
q               : từ khóa (không phân biệt dấu)
categoryId      : lọc theo danh mục (bao gồm danh mục con)
brandIds        : danh sách, phân tách bằng dấu phẩy
minPrice,maxPrice : theo TIỀN TỆ đang chọn (tham số currency cho biết là gì)
currency        : VND | USD  (mặc định VND)
vegan,crueltyFree,clean                  : boolean (logic AND)
fragranceFree,parabenFree,alcoholFree    : boolean (lọc loại trừ)
actives         : danh sách mã nhóm hoạt chất, vd NIACINAMIDE,BHA
activesMode     : AND | OR  (mặc định AND — FR-CAT-06 AC-02)
skinType        : lọc theo loại da
safeForMe       : boolean — chỉ có tác dụng khi đã đăng nhập (FR-CAT-10)
sort, page, pageSize
```

### Hồ sơ da (`/api/v1/skin-profile`) — C4

| Method | Đường dẫn | Quyền | FR | ⚠️ |
|---|---|---|---|---|
| `GET` | `/skin-profile` | **CUSTOMER (chỉ của mình)** | `FR-SKIN-01` | ❌ **Không có biến thể `/skin-profile/{userId}`** — INV-07 |
| `PUT` | `/skin-profile` | CUSTOMER | `FR-SKIN-01` | |
| `DELETE` | `/skin-profile` | CUSTOMER | `FR-SKIN-06` | **Xóa thật**, không ẩn |
| `GET`/`POST`/`DELETE` | `/skin-profile/allergies[/{id}]` | CUSTOMER | `FR-SKIN-02` | |
| `GET` | `/skin-profile/allergies/suggest?q=` | CUSTOMER | `FR-SKIN-02` AC-01 | Khớp cả tên đồng nghĩa |
| `GET`/`POST`/`DELETE` | `/skin-profile/currently-using[/{id}]` | CUSTOMER | `FR-CONF-05` | |
| `PUT` | `/skin-profile/ai-sharing` | CUSTOMER | `FR-SKIN-07` | Công tắc, **mặc định tắt** |
| `GET` | `/skin-profile/alternatives/{productId}` | CUSTOMER | `FR-SKIN-04` | |

> 🔒 **Thiết kế bảo mật có chủ đích:** nhóm endpoint này **không có tham số `userId`** ở bất kỳ đâu. Người dùng luôn được suy ra từ cookie xác thực. Điều này làm cho lỗ hổng "đổi mã trên địa chỉ" (`RISK-18`) **không thể xảy ra về mặt cấu trúc**, thay vì phải nhớ kiểm tra ở từng chỗ.

### Quiz & Routine (`/api/v1/quiz`, `/api/v1/routines`) — C4

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `GET` | `/quiz/questions` | ALL | `FR-QUIZ-01` |
| `POST` | `/quiz/evaluate` | ALL | `FR-QUIZ-02`, `03`, `05` — trả routine AM/PM + cảnh báo xung đột + lý do đề xuất |
| `GET` | `/quiz/step-alternatives?step=&...` | ALL | `FR-QUIZ-03` AC-04 |
| `GET`/`POST`/`DELETE` | `/routines[/{id}]` | CUSTOMER | `FR-QUIZ-07` |
| `POST` | `/routines/{id}/export` | CUSTOMER | `FR-QUIZ-08` |

### Phân tích thành phần (`/api/v1/ingredients`) — C3

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `POST` | `/ingredients/analyze` | ALL | `FR-ING-01`→`03` — thân yêu cầu ≤ 5.000 ký tự |
| `GET` | `/ingredients/{slug}` | ALL | `FR-ING-04` |
| `GET` | `/ingredients/{id}/products` | ALL | `FR-ING-04` |

### Giỏ hàng & Wishlist (`/api/v1/cart`, `/wishlist`) — C6

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `GET` | `/cart` | CUSTOMER | `FR-CART-01` — kèm cảnh báo xung đột + bảng tổng kết theo thứ tự `BR-CART-06` |
| `POST` | `/cart/items` | CUSTOMER | `FR-PDP-06` |
| `POST` | `/cart/items/bulk` | CUSTOMER | `FR-QUIZ-06` — Chat-to-Cart, **một hành động** |
| `PATCH` | `/cart/items/{id}` | CUSTOMER | `FR-CART-02` |
| `DELETE` | `/cart/items/{id}` | CUSTOMER | `FR-CART-02` |
| `POST` | `/cart/merge` | CUSTOMER | `FR-CART-04` |
| `POST` | `/cart/vouchers` | CUSTOMER | `FR-CART-06` |
| `DELETE` | `/cart/vouchers/{code}` | CUSTOMER | `FR-CART-06` |
| `POST` | `/cart/acknowledge-conflict` | CUSTOMER | `FR-CONF-03` |
| `GET`/`POST`/`DELETE` | `/wishlist[/items/{id}]` | CUSTOMER | `FR-WISH-01`→`03` |

### Đơn hàng (`/api/v1/orders`) — C7

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `POST` | `/orders` | CUSTOMER | `FR-ORD-03` — nhận `Idempotency-Key` |
| `GET` | `/orders` | CUSTOMER (chỉ của mình) | `FR-ORD-06` |
| `GET` | `/orders/{orderCode}` | CUSTOMER (kiểm tra chủ sở hữu) | `FR-ORD-06`, `09` |
| `POST` | `/orders/{orderCode}/cancel` | CUSTOMER | `FR-ORD-07` |
| `POST` | `/orders/{orderCode}/reorder` | CUSTOMER | `FR-ORD-11` |
| `GET` | `/orders/{orderCode}/payment-url` | CUSTOMER | `FR-ORD-04` AC-01 |
| `POST` | `/webhooks/vnpay/ipn` | **PUBLIC (xác minh chữ ký)** | `FR-ORD-04` AC-02, AC-03, AC-06 |
| `GET` | `/webhooks/vnpay/return` | PUBLIC | `FR-ORD-04` |

> ⚠️ **Thiết kế webhook:** endpoint IPN là **công khai** (cổng thanh toán gọi tới) nên **bảo mật nằm hoàn toàn ở việc xác minh chữ ký** (`NFR-SEC-08`). Phải: ① xác minh chữ ký **trước khi** đọc nội dung nghiệp vụ; ② xử lý idempotent theo mã giao dịch; ③ ghi log mọi lần nhận, kể cả lần bị từ chối chữ ký (`FR-ORD-04` AC-03).

### Trợ lý AI (`/api/v1/chat`) — C8

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `POST` | `/chat/messages` | ALL (có hạn mức) | `FR-CHAT-01`→`06`, `10`, `11` — **phản hồi dạng luồng (SSE)** |
| `GET` | `/chat/conversations` | CUSTOMER | `FR-CHAT-12` |
| `GET` | `/chat/conversations/{id}` | CUSTOMER (kiểm tra chủ sở hữu) | `FR-CHAT-12` |
| `DELETE` | `/chat/conversations/{id}` | CUSTOMER | `FR-CHAT-12` AC-02 |
| `POST` | `/chat/messages/{id}/feedback` | ALL | `FR-CHAT-13` |
| `POST` | `/chat/handoff/preview` | ALL | `FR-CHAT-07` AC-02 — **trả về CHÍNH XÁC dữ liệu sẽ gửi** |
| `POST` | `/chat/handoff/confirm` | ALL | `FR-CHAT-07` AC-03 — trả mã phiên + đường dẫn Zalo |

**Lược đồ phản hồi của `POST /chat/messages`** (giữ tinh thần `PRD v2.0 §7`, bổ sung ràng buộc an toàn):

```jsonc
{
  "conversationId": "7c9e…",
  "messageId": 1042,
  "resolvedTier": "LLM",              // RULES | LLM | CHUYEN_TIEP_ZALO  → BO-05
  "message": "Da hỗn hợp thiên dầu đang có mụn ẩn thường phù hợp với…",
  "detectedSkinType": "HON_HOP",      // chỉ là NHẬN DIỆN, không phải chẩn đoán
  "identifiedConcerns": ["MUN_AN", "LO_CHAN_LONG"],
  "warnings": [                        // từ ConflictDetectionService, KHÔNG từ LLM
    {
      "severity": "LUU_Y",
      "evidenceTier": "B",
      "text": "Không nên dùng BHA và Retinol trong cùng một buổi tối.",
      "remediation": "Dùng xen kẽ: BHA tối thứ 2–4–6, Retinol tối thứ 3–5–7.",
      "sourceUrl": "https://…"
    }
  ],
  "routineSteps": [
    {
      "stepNumber": 1,
      "stepType": "LAM_SACH",
      "timeOfDay": "CA_HAI",
      "product": {                     // ⚠️ MỌI trường dưới đây lấy TỪ DATABASE,
        "productId": "P503197",        //    không lấy từ văn bản LLM (BR-AI-10, INV-05)
        "name": "…",
        "brandName": "…",
        "priceUsd": 39.00,
        "priceVnd": 991000,
        "imageUrl": "/media/products/P503197.webp",
        "slug": "…",
        "suitabilityScore": 96,        // null nếu chưa có hồ sơ da (BR-ING-02)
        "allergyFlags": []             // tên thành phần gây cảnh báo (BR-SKIN-04)
      },
      "whyRecommended": ["Khớp loại da hỗn hợp", "Chứa Niacinamide cho vấn đề lỗ chân lông"]
    }
  ],
  "canAddAllToCart": true,
  "comboDiscountPercent": 5,
  "handoffSuggested": false,
  "handoffReason": null,
  "disclaimer": "Thông tin do trợ lý của BeautyAI cung cấp chỉ mang tính tham khảo…",
  "degradedMode": false                // true khi đang chạy ở Tầng 1 vì LLM không khả dụng
}
```

> 📌 **Ba điểm quan trọng về lược đồ này:**
> 1. **`disclaimer` là trường BẮT BUỘC, không nullable.** Nếu backend trả về thiếu nó thì đó là lỗi chặn phát hành (`BR-AI-04`, golden case kiểm tra điều này).
> 2. **`warnings` do `ConflictDetectionService` sinh ra, KHÔNG do LLM sinh ra.** LLM không được phép tự tạo cảnh báo — vì cảnh báo phải có `evidenceTier` và `sourceUrl` từ database.
> 3. **`detectedSkinType` chỉ là "nhận diện", không phải "chẩn đoán".** Cách gọi tên trường cũng phải tuân thủ `BR-AI-14`.

### Đánh giá (`/api/v1/reviews`) — C10

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `GET` | `/products/{id}/reviews` | ALL | `FR-REV-01`, `02` |
| `GET` | `/products/{id}/reviews/similar-profile` | CUSTOMER | **`FR-PDP-12`** |
| `POST` | `/products/{id}/reviews` | CUSTOMER (đã mua) | `FR-REV-03` |
| `PUT` | `/reviews/{id}` | CUSTOMER (tác giả) | `FR-REV-03` AC-03 |
| `POST` | `/reviews/{id}/helpful` | CUSTOMER | `FR-REV-04` |

### Quản trị (`/api/v1/admin`) — C9

| Nhóm | Endpoint tiêu biểu | FR |
|---|---|---|
| Tổng quan | `GET /admin/dashboard` | `FR-ADM-01` |
| Sản phẩm | `GET/POST/PUT /admin/products[/{id}]` · `POST /admin/products/{id}/image` | `FR-ADM-02` |
| Danh mục/Thương hiệu | `GET/POST/PUT /admin/categories`, `/admin/brands` | `FR-ADM-03` |
| Thành phần | `GET/POST/PUT /admin/ingredients[/{id}]` · `GET /admin/ingredients/unmatched` | `FR-ADM-04` |
| Quy tắc xung đột | `GET/POST/PUT /admin/conflict-rules[/{id}]` | `FR-CONF-06` |
| Nhóm hoạt chất | `GET/POST/PUT /admin/active-groups[/{id}]` | `BR-CONF-01` |
| Đơn hàng | `GET /admin/orders` · `POST /admin/orders/{code}/status` | `FR-ADM-06`, `FR-ORD-08` |
| Voucher | `GET/POST/PUT /admin/vouchers[/{id}]` | `FR-ADM-07` |
| Tỷ giá | `GET/PUT /admin/exchange-rate` · `GET /admin/exchange-rate/history` | `FR-ADM-08` |
| Cấu hình | `GET/PUT /admin/settings` | `FR-ADM-09` |
| Kịch bản chat | `GET/POST/PUT /admin/chat-intents` · `GET/POST /admin/blocked-topics` | `FR-ADM-10` |
| Báo cáo | `GET /admin/reports/revenue` · `/reports/products` · `/reports/ai-usage` | `FR-ADM-11`, `12` |
| Xuất Excel | `GET /admin/exports/orders.xlsx` · `/exports/products.xlsx` | `FR-ADM-13` |
| Nhật ký hội thoại | `GET /admin/conversations` (**đã ẩn danh hóa**) | `FR-ADM-14` |
| Hàng đợi chuyển tiếp | `GET /admin/handoffs` · `GET /admin/handoffs/{code}` · `POST /admin/handoffs/{code}/status` | `FR-ADM-15` |
| Nhật ký kiểm toán | `GET /admin/audit-logs` | `FR-ADM-16` |
| Đặt lại mật khẩu | `POST /admin/users/{id}/reset-password` | `FR-AUTH-06` |

> ⚠️ **`GET /admin/handoffs/{code}`** là endpoint duy nhất trong nhóm Admin được xem bản chụp hồ sơ da — **và chỉ khi** `profile_consent_given = true` **và** chỉ bản chụp của yêu cầu chuyển tiếp đó, **không** truy cập được hồ sơ da gốc của người dùng. Đây là ngoại lệ **đã được khách hàng đồng ý rõ ràng** (`BR-AI-11`), khác hoàn toàn với việc Admin duyệt hồ sơ da (bị cấm bởi `INV-07`).

### Hỗ trợ & nền tảng

| Method | Đường dẫn | Quyền | FR |
|---|---|---|---|
| `GET` | `/content/faq` · `/content/policies/{slug}` | ALL | `FR-SUP-01` |
| `GET` | `/content/methodology` | ALL | **`FR-SUP-02`** — trang giải thích Điểm Phù Hợp |
| `GET` | `/content/privacy-policy` | ALL | **`FR-SUP-03`** |
| `POST` | `/support/requests` | ALL | `FR-SUP-05` |
| `GET` | `/notifications` · `POST /notifications/{id}/read` | CUSTOMER | `FR-SUP-04` |
| `GET` | `/health` | ALL | `NFR-OBS-03` |
| `GET` | `/openapi.json` | ALL (chỉ dev) | ADR-008 |

## 7.3. Từ điển mã lỗi

| Mã | HTTP | Khi nào | FR/BR |
|---|---|---|---|
| `VALIDATION_FAILED` | 400 | Dữ liệu vào không hợp lệ; `details` chứa lỗi theo từng trường | — |
| `AUTH_INVALID_CREDENTIALS` | 401 | Sai email hoặc mật khẩu — **không** phân biệt hai trường hợp | `BR-AUTH-04` |
| `AUTH_LOCKED_OUT` | 423 | Đang bị khóa tạm; `details.retryAfterSeconds` | `BR-AUTH-04` |
| `AUTH_MUST_CHANGE_PASSWORD` | 403 | Bị buộc đổi mật khẩu | `FR-AUTH-06` |
| `FORBIDDEN` | 403 | Không đủ quyền | `FR-AUTH-07` |
| `NOT_FOUND` | 404 | Không tìm thấy — **dùng cho cả trường hợp không thuộc quyền** để không tiết lộ tồn tại | `FR-AUTH-07` AC-02 |
| `EMAIL_ALREADY_USED` | 409 | Email đã tồn tại | `FR-AUTH-01` AC-02 |
| `PRODUCT_OUT_OF_STOCK` | 409 | Hết hàng | `BR-CART-04` |
| `PRODUCT_NOT_PURCHASABLE` | 409 | Sản phẩm Lớp B (`THAM_KHAO`) không mua được | `BR-DATA-07` |
| `CART_QUANTITY_EXCEEDED` | 400 | Vượt `min(10, tồn kho)`; `details.max` | `BR-CART-03` |
| `VOUCHER_NOT_FOUND` / `_EXPIRED` / `_NOT_STARTED` / `_INACTIVE` | 400 | Lý do **cụ thể**, không nói chung "mã không hợp lệ" | `BR-CART-08` |
| `VOUCHER_MIN_ORDER_NOT_MET` | 400 | `details.required`, `details.current` | `BR-CART-08` |
| `VOUCHER_BRAND_NOT_IN_CART` | 400 | `details.brandName` | `FR-CART-06` AC-03 |
| `VOUCHER_TYPE_ALREADY_APPLIED` | 409 | Đã có mã cùng loại; frontend hỏi thay thế | `FR-CART-06` AC-02 |
| `VOUCHER_USAGE_LIMIT_REACHED` | 409 | Vượt số lượt cho phép | `DC-15` |
| `EXCHANGE_RATE_NOT_CONFIGURED` | 503 | **Chặn checkout** | `BR-PRICE-08` |
| `CONFLICT_ACKNOWLEDGEMENT_REQUIRED` | 409 | Giỏ có xung đột `CAO` chưa xác nhận | `FR-CONF-03` |
| `ORDER_INVALID_STATE_TRANSITION` | 409 | `details.allowed` liệt kê chuyển đổi hợp lệ | `BR-ORDER-01` |
| `ORDER_NOT_CANCELLABLE` | 409 | Đơn đã qua `CHO_XU_LY` | `BR-ORDER-02` |
| `ORDER_CANCEL_REASON_REQUIRED` | 400 | Admin hủy đơn đã thanh toán mà không nhập lý do | `BR-ORDER-02` |
| `PAYMENT_SIGNATURE_INVALID` | 400 | Chữ ký callback sai — **ghi log cảnh báo bảo mật** | `FR-ORD-04` AC-03 |
| `LLM_QUOTA_EXCEEDED` | 200 (không phải lỗi!) | Trả về nội dung Tầng 1 + `degradedMode: true` | `BR-AI-06`, `FR-CHAT-11` |
| `LLM_UNAVAILABLE` | 200 (không phải lỗi!) | Trả về nội dung Tầng 1 hoặc đề nghị Zalo + `degradedMode: true` | `BR-AI-05`, `FR-CHAT-10` |
| `TOPIC_BLOCKED` | 200 (không phải lỗi!) | Trả về câu trả lời cố định + đề nghị chuyển tiếp | `BR-AI-03`, `FR-CHAT-04` |
| `INPUT_TOO_LONG` | 400 | Nội dung phân tích > 5.000 ký tự | `FR-ING-01` AC-03 |
| `REVIEW_PURCHASE_REQUIRED` | 403 | Chưa mua sản phẩm | `FR-REV-03` AC-02 |
| `CONFLICT_RULE_SOURCE_REQUIRED` | 400 | Admin tạo quy tắc không có nguồn | `FR-CONF-06` AC-02 |
| `CONFLICT_RULE_TIER_SEVERITY_MISMATCH` | 400 | Cấp bằng chứng B/C nhưng mức `CAO` | `INV-03`, `DC-14` |
| `BLOCKED_TOPIC_IMMUTABLE` | 403 | Cố xóa vùng chặn hệ thống | `FR-ADM-10` AC-03 |
| `EXCHANGE_RATE_CONFIRMATION_REQUIRED` | 409 | Lệch > 20%, cần xác nhận lần hai | `FR-ADM-08` AC-03 |
| `RATE_LIMITED` | 429 | Vượt giới hạn tần suất; header `Retry-After` | `NFR-SEC-07` |
| `INTERNAL_ERROR` | 500 | Lỗi không mong đợi; `details.incidentId` để báo hỗ trợ — **không** có dấu vết ngăn xếp | `NFR-SEC-06`, `FR-SUP-06` |

> 💡 **Quyết định thiết kế đáng chú ý:** ba trạng thái `LLM_QUOTA_EXCEEDED`, `LLM_UNAVAILABLE`, `TOPIC_BLOCKED` trả **HTTP 200**, không phải mã lỗi. Lý do: đây **không phải lỗi** — đây là **hành vi đã thiết kế** (`BR-AI-05`, `BR-AI-03`). Nếu trả 4xx/5xx, frontend sẽ hiển thị trạng thái lỗi và vi phạm `FR-CHAT-10` AC-02 (*"tuyệt đối không hiển thị thông báo lỗi kỹ thuật"*). Phân biệt đúng giữa *lỗi* và *suy giảm có kiểm soát* là điểm thường bị làm sai.

---

