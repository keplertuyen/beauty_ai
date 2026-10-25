---
doc: tech-stack
title: Danh Mục Công Nghệ & Kiểm Kê Phụ Thuộc (Tech Stack Inventory) — BeautyAI Platform
status: draft
precedence: 2
owner: Tech Lead / Architect
last_reviewed: 2026-10-25
---

# DANH MỤC CÔNG NGHỆ & KIỂM KÊ PHỤ THUỘC — BeautyAI Platform

> "Nhà duy nhất" của mọi phụ thuộc bên thứ ba (Precedence 2 — Contracts).
> Nghiêm cấm tự ý bổ sung hoặc nâng cấp phụ thuộc lớn khi chưa có cập nhật trong tài liệu này (AGENTS.md §2.2).
> Mọi thư viện bị cấm (AutoMapper, MediatR, Redis, Hangfire) được kiểm soát bởi Architecture Tests trong CI.

---

# 12. DANH MỤC CÔNG NGHỆ & KIỂM KÊ PHỤ THUỘC

> Theo `docs/tech-stack.md` của framework: đây là **nhà duy nhất** của danh mục phụ thuộc. Khi bất kỳ tài liệu nào nêu phiên bản/giấy phép khác, **bảng này thắng** (precedence 2). Thêm hoặc nâng cấp một phụ thuộc cấp cao **phải cập nhật bảng này trong CÙNG change** (`AGENTS.md §2.2`).

## 12.1. Backend

| Tên | Tầng | Ghim phiên bản | Giấy phép | Mục đích | Tier | Ghi chú / Rủi ro | ADR |
|---|---|---|---|---|---|---|---|
| .NET / C# | Runtime | `net10.0` (LTS) | MIT | Nền tảng backend | 1 | Ghim SDK qua `global.json`. Phù hợp blueprint `dotnet-react-rn` | — |
| ASP.NET Core | BE / Web | `10.0` | MIT | Minimal API · DI · Kestrel · xác thực · phân quyền · giới hạn tần suất | 1 | Đi kèm SDK | — |
| `Microsoft.EntityFrameworkCore` | BE / ORM | `10.0.*` | MIT | ORM chính, migration | 1 | Migration là nguồn chân lý lược đồ | ADR-003 |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | BE / ORM | `10.0.*` | PostgreSQL | Provider PostgreSQL cho EF Core | 1 | Hỗ trợ `citext`, `jsonb`, mảng | ADR-002 |
| `Dapper` | BE / Data | `^2.1` | Apache-2.0 | Truy vấn báo cáo tổng hợp | 1 | **Chỉ** dùng tham số hóa, không nối chuỗi | ADR-003 |
| `Microsoft.Extensions.Identity.Core` | BE / Security | `10.0.*` | MIT | **Chỉ dùng `PasswordHasher<T>`** (PBKDF2) | 1 | ⚠️ **Không** dùng Identity đầy đủ — xem ADR-004 | ADR-004 |
| `FluentValidation.AspNetCore` | BE / Validation | `^11` | Apache-2.0 | Kiểm tra dữ liệu vào; bù giới hạn của schema LLM | 1 | — | — |
| `Serilog.AspNetCore` | BE / Logging | `^8` | Apache-2.0 | Nhật ký có cấu trúc + mã truy vết | 1 | Sink: Console + File | — |
| `Swashbuckle.AspNetCore` | BE / Docs | `^7` | MIT | Sinh `openapi.json` | 1 | Đầu vào cho sinh kiểu frontend | ADR-008 |
| `ClosedXML` | BE / Export | `^0.104` | MIT | Xuất Excel báo cáo | 1 | Chú ý UTF-8 tiếng Việt (`NFR-COMP-04`) | — |
| `Riok.Mapperly` | BE / Mapping | `^4` | Apache-2.0 | Ánh xạ Entity ↔ DTO bằng sinh mã nguồn | 1 | Không dùng reflection → nhanh, không mất kiểu | — |
| ❌ `AutoMapper` | — | — | — | — | — | **Không dùng** — ánh xạ ngầm làm mất kiểm soát, khó debug | — |
| ❌ `MediatR` | — | — | — | — | — | **Không dùng** ở Tier 1 — thêm một lớp gián tiếp không cần thiết | ADR-009 |
| ❌ `Hangfire` / `Quartz` | — | — | — | — | — | **Không dùng** — `BackgroundService` là đủ | ADR-009 |
| ❌ `StackExchange.Redis` | — | — | — | — | — | **Không dùng** — `IMemoryCache` là đủ | ADR-009 |
| ❌ SDK Gemini của bên thứ ba | — | — | — | — | — | **Không dùng** — gọi REST bằng `HttpClient` **trong adapter** (ít phụ thuộc, toàn quyền kiểm soát, đúng `provider-abstraction`) | ADR-005 |

