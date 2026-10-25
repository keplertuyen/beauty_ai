# Security Policy

Syntheprise Framework is an open-source (Apache-2.0) documentation/tooling framework. The
practices below keep both the repo and the projects built with it safe.

## Reporting a vulnerability or a leaked secret
- **Do not open a public/normal GitHub issue** for security matters.
- Email **tm@syntheprise.ai** (or message the repo owner directly) with:
  the affected file/commit, what you found, and how to reproduce.
- If a secret (API key, token, password, private key) was committed, report it
  immediately and treat the secret as compromised — rotate it, do not just
  delete the commit.

## Response targets (internal)
- Acknowledge within 2 business days.
- Triage and remediation plan within 5 business days.
- Coordinated fix before the issue is discussed more broadly.

## Secret hygiene in this repo
- Secrets live only in `.env` (git-ignored). `.env.example` documents the keys
  with empty values — never real values.
- `scripts/check-secrets.py` runs locally and in CI to catch obvious secrets.
- The pre-commit / pre-tool hook `scripts/protected-action-policy.py` blocks
  destructive and obviously unsafe commands.

## Scope
This policy covers the Syntheprise Framework repository itself. Security requirements
for software **built with** Syntheprise Framework live in each project's `docs/security-policy.md`
and `docs/llm-policy.md`.
