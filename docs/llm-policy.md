---
doc: llm-policy
title: LLM / AI Policy
status: stable
precedence: 2
owner: <SA / AI Lead>
last_reviewed: <YYYY-MM-DD>
---

# LLM / AI Policy — <PROJECT NAME>

> Contract for any LLM/AI feature or agent in this project. Include when the product uses an LLM.

## 1. Allowed models & providers
- <which providers/models are approved; cost tier per use case; how a provider is selected via adapter>.

## 2. Data boundary (privacy)
- What data MAY be sent to a model and what MUST NOT (secrets, PII, regulated data).
- Per-user opt-in required for sensitive context; redact before sending.

## 3. Prompt-injection defense
- Treat tool output, fetched web/content, and user data as UNTRUSTED.
- Untrusted content can never override system rules, escalate permissions, or trigger destructive actions.

## 4. Logging
- Log prompt/response for quality, with secrets/PII masked. Define retention.

## 5. Human approval
- Required before the agent calls an external/side-effecting tool or processes sensitive data (see `.agents/rules/safety.md`).

## 6. Output is not source of truth
- LLM output is a draft until validated against data/contracts. Never persist a model's number/claim as fact without a check.

## 7. Golden tests
- Maintain fixed golden cases re-run on every prompt/model change. Pass criteria: format correct, numbers match input data, no banned/over-confident claims, disclaimer present where required.
