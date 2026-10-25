---
doc: phase-plan-p4
title: Phase 4 Plan — DIGITAL SKIN ID, SKIN QUIZ & ROUTINE BUILDER
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 4 — DIGITAL SKIN ID, SKIN QUIZ & ROUTINE BUILDER

# 6. PHASE 4 — DIGITAL SKIN ID, SKIN QUIZ & ROUTINE BUILDER

| | |
|---|---|
| **Mục tiêu** | ✅ Cá nhân hóa hoạt động: khai hồ sơ da → làm quiz → nhận routine AM/PM |
| **Khối lượng** | **60 giờ** · 15 ngày |
| **Module** | M04 (7 FR) · M05 (9 FR) |
| **Rủi ro chính được xử lý** | `RISK-01` (lớp ẩn danh hóa được làm ở đây, trước khi có LLM) |

### `WG-P4-01` — Digital Skin ID (backend) · **12h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `SkinProfileServiceTests`, `AllergyMatcherTests` | 2 | QA-first |
| CRUD hồ sơ da + giới hạn 5 vấn đề da | 2,5 | `FR-SKIN-01`, `BR-SKIN-02` |
| Allergy Blacklist + gợi ý khớp (gồm tên đồng nghĩa + tên tiếng Việt) | 3 | `FR-SKIN-02` |
| **Xóa hồ sơ da = xóa THẬT** (cascade), không gắn cờ ẩn | 1 | `FR-SKIN-06`, `BR-SKIN-07` |
| Công tắc `allow_ai_sharing` — **mặc định TẮT ở tầng DB** | 1 | `FR-SKIN-07`, `NFR-PRIV-04` |
| ⭐ **`DeIdentificationService`** + test ranh giới dữ liệu | 2 | `BR-AI-16`, `INV-04` |
| ⭐ `AdminCannotReadSkinProfileTests` — thử 5 biến thể đường dẫn | 0,5 | `INV-07` |

> ⭐ **Làm `DeIdentificationService` ở Phase 4, TRƯỚC khi có LLM ở Phase 7.** Lý do (`RISK-01` §16.1 của BRD): *"Viết lớp ẩn danh hóa cùng lúc với adapter LLM, không để làm sau — nếu để sau thì sẽ không bao giờ được làm."* Thực tế còn tốt hơn: làm **trước** LLM, nên khi tới Phase 7 thì đường ống đã có sẵn chỗ cho nó, không thể "quên".

### `WG-P4-02` — Thuật toán Quiz 4 tầng (backend) · **14h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `QuizScoringServiceTests` — **gồm test tính tất định** | 3 | `INV-10` |
| `QuizScoringService`: Tầng 1 (lọc danh mục) + Tầng 2 (+3 loại da) | 3 | `BR-REC-01` |
| Tầng 3 (+2/vấn đề da) + **−1000 cho chất dị ứng** | 2,5 | `BR-REC-02` |
| Tầng 4 (lọc ngân sách) + **sắp xếp tất định có tiêu chí cuối `productId↑`** | 2,5 | `BR-REC-01`, `INV-10` |
| Chuẩn hóa Match Score 0–100; loại SP điểm ≤ 0 | 1,5 | `BR-REC-03` |
| `GET /quiz/questions` + `POST /quiz/evaluate` | 1,5 | `FR-QUIZ-01`, `02` |

> 🔍 **Điểm cực dễ sai:** thiếu tiêu chí sắp xếp cuối `productId ↑`. Hai sản phẩm cùng điểm/rating/loves sẽ được PostgreSQL trả về theo thứ tự tùy ý ⟹ golden case `GC-02` (tính tất định) **thất bại ngẫu nhiên** — loại lỗi tốn nhiều giờ nhất để tìm ra.

### `WG-P4-03` — Routine Builder (backend) · **12h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `RoutineBuilderServiceTests` | 2 | QA-first |
| Xếp bước theo thứ tự khoa học AM 5 bước / PM 5 bước | 3 | `BR-REC-04` |
| ⭐ **Bắt buộc có bước chống nắng ở AM** (kể cả khi không tìm được SP) | 1,5 | `BR-REC-05`, `INV-11` |
| Giới hạn 3–5 bước; người mới = 3 bước | 1,5 | `BR-REC-06` |
| Phương án thay thế cho từng bước (tối đa 3) | 2 | `FR-QUIZ-03` AC-04 |
| Lưu/xem/xóa routine (tối đa 3/người) + **khách chưa đăng nhập xem được nhưng không lưu** | 2 | `FR-QUIZ-07`, `BR-REC-10` |

### `WG-P4-04` — Giao diện Skin ID & Quiz · **22h**

| Task | Giờ | FR |
|---|---|---|
| Design brief cho Skin ID & Quiz | 2 | `UI-04` |
| `SkinProfileForm` + `SkinTypePicker` + `ConcernPicker` (giới hạn 5) | 4 | `FR-SKIN-01` |
| `AllergyEditor` với gợi ý tức thì + cảnh báo khi chưa khớp từ điển | 3,5 | `FR-SKIN-02` AC-03 |
| ⭐ `AiSharingToggle` + giải thích rõ dữ liệu nào được gửi đi đâu | 1,5 | `FR-SKIN-07` |
| Nút xóa hồ sơ da + hộp thoại **nêu rõ hậu quả** | 1 | `NFR-USE-04` |
| `QuizWizard` 5 bước + quay lại không mất dữ liệu + chỉ báo tiến trình | 4 | `FR-QUIZ-01` |
| `RoutineResult` 2 tab AM/PM + `RoutineStepCard` + `StepAlternatives` | 4 | `FR-QUIZ-03` |
| Phần "Vì sao sản phẩm này?" trong mỗi bước | 1,5 | `FR-QUIZ-04` |
| Trạng thái rỗng khi không tìm được SP cho một bước | 0,5 | `FR-QUIZ-02` AC-04 |

## 6.1. Tiêu chí hoàn thành Phase 4

```text
☐ Khai hồ sơ da → thêm "Fragrance" vào blacklist → PDP sản phẩm chứa Fragrance
   hiện thẻ ĐỎ nêu rõ tên thành phần
☐ Làm quiz 2 lần với CÙNG câu trả lời → kết quả GIỐNG HỆT (INV-10)
☐ Routine AM LUÔN có bước chống nắng, kể cả khi ngân sách rất thấp (INV-11)
☐ Sản phẩm chứa chất trong blacklist KHÔNG BAO GIỜ xuất hiện trong kết quả quiz
☐ Công tắc chia sẻ AI mặc định TẮT (kiểm chứng ở DB, không chỉ ở giao diện)
☐ ⭐ Test ranh giới dữ liệu: tải gửi đi KHÔNG chứa userId/email/tên/điện thoại
☐ ⭐ Admin thử 5 biến thể đường dẫn để đọc hồ sơ da → đều bị từ chối (INV-07)
☐ Xóa hồ sơ da → truy vấn DB xác nhận bản ghi ĐÃ MẤT, không chỉ bị ẩn
☐ NFR-PERF-05 ≤ 1s cho toàn bộ tính quiz
☐ Coverage ≥ 70% · gate XANH
```

---


