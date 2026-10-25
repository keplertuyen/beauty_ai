---
doc: architecture
title: Kiến Trúc Tổng Thể & Hợp Đồng Hệ Thống — BeautyAI Platform
status: draft
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# KIẾN TRÚC TỔNG THỂ HỆ THỐNG — BeautyAI Platform

> **Nguồn chân lý về CÁCH hệ thống được xây dựng (Precedence 2 — Contracts).**
> Xem danh mục 13 ADR độc lập tại [`docs/adr/`](docs/adr/).
> Xem lược đồ dữ liệu và DDL tại [`docs/data-contracts.md`](docs/data-contracts.md) và [`docs/db-schema/schema.sql`](docs/db-schema/schema.sql).
> Xem hợp đồng API tại [`docs/api-contract.md`](docs/api-contract.md).
> Bất biến hệ thống: định nghĩa tại §4.4 dưới đây là bất biến bắt buộc, được bảo vệ bằng Architecture Tests trong CI.

---

# 1. NGUYÊN TẮC & RÀNG BUỘC KIẾN TRÚC

## 1.1. Nguyên tắc chi phối (thứ tự ưu tiên)

| # | Nguyên tắc | Nguồn | Áp dụng cụ thể vào BeautyAI |
|---|---|---|---|
| **1** | **"Simple but Efficient" (KISS)** — độ phức tạp của giải pháp phải tương xứng với tầng/quy mô hiện tại của dự án | `core-principles.md §1`, §4 | Một backend, một database, không message queue, không Redis, không microservice. 4 project .NET, không phải 12 |
| **2** | **Chống over-engineering** — không xây hạ tầng giai đoạn cuối cho sản phẩm giai đoạn đầu | `core-principles.md §4` | Bộ nhớ đệm trong tiến trình thay vì Redis · `BackgroundService` thay vì Hangfire · không Kubernetes |
| **3** | **SOLID & Clean Architecture** — biên module rõ ràng, phụ thuộc hướng vào trong | `core-principles.md §3` | 4 lớp: Domain ← Application ← Infrastructure/Api. Domain **không** tham chiếu bất kỳ framework nào |
| **4** | **Bảo mật theo chuẩn hiện đại; bí mật không bao giờ viết cứng hay ghi log** | `core-principles.md §3`, `BR-SEC-04` | Băm mật khẩu PBKDF2 · xác thực bằng cookie httpOnly · bí mật ở `.env`/user-secrets · kiểm tra bí mật trong CI |
| **5** | **OOSAD cho mô hình dữ liệu** — định nghĩa đối tượng, quan hệ, ràng buộc một cách đầy đủ và có chủ đích; **lưu dữ liệu gốc, dẫn xuất giá trị tính toán khi đọc** | `core-principles.md §3.1` | USD là tiền tệ gốc, VND là dẫn xuất (`BR-PRICE-01`) · Điểm Phù Hợp **không lưu**, tính khi đọc · thứ tự thành phần được giữ nguyên |
| **6** | **Nhà cung cấp ngoài nằm sau adapter** có timeout/retry/xử lý lỗi; thư viện của nhà cung cấp **không được import ngoài tầng adapter**; thêm nguồn mới = một adapter + một dòng kiểm kê, **không sửa chỗ gọi** | `.agents/rules/provider-abstraction.md`, `AGENTS.md §2.5` | `ILlmProvider`, `IPaymentProvider`, `IHandoffChannel`, `IEmailSender` — xem §4.6 |
| **7** | **Tái sử dụng hệ thống thiết kế, không phát minh lại mẫu** | `.agents/rules/ui-ux-standards.md §1.2` | **Giữ nguyên 7.035 dòng CSS token của prototype**, không chuyển sang Tailwind — xem ADR-008 |
| **8** | **QA-first** — thiết kế test trước khi triển khai hành vi mức Must | `AGENTS.md §3` | Mỗi `BR-*` có ít nhất một unit test (`NFR-MAIN-02`) |
| **9** | **Mọi ngưỡng/hằng số là cấu hình, không viết cứng** | `AGENTS.md §2.7` tiêu chí (2), `NFR-MAIN-04` | Bảng `app_settings` + `IOptions<T>` — xem §16.2 |
| **10** | **Không thay đổi âm thầm** stack / lưu trữ / xác thực / triển khai / lược đồ — phải có ADR | `AGENTS.md §2.2` | §2 là nơi duy nhất ghi các quyết định này |

## 1.2. Ràng buộc kỹ thuật (từ `BRD` §2.6)

| Mã | Ràng buộc | Hệ quả kiến trúc |
|---|---|---|
| `CON-01` | 1 người + 1 AI Code Agent, ~4h/ngày | Tối thiểu hóa số thành phần cần cấu hình & vận hành; ưu tiên công nghệ "zero-config" |
| `CON-02` | Backend **.NET**, Frontend **React** | Khóa stack. Blueprint `dotnet-react-rn` của framework khớp chính xác |
| `CON-03` | **Cơ sở dữ liệu cục bộ** trên MacBook, không dịch vụ cloud trả phí | PostgreSQL trong Docker Compose cục bộ; **không** Supabase/RDS |
| `CON-04` | **Xác thực đơn giản: username + password ở DB cục bộ** | Không OAuth/SSO/IdP. **NHƯNG mật khẩu vẫn phải băm** (`BR-AUTH-02`) — xem ADR-004 |
| `CON-05` | **CI/CD: local (MacBook) + GitHub** | GitHub Actions cho kiểm tra chất lượng; triển khai = Docker Compose cục bộ; **không** môi trường staging thật |
| `CON-06` | Tuân thủ **Syntheprise Framework v6.0.1** | Cấu trúc repo, docs taxonomy, change spec, quality gate — xem §13 |
| `CON-07` | Chatbot = **quy tắc định trước + Gemini + chuyển tiếp Zalo** | Kiến trúc 3 tầng với adapter LLM — xem §9 |
| `CON-08` | **Không chẩn đoán y tế** | Bộ phân loại chặn trước + bộ lọc đầu ra — xem §9.5, §9.6 |
| `CON-09` | Giá gốc **USD**, thị trường **VND** | Dịch vụ quy đổi tập trung + đóng băng tỷ giá theo đơn — xem §8.4 |

## 1.3. Khung chất lượng kiến trúc (Architecture Quality Attributes)

Thứ tự ưu tiên khi hai thuộc tính xung đột:

```text
1. Tính đúng đắn & An toàn dữ liệu   (không bao giờ đánh đổi)
2. Tuân thủ pháp lý & Quyền riêng tư  (không bao giờ đánh đổi)
3. Khả năng kiểm thử                  (điều kiện để Done)
4. Đơn giản vận hành                  (ràng buộc 1 người)
5. Hiệu năng                          (đủ cho quy mô demo)
6. Khả năng mở rộng                   (không chống chỉ định, nhưng không xây trước)
```

**Ví dụ áp dụng:** khi phải chọn giữa *bộ nhớ đệm phân tán Redis* (hiệu năng, khả năng mở rộng) và *bộ nhớ đệm trong tiến trình* (đơn giản vận hành) → chọn **trong tiến trình**, vì ưu tiên 4 cao hơn ưu tiên 5 và 6 ở Tier 1.

---

# 2. CÁC QUYẾT ĐỊNH KIẾN TRÚC (ADR)

> Mỗi ADR dưới đây cần được tạo thành tệp riêng trong `docs/adr/` của repo dự án theo `AGENTS.md §2.2`. Bảng dưới là bản tổng hợp để đọc liền mạch.

## ADR-001 — Hợp nhất về một backend .NET; tính toán ML ngoại tuyến

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `PRD_BeautyAI_Tailored.md` v2.0 đề xuất **hai backend song song**: .NET 8 WebAPI (thương mại) + FastAPI Python (AI/ML, nạp 8.494 sản phẩm vào DataFrame trong RAM). Ràng buộc mới: `CON-01` (1 người, 4h/ngày), `CON-02` (.NET + React), `CON-05` (CI/CD local). |

**Các phương án đã xét:**

