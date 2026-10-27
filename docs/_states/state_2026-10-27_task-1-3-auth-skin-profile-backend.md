---
doc: state-2026-10-27-task-1-3-auth-skin-profile-backend
title: State Snapshot — 2026-10-27 — Backend Auth & Unified Digital Skin ID Complete
status: stable
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-27
---

# state_2026-10-27_task-1-3-auth-skin-profile-backend

## Đang ở đâu
- **Phase:** Phase 1 MVP (Week 1 / 4)
- **Repo:** `keplertuyen/beauty_ai` (main)
- **Trạng thái:** Hoàn thành xuất sắc toàn bộ Nhiệm vụ 1.1, 1.2, và 1.3 trong Playbook Phase 1.

## Phiên này đã làm gì
1. **Nhiệm vụ 1.2 (ETL & B-Tree Index 518K Reviews):**
   - Viết `scripts/import_reviews.py` dùng PostgreSQL streaming COPY nạp 518.771 bản ghi trong 13.25s.
   - Kích hoạt B-Tree index kép (`idx_reviews_product_skin`), truy vấn thực tế đạt 1.398 ms (< 50ms).
2. **Nhiệm vụ 1.3 (C# .NET 10 Auth & Unified Digital Skin ID Backend):**
   - **Domain:** Entities `User`, `SkinProfile`, `UserAllergy` và Enums `UserRole`, `SkinType`, `BudgetLevel` (Pure C#, 0 dependencies).
   - **Application:** DTOs bất biến (`RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserProfileDto`, `DigitalSkinIdDto`, `UpdateDigitalSkinIdRequest`, `AddAllergyRequest`), Repository Interfaces, Service Interfaces, và Services (`AuthService`, `SkinProfileService`). Không dính EF Core, không dính HTTP.
   - **Infrastructure:** `BeautyAIDbContext` (PostgreSQL 17), `UserRepository`, `SkinProfileRepository`, `Pbkdf2PasswordHasher` (HMAC-SHA256 600.000 vòng lặp + 16B salt), `JwtTokenGenerator` (JWT Bearer Token 7 ngày).
   - **API:** `AuthController` (`register`, `login`, `me`, `profile`), `SkinProfileController` (`GET`, `PUT`, `POST allergies`, `DELETE allergies`).
   - **Kiểm thử & Xác thực Live:**
     - Unit tests: 13 tests passed (PBKDF2 hasher, Auth logic, Unified Skin ID).
     - Architecture tests: 11 tests passed 100%.
     - Live cURL test: Đăng ký, đăng nhập lấy JWT, thêm/xóa chất dị ứng, cập nhật toàn bộ hồ sơ trong 1 transaction, lấy profile. Mật khẩu trong PostgreSQL được băm PBKDF2 chuẩn OWASP.

## Trạng thái gate
- `./scripts/build`: XANH (0 Error, 0 Warning)
- `./scripts/test`: XANH (11 Architecture Tests + 13 Unit Tests + Frontend TS test)
- `./syntheprise gate`: XANH (15/15 checks PASSED)
