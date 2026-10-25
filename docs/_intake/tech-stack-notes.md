# Tech Stack Notes — BeautyAI Platform

Trỏ tới tài liệu nguồn:
- [`docs/_intake/Technical_Design_BeautyAI_V1.0.md`](./Technical_Design_BeautyAI_V1.0.md) §12 (Danh mục công nghệ & kiểm kê phụ thuộc) và §2 (12 ADR).
- Backend: .NET 10 Minimal API (`net10.0`).
- Frontend: React 19 + TypeScript (`strict: true`) + Vite 6 + Tailwind CSS / Vanilla CSS từ prototype.
- Database: PostgreSQL 17 Alpine qua Docker Compose cục bộ.
- AI: Google Gemini Flash 2.5 / REST API qua `HttpClient` (không dùng SDK bên thứ ba, tuân thủ `provider-abstraction.md`).
- CI/CD: GitHub Actions (5 job) + Deploy test cục bộ qua Docker Compose (`scripts/deploy-test` — ADR-013).