| | Phương án A — Hai backend (như PRD v2.0) | Phương án B — Một backend .NET, ML tính ngoại tuyến ✅ | Phương án C — Một backend .NET, viết lại ML bằng C# |
|---|---|---|---|
| **Mô tả** | .NET cho thương mại + FastAPI cho ML, chạy song song | .NET duy nhất. Script Python chạy **một lần ngoại tuyến** để tính độ tương đồng/luật mua kèm → ghi vào bảng DB. Runtime chỉ đọc | Viết lại TF-IDF/SVD/Apriori bằng C# (ML.NET) |
| **Thời gian thiết lập** | Cao (2 runtime, 2 pipeline, 2 bộ test) | **Thấp** | Trung bình |
| **Độ phức tạp vận hành** | 2 tiến trình phải cùng sống khi demo | **1 tiến trình** | 1 tiến trình |
| **Giữ được giá trị học thuật của phần khoa học dữ liệu** | ✅ | ✅ **Notebook/script Python vẫn là sản phẩm bàn giao** | ⚠️ Mất lợi thế hệ sinh thái Python |
| **Hiệu năng lúc chạy** | <50ms (RAM) | **<50ms (đọc bảng có chỉ mục)** — tương đương | Trung bình |
| **Gợi ý thời gian thực theo hành vi** | ✅ Có thể | ⚠️ Không (nhưng **không nằm trong phạm vi V1.0**) | ✅ Có thể |
| **Phù hợp `CON-01`, `CON-02`** | ❌ | ✅ | ✅ |
| **Rủi ro lúc demo** | Cao (nhiều điểm lỗi) | **Thấp** | Thấp |

**Quyết định: Phương án B.**

**Lý do:**
1. Các thuật toán trong phạm vi V1.0 (độ tương đồng nội dung, phân rã ma trận, luật kết hợp) **không phụ thuộc hành vi thời gian thực** — chúng tính trên dữ liệu tĩnh. Tính sẵn một lần là đủ.
2. PostgreSQL với chỉ mục phù hợp **xử lý thừa sức** quy mô 8.494 sản phẩm × 8 gợi ý và ~15.000 luật — không cần DataFrame trong RAM.
3. Loại bỏ một runtime, một pipeline, một bộ test, một tiến trình phải chạy khi demo — tiết kiệm trực tiếp cho ràng buộc 4h/ngày.
4. **Không mất giá trị học thuật:** các notebook Python vẫn là sản phẩm bàn giao, vẫn trình bày được phương pháp TF-IDF/SVD/Apriori.

**Hệ quả:**
- Thêm 2 bảng: `product_similarities`, `association_rules`, mỗi bảng có `version` + `computed_at` (`BR-DATA-06`).
- Đường ống Python nằm ở `tools/data-pipeline/` — **là công cụ phát triển, không phải thành phần runtime**.
- Khi cần tính lại: chạy script, không cần triển khai lại ứng dụng.
- **Nếu Phase sau cần gợi ý thời gian thực theo hành vi** → mở ADR mới; kiến trúc hiện tại không chặn điều đó (chỉ cần thêm một service).

---

## ADR-002 — PostgreSQL 17 trong Docker Compose cục bộ

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `CON-03` yêu cầu DB cục bộ, không dịch vụ cloud trả phí. PRD v2.0 dùng Supabase (cloud). Dữ liệu cần: ~8.494 sản phẩm, ~150.000 liên kết thành phần, ~50.000 đánh giá, ~15.000 luật. |

**Các phương án:**

| | PostgreSQL trong Docker ✅ | SQL Server (Developer Edition) | SQLite |
|---|---|---|---|
| Giữ được lược đồ & kiểu dữ liệu từ PRD v2.0 | ✅ (PRD viết bằng cú pháp PostgreSQL) | ⚠️ Phải chuyển đổi | ⚠️ Phải chuyển đổi |
| Hỗ trợ `citext`, `jsonb`, `GIN`, `pg_trgm`, `unaccent` | ✅ **Cần cho tìm kiếm không dấu & lọc hoạt chất** | ⚠️ Khác cú pháp | ❌ |
| Chi phí | 0 | 0 (Developer) | 0 |
| Hiệu năng trên Apple Silicon | ✅ Tốt | ⚠️ Chạy qua emulation/ARM image | ✅ |
| Phù hợp truy cập đồng thời (trừ tồn kho) | ✅ MVCC + `FOR UPDATE` | ✅ | ❌ **Khóa toàn file — rủi ro thật với `DC-11`** |
| Tương đồng với môi trường production tương lai | ✅ | ✅ | ❌ |

**Quyết định: PostgreSQL 17 (image chính thức) chạy qua Docker Compose.**

**Lý do quyết định:** `unaccent` + `pg_trgm` là **điều kiện kỹ thuật** để thỏa `FR-CAT-03` AC-03 (tìm kiếm không phân biệt dấu tiếng Việt) và AC-02 (gợi ý tức thì). SQLite không có; SQL Server có nhưng cú pháp khác và PRD đã viết bằng PostgreSQL.

**Hệ quả:** cần Docker Desktop trên máy phát triển. `docker-compose.yml` ở gốc repo. Sao lưu bằng `pg_dump` theo lịch (`NFR-REL-05`).

---

## ADR-003 — Truy cập dữ liệu: EF Core làm chính, Dapper cho báo cáo

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | PRD v2.0 đề xuất "EF Core cho CRUD + Dapper kết hợp Stored Procedure cho báo cáo doanh thu". Cần quyết định có giữ cách tiếp cận lai này không. |

**Quyết định:** **Giữ cách tiếp cận lai, nhưng bỏ Stored Procedure.**

| Loại truy vấn | Công cụ | Lý do |
|---|---|---|
| CRUD nghiệp vụ, điều hướng quan hệ, migration | **EF Core 10 + Npgsql** | Năng suất cao; migration là nguồn chân lý của lược đồ; tận dụng ràng buộc & quan hệ đã khai báo |
| Truy vấn lọc danh mục phức tạp (lọc theo nhiều hoạt chất + chứng nhận + giá + sắp xếp) | **EF Core với truy vấn biên dịch**; nếu đo được là chậm thì chuyển sang **Dapper + SQL viết tay** | Đo trước, tối ưu sau (`NFR-PERF-03` = 500ms là ngưỡng quyết định) |
| Báo cáo tổng hợp (doanh thu theo ngày/tháng/quý, top sản phẩm) | **Dapper + SQL viết tay trong tệp `.sql` có phiên bản** | Truy vấn tổng hợp viết bằng SQL rõ ràng hơn LINQ; Dapper nhanh và nhẹ |
| ~~Stored Procedure~~ | ❌ **Không dùng** | Lý do: SP nằm **ngoài** hệ thống migration → dễ sai lệch giữa code và DB; khó review trong PR; khó kiểm thử. SQL viết tay trong tệp có phiên bản đạt được **cùng hiệu năng** mà **không mất khả năng kiểm soát** |

> **Đây là một thay đổi có chủ đích so với PRD v2.0.** Nếu Chủ sản phẩm muốn giữ Stored Procedure vì lý do học thuật (minh họa kỹ năng SQL), có thể giữ **một** SP minh họa cho báo cáo doanh thu, nhưng phải được quản lý trong migration. Cần quyết định — xem `OQ-TD-01`.

---

## ADR-004 — Xác thực: Cookie httpOnly + băm mật khẩu PBKDF2

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

## ADR-005 — Trợ lý AI: kiến trúc 3 tầng với ép gọi hàm

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `CON-07` + `BR-AI-01`…`BR-AI-16`. Rủi ro chính: AI bịa sản phẩm (`RISK-04`), rò rỉ dữ liệu nhạy cảm ra nước ngoài (`RISK-01`), vi phạm quảng cáo mỹ phẩm (`RISK-02`), hết hạn mức đúng lúc demo (`RISK-03`). |

**Quyết định:** đường ống **7 chặng cố định**, mọi tin nhắn đều đi qua đủ 7 chặng theo thứ tự:

```text
Tin nhắn người dùng
   │
   ├─(1)─► Bộ phân loại CHẶN TRƯỚC (deterministic)         ── vùng chặn y tế? ──► Tầng 3: Zalo
   │                                                          (KHÔNG gọi LLM)
   ├─(2)─► Bộ kiểm tra HẠN MỨC                             ── vượt hạn? ──────► hạ cấp về Tầng 1
   │
   ├─(3)─► Bộ khớp Ý ĐỊNH (Tầng 1 — Rules)                 ── khớp? ──────────► trả lời từ DB
   │                                                          (KHÔNG gọi LLM)
   ├─(4)─► Bộ ẨN DANH HÓA ngữ cảnh                         (bắt buộc, BR-AI-16)
   │
   ├─(5)─► Gemini qua ILlmProvider (Tầng 2)
   │         • tool_choice = BẮT BUỘC gọi tim_san_pham()
   │         • schema đầu ra phẳng, enum cố định
   │         • timeout 8s
   │
   ├─(6)─► Bộ ĐỐI CHIẾU & LÀM GIÀU                         (BR-AI-02, BR-AI-10)
   │         • mã sản phẩm không có trong DB → LOẠI BỎ
   │         • giá/tồn kho → LẤY LẠI TỪ DB, không dùng số của LLM
   │
   └─(7)─► Bộ LỌC TUÂN THỦ ĐẦU RA                          (BR-AI-13, bắt buộc)
             • chặn/thay thế từ ngữ gây hiểu nhầm là thuốc
             • bảo đảm có disclaimer
                    │
                    ▼
            Trả về cho người dùng
```

