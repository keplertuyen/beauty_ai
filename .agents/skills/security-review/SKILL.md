---
name: security-review
description: Review a change against the security policy and OWASP basics before merge.
---

# Skill: security-review

**When:** during `/review`, especially for auth, data access, external calls, or LLM context.

**Checklist:**
- Secrets: none hard-coded/logged; `.env` only.
- AuthZ: every user-bound query scoped by tenant/user id.
- Input: validated; queries parameterised.
- LLM: no secrets/PII in prompts beyond the user-approved boundary; prompt-injection considered.
- Dependencies: no unreviewed major bumps; new deps justified.

**Output:** pass/fail with findings by severity; block on Must-level issues. Reference `docs/security-policy.md`.
