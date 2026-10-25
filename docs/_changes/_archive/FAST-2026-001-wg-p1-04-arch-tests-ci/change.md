---
doc: fast-2026-001-wg-p1-04-arch-tests-ci
title: Fast-Lane Change — WG-P1-04 Test kiến trúc & CI 5 Job
status: completed
precedence: 3
owner: PM / Dev Lead
last_reviewed: 2026-10-25
---

# Fast-Lane Change: WG-P1-04 Test Kiến Trúc & CI 5 Job

## Change ID
`FAST-2026-001-wg-p1-04-arch-tests-ci`

## Goal (what & why)
Hiện thực hóa các quyết định kiến trúc và bất biến INV-01 bằng 6 bài kiểm thử kiến trúc tự động (BeautyAI.ArchitectureTests), thiết lập workflow GitHub Actions với 5 job kiểm định chất lượng, và ban hành chính sách quản lý thay đổi (docs/_guides/91-beautyai-change-policy.md).

## Acceptance check (write BEFORE coding)
- [x] BeautyAI.Domain không có PackageReference nào (DomainHasNoDependenciesTests).
- [x] BeautyAI.Application không tham chiếu EF Core hay AspNetCore (ApplicationDoesNotReferenceEfCoreTests, ApplicationDoesNotReferenceAspNetTests).
- [x] Thư viện nhà cung cấp & HttpClient chỉ xuất hiện trong tầng adapter BeautyAI.Infrastructure.Providers (ProviderLibrariesOnlyInAdapterLayerTests).
- [x] Quét toàn bộ assembly không có thuộc tính mang tên SafetyScore, SafetyRating, HazardScore, DangerLevel, ToxicityScore, SafetyLevel (INV-01). Thêm thử SafetyScore -> test BẮT BUỘC ĐỎ -> revert.
- [x] Không có tham chiếu tới các gói bị cấm: AutoMapper, MediatR, Hangfire, Quartz, StackExchange.Redis (ForbiddenPackagesTests). Thêm thử MediatR -> test BẮT BUỘC ĐỎ -> revert.
- [x] Workflow GitHub Actions gồm đủ 5 job: backend, frontend, openapi-drift, security, syntheprise.
- [x] Tài liệu chính sách thay đổi docs/_guides/91-beautyai-change-policy.md được ban hành đầy đủ.

## Scope guard
- In: BeautyAI.ArchitectureTests, .github/workflows/quality-gate.yml, docs/_guides/91-beautyai-change-policy.md, OpenAPI export setup trong BeautyAI.Api & src/frontend.
- Out: Chưa triển khai business logic chi tiết của Phase 2 (giữ cho các WG sau).

## Tasks
| Task | `[P]`? | Status |
|---|---|---|
| Viết 6 bài test kiến trúc | P | Done |
| Kiểm chứng đỏ có chủ đích (SafetyScore, MediatR) | P | Done |
| Cấu hình 5 job GitHub Actions (.github/workflows/quality-gate.yml) | P | Done |
| Soạn thảo docs/_guides/91-beautyai-change-policy.md |  | Done |
| Kiểm tra `./syntheprise gate` và `./scripts/test` | P | Done |

## Done when
- Toàn bộ 11 tests kiến trúc PASS.
- Intentional red tests đã được xác nhận.
- `./syntheprise gate` và `./scripts/test` XANH 100%.
- Worklog WG-P1-04 và State Snapshot được ghi nhận nguyên tử trước khi archive.
