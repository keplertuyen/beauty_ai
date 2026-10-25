---
doc: project-charter
title: Project Charter — BeautyAI Platform
status: stable
precedence: meta
owner: Trung (Kiến trúc & Chỉ huy) / Antigravity (Thực thi)
last_reviewed: 2026-10-25
applies_to: BeautyAI Platform development
---

# Project Charter — BeautyAI Platform

## 1. Tổng quan dự án

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | **BeautyAI Platform** |
| **Mục tiêu** | Nền tảng thương mại điện tử mỹ phẩm thông minh kết hợp trợ lý AI chăm sóc da cá nhân hóa đa tầng, minh bạch thành phần INCI, phát hiện xung đột hoạt chất |
| **Cấp chất lượng (Tier)** | **Tier 1** — Unit tests + Architecture tests + Contract/Integration tests + Traceability cho toàn bộ yêu cầu Must |
| **Chế độ vận hành (Mode)** | `solo` — 1 người (Kiến trúc & Chỉ huy) + AI Code Agent Antigravity (Thực thi). Các vai BA/QA/Dev/SA vẫn tồn tại đầy đủ, nhịp review theo đơn vị change/archive |
| **Chủ sở hữu & Chỉ huy** | Trung (Product Owner / Tech Lead / Solutions Architect) |
| **Agent thực thi** | Antigravity AI Code Agent |
| **Bộ khung chuẩn** | Syntheprise Framework v6.0.1 · Blueprint `dotnet-react-rn` |
| **Repository** | `keplertuyen/beauty_ai` (Public) |

## 2. Phạm vi phiên bản V1.0 & Ranh giới

- **Web Frontend**: React 19 + TypeScript + Vite (`src/frontend`). Kế thừa hệ thống thiết kế từ prototype HTML/CSS (ADR-007).
- **Backend**: .NET 10 Minimal API (`src/BeautyAI.Api`, `src/BeautyAI.Application`, `src/BeautyAI.Infrastructure`, `src/BeautyAI.Domain`).
- **Database**: PostgreSQL 17 Alpine chạy cục bộ qua Docker Compose (ADR-002).
- **Trợ lý AI**: Kiến trúc 3 tầng (Rules → Gemini Flash → Handoff Zalo) (ADR-005, ADR-006).
- **Dữ liệu**: Bộ dữ liệu Sephora đã làm sạch (8.494 sản phẩm, 2.228 luật Apriori, reviews).
- ⚠️ **Mobile App (React Native Expo)**: Nằm tại thư mục `apps/mobile/`, là **CHỖ DÀNH SẴN CHO V2, HOÀN TOÀN KHÔNG PHÁT TRIỂN Ở V1.0** (theo `BRD` §6.4 Won't). Giữ nguyên thư mục để bảo toàn blueprint được chứng nhận của Syntheprise, không xóa.

## 3. Tiêu chí thành công V1.0

1. Toàn bộ 126 FR (M01–M15) và 12 bất biến hệ thống (INV-01 đến INV-12) được thỏa mãn và có kiểm chứng.
2. `./scripts/build`, `./scripts/test`, `./syntheprise gate` và CI quality-gate 5 job XANH.
3. Độ phủ mã nguồn đạt ngưỡng tối thiểu: Line ≥ 70%, Branch ≥ 60%.
4. Triển khai kiểm thử cục bộ mượt mà qua `./scripts/deploy-test` (Docker Compose).
