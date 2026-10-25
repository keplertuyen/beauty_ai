---
doc: phase-plan-p6
title: Phase 6 Plan — GIỎ HÀNG, VOUCHER, THANH TOÁN & ĐƠN HÀNG
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 6 — GIỎ HÀNG, VOUCHER, THANH TOÁN & ĐƠN HÀNG

# 8. PHASE 6 — GIỎ HÀNG, VOUCHER, THANH TOÁN & ĐƠN HÀNG

| | |
|---|---|
| **Mục tiêu** | ✅ **DEMO ĐƯỢC TRỌN LUỒNG MUA HÀNG** — từ xem sản phẩm tới đơn hàng hoàn tất |
| **Khối lượng** | **96 giờ** · 24 ngày — **phase lớn nhất** |
| **Module** | M10 (11 FR) · M11 (12 FR) |
| **Rủi ro chính** | `RISK-10` (tích hợp VNPay khó hơn dự kiến) · `RISK-17` (tỷ giá viết cứng) |

> ⚠️ **Đây là phase dễ bị đánh giá thấp nhất của toàn dự án.** Nó trông "chỉ là giỏ hàng và thanh toán", nhưng chứa phần nhiều quy tắc nghiệp vụ tinh vi nhất: thứ tự áp voucher 6 bước, đóng băng tỷ giá, trừ tồn kho an toàn khi đồng thời, máy trạng thái đơn, xác minh chữ ký callback, xử lý idempotent. **Mỗi quy tắc trong số đó sai = tiền của khách sai.**

### `WG-P6-01` — Dịch vụ giá & quy đổi song tệ · **12h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `PricingServiceTests` — **mọi quy tắc BR-PRICE-01…08** | 3 | QA-first |
| `ISettingsProvider` + đệm trong tiến trình + `Invalidate()` | 2 | `NFR-MAIN-04`, §16.2 TD |
| Quy đổi + **làm tròn LÊN bội số 1.000** | 1,5 | `BR-PRICE-02` |
| Giá hiệu lực (khuyến mãi) + hiển thị % giảm | 1,5 | `BR-PRICE-05` |
| **Chặn mọi thao tác khi tỷ giá chưa cấu hình** (không dùng giá trị mặc định ngầm) | 1,5 | `BR-PRICE-08` |
| API trả **cả `priceUsd` và `priceVnd`** để đổi tiền tệ không gọi lại API | 1,5 | `FE-06` |
| ⚠️ **Loại bỏ tỷ giá viết cứng 25.400 khỏi frontend** | 1 | `RISK-17`, `G-25` |

### `WG-P6-02` — Giỏ hàng (backend) · **14h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `CartServiceTests` | 2 | QA-first |
| CRUD giỏ + giới hạn số lượng `min(10, tồn kho)` | 2,5 | `FR-CART-01`, `02` |
| ⭐ **Hợp nhất giỏ khi đăng nhập — lấy số lượng LỚN HƠN, KHÔNG cộng dồn** | 2,5 | `BR-CART-02` |
| Xử lý SP hết hàng: **đánh dấu, loại khỏi tính tiền, KHÔNG tự xóa** | 2 | `BR-CART-04` |
| Chặn thêm SP Lớp B (`THAM_KHAO`) vào giỏ | 1 | `BR-DATA-07` |
| Giỏ bền vững xuyên thiết bị (server) + giỏ tạm (localStorage) | 2 | `FR-CART-10` |
| Tích hợp cảnh báo xung đột + cờ dị ứng vào phản hồi `GET /cart` | 2 | `FR-CART-09` |

### `WG-P6-03` — Động cơ Voucher · **16h**

