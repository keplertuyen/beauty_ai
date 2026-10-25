---
doc: ui-ux-standards
title: UI/UX Standards
status: stable
precedence: 0
owner: <UI/UX Designer>
last_reviewed: 2026-07-24
---

# UI/UX Standards (invariant)

> Design discipline is a hard rule, not a preference. A frontend change that skips it is a Definition-of-Done failure.

## 1. Core principles

1. **Design brief before code.** Do not implement new UI behavior without an approved design brief. Interfaces get the same "design first, then build" discipline that QA-first gives to behavior — see the `/ux-design` workflow.
2. **Design-system adherence.** Reuse the tokens, components, and patterns defined in `docs/design-system.md`. Do NOT invent a new style, spacing scale, or color when the system already provides one.
3. **No pattern reinvention.** If an interaction pattern already exists in the product, reuse it. Divergence must be justified in the design brief, not introduced ad hoc in code.
4. **Accessibility is required.** Meet baseline a11y for every screen: keyboard navigation, focus order, visible focus states, sufficient contrast, labelled controls, and screen-reader-friendly semantics. Accessibility is part of "done", not a follow-up.
5. **Handle every state.** A screen must define and implement its loading, empty, error, and degraded states — never ship only the happy path, and never present a blank screen where guidance is possible.
6. **Internationalization & responsiveness.** Design for the project's supported locales and defined responsive breakpoints from the start; do not hardcode copy or fixed pixel layouts that break translation or reflow.

## 2. Design artifacts (governance)

- Every design artifact (wireframe, mockup, design brief) lives under `docs/_ui-ux_design/`, following the versioning convention documented in that folder's README (the single home of that convention — not repeated here).
- A change touching the frontend MUST include a **"UI/UX impact"** section in `proposal.md`/`design.md`, produced via the `/ux-design` workflow BEFORE any code (design-brief-before-code).
- Role separation: `docs/design-system.md` = token/component contract (a contract doc); `docs/_ui-ux_design/` = versioned artifacts/mockups; this rule = invariant principles (precedence 0).
