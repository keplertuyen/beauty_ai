---
doc: state-snapshot
title: State Snapshot — Phase 1 Pre-Release Hardening (2026-11-27)
status: stable
precedence: 5
owner: tech-lead
last_reviewed: 2026-11-27
---

# State Snapshot — 2026-11-27 (Phase 1 Pre-Release Hardening)

- **Branch / Worktree:** `release/phase1-prerelease` (`../beauty_ai-release-phase1-prerelease`)
- **Completed Steps (1–8):**
  1. Git hygiene, removed hardcoded `JWT_SECRET`, tightened `CORS_ORIGINS`, updated `.gitignore`.
  2. Replaced static `ProductService` caches with DI `IMemoryCache` (`IProductCache` / `MemoryProductCache`) + invalidation tests (`69/69` -> `80/80` unit tests).
  3. Added `RecommendationsController` (`/featured`, `/trending`, `/skinquiz`), 404 route (`NotFound.jsx`), English `SkinQuiz.jsx` fallbacks, regenerated OpenAPI & `schema.d.ts`.
  4. Added TDD `OrderServiceTests`, DB transactions + `FOR UPDATE` row lock, server-side conflict check, stock restore on `Cancelled` + state machine, `orders.notes` & `users.shipping_address` SQL migration (`2026-11-27_phase1_prerelease_schema_sync.sql`).
  5. Added `[Authorize]` on review endpoints (`ReviewAuthorizationTests`), translated backend Vietnamese messages to English, exposed `Role` in `/auth/me`, cleaned `avatar_url`, added `POST /api/v1/auth/change-password` + Profile UI.
  6. Added API security headers, Rate Limiting (`auth` & `ai`, HTTP 429), `UseForwardedHeaders` + Production HSTS/HTTPS, and `vercel.json` SPA security headers.
  7. Patched npm advisories to **0 vulnerabilities** (`vite@8.4.0`), fixed `.env.example`, `src/frontend/.env.example`, `docker-compose.yml`, `src/frontend/Dockerfile`, pruned dead `api.js` exports, hid prod upload UI via `VITE_ENABLE_IMAGE_UPLOAD`.
  8. Synced canonical docs (`ADR-016`, `tech-stack.md`, `security-policy.md`, `deployment-runbook.md`, `api-contract.md`, `data-contracts.md`, `traceability.md`, `glossary.md`, `architecture.md`, `domain-rules.md`, `observability-runbook.md`, `testing-strategy.md`), ran `./syntheprise sync` & `./syntheprise dashboard`.
- **Next:** Step 9 re-audit delta report & write smoke test on temporary Neon branch (awaiting user-supplied Neon branch connection string).
