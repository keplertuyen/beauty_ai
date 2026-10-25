---
doc: architecture
title: System Architecture
status: stable
precedence: 2
owner: <SA / Tech Lead>
last_reviewed: <YYYY-MM-DD>
---

# System Architecture — <PROJECT NAME>

> SINGLE SOURCE OF TRUTH for HOW the system is built. No functional requirements/business rules here (link to `requirements.md` / `docs/domain-rules.md`).

## 1. Staged deployment (if applicable)
| Component | Stage 0 (PoC) | Stage 1 (MVP) | Stage 2 (Production) |
|---|---|---|---|
| OLTP DB | <...> | <...> | <...> |
| Analytics / time-series | <...> | <...> | <...> |
| Background jobs | <...> | <...> | <...> |
| Realtime | <...> | <...> | <...> |
| Auth | <...> | <...> | <...> |
| Deploy | <...> | <...> | <...> |
> Match infra to the CURRENT tier. Record the chosen baseline in `docs/adr/0001-...`.

## 2. Components & responsibilities
| Component | Responsibility |
|---|---|
| <...> | <...> |

## 3. Data pipeline / flow
1. <...>

## 4. Storage roles & CQRS (if any)
<which store owns what; how reads/writes are split>

## 5. Auth model
<scheme, token flow, verification>

## 6. Realtime / WebSocket model
<connection, envelope, auth, scaling note>

## 7. Resilience
<retry/backoff, circuit breaker, fallback, backfill>

## 8. Diagram(s)
<ascii or link>

## Composed Stack Architecture

### backend.dotnet

ASP.NET Core exposes the HTTP boundary on port 8080. The minimal API owns
runtime behavior while `contracts/openapi.yaml` remains the design-first client
contract.

### web.react-vite

The browser application is an external API consumer. It imports the generated
transport-neutral TypeScript client and does not redefine API DTOs.

### mobile.react-native-expo

The Expo application consumes the same generated TypeScript client as the web
application. Runtime API base URL selection distinguishes Android emulator, iOS
simulator and an explicit physical-device override.

### contract.openapi-http

OpenAPI 3.1 is the single HTTP boundary artifact. Generated clients are
reproducible outputs and must not be edited by hand.

### infra.compose-local

Docker Compose owns local backend orchestration. Web development runs natively;
mobile runs outside containers with an environment-specific host API URL.
