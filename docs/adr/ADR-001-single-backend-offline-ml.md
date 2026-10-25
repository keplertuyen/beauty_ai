---
doc: adr-adr-001
title: ADR-001 — Hợp nhất về một backend .NET; tính toán ML ngoại tuyến
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-001 — Hợp nhất về một backend .NET; tính toán ML ngoại tuyến


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `PRD_BeautyAI_Tailored.md` v2.0 đề xuất **hai backend song song**: .NET 8 WebAPI (thương mại) + FastAPI Python (AI/ML, nạp 8.494 sản phẩm vào DataFrame trong RAM). Ràng buộc mới: `CON-01` (1 người, 4h/ngày), `CON-02` (.NET + React), `CON-05` (CI/CD local). |

**Các phương án đã xét:**

| | Phương án A — Hai backend (như PRD v2.0) | Phương án B — Một backend .NET, ML tính ngoại tuyến ✅ | Phương án C — Một backend .NET, viết lại ML bằng C# |
|---|---|---|---|
| **Mô tả** | .NET cho thương mại + FastAPI cho ML, chạy song song | .NET duy nhất. Script Python chạy **một lần ngoại tuyến** để tính độ tương đồng/luật mua kèm → ghi vào bảng DB. Runtime chỉ đọc | Viết lại TF-IDF/SVD/Apriori bằng C# (ML.NET) |
| **Thời gian thiết lập** | Cao (2 runtime, 2 pipeline, 2 bộ test) | **Thấp** | Trung bình |
| **Độ phức tạp vận hành** | 2 tiến trình phải cùng sống khi demo | **1 tiến trình** | 1 tiến trình |
| **Giữ được giá trị học thuật của phần khoa học dữ liệu** | ✅ | ✅ **Notebook/script Python vẫn là sản phẩm bàn giao** | ⚠️ Mất lợi thế hệ sinh thái Python |
| **Hiệu năng lúc chạy** | <50ms (RAM) | **<50ms (đọc bảng có chỉ mục)** — tương đương | Trung bình |
| **Gợi ý thời gian thực theo hành vi** | ✅ Có thể | ⚠️ Không (nhưng **không nằm trong phạm vi V1.0**) | ✅ Có thể |
| **Phù hợp `CON-01`, `CON-02`** | ❌ | ✅ | ✅ |
| **Rủi ro lúc demo** | Cao (nhiều điểm lỗi) | **Thấp** | Thấp |

**Quyết định: Phương án B.**

**Lý do:**
1. Các thuật toán trong phạm vi V1.0 (độ tương đồng nội dung, phân rã ma trận, luật kết hợp) **không phụ thuộc hành vi thời gian thực** — chúng tính trên dữ liệu tĩnh. Tính sẵn một lần là đủ.
2. PostgreSQL với chỉ mục phù hợp **xử lý thừa sức** quy mô 8.494 sản phẩm × 8 gợi ý và ~15.000 luật — không cần DataFrame trong RAM.
3. Loại bỏ một runtime, một pipeline, một bộ test, một tiến trình phải chạy khi demo — tiết kiệm trực tiếp cho ràng buộc 4h/ngày.
4. **Không mất giá trị học thuật:** các notebook Python vẫn là sản phẩm bàn giao, vẫn trình bày được phương pháp TF-IDF/SVD/Apriori.

**Hệ quả:**
- Thêm 2 bảng: `product_similarities`, `association_rules`, mỗi bảng có `version` + `computed_at` (`BR-DATA-06`).
- Đường ống Python nằm ở `tools/data-pipeline/` — **là công cụ phát triển, không phải thành phần runtime**.
- Khi cần tính lại: chạy script, không cần triển khai lại ứng dụng.
- **Nếu Phase sau cần gợi ý thời gian thực theo hành vi** → mở ADR mới; kiến trúc hiện tại không chặn điều đó (chỉ cần thêm một service).

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-05 (bảo toàn ML ngoại tuyến)
