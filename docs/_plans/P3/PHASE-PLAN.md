---
doc: phase-plan-p3
title: Phase 3 Plan — DANH MỤC, TÌM KIẾM, PDP & WISHLIST
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 3 — DANH MỤC, TÌM KIẾM, PDP & WISHLIST

# 5. PHASE 3 — DANH MỤC, TÌM KIẾM, PDP & WISHLIST

| | |
|---|---|
| **Mục tiêu** | ✅ Duyệt 8.494 sản phẩm với Smart Filter; xem PDP có **phân tích INCI đầy đủ** |
| **Khối lượng** | **64 giờ** · 16 ngày |
| **Module** | M02 (10 FR) · M03 (13 FR) · M09 (4 FR) |

### `WG-P3-01` — Truy vấn danh mục & Smart Filter (backend) · **16h**

| Task | Giờ | FR/NFR |
|---|---|---|
| Thiết kế test trước: `SmartFilterBuilderTests`, `SearchServiceTests` | 2,5 | QA-first |
| `ProductQueryService` + phân trang + sắp xếp 6 tiêu chí | 3 | `FR-CAT-01`, `08` |
| **Tìm kiếm không dấu** (`unaccent` + `pg_trgm`) + gợi ý tức thì | 3 | `FR-CAT-03`, `NFR-PERF-04` |
| Lọc chứng nhận + lọc loại trừ (cờ nhãn **HOẶC** quét bảng thành phần) | 2,5 | `FR-CAT-04`, `05` |
| **Lọc nhiều hoạt chất AND/OR** — mẫu "đếm nhóm khớp" | 3 | `FR-CAT-06`, `NFR-PERF-03` |
| Lọc giá theo tiền tệ đang chọn + lọc loại da | 1,5 | `FR-CAT-07` |
| ⭐ `UnaccentedSearchTests` + `MultiActiveFilterTests` (integration) | 0,5 | — |

### `WG-P3-02` — Phân tích INCI & Điểm Phù Hợp (backend) · **14h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `IngredientParsingServiceTests`, `SuitabilityScoringServiceTests` | 2,5 | QA-first |
| `IngredientParsingService` (dùng lại logic của pipeline) + tính **tỷ lệ phủ** | 2,5 | `BR-ING-06`, `04b` |
| `FunctionProfiler` — phân bổ công năng theo nhóm | 1,5 | `FR-PDP-04` |
| ⭐ `SuitabilityScoringService` — 9 yếu tố, chuẩn hóa 0–100, **trả kèm `factors[]`** | 4 | `FR-PDP-03`, ADR-011 |
| `AllergyMatcher` — một truy vấn cho nhiều SP | 2 | `FR-PDP-05`, `BR-SKIN-04` |
| `ExplainabilityService` — bảng "Vì sao gợi ý sản phẩm này" | 1,5 | **`FR-PDP-13`, `CMP-20`** |

> ⭐ **`factors[]` phải được thu thập TRONG lúc tính điểm, không tính lại sau** (`TD` §8.7). Nếu tính điểm ở một chỗ và sinh lời giải thích ở chỗ khác, hai nơi sẽ trôi khỏi nhau — và vì công khai tiêu chí thuật toán là **nghĩa vụ pháp lý** (`CMP-20`), sai lệch này không chấp nhận được.

### `WG-P3-03` — Gợi ý liên quan & đánh giá (backend) · **8h**

| Task | Giờ | FR |
|---|---|---|
| `GET /products/{id}/similar` từ bảng tính sẵn + ghi chú phiên bản dữ liệu | 1,5 | `FR-PDP-08` |
| `GET /products/{id}/bought-together` + **không hiển thị khi không có luật đạt ngưỡng** | 1,5 | `FR-PDP-09` AC-02 |
| Đọc đánh giá + lọc theo loại da & số sao | 2 | `FR-PDP-10`, `FR-REV-01`, `02` |
| ⭐ `SimilarProfileAggregator` — "người có da giống bạn nói gì" | 3 | **`FR-PDP-12`** |

> ⭐ **`FR-PDP-12` là tính năng biến 1,1 triệu đánh giá từ một con số tiếp thị thành lợi thế thật.** Quy tắc then chốt: **không hiển thị khi < 5 đánh giá trong nhóm tương đồng** (tránh suy luận từ mẫu quá nhỏ), và **chỉ dùng trích dẫn nguyên văn có thật**, không để AI viết lại.

### `WG-P3-04` — Giao diện danh mục & PDP · **20h**

| Task | Giờ | FR |
|---|---|---|
| Design brief cho trang danh mục & PDP (`/ux-design`, dựa trên prototype) | 2 | `UI-04` |
| `ProductsPage` + `ProductGrid` + `ProductCard` (có **biểu tượng cảnh báo dị ứng**) | 4 | `FR-CAT-01` AC-03 |
| `SmartFilter` + `FilterChips` + **bộ lọc trong tham số URL** | 4 | `FR-CAT-09`, `FE-07` |
| `SafeForMeToggle` — "An toàn cho da tôi" | 1,5 | `FR-CAT-10` |
| `ProductDetailPage` + `GalleryPanel` | 2,5 | `FR-PDP-01` |
| ⭐ `InciTable` (giữ thứ tự, nhãn `Chưa phân tích`, tỷ lệ phủ) | 2,5 | `FR-PDP-02` |
| ⭐ `SuitabilityCard` (**KHÔNG phải SafetyScore**) + `FunctionChart` + **bảng văn bản thay thế cho trình đọc màn hình** | 2,5 | `FR-PDP-03`, `04`, `NFR-A11Y-02` |
| `AllergyWarningCard` (thẻ viền đỏ, **nêu rõ tên thành phần**) | 1 | `FR-PDP-05` |

### `WG-P3-05` — Wishlist & So sánh (khay) · **6h**

| Task | Giờ | FR |
|---|---|---|
| Backend wishlist (CRUD + thêm vào giỏ từ wishlist) | 2 | `FR-WISH-01`→`03` |
| `WishlistPage` + cập nhật lạc quan + trạng thái rỗng | 2 | `FE-12` |
| `CompareTray` (khay cố định đáy trang, tối đa 4) | 2 | `FR-CMP-01` |

## 5.1. Tiêu chí hoàn thành Phase 3

```text
☐ Duyệt được 8.494 sản phẩm, phân trang 24/trang
☐ Tìm "niaxinamit" (sai dấu, sai chính tả nhẹ) → ra sản phẩm Niacinamide
☐ Lọc Vegan + Niacinamide + BHA (AND) → kết quả đúng; đổi sang OR → kết quả rộng hơn
☐ Bộ lọc nằm trong URL; copy URL sang tab khác → cùng kết quả
☐ PDP hiển thị bảng INCI ĐÚNG THỨ TỰ + tỷ lệ phủ ("Đã phân tích 38/52 (73%)")
☐ ⚠️ KHÔNG có bất kỳ chỉ số "an toàn/nguy hiểm" nào trên toàn giao diện (INV-01)
☐ Điểm Phù Hợp CHỈ hiện khi đã có hồ sơ da; chưa có → hiện lời mời tạo hồ sơ
☐ Bấm vào Điểm Phù Hợp → thấy danh sách yếu tố cộng/trừ cụ thể
☐ Khối "người có da giống bạn" ẩn khi < 5 đánh giá tương đồng
☐ NFR-PERF-01 ≤ 1,5s · NFR-PERF-03 ≤ 500ms · NFR-PERF-04 ≤ 300ms (đo thật)
☐ Mọi trang có đủ 4 trạng thái
☐ Coverage ≥ 70% · gate XANH
```

---