**Bốn quyết định then chốt và lý do:**

| # | Quyết định | Vì sao bắt buộc |
|---|---|---|
| 1 | **Bộ phân loại chặn TRƯỚC khi gọi LLM** (chặng 1) | Hai lý do: (a) pháp lý — không để AI chạm vào chủ đề y tế (`BR-AI-03`); (b) kỹ thuật — bộ lọc an toàn của nhà cung cấp có thể chặn hoặc làm nhẹ câu trả lời một cách thất thường, gây trải nghiệm không đoán trước được |
| 2 | **Ép gọi hàm `tim_san_pham()`** (chặng 5) | Biện pháp chống bịa sản phẩm **hiệu quả nhất và rẻ nhất**. Mô hình **không được phép** sinh tên sản phẩm từ tri thức nội tại (`BR-AI-15`) |
| 3 | **Đối chiếu lại với DB** (chặng 6) | Lưới an toàn thứ hai. JSON hợp lệ **không đảm bảo giá trị đúng** — đây là giới hạn đã biết của đầu ra có cấu trúc. Giá hiển thị cho khách **luôn** lấy từ DB (`BR-AI-10`) |
| 4 | **Bộ lọc tuân thủ ở ĐẦU RA, không chỉ ở prompt** (chặng 7) | Chỉ thị trong prompt là *khuyến nghị* — LLM vẫn vi phạm. **Chỉ bộ lọc đầu ra là kiểm soát thật** (`BR-AI-13`, `CMP-04`) |

**Hệ quả:** 7 chặng đều là thành phần **kiểm thử độc lập được** → 22 golden case ở `BRD` §14.5 map trực tiếp vào các chặng. Xem §9 để biết thiết kế chi tiết.

---

## ADR-006 — Chuyển tiếp Zalo bằng deep link + mã phiên, không dùng API

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `FR-CHAT-07`, `BR-AI-11`. Cần chuyển hội thoại **kèm ngữ cảnh** sang chuyên viên người thật. |

**Phân tích khả thi các kênh Zalo** (chi tiết ở `BRD` §3.4):

| Kênh | Điều kiện | Khả thi V1.0 |
|---|---|---|
| ZNS | OA xác thực doanh nghiệp + template được duyệt + có phí/tin | ❌ |
| Follow Up | Cần đạt 50.000 tin ZNS **và** ≥ 5 cửa hàng | ❌ |
| OA API 2 chiều | Đăng ký ứng dụng + OA xác thực | 🔸 Phase 2 |
| **Deep link + mã phiên** | Chỉ cần có OA. **Không API, không quota, chi phí 0** | ✅ |

**Quyết định:**

```text
① Khách yêu cầu chuyển tiếp
② Hệ thống hiển thị CHÍNH XÁC dữ liệu sẽ được gửi → khách xác nhận rõ ràng (BR-AI-11)
③ Tạo bản ghi `handoff_requests` với mã dễ đọc: #BA-7F3K
④ Hiển thị cho khách: mã phiên + nút "Mở Zalo" → https://zalo.me/<oa_id>
⑤ Khách dán mã vào tin nhắn đầu tiên gửi chuyên viên
⑥ Chuyên viên tra mã #BA-7F3K trong Admin Console của BeautyAI
   → thấy đầy đủ: tóm tắt hội thoại, hồ sơ da (nếu được đồng ý),
     danh sách thành phần cần tránh, sản phẩm đang xem/trong giỏ
```

**Lý do đây là thiết kế tốt chứ không phải giải pháp tạm:**
1. **Chi phí 0, không phụ thuộc quota** → không có rủi ro hết hạn mức lúc demo.
2. **Dữ liệu nhạy cảm không bao giờ đi qua Zalo** — chỉ có mã phiên 6 ký tự đi qua. Hồ sơ da ở lại trong hệ thống BeautyAI, chuyên viên xem qua Admin Console đã xác thực. **Đây thực ra an toàn hơn việc gửi hồ sơ qua tin nhắn Zalo.**
3. Giải đúng khoảng trống thị trường: **chưa nhà bán lẻ mỹ phẩm Việt Nam nào làm chuyển tiếp có ngữ cảnh** (`BRD` §3.4).

**Hệ quả:** mã phiên phải **ngắn, dễ đọc, không gây nhầm lẫn** → bảng chữ Crockford Base32 (bỏ `I`, `L`, `O`, `U`), 4 ký tự + tiền tố `BA-`. Mã có thời hạn **24 giờ** rồi hết hiệu lực tra cứu.

---

## ADR-007 — Không viết lại Frontend từ đầu; chuyển prototype thành React giữ nguyên hệ thống thiết kế

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | Prototype hiện có **13 trang HTML + 7.035 dòng CSS** với hệ thống token hoàn chỉnh (màu, typography, spacing, radius, shadow, transition) và ~190 lớp component. Cần quyết định xử lý tài sản này thế nào. |

**Các phương án:**

| | Chuyển sang React, **giữ nguyên CSS token** ✅ | Viết lại bằng Tailwind | Viết lại bằng một UI kit (MUI/Ant) |
|---|---|---|---|
| Giữ được bản sắc thị giác đã thiết kế | ✅ **Nguyên vẹn** | ⚠️ Phải dịch lại toàn bộ token | ❌ Mất bản sắc, trông như mọi sản phẩm khác |
| Công sức | **Thấp** — CSS dùng lại trực tiếp | Cao | Rất cao |
| Tuân thủ `.agents/rules/ui-ux-standards.md §1.2` (*không phát minh lại mẫu khi hệ thống đã có*) | ✅ | ❌ **Vi phạm** | ❌ **Vi phạm** |
| Kích thước gói JS (`NFR-PERF-11` ≤ 300KB) | ✅ CSS không tính vào gói JS | ✅ | ❌ UI kit nặng |

**Quyết định:** **Chuyển prototype thành React, giữ nguyên `css/style.css` làm tầng token + dùng CSS Modules cho component mới.**

```text
frontend/src/styles/
  tokens.css        ← :root { --primary, --spacing-*, --radius-* ... }  (lấy từ prototype)
  base.css          ← reset + typography + utility  (lấy từ prototype)
  components.css    ← .btn, .card, .badge, .navbar ...  (lấy từ prototype)
frontend/src/features/<tính-năng>/Component.module.css  ← chỉ CSS riêng của component mới
```

**Hệ quả:**
- **Không** thêm Tailwind, **không** thêm UI kit. Phụ thuộc frontend giữ ở mức tối thiểu.
- Prototype HTML tiếp tục là **tài liệu thiết kế sống** (`docs/_ui-ux_design/`) — cập nhật nó khi thiết kế đổi (xem nhiệm vụ cập nhật prototype).
- Mỗi trang HTML → một route React; mỗi khối lặp lại trong HTML → một component React.

---

## ADR-008 — Hợp đồng API là OpenAPI sinh từ code; DTO frontend sinh tự động

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

## ADR-009 — Không dùng Redis / message queue / Hangfire ở Tier 1

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | Cần bộ nhớ đệm (`NFR-PERF-03`), tác vụ nền (`NFR-SCALE-04`), và xử lý không đồng bộ. |

**Quyết định:**

| Nhu cầu | Giải pháp Tier 1 ✅ | Giải pháp "đúng chuẩn" bị hoãn | Khi nào thì cần đổi |
|---|---|---|---|
| Bộ nhớ đệm | `IMemoryCache` trong tiến trình | Redis | Khi có > 1 phiên bản ứng dụng chạy song song |
| Tác vụ nền (tính lại điểm, nạp dữ liệu) | `BackgroundService` + `Channel<T>` | Hangfire / Quartz | Khi cần lịch chạy phức tạp hoặc theo dõi job qua UI |
| Hàng đợi sự kiện | Không có — gọi trực tiếp trong transaction | RabbitMQ / Kafka | Khi tách microservice |
| Giới hạn tần suất | Rate limiting middleware tích hợp của ASP.NET Core | API Gateway | Khi có nhiều phiên bản |

**Lý do:** `core-principles.md §4` — *"Không xây hạ tầng giai đoạn cuối cho sản phẩm giai đoạn đầu."* Mỗi thành phần hạ tầng thêm vào là một thứ phải cài, cấu hình, theo dõi, và có thể gãy lúc demo. Với 20 người dùng đồng thời (`ASM-02`), không thành phần nào ở cột giữa là cần thiết.