| Task | Giờ | FR/BR |
|---|---|---|
| ⭐ Thiết kế test trước: `VoucherEngineTests` — **MỌI tổ hợp 3 loại voucher** | 4 | `BR-CART-05`→`09` |
| Áp mã + **điều kiện phải thỏa đồng thời** + lý do từ chối **CỤ THỂ** | 3 | `BR-CART-08` |
| ⭐ **Thứ tự áp dụng 6 bước — BẤT BIẾN** | 3,5 | `BR-CART-06` |
| Chặn tổng tiền ở 0, **không bao giờ âm** | 1 | `BR-CART-07` |
| Phí vận chuyển + ngưỡng miễn phí + mã FREESHIP **chỉ áp lên phí ship** | 2 | `BR-CART-10` |
| Ưu đãi combo routine (áp **trước** bước ②) | 1,5 | `BR-CART-11` |
| **Đánh giá lại mọi mã khi giỏ thay đổi** + bỏ áp kèm lý do | 1 | `BR-CART-09` |

> ⭐ **Vì sao dành 4 giờ chỉ để thiết kế test cho Voucher:** thứ tự áp dụng 6 bước là **bất biến về số tiền khách phải trả**. Có 3 loại mã × (% hoặc số tiền) × (thỏa/không thỏa điều kiện) = hàng chục tổ hợp. Một lỗi ở đây không gây crash — nó **im lặng tính sai tiền**, và chỉ phát hiện khi đối soát. Test phải được viết trước, với số liệu tính tay.

### `WG-P6-04` — Đơn hàng & tồn kho (backend) · **18h**

