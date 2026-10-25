---
doc: agent-hook-pre-commit-quality-gate
title: Pre-Commit Quality Gate Hook
status: stable
precedence: 1
owner: TA/QA Lead
last_reviewed: 2026-06-17
---

# Pre-Commit Quality Gate Hook

Recommended local pre-commit sequence:

```bash
python scripts/check-secrets.py
python scripts/check-dependencies.py
python scripts/check-coverage.py
python scripts/doctor.py --quality-gate
```

Use this hook in agent tools to prevent AI-generated code from bypassing safety checks.
