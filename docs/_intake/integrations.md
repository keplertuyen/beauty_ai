# Integrations — BeautyAI Platform

Trỏ tới tài liệu nguồn:
- [`docs/_intake/Technical_Design_BeautyAI_V1.0.md`](./Technical_Design_BeautyAI_V1.0.md) §12.4 (Bảng kiểm kê tích hợp ngoài).
- Gemini API (LLM trợ lý AI).
- VNPay Sandbox (Cổng thanh toán trực tuyến).
- Zalo Deeplink OA (Handoff tư vấn viên).
- SMTP Server (Gửi email xác nhận đơn hàng/thông báo).
- Nguyên tắc thiết kế: Mọi tích hợp ngoài đều có phiên bản `Null` / `Mock` / `NoOp` cho phép hệ thống chạy trơn tru mà không cần bí mật hoặc mạng ngoài (giảm `RISK-16`).
