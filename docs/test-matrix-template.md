---
doc: test-matrix-template
title: Mẫu Ma Trận Kiểm Thử Chấp Nhận (Test Matrix Template) — BeautyAI Platform
status: draft
precedence: 2
owner: QA Lead
last_reviewed: 2026-10-25
---

# MẪU MA TRẬN KIỂM THỬ CHẤP NHẬN (ACCEPTANCE TEST MATRIX)

| Mã Test | Yêu cầu (FR/BR) | Tầng kiểm thử | Tên ca kiểm thử | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-M01-01` | `FR-AUTH-01` | Unit | Đăng ký tài khoản mật khẩu mạnh | Email hợp lệ, pass >=8 ký tự | Tạo tài khoản, mã hóa PBKDF2 | Chưa chạy |
| `TC-M07-01` | `FR-CONF-01` | Unit | Phát hiện xung đột AHA + Retinol | 2 sản phẩm chứa hoạt chất mạnh | Cảnh báo mức Cao, hướng dẫn tách buổi | Chưa chạy |
| `TC-INV-01` | `INV-01` | Architecture | Không có thuộc tính SafetyScore | Quét toàn bộ assembly backend | Build test PASS | Chưa chạy |
