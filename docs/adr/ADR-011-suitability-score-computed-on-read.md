---
doc: adr-adr-011
title: ADR-011 — Điểm Phù Hợp tính khi đọc, không lưu
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-011 — Điểm Phù Hợp tính khi đọc, không lưu


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




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-01 (không lưu chỉ số an toàn tuyệt đối)
