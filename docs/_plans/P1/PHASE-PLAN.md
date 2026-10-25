---
doc: phase-plan-p1
title: Phase 1 Plan — NỀN TẢNG: DỮ LIỆU, KIẾN TRÚC, KHUNG DỰ ÁN
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 1 — NỀN TẢNG: DỮ LIỆU, KIẾN TRÚC, KHUNG DỰ ÁN

# 3. PHASE 1 — NỀN TẢNG: DỮ LIỆU, KIẾN TRÚC, KHUNG DỰ ÁN

| | |
|---|---|
| **Mục tiêu** | Có **bộ khung chạy được** + **dữ liệu sạch, đã kiểm tra chất lượng** trong cơ sở dữ liệu. Không có tính năng người dùng nào, nhưng mọi nền tảng để xây tính năng đều sẵn sàng. |
| **Khối lượng** | **72 giờ** · 18 ngày |
| **Trong phạm vi** | Khởi tạo repo từ framework · 12 ADR · lược đồ DB + migration · từ điển thành phần 150–200 mục · 12 quy tắc xung đột · chọn danh mục Lớp A · đường ống dữ liệu Python · Seeder · CI · Docker Compose |
| **Ngoài phạm vi** | Mọi API nghiệp vụ · mọi giao diện · xác thực |
| **Rủi ro chính được xử lý** | `RISK-05` (xuất xứ danh mục) · `RISK-06` (khối lượng từ điển) · `RISK-13` (chất lượng bóc tách INCI) |

## 3.1. Các work group

### `WG-P1-01` — Khởi tạo dự án từ Syntheprise Framework · **6h**

| Task | Giờ | Đầu ra |
|---|---|---|
| Chạy `./syntheprise new ../beautyai --blueprint dotnet-react-rn --tier 1 --adapter all --mode solo` | 1 | Repo có cấu trúc chuẩn |
| Xác nhận `./scripts/build` và `./scripts/test` xanh **trước khi viết dòng code nào** | 1 | Bộ khung chạy được |
| Điền `project-charter.md`: phạm vi, tier 1, chủ sở hữu, tiêu chí thành công, **ghi rõ phần mobile là chỗ dành sẵn cho V2** | 1,5 | Charter đã điền |
| Cấu hình `.syntheprise-quality.yml`: `mode: solo`, coverage line 70 / branch 60 | 0,5 | Cấu hình gate |
| Tạo `.env.example` với toàn bộ khóa (không giá trị); `.gitignore` cho `.env` | 0,5 | Mẫu cấu hình |
| Tạo `docker-compose.yml` (PostgreSQL 17 + extension) · `global.json` ghim .NET SDK | 1 | Hạ tầng cục bộ |
| `./syntheprise sync` → sinh adapter Antigravity/Claude/Codex; xác nhận không sai lệch | 0,5 | Adapter sẵn sàng |

### `WG-P1-02` — Trích xuất tài liệu vào repo & viết 12 ADR · **8h**

| Task | Giờ | Đầu ra |
|---|---|---|
| Trích `BRD` §8, §12 → `requirements.md` + `docs/_requirements/M01…M15.md` | 2 | Yêu cầu (precedence 3) |
| Trích `BRD` §7, §17.2 → `docs/domain-rules.md` | 1 | Quy tắc nghiệp vụ (precedence 4) |
| Trích `TD` §1–4 → `docs/architecture.md`; §5–6 → `docs/data-contracts.md`; §7 → `docs/api-contract.md` | 1,5 | Hợp đồng (precedence 2) |
| Trích `TD` §9 → `docs/llm-policy.md`; §10 → `docs/design-system.md`; §11 → `docs/security-policy.md`; §12 → `docs/tech-stack.md`; §17 → `docs/testing-strategy.md` | 1,5 | Hợp đồng (precedence 2) |
| **Viết 12 ADR thành 12 tệp riêng** trong `docs/adr/` | 1,5 | ADR-001…012 |
| Trích `BRD` §3 → `docs/_research/`; §15 → `docs/traceability.md` (bộ khung) | 0,5 | Nghiên cứu + ma trận |

> ⚠️ **Đây không phải "việc giấy tờ".** `AGENTS.md §0` quy định thứ tự ưu tiên tài liệu, và **AI Code Agent đọc chính các tệp này** để sinh code. Tài liệu đặt sai chỗ ⟹ agent đọc sai ngữ cảnh ⟹ code sai. Đây là **công việc cấu hình cho agent**, không phải thủ tục.

### `WG-P1-03` — Lược đồ DB & Migration · **10h**