**Hệ quả quan trọng:** vì bộ nhớ đệm là trong tiến trình, **thiết kế không được giả định bộ nhớ đệm luôn có dữ liệu** — mọi đường dẫn đọc phải hoạt động đúng khi đệm rỗng (`NFR-SCALE-05`).

---

## ADR-010 — Đóng băng dữ liệu đơn hàng bằng bản chụp (snapshot), không bằng tham chiếu

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `BR-ORDER-05`, `BR-PRICE-04`: đơn hàng phải bất biến trước thay đổi về giá sản phẩm và tỷ giá. |

**Quyết định:** `order_items` lưu **bản chụp đầy đủ** tại thời điểm đặt: `product_id` (tham chiếu, chỉ để liên kết), **cùng với** `product_name_snapshot`, `brand_name_snapshot`, `unit_price_usd`, `image_url_snapshot`. `orders` lưu `exchange_rate_applied`, `subtotal_usd`, `total_usd`, `total_vnd`, `shipping_fee_vnd`, và các mã voucher đã áp cùng số tiền giảm của từng mã.

**Lý do:** đây là áp dụng trực tiếp `core-principles.md §3.1` — *lưu dữ liệu gốc (source-of-truth) tại thời điểm giao dịch*. Nếu chỉ tham chiếu `product_id`, việc Admin sửa tên hoặc giá sản phẩm sẽ **viết lại lịch sử đơn hàng** — sai về kế toán và không thể đối soát.

**Hệ quả:** `order_items` có dữ liệu trùng lặp một cách **có chủ đích**. Đây là ngoại lệ hợp lý với nguyên tắc chuẩn hóa, và phải được ghi chú rõ trong lược đồ để người đọc sau không "tối ưu" nó đi.

---

## ADR-011 — Điểm Phù Hợp tính khi đọc, không lưu

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `BR-ING-02`: Điểm Phù Hợp là quan hệ giữa **một sản phẩm và một hồ sơ da cụ thể**, không phải thuộc tính của sản phẩm. |

**Quyết định:** **không lưu** Điểm Phù Hợp vào DB. Tính khi đọc bởi `SuitabilityScoringService`, dựa trên: hồ sơ da hiện tại + danh sách dị ứng + dữ liệu thành phần sản phẩm + dữ liệu đánh giá nhóm tương đồng.

**Lý do:**
1. `core-principles.md §3.1` — *"lưu dữ liệu gốc, dẫn xuất giá trị tính toán khi đọc nếu điều đó giữ mô hình đơn giản và tránh trạng thái trùng lặp."*
2. Nếu lưu: mỗi lần người dùng sửa hồ sơ da hoặc Admin sửa từ điển thành phần → phải tính lại **toàn bộ** (số người dùng × số sản phẩm) = trạng thái cần đồng bộ liên tục, chắc chắn sẽ bị lệch.
3. Số lượng tính toán thực tế nhỏ: chỉ tính cho **tập ứng viên của một bước routine** (hàng chục sản phẩm), không phải toàn bộ danh mục.

**Hệ quả:** cần đệm trong tiến trình cho *dữ liệu thành phần của sản phẩm* (ít thay đổi) để tránh truy vấn lặp; nhưng **điểm thì luôn tính tươi**. Yêu cầu hiệu năng `NFR-PERF-05` (≤1s cho toàn quiz) là ngưỡng kiểm chứng.

---

## ADR-012 — Giữ `product_id` dạng chuỗi làm khóa chính

| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận (kế thừa từ PRD v2.0) |
| **Bối cảnh** | `BR-DATA-01`: giữ nguyên mã `P473671` của nguồn dữ liệu. |
| **Quyết định** | `products.product_id VARCHAR(50) PRIMARY KEY`, giữ nguyên giá trị gốc. **Không** chuyển sang số tự tăng. |
| **Lý do** | Dữ liệu gợi ý được tính ngoại tuyến bằng Python tham chiếu mã gốc. Nếu đổi sang số tự tăng, mọi lần nạp lại dữ liệu sẽ cần một bảng ánh xạ — thêm một nguồn sai sót không cần thiết. |
| **Hệ quả** | Khóa ngoại dạng chuỗi (dài hơn số nguyên) — ở quy mô 8.494 bản ghi, chi phí này không đáng kể. Cần chỉ mục phù hợp trên mọi khóa ngoại. |

## 2.1. Bảng tổng hợp ADR

| ADR | Quyết định | Thay đổi so với PRD v2.0? |
|---|---|---|
| 001 | Một backend .NET; ML tính ngoại tuyến | 🔄 **Thay đổi lớn** (bỏ FastAPI) |
| 002 | PostgreSQL 17 trong Docker cục bộ | 🔄 **Thay đổi** (bỏ Supabase) |
| 003 | EF Core chính + Dapper cho báo cáo, **bỏ Stored Procedure** | 🔄 Thay đổi một phần |
| 004 | Cookie httpOnly + PBKDF2 | 🔄 **Thay đổi** (bỏ JWT) |
| 005 | Trợ lý AI 7 chặng, ép gọi hàm | 🆕 Mới |
| 006 | Zalo deep link + mã phiên | 🆕 Mới |
| 007 | Giữ nguyên hệ thống thiết kế của prototype | ✅ Kế thừa |
| 008 | OpenAPI sinh từ code, DTO frontend sinh tự động | 🆕 Mới |
| 009 | Không Redis/MQ/Hangfire ở Tier 1 | 🆕 Mới |
| 010 | Bản chụp đơn hàng | ✅ Mở rộng |
| 011 | Điểm Phù Hợp tính khi đọc | 🆕 Mới |
| 012 | `product_id` dạng chuỗi | ✅ Kế thừa |

---
# 3. KIẾN TRÚC TỔNG QUAN HỆ THỐNG

## 3.1. Mức 1 — Bối cảnh hệ thống (System Context)

```text
┌──────────────┐                                                  ┌──────────────────┐
│  Khách hàng  │                                                  │ Chuyên viên      │
│  (trình      │                                                  │ tư vấn da        │
│   duyệt web) │                                                  │ (người thật)     │
└──────┬───────┘                                                  └────────▲─────────┘
       │ HTTPS                                                             │ tra mã phiên
       │                                                                   │ qua Admin Console
       ▼                                                                   │
┌─────────────────────────────────────────────────────────────────────────┬─┘
│                        HỆ THỐNG BeautyAI                                │
│                                                                          │
│   • Thương mại điện tử (danh mục · giỏ · đơn hàng · voucher)             │
│   • Trí tuệ thành phần (INCI · Điểm Phù Hợp · xung đột hoạt chất)        │
│   • Cá nhân hóa (Digital Skin ID · Skin Quiz · Routine Builder)          │
│   • Trợ lý hội thoại 3 tầng                                              │
│   • Quản trị & báo cáo                                                   │
└──┬───────────────┬────────────────┬──────────────────────────┬───────────┘
   │               │                │                          │
   │ HTTPS         │ deep link      │ HTTPS (redirect+callback) │ SMTP
   ▼               ▼                ▼                          ▼
┌──────────┐  ┌──────────┐   ┌──────────────┐          ┌──────────────┐
│ Google   │  │ Zalo     │   │ VNPay        │          │ Dịch vụ gửi  │
│ Gemini   │  │ OA       │   │ Sandbox      │          │ email        │
│ (EXT-01) │  │ (EXT-02) │   │ (EXT-03)     │          │ (EXT-06)     │
└──────────┘  └──────────┘   └──────────────┘          └──────────────┘

       ┌──────────────────┐        ┌──────────────────────┐
       │ Dataset Sephora  │        │ CosIng (EU)          │   ◄── nạp MỘT LẦN, ngoại tuyến
       │ (EXT-04)         │        │ (EXT-05)             │       (không phải phụ thuộc runtime)
       └──────────────────┘        └──────────────────────┘
                    ▲
┌───────────────────┴─────────┐
│ Quản trị viên               │
│ (Admin Console trên web)    │
└─────────────────────────────┘
```

## 3.2. Mức 2 — Kiến trúc container

