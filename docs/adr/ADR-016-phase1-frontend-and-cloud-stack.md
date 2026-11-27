---
doc: adr
title: "ADR-016: Phase 1 Frontend Stack, JWT Bearer Auth, and Cloud Deployment (Neon + Render + Vercel)"
status: accepted
precedence: 2
owner: Tech Lead
last_reviewed: 2026-11-27
---

# ADR-016 — Phase 1 Frontend Stack, JWT Bearer Auth, and Cloud Deployment

- **Status:** Accepted (2026-11-27)
- **Supersedes / Clarifies for Phase 1:** `ADR-002` (local Docker only), `ADR-003` (Dapper usage), `ADR-004` (Cookie httpOnly), and `docs/tech-stack.md` frontend exclusions.

## Context
During Phase 1 delivery, BeautyAI is deployed across separate frontend and backend origins (Vercel SPA + Render Web Service + Neon Lakebase PostgreSQL) using the existing React prototype UI (`axios`, `framer-motion`, `recharts`, `lucide-react`, `react-hot-toast`, `Vite 8`).

## Decision
1. **Frontend packages:** Retain `axios`, `framer-motion`, `recharts ^3`, `lucide-react`, `react-hot-toast`, and `vite ^8.4.0` in Phase 1. `openapi-typescript` generates `src/api/schema.d.ts` from `docs/api/BeautyAI.Api.json`.
2. **Authentication (Phase 1):** Use stateless JWT Bearer tokens (`Authorization: Bearer <token>`) signed with HS256 (`JWT_SECRET`, min 32 chars, injected via environment/secret store — never committed) and PBKDF2-HMAC-SHA256 (600,000 iterations). **Known Phase 1 trade-off:** changing password via `POST /api/v1/auth/change-password` updates the stored hash immediately, but **does not invalidate previously issued JWTs** until they expire (no `SecurityStamp` / token revocation list in Phase 1).
3. **Database & Deployment (Phase 1):** PostgreSQL 17 on Neon Lakebase (`DATABASE_URL`) for cloud environments and Docker Compose for local development. Schema updates use idempotent SQL migrations in `docs/db-schema/migrations/`. EF Core 10 + Npgsql handles all queries in Phase 1 (Dapper deferred to Phase 2 reporting).
4. **Product Image Uploads (Phase 1):** Local `/uploads/products/` upload UI is hidden in production (`VITE_ENABLE_IMAGE_UPLOAD=false`) due to ephemeral container disks; production uses verified local `/images/products/*.webp` assets or external HTTPS URLs until Object Storage is added in Phase 2.
