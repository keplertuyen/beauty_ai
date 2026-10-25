---
description: Run the test layers and block progress unless all are green.
---

# /test-gate

**Purpose:** enforce the quality gate from `docs/testing-strategy.md`.
**Inputs:** current branch.
**Steps:**
1. Run unit + contract + integration tests; report pass/fail per layer.
2. For non-deterministic components (e.g. LLM), run the golden cases.
3. Do NOT proceed to the next task until all required layers are green.
**Output artifact:** a pass/fail summary per layer.
**Forbidden:** skipping layers; marking done while red.
