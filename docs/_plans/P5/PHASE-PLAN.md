---
doc: phase-plan-p5
title: Phase 5 Plan — CONFLICT DETECTOR, INGREDIENT ANALYZER & SO SÁNH
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 5 — CONFLICT DETECTOR, INGREDIENT ANALYZER & SO SÁNH

# 7. PHASE 5 — CONFLICT DETECTOR, INGREDIENT ANALYZER & SO SÁNH

| | |
|---|---|
| **Mục tiêu** | ✅ Lớp trí tuệ thành phần hoàn chỉnh — **điểm khác biệt cốt lõi của BeautyAI** |
| **Khối lượng** | **48 giờ** · 12 ngày |
| **Module** | M06 (5 FR) · M07 (6 FR) · M08 (4 FR) |
| **Rủi ro chính được xử lý** | `RISK-07` (cảnh báo quá mức) |

### `WG-P5-01` — Conflict Detection Engine · **16h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `ConflictDetectionServiceTests` + ⭐ `ConflictKnowledgeTests` (`GC-21`, `GC-22`) | 3,5 | `INV-03` |
| `ActiveGroupResolver` — SP → nhóm hoạt chất (có đệm) | 2 | `BR-CONF-01` |
| `ConflictRuleEvaluator` — sinh cặp nhóm, tra quy tắc | 2,5 | `BR-CONF-01` |
| ⭐ **`EvidenceTierGuard`** — chặn nâng mức cho cấp B/C | 2 | `INV-03`, `DC-14` |
| ⭐ **`RemediationAdvisor`** — mọi cảnh báo PHẢI có phương án | 2,5 | `BR-CONF-05` |
| Phát hiện trong **giỏ** và trong **routine cùng buổi** (mức nặng hơn một bậc) | 2 | `FR-CONF-01`, `04` |
| Tích hợp vào Routine Builder — **tự tránh xung đột `CAO`** | 1,5 | `BR-CONF-06` |

> ⭐⭐ **`GC-21` và `GC-22` là hai bài test bảo vệ điểm khác biệt khoa học của sản phẩm:**
> - `GC-21`: cặp **Vitamin C + Niacinamide** phải **KHÔNG** được cảnh báo — phải hiển thị **ghi chú đính chính huyền thoại**. Đây là điều mà PRD v2.0 làm sai (`G-02`).
> - `GC-22`: cặp **Retinoid + Benzoyl Peroxide** là **cặp DUY NHẤT** ở mức đỏ, và **phải nêu được sắc thái "Adapalene bền hơn Tretinoin"** — sắc thái chuyên môn mà không ứng dụng nào trên thị trường Việt Nam có.
>
> Nếu hai bài test này pass, BeautyAI có một điểm mạnh thật để trình bày. Nếu không, nó chỉ là một Yuka phiên bản Việt.

### `WG-P5-02` — Ingredient Analyzer · **12h**

| Task | Giờ | FR |
|---|---|---|
| Thiết kế test trước | 1,5 | QA-first |
| `POST /ingredients/analyze` — giới hạn 5.000 ký tự, coi nội dung là **dữ liệu không đáng tin** | 2,5 | `FR-ING-01`, `BR-AI-08` |
| Kết quả: tỷ lệ phủ · hoạt chất chính · công năng · comedogenic (kèm ghi chú giới hạn) | 2 | `FR-ING-02` |
| Đối chiếu với hồ sơ da + cảnh báo **xung đột nội tại trong chính sản phẩm** | 2 | `FR-ING-03` |
| Trang chi tiết thành phần + danh sách SP chứa nó | 2 | `FR-ING-04` |
| `IngredientAnalyzerPage` (giao diện) | 2 | — |

### `WG-P5-03` — Giao diện cảnh báo xung đột · **10h**

| Task | Giờ | FR |
|---|---|---|
| Design brief: 3 mức cảnh báo — ⚠️ **`THONG_TIN` phải trông như GHI CHÚ, không như cảnh báo** | 2 | `BR-CONF-02` |
| `ConflictBanner` (gộp theo mức, chi tiết 3 đầu, thu gọn phần còn lại) | 3 | `FR-CONF-01` AC-04 |
| `ConflictDetailModal` + `RemediationCard` + nút "Tách thành 2 buổi giúp tôi" | 3 | `FR-CONF-02` |
| Ô xác nhận "Tôi đã đọc và hiểu cảnh báo" — **không chặn hẳn việc mua** | 1,5 | `FR-CONF-03`, `BR-CONF-04` |
| Màu + biểu tượng + chữ (**không chỉ dựa vào màu**) | 0,5 | `NFR-A11Y-02` |

### `WG-P5-04` — Danh sách "đang dùng" & So sánh sản phẩm · **10h**

| Task | Giờ | FR |
|---|---|---|
| Backend: `currently_using_items` + kiểm tra xung đột với SP định mua | 3 | `FR-CONF-05` |
| `CurrentlyUsingEditor` (giao diện) | 2 | — |
| Backend so sánh: 11 tiêu chí + ô `Chưa có dữ liệu` | 2 | `FR-CMP-02` |
| `ComparePage` + `CompareTable` + làm nổi bật giá trị tốt hơn (**có giải thích "tốt hơn" nghĩa là gì**) | 2,5 | `FR-CMP-02` AC-02 |
| Nhãn cảnh báo dị ứng ở tiêu đề cột | 0,5 | `FR-CMP-03` |

## 7.1. Tiêu chí hoàn thành Phase 5

```text
☐ ⭐ Thêm SP chứa Tretinoin + SP chứa Benzoyl Peroxide vào giỏ
   → cảnh báo ĐỎ, có giải thích cơ chế, có phương án tách buổi, có URL nguồn,
     VÀ có sắc thái "Adapalene bền hơn Tretinoin"                      (GC-22)
☐ ⭐ Thêm SP Vitamin C + SP Niacinamide vào giỏ
   → KHÔNG có cảnh báo; CÓ ghi chú đính chính huyền thoại               (GC-21)
☐ ⭐ Thử tạo quy tắc cấp bằng chứng B với mức CAO → DB TỪ CHỐI (INV-03)
☐ Thử tạo quy tắc không có source_url → DB TỪ CHỐI (DC-13)
☐ MỌI cảnh báo đều có phương án hành động cụ thể (rà soát 12 quy tắc)
☐ Giỏ không có xung đột → KHÔNG hiện dải cảnh báo nào (không cảnh báo giả)
☐ Routine Builder tự tránh sinh xung đột CAO trong cùng buổi (BR-CONF-06)
☐ Dán bảng INCI 60 thành phần → phân tích đúng, nêu rõ số chưa nhận diện
☐ Dán > 5.000 ký tự → từ chối với thông báo rõ giới hạn
☐ So sánh 4 sản phẩm → bảng đủ 11 tiêu chí, ô thiếu dữ liệu ghi rõ
☐ NFR-PERF-06 ≤ 200ms cho giỏ 10 sản phẩm
☐ Coverage ≥ 70% · gate XANH
```

---

