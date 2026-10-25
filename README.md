---
doc: project-readme
title: BeautyAI Platform — Intelligent Skincare & Cosmetics E-Commerce
status: stable
precedence: 6
owner: Delivery / Tech Lead
last_reviewed: 2026-10-25
---

# BeautyAI Platform — Intelligent Skincare & Cosmetics E-Commerce

> **Nền tảng thương mại điện tử mỹ phẩm kết hợp phân tích thành phần da liễu thông minh & chấm điểm phù hợp cá nhân hóa.**

[![Quality Gate](https://github.com/keplertuyen/beauty_ai/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/keplertuyen/beauty_ai/actions/workflows/quality-gate.yml)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org/)

---

## 1. Giới thiệu dự án

**BeautyAI** là nền tảng thương mại điện tử chuyên sâu về mỹ phẩm và chăm sóc sắc đẹp, giải quyết vấn đề bất đối xứng thông tin giữa thành phần sản phẩm và đặc tính sinh học của từng làn da người dùng:
- **Phân tích thành phần chuyên sâu (Ingredient Intelligence):** Tự động bóc tách và phân tích các hoạt chất (Active Ingredients), nồng độ, nguy cơ kích ứng, và các cặp thành phần tương xung/tương hỗ theo y văn da liễu.
- **Điểm số phù hợp cá nhân (Suitability Score — ADR-011):** Tính toán độ tương thích (0–100%) giữa sản phẩm và hồ sơ da (Skin Profile: loại da, độ nhạy cảm, mối quan tâm da) trên từng lượt đọc.
- **Nguyên lý bất biến (INV-01):** BeautyAI **tuyệt đối không** chấm điểm an toàn/nguy hiểm chung chung (`SafetyScore`, `HazardScore`). Mọi hoạt chất đều phụ thuộc vào nồng độ và sự tương thích với từng nền da cụ thể.
- **Pipeline AI 7 giai đoạn (ADR-005):** Kết hợp mô hình ML Offline và Gemini 2.5 Flash để bóc tách bảng thành phần phức tạp, đối chiếu từ điển INCI và sinh giải thích khoa học dễ hiểu.
- **Tích hợp kênh Zalo Mini App / DeepLink (ADR-006):** Chuyển giao giỏ hàng và tư vấn viên tức thời.

---

## 2. Kiến trúc kỹ thuật (Architecture)

Dự án tuân thủ kiến trúc **Clean Architecture** và các quyết định kiến trúc bất biến ([13 ADRs trong `docs/adr/`](docs/adr/)):

```text
src/
├── BeautyAI.Domain/          # Core Domain Entities & Invariants (Thuần C#, 0 dependency)
├── BeautyAI.Application/     # Use Cases, DTOs, Repository Interfaces (Không phụ thuộc EF/HTTP)
├── BeautyAI.Infrastructure/  # PostgreSQL (EF Core 10 + Dapper), Adapter Providers bên ngoài
├── BeautyAI.Api/             # ASP.NET Core 10 Web API, phát hành OpenAPI tự động (ADR-008)
└── frontend/                 # React 19 + TypeScript + Vite, openapi-fetch an toàn kiểu
tests/
├── BeautyAI.ArchitectureTests/ # NetArchTest: Thực thi INV-01, cấm package trái phép, clean seams
└── BeautyAI.UnitTests/         # Unit Tests nghiệp vụ Domain & Application
```

---

## 3. Tài liệu dự án (Documentation)

Toàn bộ tài liệu gốc và đặc tả chi tiết được lưu trữ trong thư mục [`docs/`](docs/):

| Nhóm tài liệu | Đường dẫn | Mô tả |
|---|---|---|
| **BRD** | [`docs/_brd/beautyai_brd.md`](docs/_brd/beautyai_brd.md) | Business Requirements Document V1.0 |
| **PRD** | [`docs/_prd/beautyai_prd.md`](docs/_prd/beautyai_prd.md) | Product Requirements Document v2.0 & SRS baseline |
| **UI/UX Design** | [`docs/_ui-ux_design/frontend`](docs/_ui-ux_design/frontend) | Bản mẫu giao diện người dùng (Prototype & Flow HTML/CSS) |
| **Technical Design** | [`docs/_tech-solutions/beautyai_tech_solutions.md`](docs/_tech-solutions/beautyai_tech_solutions.md) | Giải pháp kỹ thuật, lược đồ CSDL & thiết kế hệ thống |
| **Plan** | [`docs/_plans/beautyai_plan.md`](docs/_plans/beautyai_plan.md) | Kế hoạch tổng thể 9 giai đoạn (P1–P9) |
| **Playbook** | [`docs/_playbook/beautyai_playbook.md`](docs/_playbook/beautyai_playbook.md) | Sổ tay phân rã 81 nhiệm vụ chi tiết và quy trình thực thi |
| **Kiến trúc & ADRs** | [`docs/architecture.md`](docs/architecture.md) & [`docs/adr/`](docs/adr/) | 13 Kiến trúc quyết định độc lập (ADR-001 đến ADR-013) |
| **Hợp đồng API** | [`docs/api-contract.md`](docs/api-contract.md) | Danh mục Endpoint, quy ước REST và mã lỗi |
| **Hợp đồng Dữ liệu** | [`docs/data-contracts.md`](docs/data-contracts.md) & [`docs/db-schema/schema.sql`](docs/db-schema/schema.sql) | Lược đồ PostgreSQL, bảng chỉ mục và ràng buộc toàn vẹn |

---

## 4. Hướng dẫn phát triển (Local Development)

### Yêu cầu môi trường
- **.NET SDK:** `10.0.401` (được ghim tại `global.json`)
- **Node.js:** `>= 22.0.0`
- **Docker & Docker Compose:** Dành cho PostgreSQL 17 và môi trường kiểm thử

### Các lệnh điều hành

```bash
# 1. Khởi động CSDL PostgreSQL cục bộ
docker compose up -d postgres

# 2. Khởi chạy toàn bộ môi trường phát triển (API + Frontend)
./scripts/dev

# 3. Biên dịch giải pháp (.NET solution + Frontend bundle)
./scripts/build

# 4. Chạy kiểm thử tự động (Unit Tests + 11 Architecture Tests + Frontend check)
./scripts/test

# 5. Kiểm tra Quality Gate (Doctor, Lifecycle, Drift, Sync check)
./syntheprise gate
```

---

## 5. Quy trình quản trị & Chất lượng (Governance)

Dự án được quản trị theo quy chuẩn **Syntheprise Framework** với các nguyên tắc nghiêm ngặt:
- **Worktree Isolation (Rule 12):** Mọi nhánh tính năng đều phát triển trên `git worktree` riêng biệt; nhánh `main` được bảo vệ nguyên vẹn.
- **Change Lifecycle (Rule 7):** Các thay đổi chạm API, CSDL, logic nghiệp vụ đều được quản lý qua change folder tại `docs/_changes/` và chính sách [`docs/_guides/91-beautyai-change-policy.md`](docs/_guides/91-beautyai-change-policy.md).
- **CI 5 Jobs ([`.github/workflows/quality-gate.yml`](.github/workflows/quality-gate.yml)):**
  1. `backend`: .NET 10 build `-warnaserror`, kiểm thử kiến trúc & coverage trên PostgreSQL container.
  2. `frontend`: Node 22, TypeScript typecheck, build bundle.
  3. `openapi-drift`: Kiểm tra sai lệch tự động giữa backend OpenAPI và frontend DTO schema.
  4. `security`: Quét secret và lỗ hổng bảo mật gói phụ thuộc.
  5. `syntheprise`: Kiểm tra tính toàn vẹn tài liệu, liên kết và hợp đồng hệ thống.
