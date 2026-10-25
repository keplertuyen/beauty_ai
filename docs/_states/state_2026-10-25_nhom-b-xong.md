---
doc: state-2026-10-25-nhom-b-xong
title: State Snapshot — 2026-10-25 — Hoàn Thành Toàn Bộ Nhóm B Khởi Tạo Dự Án
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# state_2026-10-25_nhom-b-xong

## Đang ở đâu
- **Phase:** Phase 1 — Nền tảng: Dữ liệu, Kiến trúc, Khung dự án
- **Work Group:** Hoàn thành `WG-P1-01` (B1), `WG-P1-02` (B2 & B3), `WG-P1-04` (B4 & B5)
- **Repo:** `keplertuyen/beauty_ai`
- **Worktree:** `.worktrees/WG-P1-04-arch-tests-ci` on branch `change/WG-P1-04-arch-tests-ci`

## Phiên này đã làm gì
1. **WG-P1-04 (Task B4) — Test kiến trúc & CI 5 jobs:**
   - Tạo dự án `tests/BeautyAI.ArchitectureTests` (.NET 10, xUnit, TreatWarningsAsErrors).
   - Thêm vào solution `BeautyAI.slnx`.
   - Viết 6 bài test kiến trúc với 11 test assertions:
     - Bài 1: `DomainHasNoDependenciesTests` (Domain thuần C#, không PackageReference nào).
     - Bài 2: `ApplicationDoesNotReferenceEfCoreTests` (Application không tham chiếu EF Core).
     - Bài 3: `ApplicationDoesNotReferenceAspNetTests` (Application không tham chiếu AspNetCore/HttpContext).
     - Bài 4: `ProviderLibrariesOnlyInAdapterLayerTests` (HttpClient và thư viện provider chỉ nằm trong namespace `BeautyAI.Infrastructure.Providers`).
     - Bài 5: `NoSafetyScoreAnywhereTests` (INV-01: Quét toàn bộ assembly không có thuộc tính chứa `SafetyScore`, `SafetyRating`, `HazardScore`, `DangerLevel`, `ToxicityScore`, `SafetyLevel`).
     - Bài 6: `ForbiddenPackagesTests` (Không có `AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, `StackExchange.Redis`).
   - Kiểm chứng đỏ có chủ đích:
     - Thêm `SafetyScore` vào `BaseEntity` -> Bài 5 ĐỎ kèm thông điệp INV-01 -> Revert về XANH.
     - Thêm `MediatR` vào `BeautyAI.Application.csproj` -> Bài 6 ĐỎ kèm cảnh báo tech-stack -> Revert về XANH.
   - Cấu hình phát hành OpenAPI tự động tại build-time với `Microsoft.AspNetCore.OpenApi` và `Microsoft.Extensions.ApiDescription.Server` xuất tài liệu vào `docs/api/BeautyAI.Api.json`.
   - Cài đặt `openapi-typescript` trong `src/frontend` và cấu hình script `npm run gen:api` để sinh tự động `src/frontend/src/api/schema.d.ts` (ADR-008).
   - Cấu hình workflow GitHub Actions `.github/workflows/quality-gate.yml` gồm đủ 5 job:
     - `backend`: setup-dotnet, postgres:17 service container, restore, build -warnaserror, test code coverage, chạy riêng ArchitectureTests.
     - `frontend`: setup-node 22, npm ci, test, build.
     - `openapi-drift`: build API, sinh schema.d.ts, so sánh `git diff --quiet`, fail nếu có drift.
     - `security`: quét bí mật (check-secrets.py) và quét lỗ hổng NuGet (`dotnet list package --vulnerable`).
     - `syntheprise`: `./syntheprise gate`, `./syntheprise sync --check`, `check-worktree-isolation.py`, `doctor.py --quality-gate`, và `check-change-completeness.py` trên PR.
2. **WG-P1-04 (Task B5) — Vòng đời change & Worktree isolation:**
   - Xác nhận sự tồn tại và tính sẵn sàng của hạ tầng change: `CHANGE-template/`, `BUGFIX-template/`, `FASTLANE-template/`, `_archive/`, `_dashboard/`, `_ui-ux_design/`, `check-worktree-isolation.py`, `check-change-completeness.py`.
   - Soạn thảo và ban hành `docs/_guides/91-beautyai-change-policy.md` ghi nhận ma trận quyết định change cho BeautyAI: một change folder cho mỗi WG, loại mặc định FASTLANE, quy ước CHANGE-ID, và 7 tiêu chí bắt buộc của Rule 7.
   - Tập chạy trọn một vòng change `FAST-2026-001-wg-p1-04-arch-tests-ci`: mở change, cập nhật acceptance checks, chạy gates, cập nhật worklog, viết state snapshot, archive change, và chuẩn bị merge vào main.

## Trạng thái gate
- `./scripts/build`: XANH (0 errors, 0 warnings cho cả backend và frontend)
- `./scripts/test`: XANH (1 unit test + 11 architecture tests pass)
- `./syntheprise gate`: XANH (doctor clean, lifecycle consistency OK, doc drift OK, sync --check OK)
- PostgreSQL container: Chạy ổn định trên cổng 5432.

## ⚠️ VIỆC TIẾP THEO (đọc dòng này trước ở phiên sau)
- Hoàn thành close-out của WG-P1-04 (merge vào `main`, dọn dẹp worktree).
- Đẩy repo lên GitHub remote `keplertuyen/beauty_ai`.
- Bắt đầu Nhóm C: Dữ Liệu & Pipeline (Tasks C1 đến C7, bắt đầu với WG-P1-03 CSDL PostgreSQL).
