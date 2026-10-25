---
doc: adr-adr-005
title: ADR-005 — Trợ lý AI: kiến trúc 3 tầng với ép gọi hàm
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-005 — Trợ lý AI: kiến trúc 3 tầng với ép gọi hàm


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




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-04, INV-05, INV-06, INV-12