| Task | Giờ | Đầu ra |
|---|---|---|
| Tạo 4 project .NET theo cấu trúc `TD` §13.2; cấu hình quy tắc phụ thuộc | 1,5 | Solution có 4 project |
| Viết **entity Domain** (35 thực thể của `TD` §5.2) — thuần C#, không thuộc tính EF | 3 | `BeautyAI.Domain/Entities/` |
| Viết **cấu hình Fluent API** cho từng entity (`IEntityTypeConfiguration<T>`) | 3 | `Infrastructure/Persistence/Configurations/` |
| Sinh migration đầu tiên; **xác minh DDL sinh ra khớp `TD` §6** (đặc biệt: 40+ ràng buộc `CHECK`) | 1,5 | Migration `InitialCreate` |
| Thêm extension `citext`, `unaccent`, `pg_trgm` + hàm `vn_normalize` (⚠️ dạng 2 tham số để `IMMUTABLE`) | 1 | Migration extension |

> 🔍 **Điểm dễ sai nhất của WG này:** hàm `unaccent()` một tham số **không** `IMMUTABLE` nên không dùng được trong index. Phải dùng `unaccent('public.unaccent', txt)`. Nếu làm sai, `CREATE INDEX` báo lỗi *"functions in index expression must be marked IMMUTABLE"* và rất dễ mất 1–2 giờ để hiểu nguyên nhân. Xem `TD` §6.1.

### `WG-P1-04` — Test kiến trúc & thiết lập CI · **6h**

| Task | Giờ | Đầu ra |
|---|---|---|
| `BeautyAI.ArchitectureTests`: Domain không có phụ thuộc · Application không tham chiếu EF Core/ASP.NET · thư viện nhà cung cấp chỉ ở tầng adapter | 2 | 4 test kiến trúc |
| ⭐ **`NoSafetyScoreAnywhereTests`** — thực thi `INV-01` bằng máy | 1 | Test bảo vệ quyết định sản phẩm |
| `BeautyAI.IntegrationTests` với Testcontainers PostgreSQL; `SchemaConstraintTests` cho mọi `CHECK` | 1,5 | Test ràng buộc |
| GitHub Actions: 5 job theo `TD` §15.3 (backend · frontend · openapi-drift · security · syntheprise-gate) | 1,5 | CI xanh |

### `WG-P1-05` — Đường ống dữ liệu: danh mục & chọn Lớp A · **10h**

| Task | Giờ | Đầu ra |
|---|---|---|
| Thiết lập `tools/data-pipeline/` (venv, requirements, config) | 1 | Môi trường Python |
| `01_extract_catalog.py`: làm sạch thương hiệu/danh mục/sản phẩm, sinh slug | 3 | 3 tệp CSV |
| ⚠️ **Chọn 200–400 SP Lớp A — NGƯỜI quyết định** | **4** | `products.csv` đã gắn nhãn lớp |
| `08_download_images.py`: tải & chuyển WebP ảnh SP Lớp A | 2 | Ảnh cục bộ |

> ⭐ **Task 4 giờ "chọn SP Lớp A" là việc của người, không của AI.** Tiêu chí (`OQ-TD-03`): ① thương hiệu thực tế có mặt ở Việt Nam · ② đủ dữ liệu thành phần · ③ **phân bố đều qua mọi bước routine** (nếu không có sản phẩm chống nắng nào trong Lớp A thì Routine Builder sẽ luôn thiếu bước bắt buộc — `INV-11`). Đây là xử lý trực tiếp cho `RISK-05`.

### `WG-P1-06` — Từ điển thành phần (công việc dữ liệu lớn nhất) · **18h**

| Task | Giờ | Đầu ra |
|---|---|---|
| `02_build_ingredient_dict.py`: nạp CosIng, đếm tần suất, xếp hạng ưu tiên | 3 | `ingredients_todo.csv` 150–200 mục |
| ⚠️ **Biên soạn diễn giải tiếng Việt — AI soạn nháp, NGƯỜI rà soát từng mục** | **10** | `ingredients_seed.csv` đã rà soát |
| Xây danh sách tên đồng nghĩa (~80 cặp) | 2 | `ingredient_synonyms.csv` |
| Định nghĩa 15 nhóm hoạt chất (`TD` §17.2 của BRD) | 1 | `active_groups.csv` |
| ⚠️ **Soạn 12 quy tắc xung đột + XÁC MINH từng nguồn** | **2** | `conflict_rules.csv` |

> ⭐⭐ **Đây là work group quan trọng nhất và dễ bị đánh giá thấp nhất của toàn dự án (`RISK-06`).** 18 giờ = 4,5 ngày chỉ để làm dữ liệu, không viết code. Nhưng:
> - Không có từ điển ⟹ không có phân tích INCI ⟹ **không có USP**.
> - 200 mục phủ > 90% nhu cầu thực tế. Làm 2.000 mục là vô nghĩa ở giai đoạn này.
> - **AI soạn nháp được, nhưng người PHẢI rà soát** — một diễn giải sai về hoạt chất là sai thông tin sức khỏe, nghiêm trọng hơn nhiều so với một lỗi code.
> - 12 quy tắc xung đột: mỗi quy tắc phải mở URL nguồn và đọc để xác minh. **Không có nguồn ⟹ ràng buộc `ck_cr_sourceurl` ở DB sẽ từ chối** — đó là chủ đích.