## 12.2. Frontend

| Tên | Tầng | Ghim | Giấy phép | Mục đích | Tier | Ghi chú |
|---|---|---|---|---|---|---|
| React / React DOM | FE / UI | `^19` | MIT | Thư viện UI | 1 | Giữ `react` và `react-dom` cùng major |
| TypeScript | Ngôn ngữ | `^5.7` | Apache-2.0 | Kiểu tĩnh | 1 | **`strict: true` bắt buộc** |
| Vite | FE / Build | `^6` | MIT | Dev server + bundler | 1 | Review release note khi nâng major |
| `react-router-dom` | FE / Routing | `^7` | MIT | Điều hướng SPA | 1 | — |
| `@tanstack/react-query` | FE / Data | `^5` | MIT | Trạng thái server, đệm, vô hiệu | 1 | Thay thế việc tự viết logic tải/lỗi |
| `zustand` | FE / State | `^5` | MIT | Trạng thái UI (giỏ, tiền tệ, so sánh) | 1 | ~1KB |
| `openapi-fetch` | FE / HTTP | `^0.13` | MIT | Client an toàn kiểu | 1 | ~6KB |
| `openapi-typescript` | Dev / Codegen | `^7` | MIT | Sinh `schema.d.ts` | 1 | **Chỉ dev**; CI kiểm tra sai lệch |
| `react-hook-form` | FE / Form | `^7` | MIT | Quản lý biểu mẫu | 1 | — |
| `zod` | FE / Validation | `^3` | MIT | Schema kiểm tra dữ liệu | 1 | Dùng chung cho form và phản hồi API |
| `recharts` | FE / Chart | `^2` | MIT | Biểu đồ công năng, báo cáo | 1 | PRD v2.0 đã chọn |
| `vitest` | Dev / Test | `^2` | MIT | Test runner | 1 | Chia sẻ cấu hình Vite |
| `@testing-library/react` | Dev / Test | `^16` | MIT | Test hướng người dùng | 1 | — |
| `@playwright/test` | Dev / E2E | `^1.49` | Apache-2.0 | Kiểm thử đầu-cuối | 1 | 8 luồng E2E của `BRD` §14.4 |
| `@axe-core/playwright` | Dev / A11y | `^4` | MPL-2.0 | Kiểm tra khả năng truy cập tự động | 1 | `NFR-A11Y-01` |
| ❌ Tailwind CSS | — | — | — | — | — | **Không dùng** — ADR-007 |
| ❌ MUI / Ant Design | — | — | — | — | — | **Không dùng** — ADR-007 |
| ❌ Redux / Redux Toolkit | — | — | — | — | — | **Không dùng** — Zustand đủ ở quy mô này |
| ❌ Axios | — | — | — | — | — | **Không dùng** — `openapi-fetch` dựa trên `fetch` chuẩn |
| ❌ Framer Motion | — | — | — | — | — | Chuyển động trong prototype làm bằng CSS transition — đủ, và nhẹ hơn |

> 📌 **Ghi chú về Framer Motion:** PRD v2.0 có nêu Framer Motion. Prototype hiện tại đã đạt được chuyển động mong muốn **chỉ bằng CSS transition** (xem `--transition-fast/base/slow` trong `tokens.css`). Thêm một thư viện animation ~50KB cho hiệu ứng đã có là vi phạm `NFR-PERF-11` và nguyên tắc chống over-engineering. **Nếu cần một hiệu ứng CSS không làm được** → mở change request kèm lý do cụ thể.

## 12.3. Hạ tầng & công cụ

