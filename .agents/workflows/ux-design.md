---
description: Produce a UI/UX design brief (flows, wireframe/mockup, states) BEFORE frontend implementation — QA-first applied to interfaces.
---

# /ux-design

**Purpose:** do not write frontend code before an approved design — the "design brief before code" discipline, the interface counterpart of QA-first for behavior.

**Inputs:** the screen/feature UI request (from a change proposal or owner description); `docs/design-system.md` (token/component contract); `.agents/rules/ui-ux-standards.md` (invariant principles); the active artifact version under `docs/_ui-ux_design/` (see that folder's README).

**Steps:**
1. Read the design system + ui-ux-standards + the active artifact version; identify reusable patterns/tokens — do NOT invent a new style when a token already exists.
2. Write the **design brief**: screen goal, user flow, wireframe/mockup (SVG/PNG/HTML), every state (loading/empty/error/degraded), i18n requirements for supported locales, accessibility, responsive breakpoints.
3. Save the artifact: a design belonging to the version set → `docs/_ui-ux_design/<active-version>/`; a design local to one change → `docs/_changes/<CHANGE-ID>/refs/`. Commit immediately (an untracked artifact is at risk of loss).
4. Fill the **"UI/UX impact"** section in the change's `proposal.md`/`design.md`, linking to the brief.
5. **STOP and wait for owner / UI-UX Designer approval of the brief** before creating implementation tasks.

**Output:** an approved design brief + the UI/UX impact section in the change folder — the precondition for Dev to start frontend tasks.

**Forbidden:** coding new UI behavior before the brief is approved; redrawing a pattern that already exists in the design system; saving artifacts outside the two defined locations; leaving an artifact untracked overnight.