### `WG-P1-07` — Bóc tách INCI & lấy mẫu đánh giá · **8h**

| Task | Giờ | Đầu ra |
|---|---|---|
| `03_parse_inci.py`: cắt, chuẩn hóa, khớp từ điển + đồng nghĩa, lưu dòng chưa nhận diện | 4 | `product_ingredients.csv` + `coverage_report.md` |
| Rà soát danh sách khớp mờ — **người xác nhận, không tự động** | 1,5 | Khớp mờ đã xác nhận |
| `04_sample_reviews.py`: lọc + lấy mẫu phân tầng ~50.000 review | 2 | `reviews_sample.csv` |
| Kiểm tra `DQ-01` ≥ 90% · `DQ-02` ≥ 85% · `DQ-06` ≥ 60% | 0,5 | Báo cáo chất lượng |

> 🔍 **Quyết định quan trọng:** khớp mờ (fuzzy match) **không được tự động áp dụng**. Khớp sai gán một thành phần cho sản phẩm không chứa nó ⟹ **cảnh báo dị ứng sai** ⟹ mất niềm tin không lấy lại được. **Thà để `Chưa phân tích` còn hơn gán sai.** Đây là `RISK-13`.

### `WG-P1-08` — Gợi ý tính sẵn & Seeder · **6h**

| Task | Giờ | Đầu ra |
|---|---|---|
| `05_compute_similarity.py`: TF-IDF + cosine, top 8/SP | 1,5 | `product_similarities.csv` |
| `06_compute_association_rules.py`: Apriori, lọc theo ngưỡng | 1,5 | `association_rules.csv` |
| `tools/BeautyAI.Seeder`: nạp toàn bộ CSV qua `DbContext`, **idempotent**, kiểm tra chất lượng sau nạp | 2,5 | Seeder chạy được |
| Mật khẩu admin đọc từ biến môi trường (không viết cứng) | 0,5 | Admin đầu tiên |

> ⚠️ **Hạn chế phải nêu rõ:** dataset **không có dữ liệu giỏ hàng thật**. Luật mua kèm dùng **xấp xỉ** (nhóm sản phẩm cùng được một người đánh giá). Điều này **phải được ghi trong báo cáo đồ án và nêu trên giao diện** (`FR-PDP-09` AC-02) — che đi là điểm trừ, nêu rõ là điểm cộng về tính trung thực học thuật.

## 3.2. Sản phẩm bàn giao của Phase 1

| # | Sản phẩm | Kiểm chứng |
|---|---|---|
| 1 | Repo có cấu trúc Syntheprise đầy đủ, `./syntheprise gate` xanh | Nhật ký CI |
| 2 | 12 ADR trong `docs/adr/` | Rà soát tệp |
| 3 | Toàn bộ tài liệu canonical đã trích xuất đúng lớp precedence | `./syntheprise gate` (doc-drift) |
| 4 | Migration tạo đủ **35 bảng, 38 index, 40+ ràng buộc CHECK** | `SchemaConstraintTests` |
| 5 | **Từ điển 150–200 thành phần đã rà soát bởi người** | `DQ-02` ≥ 85% |
| 6 | **12 quy tắc xung đột, mỗi quy tắc có nguồn đã xác minh** | `DQ-04` = 100% |
| 7 | **200–400 SP Lớp A** phân bố đều qua mọi bước routine | Truy vấn kiểm tra |
| 8 | ~8.494 SP, ~150.000 liên kết thành phần, ~50.000 đánh giá trong DB | Truy vấn đếm |
| 9 | Ảnh SP Lớp A lưu cục bộ | `DQ-08` = 100% |
| 10 | CI 5 job xanh trên `main` | GitHub Actions |
| 11 | ⭐ `NoSafetyScoreAnywhereTests` pass | Nhật ký test |

## 3.3. Tiêu chí hoàn thành Phase 1 (Exit Criteria)

```text
☐ ./syntheprise gate XANH
☐ docker compose up → migration áp dụng → Seeder chạy → mọi ngưỡng §9.5 BRD ĐẠT
☐ DQ-01 ≥ 90% · DQ-02 ≥ 85% · DQ-03 = 100% · DQ-04 = 100% · DQ-06 ≥ 60% · DQ-08 = 100%
☐ Test kiến trúc (5 bài) pass — Domain không có phụ thuộc nào
☐ 12 ADR tồn tại và được chủ dự án phê duyệt
☐ Seeder chạy LẠI không tạo bản ghi trùng (idempotent)
☐ Mọi SP Lớp A có đủ dữ liệu bắt buộc và có ảnh cục bộ
☐ Có ít nhất 3 sản phẩm Lớp A cho MỖI bước routine (điều kiện cho INV-11)
☐ Ảnh chụp trạng thái cuối phase trong docs/_states/
```

---