| Task | Giờ | FR/BR |
|---|---|---|
| Thiết kế test trước: `OrderServiceTests` + ⭐ `InventoryConcurrencyTests` | 3,5 | `INV-02` |
| ⭐ `OrderStateMachine` trong **Domain layer** (thuần C#) | 2 | `BR-ORDER-01`, F5 |
| ⭐ **Trừ tồn kho bằng cập nhật có điều kiện nguyên tử** | 3 | `INV-02`, `FR-ORD-03` AC-04 |
| `OrderCodeGenerator` — `BA-YYYYMMDD-NNNN` duy nhất | 1,5 | `BR-ORDER-07` |
| ⭐ **Đóng băng tỷ giá + tổng tiền + bản chụp sản phẩm** | 3 | `BR-PRICE-04`, ADR-010 |
| Transaction tạo đơn **nguyên tử** (đơn + dòng + tồn kho + làm rỗng giỏ) | 2 | `NFR-REL-04` |
| Idempotency key chống tạo đơn trùng | 1,5 | `NFR-REL-02` |
| Hủy đơn (khách tự hủy khi `CHO_XU_LY`) + **hoàn tồn kho** | 1,5 | `FR-ORD-07`, `BR-ORDER-04` |

### `WG-P6-05` — Tích hợp thanh toán VNPay Sandbox · **16h**

| Task | Giờ | FR/BR |
|---|---|---|
| ⚠️ **Xin tài khoản VNPay Sandbox + đọc tài liệu — việc của NGƯỜI** | **3** | `RISK-10` |
| ⚠️ **Thiết lập đường hầm (`cloudflared`) cho callback — việc của NGƯỜI** | **2** | `RISK-10` |
| `IPaymentProvider` + `VnPaySandboxProvider` (tạo URL thanh toán) | 3 | `FR-ORD-04` AC-01 |
| ⭐ **`SignatureVerifier` — xác minh chữ ký TRƯỚC khi đọc nội dung nghiệp vụ** | 2,5 | `NFR-SEC-08`, `FR-ORD-04` AC-03 |
| Endpoint IPN + **xử lý idempotent** + đối chiếu số tiền | 2,5 | `FR-ORD-04` AC-06 |
| ⭐ **`MockPaymentProvider` — phương án dự phòng, chọn tự động khi thiếu cấu hình** | 2 | `RISK-10`, `RISK-16` |
| Xử lý hết hạn 15 phút (cờ, **không tự hủy đơn**) | 1 | `BR-ORDER-06` |

> ⚠️ **5 trong 16 giờ của WG này là việc người không thể giao cho AI:** xin tài khoản sandbox, đọc tài liệu cổng thanh toán, thiết lập đường hầm. Đây đúng là `RISK-08` ở dạng cụ thể — **nút thắt là tích hợp, không phải code**. `MockPaymentProvider` được làm **trong cùng WG** để nếu tích hợp thật bị chặn, phase vẫn hoàn thành được.

### `WG-P6-06` — Giao diện giỏ hàng & thanh toán · **20h**

| Task | Giờ | FR |
|---|---|---|
| Design brief: giỏ hàng + bảng tổng kết + thanh toán | 2 | `UI-04` |
| `CartPage` + `CartLine` + xử lý SP hết hàng + hoàn tác 5 giây | 4 | `FR-CART-02`, `05`, `NFR-USE-05` |
| `CartDrawer` (ngăn kéo, đóng bằng `Esc`, giữ tiêu điểm) | 2,5 | `FR-CART-03`, `NFR-A11Y-06` |
| `VoucherBox` + hiển thị lý do từ chối cụ thể + hỏi thay thế mã cùng loại | 3 | `FR-CART-06` |
| ⭐ `OrderSummaryTable` — **hiển thị TỪNG DÒNG giảm giá riêng biệt** theo đúng 6 bước | 3 | `FR-CART-08` AC-01 |
| `CheckoutPage` + `AddressForm` (kiểm tra SĐT Việt Nam) | 3 | `FR-ORD-01` |
| `PaymentSelector` + ⚠️ **thông báo "giao dịch bằng VND" khi đang xem USD** | 1,5 | `BR-PRICE-07`, `FR-ORD-02` AC-02 |
| `OrderResultPage` (mã đơn, tổng tiền cả 2 tiền tệ, tỷ giá áp dụng) | 1 | `FR-ORD-05` |

## 8.1. Tiêu chí hoàn thành Phase 6

```text
☐ ⭐ Hai đơn đồng thời cho SP còn 1 tồn kho → chỉ 1 thành công, tồn kho = 0,
   KHÔNG âm (test tự động, không phải test tay)                        (INV-02)
☐ ⭐ Áp cả 3 loại voucher → bảng tổng kết hiển thị TỪNG dòng giảm giá,
   số liệu khớp với tính tay theo đúng 6 bước của BR-CART-06
☐ Mã giảm vượt giá trị → tổng chặn ở 0, không âm
☐ Mã hết hạn / chưa tới hạn / không đủ giá trị tối thiểu / sai thương hiệu
   → thông báo nêu CHÍNH XÁC điều kiện chưa đạt kèm con số
☐ Xóa SP làm tụt dưới ngưỡng → mã tự bỏ áp kèm lý do rõ
☐ Giỏ tạm (chưa đăng nhập) + giỏ server → hợp nhất lấy SL LỚN HƠN, không cộng dồn
☐ Đặt hàng COD → đơn CHO_XU_LY, mã BA-YYYYMMDD-NNNN, tồn kho trừ đúng, giỏ rỗng
☐ ⭐ Đặt hàng VNPay → chuyển cổng → thanh toán thành công → chữ ký được XÁC MINH
   → đơn chuyển DA_THANH_TOAN
☐ ⭐ Gửi callback với chữ ký SAI → bị TỪ CHỐI, ghi log cảnh báo bảo mật,
   đơn GIỮ ở CHO_XU_LY                                          (FR-ORD-04 AC-03)
☐ Gửi callback thành công 3 lần → trạng thái chỉ đổi MỘT lần      (idempotent)
☐ Bấm "Đặt hàng" 3 lần liên tiếp → chỉ 1 đơn được tạo
☐ ⭐ Admin đổi tỷ giá sau khi đơn đã tạo → total_vnd của đơn KHÔNG ĐỔI  (INV-09)
☐ Admin đổi giá sản phẩm → đơn cũ giữ nguyên tên và giá cũ              (ADR-010)
☐ Xóa tỷ giá khỏi cấu hình → checkout bị CHẶN, không tạo đơn với giá trị sai
☐ Hủy đơn CHO_XU_LY → tồn kho được HOÀN LẠI
☐ Thử chuyển DA_GIAO → CHO_XU_LY → bị từ chối, nêu các chuyển đổi được phép
☐ ⚠️ KHÔNG còn tỷ giá viết cứng nào trong frontend (grep "25400" = rỗng)
☐ NFR-PERF-10 ≤ 1s tạo đơn · Coverage ≥ 70% · gate XANH
```

---


