---
doc: adr-adr-006
title: ADR-006 — Chuyển tiếp Zalo bằng deep link + mã phiên, không dùng API
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-006 — Chuyển tiếp Zalo bằng deep link + mã phiên, không dùng API


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




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-04 (không gửi PII cho bên thứ ba)
