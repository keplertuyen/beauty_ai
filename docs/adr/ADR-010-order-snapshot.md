---
doc: adr-adr-010
title: ADR-010 — Đóng băng dữ liệu đơn hàng bằng bản chụp (snapshot), không bằng tham chiếu
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-010 — Đóng băng dữ liệu đơn hàng bằng bản chụp (snapshot), không bằng tham chiếu


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `BR-ORDER-05`, `BR-PRICE-04`: đơn hàng phải bất biến trước thay đổi về giá sản phẩm và tỷ giá. |

**Quyết định:** `order_items` lưu **bản chụp đầy đủ** tại thời điểm đặt: `product_id` (tham chiếu, chỉ để liên kết), **cùng với** `product_name_snapshot`, `brand_name_snapshot`, `unit_price_usd`, `image_url_snapshot`. `orders` lưu `exchange_rate_applied`, `subtotal_usd`, `total_usd`, `total_vnd`, `shipping_fee_vnd`, và các mã voucher đã áp cùng số tiền giảm của từng mã.

**Lý do:** đây là áp dụng trực tiếp `core-principles.md §3.1` — *lưu dữ liệu gốc (source-of-truth) tại thời điểm giao dịch*. Nếu chỉ tham chiếu `product_id`, việc Admin sửa tên hoặc giá sản phẩm sẽ **viết lại lịch sử đơn hàng** — sai về kế toán và không thể đối soát.

**Hệ quả:** `order_items` có dữ liệu trùng lặp một cách **có chủ đích**. Đây là ngoại lệ hợp lý với nguyên tắc chuẩn hóa, và phải được ghi chú rõ trong lược đồ để người đọc sau không "tối ưu" nó đi.

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-09 (đơn hàng bất biến)