| Tên | Tầng | Ghim | Giấy phép | Mục đích | Ghi chú |
|---|---|---|---|---|---|
| PostgreSQL | Infra / DB | `17-alpine` | PostgreSQL | Cơ sở dữ liệu vận hành | Qua Docker Compose cục bộ (ADR-002) |
| Docker / Docker Compose | Infra | — | Apache-2.0 | Chạy PostgreSQL cục bộ | Yêu cầu Docker Desktop trên máy phát triển |
| `cloudflared` **hoặc** `ngrok` | Dev / Tunnel | mới nhất | tùy nhà cung cấp | Lộ địa chỉ cục bộ cho callback thanh toán | **Chỉ cần khi test VNPay** (`RISK-10`) |
| Python | Dev / Data | `3.12` | PSF | Đường ống dữ liệu & ML ngoại tuyến | **Công cụ phát triển, KHÔNG phải thành phần runtime** (ADR-001) |
| `pandas` | Dev / Data | `^2.2` | BSD-3 | Xử lý CSV | — |
| `scikit-learn` | Dev / ML | `^1.5` | BSD-3 | TF-IDF · TruncatedSVD | Tính độ tương đồng ngoại tuyến |
| `mlxtend` | Dev / ML | `^0.23` | BSD-3 | Apriori — khai phá luật kết hợp | — |
| `Pillow` | Dev / Image | `^11` | MIT-CMU | Chuyển ảnh sản phẩm sang WebP | Giảm dung lượng |
| `gitleaks` | CI / Security | mới nhất | MIT | Phát hiện bí mật trong commit | `NFR-SEC-05` |
| GitHub Actions | CI | — | — | Chạy build/test/gate | `CON-05` |

## 12.4. Bảng kiểm kê tích hợp ngoài

> Theo `docs/tech-stack.md` của framework: mỗi tích hợp một dòng, có trạng thái vòng đời, để `syntheprise integrations` đối chiếu được giữa khai báo và code.

| Tên | Loại | Adapter | Trạng thái | Từ | Ghi chú |
|---|---|---|---|---|---|
| Google Gemini | `llm` | `Infrastructure/Providers/Llm/GeminiLlmProvider.cs` | `dự kiến` → `đang dùng` | 2026-11 | Có `NullLlmProvider` dự phòng; ẩn danh hóa bắt buộc (`BR-AI-16`) |
| Zalo OA (deep link) | `service` | `Infrastructure/Providers/Handoff/ZaloDeepLinkHandoffChannel.cs` | `dự kiến` → `đang dùng` | 2026-12 | Chỉ deep link + mã phiên, **không dùng API** (ADR-006) |
| VNPay Sandbox | `service` | `Infrastructure/Providers/Payment/VnPaySandboxProvider.cs` | `dự kiến` → `đang dùng` | 2026-12 | Có `MockPaymentProvider` dự phòng |
| SMTP (email giao dịch) | `service` | `Infrastructure/Providers/Email/SmtpEmailSender.cs` | `dự kiến` | 2027-01 | Có `NoOpEmailSender` dự phòng; phụ thuộc `OQ-02` |
| Dataset Sephora | `store` | `tools/data-pipeline/01_extract_catalog.py` | `đang dùng` | 2026-11 | **Nạp một lần, ngoại tuyến** — không phải phụ thuộc runtime |
| CosIng (EU) | `store` | `tools/data-pipeline/02_build_ingredient_dict.py` | `đang dùng` | 2026-11 | **Nạp một lần, ngoại tuyến** |

## 12.5. Quy tắc bảo trì danh mục

| Quy tắc | Căn cứ |
|---|---|
| Thêm/nâng cấp phụ thuộc cấp cao ⟹ cập nhật bảng này **trong cùng change** | `AGENTS.md §2.2` |
| Nâng cấp **major** là change có quản trị, cần phê duyệt | `.agents/rules/safety.md` |
| Phụ thuộc runtime nằm ở `PackageReference` / `dependencies`; phụ thuộc dev ở `devDependencies` — giữ **khớp với bảng này** | — |
| Hành vi thuộc hợp đồng khác (chính sách gọi nhà cung cấp, chuỗi LLM) nằm ở hợp đồng đó; bảng này **chỉ là kiểm kê** | `docs/tech-stack.md` của framework |
| Mọi phụ thuộc **phải ghim phiên bản**; không dùng dải mở rộng không giới hạn | `.syntheprise-quality.yml: dependency_policy` |

---


