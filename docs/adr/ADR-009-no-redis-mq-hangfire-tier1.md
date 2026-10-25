---
doc: adr-adr-009
title: ADR-009 — Không dùng Redis / message queue / Hangfire ở Tier 1
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-009 — Không dùng Redis / message queue / Hangfire ở Tier 1


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | Cần bộ nhớ đệm (`NFR-PERF-03`), tác vụ nền (`NFR-SCALE-04`), và xử lý không đồng bộ. |

**Quyết định:**

| Nhu cầu | Giải pháp Tier 1 ✅ | Giải pháp "đúng chuẩn" bị hoãn | Khi nào thì cần đổi |
|---|---|---|---|
| Bộ nhớ đệm | `IMemoryCache` trong tiến trình | Redis | Khi có > 1 phiên bản ứng dụng chạy song song |
| Tác vụ nền (tính lại điểm, nạp dữ liệu) | `BackgroundService` + `Channel<T>` | Hangfire / Quartz | Khi cần lịch chạy phức tạp hoặc theo dõi job qua UI |
| Hàng đợi sự kiện | Không có — gọi trực tiếp trong transaction | RabbitMQ / Kafka | Khi tách microservice |
| Giới hạn tần suất | Rate limiting middleware tích hợp của ASP.NET Core | API Gateway | Khi có nhiều phiên bản |

**Lý do:** `core-principles.md §4` — *"Không xây hạ tầng giai đoạn cuối cho sản phẩm giai đoạn đầu."* Mỗi thành phần hạ tầng thêm vào là một thứ phải cài, cấu hình, theo dõi, và có thể gãy lúc demo. Với 20 người dùng đồng thời (`ASM-02`), không thành phần nào ở cột giữa là cần thiết.

**Hệ quả quan trọng:** vì bộ nhớ đệm là trong tiến trình, **thiết kế không được giả định bộ nhớ đệm luôn có dữ liệu** — mọi đường dẫn đọc phải hoạt động đúng khi đệm rỗng (`NFR-SCALE-05`).

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** Đơn giản hóa runtime (CON-01)
