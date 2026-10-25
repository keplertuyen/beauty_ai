---
doc: adr-adr-002
title: ADR-002 — PostgreSQL 17 trong Docker Compose cục bộ
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-002 — PostgreSQL 17 trong Docker Compose cục bộ


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | `CON-03` yêu cầu DB cục bộ, không dịch vụ cloud trả phí. PRD v2.0 dùng Supabase (cloud). Dữ liệu cần: ~8.494 sản phẩm, ~150.000 liên kết thành phần, ~50.000 đánh giá, ~15.000 luật. |

**Các phương án:**

| | PostgreSQL trong Docker ✅ | SQL Server (Developer Edition) | SQLite |
|---|---|---|---|
| Giữ được lược đồ & kiểu dữ liệu từ PRD v2.0 | ✅ (PRD viết bằng cú pháp PostgreSQL) | ⚠️ Phải chuyển đổi | ⚠️ Phải chuyển đổi |
| Hỗ trợ `citext`, `jsonb`, `GIN`, `pg_trgm`, `unaccent` | ✅ **Cần cho tìm kiếm không dấu & lọc hoạt chất** | ⚠️ Khác cú pháp | ❌ |
| Chi phí | 0 | 0 (Developer) | 0 |
| Hiệu năng trên Apple Silicon | ✅ Tốt | ⚠️ Chạy qua emulation/ARM image | ✅ |
| Phù hợp truy cập đồng thời (trừ tồn kho) | ✅ MVCC + `FOR UPDATE` | ✅ | ❌ **Khóa toàn file — rủi ro thật với `DC-11`** |
| Tương đồng với môi trường production tương lai | ✅ | ✅ | ❌ |

**Quyết định: PostgreSQL 17 (image chính thức) chạy qua Docker Compose.**

**Lý do quyết định:** `unaccent` + `pg_trgm` là **điều kiện kỹ thuật** để thỏa `FR-CAT-03` AC-03 (tìm kiếm không phân biệt dấu tiếng Việt) và AC-02 (gợi ý tức thì). SQLite không có; SQL Server có nhưng cú pháp khác và PRD đã viết bằng PostgreSQL.

**Hệ quả:** cần Docker Desktop trên máy phát triển. `docker-compose.yml` ở gốc repo. Sao lưu bằng `pg_dump` theo lịch (`NFR-REL-05`).

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-02 (ACID / tồn kho không âm)
