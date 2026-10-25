---
doc: adr-adr-008
title: ADR-008 — Hợp đồng API là OpenAPI sinh từ code; DTO frontend sinh tự động
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-008 — Hợp đồng API là OpenAPI sinh từ code; DTO frontend sinh tự động


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `docs/api-contract.md` của framework quy định: *"DTO frontend được sinh từ lược đồ API; không bao giờ viết tay."* |

**Quyết định:**

```text
.NET API  ──(Swashbuckle/OpenAPI)──►  openapi.json  ──(openapi-typescript)──►  src/api/schema.d.ts
                                           │                                          │
                                           │                                   openapi-fetch (client an toàn kiểu)
                                           ▼
                                  CI kiểm tra SAI LỆCH:
                              sinh lại → so sánh → khác là FAIL
```

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Sinh OpenAPI | `Swashbuckle.AspNetCore` (hoặc `Microsoft.AspNetCore.OpenApi` tích hợp .NET) | Có sẵn, sinh từ code nên không sai lệch |
| Sinh TypeScript | `openapi-typescript` | Chỉ sinh **kiểu**, không sinh code runtime → không tăng kích thước gói |
| Client HTTP | `openapi-fetch` | ~6KB, an toàn kiểu, dựa trên `fetch` chuẩn |
| ~~NSwag / Kiota~~ | Không dùng | Sinh nhiều code runtime hơn mức cần |

**Hệ quả:** Thêm một bước trong CI: sinh lại `schema.d.ts` và fail nếu có khác biệt chưa commit (giống `syntheprise sync --check`). Điều này chặn việc frontend và backend trôi khỏi nhau.

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** Không có DTO viết tay sai lệch
