---
doc: adr-adr-012
title: ADR-012 — Giữ product_id dạng chuỗi làm khóa chính
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-012 — Giữ product_id dạng chuỗi làm khóa chính


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận (kế thừa từ PRD v2.0) |
| **Bối cảnh** | `BR-DATA-01`: giữ nguyên mã `P473671` của nguồn dữ liệu. |
| **Quyết định** | `products.product_id VARCHAR(50) PRIMARY KEY`, giữ nguyên giá trị gốc. **Không** chuyển sang số tự tăng. |
| **Lý do** | Dữ liệu gợi ý được tính ngoại tuyến bằng Python tham chiếu mã gốc. Nếu đổi sang số tự tăng, mọi lần nạp lại dữ liệu sẽ cần một bảng ánh xạ — thêm một nguồn sai sót không cần thiết. |
| **Hệ quả** | Khóa ngoại dạng chuỗi (dài hơn số nguyên) — ở quy mô 8.494 bản ghi, chi phí này không đáng kể. Cần chỉ mục phù hợp trên mọi khóa ngoại. |

## 2.1. Bảng tổng hợp ADR



**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** Khớp dữ liệu gốc Sephora