```text
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        MÁY PHÁT TRIỂN / DEMO (MacBook, macOS ARM64)              ║
║                                                                                  ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │  frontend — React 19 + TypeScript + Vite              [:5173 dev]          │  ║
║  │                                                        [tĩnh ở prod]       │  ║
║  │  • SPA · React Router v7 · TanStack Query · Zustand                        │  ║
║  │  • Client sinh từ OpenAPI (openapi-fetch)                                   │  ║
║  │  • Hệ thống thiết kế: tokens.css + components.css (giữ từ prototype)        │  ║
║  └──────────────────────────────┬─────────────────────────────────────────────┘  ║
║                                 │ HTTP/JSON · cookie httpOnly · CORS credentials ║
║                                 ▼                                                ║
║  ┌────────────────────────────────────────────────────────────────────────────┐  ║
║  │  backend — ASP.NET Core 10 (Kestrel)                   [:5000]             │  ║
║  │                                                                             │  ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │  ║
║  │  │  BeautyAI.Api           — Endpoints · middleware · xác thực          │  │  ║
║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║
║  │  │  BeautyAI.Application   — Use cases · DTO · validator · policy       │  │  ║
║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║
║  │  │  BeautyAI.Domain        — Entity · enum · quy tắc nghiệp vụ          │  │  ║
║  │  │                           (KHÔNG tham chiếu framework nào)           │  │  ║
║  │  ├──────────────────────────────────────────────────────────────────────┤  │  ║
║  │  │  BeautyAI.Infrastructure— EF Core · Dapper · Adapter nhà cung cấp    │  │  ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │  ║
║  │                                                                             │  ║
║  │  Tiến trình nền trong cùng host: ScoreRecalcWorker · ConversationPurgeWorker │  ║
║  └───────┬──────────────────────────────────────────┬──────────────────────────┘  ║
║          │ Npgsql                                   │ HttpClient qua adapter      ║
║          ▼                                          ▼                             ║
║  ┌────────────────────────┐              ┌──────────────────────────────┐        ║
║  │  postgres  [:5432]     │              │  Đường hầm (cloudflared)     │        ║
║  │  Docker Compose        │              │  — chỉ cần cho callback VNPay│        ║
║  │  PostgreSQL 17         │              └──────────┬───────────────────┘        ║
║  │  + unaccent + pg_trgm  │                         │                             ║
║  │  volume: ./data/pg     │                         │                             ║
║  └────────────────────────┘                         │                             ║
║                                                     │                             ║
║  ┌────────────────────────────────────────────┐    │                             ║
║  │  tools/data-pipeline — Python 3.12         │    │   ◄── CÔNG CỤ PHÁT TRIỂN,  ║
║  │  pandas · scikit-learn · mlxtend           │    │       KHÔNG phải thành phần║
║  │  Chạy THỦ CÔNG, ghi kết quả vào postgres   │    │       runtime               ║
║  └────────────────────────────────────────────┘    │                             ║
╚═════════════════════════════════════════════════════│═════════════════════════════╝
                                                      │
                                      ┌───────────────┴───────────────┐
                                      ▼                               ▼
                             ┌─────────────────┐            ┌──────────────────┐
                             │ Gemini API      │            │ VNPay Sandbox    │
                             └─────────────────┘            └──────────────────┘
```

## 3.3. Mức 3 — Kiến trúc tầng trong backend

```text
                    ┌─────────────────────────────────────────┐
                    │         BeautyAI.Api                    │
                    │  ───────────────────────────────────    │
                    │  Endpoints/                             │
                    │    AuthEndpoints · CatalogEndpoints     │
                    │    ProductEndpoints · SkinProfile…      │
                    │    CartEndpoints · OrderEndpoints       │
                    │    QuizEndpoints · ChatEndpoints        │
                    │    AdminEndpoints · WebhookEndpoints    │
                    │  Middleware/                            │
                    │    ExceptionHandling · RequestLogging   │
                    │    RateLimiting · SecurityStampCheck    │
                    │  Program.cs — bootstrap + DI + mapping   │
                    └────────────────┬────────────────────────┘
                                     │ phụ thuộc
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │      BeautyAI.Application               │
                    │  ───────────────────────────────────    │
                    │  Features/<module>/                     │
                    │    Commands/ · Queries/ · Dtos/         │
                    │    Validators/                          │
                    │  Services/                              │
                    │    SuitabilityScoringService            │
                    │    ConflictDetectionService             │
                    │    RoutineBuilderService               │
                    │    QuizScoringService                   │
                    │    PricingService                       │
                    │    VoucherEngine                        │
                    │    IngredientParsingService            │
                    │    ChatOrchestrator (7 chặng)           │
                    │  Abstractions/                          │
                    │    I*Repository · ILlmProvider          │
                    │    IPaymentProvider · IHandoffChannel   │
                    │    IEmailSender · IClock · ICurrentUser  │
                    └────────┬───────────────────┬────────────┘
                             │                   │ (chỉ interface)
                             ▼                   │
         ┌─────────────────────────────┐         │
         │      BeautyAI.Domain        │         │
         │  ─────────────────────────  │         │
         │  Entities/                  │         │
         │  Enums/                     │         │
         │  ValueObjects/              │         │
         │    Money · OrderCode        │         │
         │    HandoffCode              │         │
         │  Rules/                     │         │
         │    OrderStateMachine        │         │
         │    ConflictRuleEvaluator    │         │
         │  KHÔNG có using nào tới     │         │
         │  EF Core / ASP.NET / HTTP   │         │
         └─────────────────────────────┘         │
                             ▲                   │
                             │ triển khai        │ triển khai
                             │                   ▼
                    ┌─────────────────────────────────────────┐
                    │     BeautyAI.Infrastructure             │
                    │  ───────────────────────────────────    │
                    │  Persistence/                           │
                    │    BeautyAiDbContext (EF Core)          │
                    │    Configurations/  (Fluent API)        │
                    │    Repositories/                        │
                    │    Migrations/                          │
                    │    Reporting/  (Dapper + *.sql)         │
                    │  Providers/          ◄── TẦNG ADAPTER   │
                    │    Llm/GeminiLlmProvider                │
                    │    Llm/NullLlmProvider  (chế độ offline)│
                    │    Payment/VnPaySandboxProvider         │
                    │    Payment/MockPaymentProvider          │
                    │    Handoff/ZaloDeepLinkHandoffChannel   │
                    │    Email/SmtpEmailSender                │
                    │    Email/NoOpEmailSender                │
                    │  Compliance/                            │
                    │    DeIdentificationService              │
                    │    AdvertisingComplianceFilter          │
                    │  Security/                              │
                    │    PasswordHasherAdapter                │
                    └─────────────────────────────────────────┘
```

### Quy tắc phụ thuộc (bắt buộc, có thể kiểm tra tự động)

| Từ | Được tham chiếu | **KHÔNG được** tham chiếu |
|---|---|---|
| `Domain` | — (không tham chiếu gì) | Tất cả |
| `Application` | `Domain` | `Infrastructure`, `Api`, EF Core, ASP.NET Core, HttpClient |
| `Infrastructure` | `Domain`, `Application` | `Api` |
| `Api` | `Domain`, `Application`, `Infrastructure` | — |

> 🔒 **Kiểm tra tự động:** thêm một test kiến trúc (dùng `NetArchTest` hoặc kiểm tra thủ công trong CI) xác minh `BeautyAI.Domain.csproj` **không có** `PackageReference` nào và `BeautyAI.Application` **không tham chiếu** `Microsoft.EntityFrameworkCore`. Vi phạm = FAIL quality gate. Đây là cách thực thi `core-principles.md §3` thay vì chỉ ghi trong tài liệu.

## 3.4. Kiến trúc triển khai (môi trường local & demo)

| Môi trường | Thành phần | Cách chạy | Ghi chú |
|---|---|---|---|
| **Dev** | postgres (Docker) · backend (`dotnet watch`) · frontend (`vite dev`) | `./scripts/dev` | HMR frontend; hot reload backend; CORS cho `:5173` |
| **Demo cục bộ** | postgres (Docker) · backend phục vụ cả API và frontend đã build | `./scripts/demo` | Frontend build ra `dist/` → backend phục vụ tĩnh → **một địa chỉ duy nhất `:5000`**, giảm điểm lỗi khi demo |
| **Demo ngoại tuyến** (dự phòng `RISK-16`) | Như trên + `NullLlmProvider` + `MockPaymentProvider` + câu trả lời AI đã cache | `./scripts/demo --offline` | **Không cần mạng.** Bắt buộc tổng duyệt ít nhất một lần |
| **CI** | postgres (service container) · test | GitHub Actions | Chỉ chạy build + test + gate, **không triển khai** |

> **Quyết định quan trọng cho demo:** chế độ demo dùng **một cổng duy nhất** (backend phục vụ frontend tĩnh). Lý do: khi trình bày, mỗi tiến trình phải chạy là một rủi ro. Chạy `./scripts/demo` → mở `http://localhost:5000` → xong.

## 3.5. Chiến lược cấu hình môi trường

```text
appsettings.json                  ← giá trị mặc định, an toàn để commit
appsettings.Development.json      ← ghi đè cho dev, an toàn để commit
.env                              ← BÍ MẬT, trong .gitignore  (BR-SEC-04)
.env.example                      ← mẫu, có commit, KHÔNG chứa giá trị thật
dotnet user-secrets               ← phương án thay thế cho .env ở máy dev
```

