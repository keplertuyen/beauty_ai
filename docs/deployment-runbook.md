---
doc: deployment-runbook
title: Sổ Tay Triển Khai & Vận Hành Môi Trường (Deployment Runbook) — BeautyAI Platform
status: draft
precedence: 2
owner: DevOps / Tech Lead
last_reviewed: 2026-10-25
---

# SỔ TAY TRIỂN KHAI & MÔI TRƯỜNG — BeautyAI Platform

> Thực thi CON-05 và ADR-013: Triển khai kiểm thử cục bộ bằng Docker Compose (`scripts/deploy-test`) và CI 5 jobs trên GitHub Actions (Precedence 2 — Contracts).

---

# 15. CI/CD, MÔI TRƯỜNG & TRIỂN KHAI

> Thực thi `CON-05`: **CI/CD local (MacBook) + GitHub.**

## 15.1. Mô hình tổng thể

```text
┌────────────────── MÁY PHÁT TRIỂN (MacBook) ──────────────────┐
│                                                               │
│  ./scripts/dev      → postgres (Docker) + API (watch)        │
│                       + frontend (vite dev)                   │
│  ./scripts/test     → unit + integration + frontend           │
│  ./scripts/build    → build cả hai                            │
│  ./scripts/e2e      → Playwright trên bản build               │
│  ./scripts/demo     → MỘT cổng duy nhất (:5000)               │
│  ./scripts/demo --offline → chế độ ngoại tuyến (RISK-16)      │
│  ./syntheprise gate → quality gate của framework              │
│                                                               │
│  git push                                                     │
└───────────────────────────┬───────────────────────────────────┘
                            ▼
┌────────────────────── GITHUB ACTIONS ────────────────────────┐
│  Trên MỖI push & pull request:                                │
│   ① setup .NET 10 (theo global.json) + Node 22               │
│   ② khởi động service container postgres:17                   │
│   ③ dotnet restore · build (warnings = errors) · test         │
│   ④ frontend: npm ci · typecheck · lint · test · build        │
│   ⑤ KIỂM TRA SAI LỆCH OPENAPI (sinh lại schema.d.ts, so sánh) │
│   ⑥ kiểm tra bí mật (gitleaks)                                │
│   ⑦ kiểm tra lỗ hổng phụ thuộc                                │
│   ⑧ kiểm tra độ phủ (line ≥70%, branch ≥60%)                  │
│   ⑨ test kiến trúc (quy tắc phụ thuộc §3.3)                   │
│   ⑩ ./syntheprise gate — doctor + traceability + doc-drift    │
│       + adapter parity (syntheprise sync --check)             │
│   ⑪ golden test (chạy với NullLlmProvider + bản ghi cố định)  │
│  Trên pull request (bổ sung):                                  │
│   ⑫ kiểm tra tính đầy đủ của change folder                     │
│   ⑬ E2E Playwright (có thể chạy nhẹ hơn: 4 luồng quan trọng)   │
│                                                               │
│  ❌ KHÔNG triển khai từ CI — demo chạy cục bộ (CON-05)         │
└───────────────────────────────────────────────────────────────┘
```

## 15.2. Script phát triển

```bash
#!/usr/bin/env bash
# scripts/dev — khởi động môi trường phát triển
set -euo pipefail
docker compose up -d postgres
until docker compose exec -T postgres pg_isready -U beautyai >/dev/null 2>&1; do
  echo "Đang chờ PostgreSQL…"; sleep 1
done
dotnet ef database update --project src/BeautyAI.Infrastructure --startup-project src/BeautyAI.Api
dotnet watch --project src/BeautyAI.Api run &
npm --prefix src/frontend run dev
```

```bash
#!/usr/bin/env bash
# scripts/demo — MỘT cổng duy nhất, giảm điểm lỗi khi trình bày
set -euo pipefail
OFFLINE=${1:-}
docker compose up -d postgres
npm --prefix src/frontend ci
npm --prefix src/frontend run build                     # → src/frontend/dist
rm -rf src/BeautyAI.Api/wwwroot && cp -r src/frontend/dist src/BeautyAI.Api/wwwroot
if [[ "$OFFLINE" == "--offline" ]]; then
  export Providers__Llm=Null                            # NullLlmProvider
  export Providers__Payment=Mock                        # MockPaymentProvider
  export Providers__Email=NoOp
  echo "⚠️  CHẾ ĐỘ DEMO NGOẠI TUYẾN — không gọi dịch vụ ngoài"
fi
dotnet run --project src/BeautyAI.Api --configuration Release
# → http://localhost:5000  (cả giao diện và API)
```

> 💡 **Vì sao gộp một cổng cho demo:** mỗi tiến trình phải chạy khi trình bày là một rủi ro (`RISK-16`). Chạy một lệnh, mở một địa chỉ. Chế độ `--offline` còn loại bỏ mọi phụ thuộc mạng — **phải tổng duyệt chế độ này ít nhất một lần** trước buổi demo thật.

## 15.3. Pipeline GitHub Actions

