---
doc: adr-adr-007
title: ADR-007 — Không viết lại Frontend từ đầu; chuyển prototype thành React giữ nguyên hệ thống thiết kế
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-007 — Không viết lại Frontend từ đầu; chuyển prototype thành React giữ nguyên hệ thống thiết kế


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | Prototype hiện có **13 trang HTML + 7.035 dòng CSS** với hệ thống token hoàn chỉnh (màu, typography, spacing, radius, shadow, transition) và ~190 lớp component. Cần quyết định xử lý tài sản này thế nào. |

**Các phương án:**

| | Chuyển sang React, **giữ nguyên CSS token** ✅ | Viết lại bằng Tailwind | Viết lại bằng một UI kit (MUI/Ant) |
|---|---|---|---|
| Giữ được bản sắc thị giác đã thiết kế | ✅ **Nguyên vẹn** | ⚠️ Phải dịch lại toàn bộ token | ❌ Mất bản sắc, trông như mọi sản phẩm khác |
| Công sức | **Thấp** — CSS dùng lại trực tiếp | Cao | Rất cao |
| Tuân thủ `.agents/rules/ui-ux-standards.md §1.2` (*không phát minh lại mẫu khi hệ thống đã có*) | ✅ | ❌ **Vi phạm** | ❌ **Vi phạm** |
| Kích thước gói JS (`NFR-PERF-11` ≤ 300KB) | ✅ CSS không tính vào gói JS | ✅ | ❌ UI kit nặng |

**Quyết định:** **Chuyển prototype thành React, giữ nguyên `css/style.css` làm tầng token + dùng CSS Modules cho component mới.**

```text
frontend/src/styles/
  tokens.css        ← :root { --primary, --spacing-*, --radius-* ... }  (lấy từ prototype)
  base.css          ← reset + typography + utility  (lấy từ prototype)
  components.css    ← .btn, .card, .badge, .navbar ...  (lấy từ prototype)
frontend/src/features/<tính-năng>/Component.module.css  ← chỉ CSS riêng của component mới
```

**Hệ quả:**
- **Không** thêm Tailwind, **không** thêm UI kit. Phụ thuộc frontend giữ ở mức tối thiểu.
- Prototype HTML tiếp tục là **tài liệu thiết kế sống** (`docs/_ui-ux_design/`) — cập nhật nó khi thiết kế đổi (xem nhiệm vụ cập nhật prototype).
- Mỗi trang HTML → một route React; mỗi khối lặp lại trong HTML → một component React.

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-01 (không hiển thị safety rating)
