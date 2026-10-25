# docs/_intake/ — what to prepare for `syntheprise kickoff`

This folder is your **inbox**. Drop in whatever describes your product; then run
`syntheprise kickoff` and the AI agent reads everything here, extracts the content, and
**drafts** your canonical Syntheprise Framework documents (requirements, architecture, tech-stack,
domain rules, design system, project charter) for you to approve.

> AI drafts. Humans decide. The agent works **only** from what you put here — it
> never invents domain facts. Anything you leave out, it lists as a gap instead of
> guessing.

## What to provide (all optional — more input = better drafts)

| File / folder | Put here | Feeds |
|---|---|---|
| `requirements-brief.md` | Product goal, target users, key features, priorities, what's out of scope | `requirements.md`, `project-charter.md` |
| `tech-stack-notes.md` | Anything beyond the chosen stack: databases, infra, hosting, third-party services | `docs/tech-stack.md`, `docs/architecture.md` |
| `domain-rules-notes.md` | Business/regulatory facts that must NOT be guessed (rules, calculations, constraints) | `docs/domain-rules.md` |
| `constraints.md` | Non-functional needs: performance, security/compliance, budget, timeline, scale | `requirements.md` (NFRs), `docs/security-policy.md` |
| `integrations.md` | External systems/APIs you must talk to | `docs/architecture.md`, `docs/api-contract.md` |
| `ui-ux/` | Mockups, screenshots, wireframes, flow descriptions (drop files in this folder) | `docs/design-system.md`, `docs/_ui-ux_design/` |

## How to use

1. Fill any of the templates above (delete what doesn't apply). You can also drop
   raw notes, exported docs, images, or links — the agent reads them all.
2. Run `syntheprise kickoff`.
3. Review each drafted document the agent presents and approve or correct it.

You can re-run `syntheprise kickoff` after adding more materials; it re-drafts from the
current contents of this folder.