```yaml
name: quality-gate
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env: { POSTGRES_USER: ci, POSTGRES_PASSWORD: ci, POSTGRES_DB: beautyai_test }
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4        # đọc global.json
      - run: dotnet restore
      - run: dotnet build --no-restore -warnaserror
      - run: dotnet test --no-build --collect:"XPlat Code Coverage"
      - run: python scripts/check-coverage.py --line 70 --branch 60
      - run: dotnet test tests/BeautyAI.ArchitectureTests --no-build
      - run: dotnet test tests/BeautyAI.GoldenTests --no-build
        env: { Providers__Llm: Null }         # golden test dùng bản ghi cố định

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: src/frontend/package-lock.json }
      - run: npm --prefix src/frontend ci
      - run: npm --prefix src/frontend run typecheck
      - run: npm --prefix src/frontend run lint
      - run: npm --prefix src/frontend run test
      - run: npm --prefix src/frontend run build

  openapi-drift:                              # ⟸ ADR-008
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: dotnet build src/BeautyAI.Api
      - run: dotnet run --project src/BeautyAI.Api -- --export-openapi openapi.json
      - run: npx openapi-typescript openapi.json -o /tmp/schema.d.ts
      - name: So sánh với bản đã commit
        run: |
          if ! diff -q /tmp/schema.d.ts src/frontend/src/api/schema.d.ts; then
            echo "::error::schema.d.ts đã trôi khỏi OpenAPI. Chạy: npm run gen:api"
            diff /tmp/schema.d.ts src/frontend/src/api/schema.d.ts || true
            exit 1
          fi

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Kiểm tra bí mật
        uses: gitleaks/gitleaks-action@v2
      - run: dotnet list package --vulnerable --include-transitive 2>&1 | tee /tmp/vuln.txt
      - run: '! grep -q "has the following vulnerable" /tmp/vuln.txt'

  syntheprise-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: ./syntheprise gate                   # doctor + traceability + doc-drift
      - run: ./syntheprise sync --check            # chặn sai lệch adapter
      - if: github.event_name == 'pull_request'
        run: python scripts/check-change-completeness.py
```

## 15.4. Chiến lược nhánh & commit

| Hạng mục | Quy ước |
|---|---|
| **Nhánh chính** | `main` — luôn ở trạng thái build & test xanh |
| **Nhánh làm việc** | `feat/<module>-<slug>` · `fix/<slug>` · `chore/<slug>` · `docs/<slug>` |
| **Worktree** | **Mỗi nhánh một worktree riêng** (`AGENTS.md §2.12`) |
| **Commit** | Conventional Commits, **có mã yêu cầu/change**: `feat(M05): thêm tính điểm quiz 4 tầng (FR-QUIZ-02)` |
| **PR** | Mẫu `.github/PULL_REQUEST_TEMPLATE.md`; bắt buộc liệt kê FR/BR đã thực hiện + bằng chứng test |
| **Merge** | Chỉ khi toàn bộ job CI xanh; squash merge để giữ lịch sử `main` sạch |
| **Tag phát hành** | Chỉ qua workflow `/release-baseline`; tạo/đẩy tag là **hành động cần chủ dự án xác nhận** (`AGENTS.md §2.11`) |

## 15.5. Danh mục kiểm tra trước buổi demo

> Danh mục này giải `RISK-16` (demo thất bại vì phụ thuộc ngoài) và `RISK-03` (hết hạn mức AI).

```text
── MỘT TUẦN TRƯỚC ──────────────────────────────────────────────
☐ Nâng tier Gemini API (không dựa vào tier miễn phí — RISK-03)
☐ Xác nhận tài khoản Zalo OA hoạt động, deep link mở đúng
☐ Chạy đường ống dữ liệu đầy đủ; xác nhận mọi ngưỡng §9.5 của BRD đạt
☐ Chạy ./scripts/e2e — cả 8 luồng xanh
☐ Chạy golden test — 22/22 pass (BO-06)
☐ Kiểm tra khả năng truy cập (axe) cho luồng chính — không còn lỗi nghiêm trọng

── BA NGÀY TRƯỚC ───────────────────────────────────────────────
☐ TỔNG DUYỆT ĐẦY ĐỦ lần 1 với ./scripts/demo (chế độ online)
☐ TỔNG DUYỆT ĐẦY ĐỦ lần 2 với ./scripts/demo --offline  ⟸ BẮT BUỘC
☐ Sao lưu DB (pg_dump) + PHỤC HỒI THỬ thành công (NFR-REL-05)
☐ Chuẩn bị 5 tài khoản khách mẫu có hồ sơ da khác nhau (§9.6 BRD mục 18)
☐ Làm nóng bộ đệm AI với 20 câu hỏi dự kiến sẽ demo

── NGÀY DEMO ───────────────────────────────────────────────────
☐ docker compose up -d postgres  → kiểm tra pg_isready
☐ ./scripts/demo  → mở http://localhost:5000
☐ Kiểm tra /health: app ✓ · db ✓ · llm ✓ · payment ✓
☐ Đăng nhập tài khoản admin + một tài khoản khách mẫu
☐ CHUẨN BỊ SẴN đường thoát: nếu mạng hỏng → Ctrl+C → ./scripts/demo --offline
☐ Mở sẵn tab Admin Console để demo tra mã chuyển tiếp Zalo
```

## 15.6. Quy trình sao lưu & phục hồi (`NFR-REL-05`)

```bash
# scripts/backup — chạy hằng ngày trong giai đoạn phát triển
TS=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T postgres pg_dump -U beautyai -Fc beautyai \
  > "backups/beautyai_${TS}.dump"
find backups -name 'beautyai_*.dump' -mtime +14 -delete    # giữ 14 ngày

# scripts/restore — PHẢI THỬ ÍT NHẤT MỘT LẦN trước demo
docker compose exec -T postgres pg_restore -U beautyai -d beautyai --clean \
  < "backups/$1"
```

> ⚠️ **Nguyên tắc:** *"Một bản sao lưu chưa từng được phục hồi thử là một bản sao lưu không tồn tại."* Việc phục hồi thử là một mục **bắt buộc** trong danh mục kiểm tra trước demo, không phải việc nên làm.

---