| Khóa bí mật | Nơi lưu | Nếu thiếu thì |
|---|---|---|
| `ConnectionStrings__Default` | `.env` | Ứng dụng **không khởi động** — báo lỗi rõ ràng ở startup |
| `Gemini__ApiKey` | `.env` | Ứng dụng **vẫn khởi động**, tự chọn `NullLlmProvider`, ghi cảnh báo. Trợ lý hoạt động ở Tầng 1 (`BR-AI-05`) |
| `VnPay__TmnCode`, `VnPay__HashSecret` | `.env` | Tự chọn `MockPaymentProvider`, ghi cảnh báo. COD vẫn hoạt động |
| `Zalo__OaId` | `.env` hoặc `app_settings` trong DB | Nút chuyển tiếp hiển thị form để lại liên hệ thay vì deep link |
| `Smtp__*` | `.env` | Tự chọn `NoOpEmailSender`, ghi log nội dung email thay vì gửi |
| `Admin__BootstrapPassword` | `.env` — **chỉ dùng một lần khi seed** | Script seed từ chối chạy (`§9.6` của BRD: không viết cứng mật khẩu admin) |

> 🔑 **Nguyên tắc thiết kế: hệ thống phải khởi động được và dùng được ngay cả khi KHÔNG có bí mật nào.** Mọi tích hợp ngoài đều có phiên bản `Null`/`Mock` được chọn tự động khi thiếu cấu hình. Điều này trực tiếp giảm `RISK-16` (demo thất bại vì phụ thuộc ngoài) và làm cho người mới clone repo chạy được ngay.

---

# 4. MÔ HÌNH COMPONENT ĐẦY ĐỦ

> Mỗi component dưới đây ánh xạ 1:1 tới một module trong `BRD` §6.2, để `FR-*` → component → test truy xuất được (`BRD` §15).

## 4.1. Bản đồ component tổng thể

