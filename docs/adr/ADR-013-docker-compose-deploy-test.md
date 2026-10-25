---
doc: adr-adr-013
title: ADR-013 — Triển khai kiểm thử cục bộ bằng Docker Compose (deploy-test)
status: accepted
precedence: 2
owner: SA / DevOps
last_reviewed: 2026-10-25
---

# ADR-013 — Triển khai kiểm thử cục bộ bằng Docker Compose (deploy-test)

## Trạng thái
Đã chấp nhận · 2026-10-25

## Bối cảnh
`Technical_Design_BeautyAI_V1.0.md` §15.1 ghi: "KHÔNG triển khai từ CI — demo chạy cục bộ (CON-05)".
Tuy nhiên, trong quá trình phát triển và kiểm thử, người dùng cần một cơ chế triển khai kiểm thử tự động, chuẩn hóa toàn bộ stack (PostgreSQL + API backend + Web frontend) bằng container Docker ngay trên máy kiểm thử (MacBook) mà không phụ thuộc vào các tiến trình watch/dev rời rạc.

## Các phương án đã xét

| Tiêu chí | Phương án A — Chạy trực tiếp qua scripts/dev (không container hóa app) | Phương án B — Cài self-hosted runner GitHub Actions trên Mac | Phương án C — Triển khai Docker Compose cục bộ qua scripts/deploy-test ✅ |
|---|---|---|---|
| **Mô tả** | Chạy dotnet watch + npm run dev trực tiếp trên máy | CI GitHub Actions gọi runner trên Mac để deploy tự động | Script `scripts/deploy-test` build Docker image và chạy stack hoàn chỉnh |
| **Tính độc lập môi trường** | Thấp (phụ thuộc node/dotnet cài trên host) | Cao | **Rất cao (container hóa 100%)** |
| **Độ phức tạp** | Rất thấp | Cao (bảo trì runner token, rủi ro bảo mật) | **Thấp (1 lệnh shell)** |
| **Độ gần với Production** | Thấp | Cao | **Cao (chạy đúng container production)** |
| **Phù hợp solo mode** | Có | Không (overhead quản lý runner) | **Rất phù hợp** |

## Quyết định
**Chọn Phương án C.** Sử dụng `docker-compose.yml` với profile `app` (chứa service `api` và `web`) cùng script `scripts/deploy-test` để kích hoạt triển khai kiểm thử cục bộ một lệnh.

## Lý do
1. Cho phép kiểm chứng chính xác cách ứng dụng vận hành trong container Docker mà không cần cấu hình phức tạp.
2. Tránh rủi ro bảo mật khi mở runner daemon lắng nghe từ GitHub vào máy cá nhân.
3. Đồng bộ hóa cổng phục vụ: API cổng 5000, Web cổng 5173, Postgres cổng 5432.
4. Có healthcheck tự động đảm bảo dịch vụ đã sẵn sàng trước khi thông báo thành công.

## Hệ quả
- Thêm Dockerfile cho `src/BeautyAI.Api` và `src/frontend`.
- Cần Docker Desktop đang chạy khi thực hiện `scripts/deploy-test`.
- **Điều kiện xem lại quyết định:** Xem lại khi dự án chuyển sang môi trường Cloud staging/production chính thức (Phase 9+ hoặc Tier 2).

## Bất biến phát sinh
Không phá vỡ `CON-05` (máy Mac vẫn là máy chủ thử nghiệm chính trong giai đoạn đầu).
