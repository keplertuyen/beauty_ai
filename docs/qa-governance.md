---
doc: qa-governance
title: Quản Trị Chất Lượng & QA-First (QA Governance) — BeautyAI Platform
status: draft
precedence: 2
owner: QA Lead / PM
last_reviewed: 2026-10-25
---

# QUY TRÌNH QUẢN TRỊ CHẤT LƯỢNG (QA GOVERNANCE) — BeautyAI Platform

> Thực thi nguyên tắc QA-First Delivery (`AGENTS.md §3`): Thiết kế tiêu chí chấp nhận và ma trận test TRƯỚC khi lập trình.
> Ngưỡng bao phủ bắt buộc: Line ≥ 70%, Branch ≥ 60%.

---

## 17.5. Cổng kiểm thử theo tier

Theo `docs/testing-strategy.md` — dự án ở **Tier 1**:

| Cổng | Yêu cầu Tier 1 |
|---|---|
| Unit | ✅ Bắt buộc cho mọi logic thay đổi |
| Contract | ✅ Bắt buộc khi đổi API/DTO/lược đồ |
| Integration | ✅ Bắt buộc cho lưu trữ, dịch vụ ngoài, tác vụ nền |
| E2E | ✅ Cho các luồng người dùng quan trọng (8 luồng) |
| Golden case | ✅ **Bắt buộc** vì có LLM và heuristic |
| Thủ công khám phá | ✅ Cho giao diện mới; kiểm tra 4 trạng thái |
| Traceability | ✅ Cho mọi yêu cầu mức Must |
| Độ phủ | Dòng ≥ 70% · Nhánh ≥ 60% |

## 17.6. Báo cáo thực thi (bắt buộc khi đóng change)

```markdown
## Báo cáo thực thi
- **Ngày chạy:** 2026-11-20
- **Môi trường:** local macOS 15.1 · .NET 10.0.1 · Node 22.11 · PostgreSQL 17.2
- **Kết quả theo tầng:**
  | Tầng | Pass | Fail | Bỏ qua |
  |---|---|---|---|
  | Unit | 184 | 0 | 0 |
  | Integration | 42 | 0 | 0 |
  | Architecture | 5 | 0 | 0 |
  | Golden | 22 | 0 | 0 |
  | E2E | 8 | 0 | 0 |
  | A11y (axe) | 12 màn hình | 0 nghiêm trọng | — |
- **Độ phủ:** dòng 76% · nhánh 64%
- **Bằng chứng:** <đường dẫn CI run>
- **Khuyết điểm phát hiện:** <mô tả> → <đã sửa / chấp nhận / hoãn>
```

> ⚠️ **`docs/testing-strategy.md` của framework:** *"Thiết kế test xanh mà không có bằng chứng chạy thì KHÔNG phải là Done."*

---


