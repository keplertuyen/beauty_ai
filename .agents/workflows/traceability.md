---
description: Update requirement-to-test-to-implementation traceability.
---

# /traceability

**Purpose:** maintain the chain from business goal to verified release.

**Inputs:** requirement IDs, change ID, test case IDs, WG/task IDs, PR/commit/release references.

**Steps:**
1. Open `docs/traceability.md`.
2. Add or update rows for changed Must/Should behavior.
3. Ensure every Must FR has AC + test case before implementation.
4. Link implementation task and PR/commit once available.
5. Mark status accurately: Draft, Ready, Implemented, Verified, Released, Deferred, Exception approved.

**Output:** updated traceability matrix.