```text
┌───────────────────────────────────── FRONTEND (React) ──────────────────────────────────┐
│                                                                                          │
│  App Shell          │ Catalog         │ Product Detail  │ Skin Intelligence              │
│  • Navbar           │ • ProductGrid   │ • GalleryPanel  │ • SkinProfileForm              │
│  • CartDrawer       │ • SmartFilter   │ • InciTable     │ • AllergyBlacklistEditor       │
│  • AuthGate         │ • SortControl   │ • SuitabilityC. │ • QuizWizard                   │
│  • CurrencyToggle   │ • FilterChips   │ • FunctionChart │ • RoutineBuilder               │
│  • ToastHost        │ • Pagination    │ • SimilarLike   │ • IngredientAnalyzer           │
│  • DisclaimerBar    │ • SafeForMe     │ • WhyRecommended│ • ConflictBanner               │
│                     │                 │ • ReviewsPanel  │                                │
│  ───────────────────┼─────────────────┼─────────────────┼────────────────────────────────│
│  Commerce           │ Chat            │ Account         │ Admin                          │
│  • CartPage         │ • ChatPanel     │ • ProfilePage   │ • AdminShell                   │
│  • VoucherBox       │ • MessageList   │ • OrderHistory  │ • ProductManager               │
│  • SummaryTable     │ • SuggestionPill│ • OrderDetail   │ • OrderManager                 │
│  • CheckoutForm     │ • HandoffCard   │ • SavedRoutines │ • IngredientDictEditor         │
│  • PaymentSelector  │ • TierBadge     │ • WishlistPage  │ • ConflictRuleEditor           │
│  • OrderResult      │ • Disclaimer    │ • ShareToggle   │ • VoucherManager               │
│  • CompareTray      │                 │                 │ • ExchangeRatePanel            │
│                     │                 │                 │ • ChatRuleEditor               │
│                     │                 │                 │ • ReportsPanel                 │
│                     │                 │                 │ • AuditLogViewer               │
│                     │                 │                 │ • HandoffQueue                 │
└──────────────────────────────────────────┬───────────────────────────────────────────────┘
                                           │ openapi-fetch (kiểu sinh tự động)
┌──────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                    BACKEND (.NET)                                        │
│                                                                                          │
│  ┌─ C1 Identity & Access ──────┐  ┌─ C2 Catalog & Search ───────┐  ┌─ C3 Ingredient ──┐  │
│  │ AuthService                 │  │ ProductQueryService         │  │ Intelligence     │  │
│  │ PasswordHasherAdapter       │  │ SmartFilterBuilder          │  │ InciParser       │  │
│  │ SessionManager              │  │ SearchService (unaccent)    │  │ IngredientRepo   │  │
│  │ AuthorizationPolicies       │  │ CategoryTreeService         │  │ FunctionProfiler │  │
│  │ LockoutTracker              │  │ SortStrategy                │  │ CoverageCalc     │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  └──────────────────┘  │
│                                                                                          │
│  ┌─ C4 Personalization ────────┐  ┌─ C5 Conflict Detection ─────┐  ┌─ C6 Commerce ────┐  │
│  │ SkinProfileService          │  │ ConflictDetectionService    │  │ CartService      │  │
│  │ AllergyMatcher              │  │ ActiveGroupResolver         │  │ VoucherEngine    │  │
│  │ SuitabilityScoringService   │  │ ConflictRuleEvaluator       │  │ PricingService   │  │
│  │ QuizScoringService (4 tầng) │  │ EvidenceTierGuard           │  │ ShippingCalc     │  │
│  │ RoutineBuilderService       │  │ RemediationAdvisor          │  │ ComboDiscount    │  │
│  │ SimilarProfileReviewService │  └─────────────────────────────┘  └──────────────────┘  │
│  │ ExplainabilityService       │                                                          │
│  └─────────────────────────────┘                                                          │
│                                                                                          │
│  ┌─ C7 Orders & Payment ───────┐  ┌─ C8 AI Assistant ───────────┐  ┌─ C9 Admin ───────┐  │
│  │ OrderService                │  │ ChatOrchestrator (7 chặng)  │  │ CatalogAdminSvc  │  │
│  │ OrderStateMachine           │  │ MedicalGuardClassifier (1)  │  │ IngredientAdmin  │  │
│  │ InventoryService            │  │ QuotaGuard (2)              │  │ ConflictRuleAdmin│  │
│  │ OrderCodeGenerator          │  │ IntentMatcher (3)           │  │ VoucherAdminSvc  │  │
│  │ PaymentCoordinator          │  │ DeIdentificationService (4) │  │ ExchangeRateSvc  │  │
│  │ ├ IPaymentProvider          │  │ ILlmProvider (5)            │  │ ChatRuleAdminSvc │  │
│  │ │  ├ VnPaySandboxProvider   │  │ │ ├ GeminiLlmProvider       │  │ ReportService    │  │
│  │ │  └ MockPaymentProvider    │  │ │ └ NullLlmProvider         │  │ ├ Dapper + .sql  │  │
│  │ SignatureVerifier           │  │ GroundingValidator (6)      │  │ ExcelExporter    │  │
│  │ ExchangeRateFreezer         │  │ ComplianceFilter (7)        │  │ AuditLogService  │  │
│  └─────────────────────────────┘  │ HandoffService              │  │ HandoffQueueSvc  │  │
│                                   │ └ IHandoffChannel           │  └──────────────────┘  │
│  ┌─ C10 Reviews ───────────────┐  │    └ ZaloDeepLinkChannel    │                        │
│  │ ReviewService               │  │ ConversationRepository      │  ┌─ C11 Platform ───┐  │
│  │ PurchaseVerifier            │  └─────────────────────────────┘  │ IClock           │  │
│  │ ReviewModerationService     │                                   │ ICurrentUser     │  │
│  │ SimilarProfileAggregator    │  ┌─ C12 Background Workers ────┐  │ IMemoryCache     │  │
│  └─────────────────────────────┘  │ ScoreRecalcWorker           │  │ AuditInterceptor │  │
│                                   │ ConversationPurgeWorker     │  │ ProblemDetails   │  │
│                                   │ HandoffExpiryWorker         │  │ Serilog          │  │
│                                   └─────────────────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2. Đặc tả từng component

### C1 — Identity & Access

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Đăng ký · đăng nhập · phiên · đổi mật khẩu · khóa tạm · phân quyền |
| **FR bao phủ** | `FR-AUTH-01`→`07` |
| **BR thực thi** | `BR-AUTH-01`→`06`, `BR-SEC-01`→`03` |
| **Phụ thuộc** | `IUserRepository`, `IPasswordHasher`, `IClock` |
| **Đầu vào** | Email (chuẩn hóa chữ thường), mật khẩu dạng rõ (chỉ trong RAM, không ghi log) |
| **Đầu ra** | Cookie xác thực · thông tin người dùng (không bao giờ gồm trường băm) |
| **Không được làm** | Ghi mật khẩu vào log · tiết lộ email có tồn tại hay không (`BR-AUTH-04`) · trả về `password_hash` trong bất kỳ DTO nào |
| **Bất biến chính** | Mọi endpoint yêu cầu đăng nhập đều qua policy; `security_stamp` khớp mới cho qua |

### C2 — Catalog & Search

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Truy vấn danh mục · tìm kiếm · Smart Filter · sắp xếp · phân trang |
| **FR bao phủ** | `FR-CAT-01`→`10` |
| **BR thực thi** | `BR-PRICE-02`, `BR-PRICE-06`, `BR-DATA-07` |
| **Điểm kỹ thuật then chốt** | Tìm kiếm **không phân biệt dấu** dùng `unaccent` + `pg_trgm` (`FR-CAT-03` AC-03). Lọc theo nhiều hoạt chất với ngữ nghĩa AND/OR (`FR-CAT-06` AC-02) dùng truy vấn tập hợp, không dùng nhiều `JOIN` lồng |
| **Ngưỡng hiệu năng** | `NFR-PERF-03` ≤ 500ms · `NFR-PERF-04` ≤ 300ms |
| **Bất biến chính** | Sản phẩm `NGUNG_BAN` và `NHAP` **không bao giờ** xuất hiện trong kết quả của khách; sản phẩm `THAM_KHAO` (Lớp B) xuất hiện nhưng **không mua được** |

### C3 — Ingredient Intelligence

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Bóc tách & chuẩn hóa INCI · tra từ điển · tính phân bổ công năng · tính tỷ lệ phủ |
| **FR bao phủ** | `FR-PDP-02`, `FR-PDP-04`, `FR-ING-01`→`04`, `FR-ADM-04` |
| **BR thực thi** | `BR-ING-01`→`07` |
| **Điểm kỹ thuật then chốt** | `InciParser`: cắt theo dấu phẩy → bỏ nội dung trong ngoặc mô tả → chuẩn hóa chữ → khớp theo **tên INCI chuẩn VÀ danh sách tên đồng nghĩa** → dòng không khớp lưu vào `product_unmatched_ingredients` (`BR-ING-06`) |
| **Không được làm** | ❌ **Tính hay hiển thị bất kỳ "điểm an toàn/nguy hiểm"** nào (`BR-ING-01`) — đây là bất biến quan trọng nhất của component này ❌ Bỏ qua im lặng thành phần chưa nhận diện (`BR-ING-04b`) ❌ Thay đổi thứ tự thành phần (`BR-ING-07`) |

### C4 — Personalization

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Hồ sơ da · khớp dị ứng · Điểm Phù Hợp · tính điểm quiz 4 tầng · xây routine · tổng hợp đánh giá nhóm tương đồng · bảng giải thích |
| **FR bao phủ** | `FR-SKIN-01`→`07`, `FR-QUIZ-01`→`09`, `FR-PDP-03`, `FR-PDP-12`, `FR-PDP-13` |
| **BR thực thi** | `BR-SKIN-01`→`07`, `BR-REC-01`→`10`, `BR-ING-02` |
| **Điểm kỹ thuật then chốt** | **Tính tất định là bất biến bắt buộc** (`BR-REC-09`): không dùng yếu tố ngẫu nhiên; tiêu chí sắp xếp cuối là `product_id ↑` để kết quả không phụ thuộc thứ tự trả về của DB. Điểm Phù Hợp **tính khi đọc, không lưu** (ADR-011) |
| **Không được làm** | ❌ Hiển thị Điểm Phù Hợp cho người chưa có hồ sơ da (`BR-ING-02`) ❌ Để sản phẩm chứa chất dị ứng xuất hiện trong gợi ý (`BR-REC-02`) ❌ Sinh routine AM thiếu bước chống nắng (`BR-REC-05`) |
| **Kiểm thử bắt buộc** | Golden case `GC-01`, `GC-02` (tính tất định), `GC-03` (loại trừ dị ứng) |

### C5 — Conflict Detection

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Phát hiện xung đột hoạt chất trong giỏ / trong routine / với sản phẩm đang dùng · sinh khuyến nghị xử lý |
| **FR bao phủ** | `FR-CONF-01`→`06`, `FR-QUIZ-05`, `FR-CART-09` |
| **BR thực thi** | `BR-CONF-01`→`06` |
| **Điểm kỹ thuật then chốt** | `EvidenceTierGuard` — **cổng bất biến**: quy tắc có `evidence_tier` ∈ {B, C} **không bao giờ** được hiển thị ở mức `CAO`, bất kể cấu hình DB (`BR-CONF-01b`, `DC-14`). Thực thi ở **hai nơi**: ràng buộc `CHECK` trong DB **và** kiểm tra trong code |
| **Điểm nghiệp vụ then chốt** | `RemediationAdvisor` — **mọi cảnh báo PHẢI có phương án hành động cụ thể** (`BR-CONF-05`). Cảnh báo không có phương án là lỗi, không phải thiếu sót nhỏ |
| **Kiểm thử bắt buộc** | `GC-21` (đính chính huyền thoại Vitamin C + Niacinamide — **không cảnh báo**), `GC-22` (Retinoid + BPO — cảnh báo đỏ kèm sắc thái Adapalene) |

### C6 — Commerce

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Giỏ hàng · hợp nhất giỏ · voucher đa tầng · quy đổi & làm tròn giá · phí vận chuyển · ưu đãi combo |
| **FR bao phủ** | `FR-CART-01`→`11`, `FR-PDP-06` |
| **BR thực thi** | `BR-CART-01`→`11`, `BR-PRICE-01`→`08` |
| **Điểm kỹ thuật then chốt** | `VoucherEngine` thực hiện **đúng thứ tự 6 bước** của `BR-CART-06`. Thứ tự này là **bất biến** — đổi thứ tự = đổi số tiền khách phải trả. Phải có unit test cho **từng tổ hợp** 3 loại voucher |
| **Không được làm** | ❌ Để tổng tiền âm (`BR-CART-07`) ❌ Cộng dồn số lượng khi hợp nhất giỏ (`BR-CART-02` — lấy số **lớn hơn**) ❌ Tự động xóa dòng sản phẩm hết hàng (`BR-CART-04`) |

### C7 — Orders & Payment

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Tạo đơn · máy trạng thái · trừ/hoàn tồn kho · đóng băng tỷ giá · phối hợp thanh toán · xác minh chữ ký |
| **FR bao phủ** | `FR-ORD-01`→`12` |
| **BR thực thi** | `BR-ORDER-01`→`08`, `BR-PRICE-04`, `BR-PRICE-07`, `BR-PRICE-08` |
| **Điểm kỹ thuật then chốt** | ① `OrderStateMachine` trong **Domain layer** — chuyển đổi không hợp lệ ném ngoại lệ miền, không phụ thuộc tầng nào<br>② Trừ tồn kho dùng **cập nhật có điều kiện nguyên tử** (`UPDATE … SET stock = stock - @q WHERE product_id = @id AND stock >= @q`) + kiểm tra số dòng bị ảnh hưởng → **không bao giờ tồn kho âm** (`DC-11`) kể cả khi đồng thời<br>③ Tạo đơn và nhận callback đều **idempotent** qua khóa idempotency (`NFR-REL-02`) |
| **Không được làm** | ❌ Chuyển trạng thái đơn khi chữ ký callback không hợp lệ (`FR-ORD-04` AC-03) ❌ Tạo đơn khi tỷ giá chưa cấu hình (`BR-PRICE-08`) ❌ Tính lại `total_vnd` từ tỷ giá hiện tại (`DC-09`) |

### C8 — AI Assistant

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Toàn bộ đường ống hội thoại 7 chặng · chuyển tiếp Zalo · lưu & dọn nhật ký hội thoại |
| **FR bao phủ** | `FR-CHAT-01`→`13` |
| **BR thực thi** | `BR-AI-01`→`16` |
| **Thiết kế chi tiết** | §9 |
| **Không được làm** | ❌ Gửi dữ liệu gắn danh tính ra ngoài (`BR-AI-16`) ❌ Hiển thị tên/giá sản phẩm lấy từ văn bản LLM (`BR-AI-10`) ❌ Hiển thị lỗi kỹ thuật cho người dùng (`BR-AI-05`) ❌ Có quyền thực hiện giao dịch (`NFR-SEC-11`) |
| **Kiểm thử bắt buộc** | 22 golden case `GC-01`→`GC-22` |

### C9 — Admin

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | CRUD danh mục/sản phẩm/thành phần/quy tắc xung đột/voucher · tỷ giá · kịch bản chatbot · báo cáo · xuất Excel · nhật ký kiểm toán · hàng đợi chuyển tiếp |
| **FR bao phủ** | `FR-ADM-01`→`16`, `FR-CONF-06`, `FR-ORD-08` |
| **BR thực thi** | `BR-SEC-03`, `BR-SEC-05`, `BR-PRICE-03`, `BR-CONF-01` |
| **Điểm kỹ thuật then chốt** | `AuditInterceptor` — một `SaveChangesInterceptor` của EF Core **tự động** ghi nhật ký mọi thay đổi do Admin thực hiện, kèm giá trị trước/sau. Lý do thiết kế: nếu để Dev tự nhớ ghi log ở từng chỗ thì chắc chắn sẽ thiếu. Chặn ở tầng hạ tầng là cách duy nhất đạt được "mọi hành động" |
| **Không được làm** | ❌ **Tồn tại bất kỳ endpoint nào cho phép Admin đọc hồ sơ da / danh sách dị ứng / hội thoại gắn danh tính của khách** (`BR-SEC-03`, `NFR-PRIV-08`). Đây là bất biến phải kiểm thử bằng luồng `E2E-08` |

### C10 — Reviews

| Thuộc tính | Nội dung |
|---|---|
| **Trách nhiệm** | Đọc/viết/lọc đánh giá · xác minh đã mua · kiểm duyệt · **tổng hợp theo nhóm hồ sơ tương đồng** |
| **FR bao phủ** | `FR-REV-01`→`05`, `FR-PDP-10`, `FR-PDP-12` |
| **Điểm kỹ thuật then chốt** | `SimilarProfileAggregator` — chỉ hiển thị khi có **≥ 5 đánh giá** trong nhóm tương đồng (`FR-PDP-12` AC-03). Trích dẫn **phải là nguyên văn có thật**, không để AI viết lại (`FR-PDP-12` AC-02) |
| **Không được làm** | ❌ Cho viết đánh giá khi chưa mua (`FR-REV-03` AC-02) ❌ Xóa vật lý đánh giá bị kiểm duyệt (`FR-REV-05` AC-02) |

### C11 — Platform (cross-cutting)

| Thành phần | Trách nhiệm | Lý do tồn tại |
|---|---|---|
| `IClock` | Trừu tượng hóa thời gian hiện tại | **Điều kiện để kiểm thử** mọi logic phụ thuộc thời gian: hiệu lực voucher, khóa tạm 15 phút, hết hạn phiên 7 ngày, dọn hội thoại 90 ngày, khung giờ hỗ trợ |
| `ICurrentUser` | Cung cấp danh tính người gọi cho Application layer | Để Application layer kiểm tra chủ sở hữu (`NFR-SEC-03`) mà **không** phụ thuộc `HttpContext` |
| `AuditInterceptor` | Ghi nhật ký kiểm toán tự động | `BR-SEC-05` — xem C9 |
| `ProblemDetails` handler | Chuẩn hóa phản hồi lỗi `{ "error": { "code", "message" } }` | `docs/api-contract.md §1` của framework; đồng thời đảm bảo `NFR-SEC-06` (không lộ dấu vết ngăn xếp) |
| Serilog | Nhật ký có cấu trúc + mã truy vết | `NFR-OBS-01` |
| `SensitiveDataMasker` | Che dữ liệu cá nhân trong log | `NFR-PRIV-10`, `NFR-OBS-05` |

### C12 — Background Workers

| Worker | Nhiệm vụ | Kích hoạt | FR/BR |
|---|---|---|---|
| `ScoreRecalcWorker` | Tính lại dữ liệu dẫn xuất sau khi Admin sửa từ điển thành phần | Hàng đợi trong tiến trình (`Channel<T>`) | `FR-ADM-04` AC-03, `NFR-SCALE-04` |
| `ConversationPurgeWorker` | Xóa hội thoại quá 90 ngày | Hằng ngày | `BR-AI-09`, `DC-18`, `NFR-PRIV-06` |
| `HandoffExpiryWorker` | Hết hiệu lực mã phiên chuyển tiếp sau 24h | Hàng giờ | ADR-006 |

## 4.3. Ma trận component × module

| Module (BRD §6.2) | Component backend | Component frontend |
|---|---|---|
| M01 Tài khoản & Xác thực | C1 | AuthGate · LoginPage · RegisterPage · ChangePasswordForm |
| M02 Danh mục & Smart Filter | C2 | ProductGrid · SmartFilter · SortControl · Pagination · SafeForMe |
| M03 PDP & Phân tích INCI | C2 · C3 · C4 · C10 | GalleryPanel · InciTable · SuitabilityCard · FunctionChart · SimilarLike · WhyRecommended · ReviewsPanel |
| M04 Digital Skin ID | C4 | SkinProfileForm · AllergyBlacklistEditor · ShareToggle |
| M05 Skin Quiz & Routine | C4 · C5 | QuizWizard · RoutineBuilder · ConflictBanner |
| M06 Ingredient Analyzer | C3 · C5 | IngredientAnalyzer |
| M07 Conflict Detector | C5 | ConflictBanner |
| M08 So sánh sản phẩm | C2 · C3 · C4 | CompareTray · ComparePage |
| M09 Wishlist | C6 | WishlistPage |
| M10 Giỏ hàng & Voucher | C6 · C5 | CartPage · CartDrawer · VoucherBox · SummaryTable |
| M11 Thanh toán & Đơn hàng | C7 | CheckoutForm · PaymentSelector · OrderResult · OrderHistory · OrderDetail |
| M12 Trợ lý AI | C8 | ChatPanel · MessageList · HandoffCard · TierBadge · DisclaimerBar |
| M13 Đánh giá | C10 | ReviewsPanel · WriteReviewForm |
| M14 Admin Console | C9 | AdminShell + 10 trang quản trị |
| M15 Hỗ trợ & Thông báo | C11 | SupportPage · PolicyPage · MethodologyPage · NotFoundPage |

## 4.4. Bất biến cấp hệ thống (System Invariants)

> Đây là các thuộc tính **phải luôn đúng**, và mỗi thuộc tính có **một kiểm thử tương ứng**. Nếu một bất biến bị vi phạm, đó là lỗi chặn phát hành.

| # | Bất biến | Thực thi ở đâu | Kiểm thử |
|---|---|---|---|
| **INV-01** | Không tồn tại chỉ số "an toàn/nguy hiểm" nào trong lược đồ, API, hay giao diện | Rà soát lược đồ + kiểm tra chuỗi hiển thị | `DC-07` · tiêu chí nghiệm thu #6 |
| **INV-02** | Tồn kho **không bao giờ** âm | Cập nhật có điều kiện nguyên tử trong DB | `FR-ORD-03` AC-04 · test tích hợp đồng thời |
| **INV-03** | Quy tắc xung đột cấp B/C **không bao giờ** hiển thị mức `CAO` | Ràng buộc `CHECK` trong DB **và** `EvidenceTierGuard` trong code | `FR-CONF-01` AC-02c |
| **INV-04** | Dữ liệu gửi tới nhà cung cấp LLM **không bao giờ** chứa thông tin gắn danh tính | `DeIdentificationService` ở chặng 4, bắt buộc trong đường ống | `GC-17` · kiểm thử nhật ký |
| **INV-05** | Mã sản phẩm do LLM nêu mà không có trong DB **không bao giờ** đến được giao diện | `GroundingValidator` ở chặng 6 | `GC-15` |
| **INV-06** | Văn bản chứa từ ngữ gây hiểu nhầm là thuốc **không bao giờ** đến được giao diện | `ComplianceFilter` ở chặng 7 | `GC-16` |
| **INV-07** | Admin **không có đường nào** đọc hồ sơ da của khách | Không tồn tại endpoint; kiểm tra chủ sở hữu ở Application | `E2E-08` |
| **INV-08** | Mật khẩu **không bao giờ** xuất hiện ở dạng rõ trong DB, log, hay phản hồi API | `PasswordHasherAdapter` + `SensitiveDataMasker` + rà soát DTO | `DC-19` · tiêu chí nghiệm thu #11 |
| **INV-09** | Đơn hàng đã tạo **không bao giờ** đổi giá/tên sản phẩm khi dữ liệu nguồn đổi | Bản chụp trong `order_items` (ADR-010) | `E2E-07` |
| **INV-10** | Cùng đầu vào quiz → cùng kết quả | Sắp xếp tất định, không có yếu tố ngẫu nhiên | `GC-02` |
| **INV-11** | Routine AM **luôn** có bước chống nắng | `RoutineBuilderService` | `FR-QUIZ-03` AC-02 |
| **INV-12** | Trợ lý AI **không thể** thực hiện giao dịch | Không có tool nào có tác dụng phụ được khai báo cho LLM | `GC-13` |

---

