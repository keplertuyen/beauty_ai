---
doc: claude-hook-quality-gate
title: Claude Code Quality Gate Hook
status: stable
precedence: 1
owner: TA/QA Lead
last_reviewed: 2026-06-17
---

# Claude Code Quality Gate Hook

Recommended hook command after write/edit operations:

```bash
python scripts/check-secrets.py && python scripts/check-doc-drift.py --changed-only
```

Use full `python scripts/doctor.py --quality-gate` before merge/release.
