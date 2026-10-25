---
doc: ui-ux-design-index
title: UI/UX Design Artifacts — Version Governance
status: stable
precedence: 5
owner: UI/UX Designer persona
last_reviewed: 2026-10-25
---

# docs/_ui-ux_design/

> Home for versioned UI/UX design artifacts (working memory, precedence 5). This
> file is the canonical home of the version convention. Token and component
> contracts live in `docs/design-system.md`.

## Version status

| Version | Status | Contents |
|---|---|---|
| `v1.0/` | **ACTIVE** | Prototype HTML/CSS/JS tĩnh hoàn chỉnh (22 màn hình và component tokens) |

_Add a row per version. Exactly one row is ACTIVE at any time; older rows become
`superseded`._

## Conventions

1. **Exactly one ACTIVE version** at any time; the table above is the single place
   that records status. Cutting a new version = add a `vX.Y/` folder + flip the
   previous version to `superseded` in this table.
2. **Supersede, don't delete.** Never delete an old version folder — it is
   reference heritage. New designs go through `/ux-design`: a versioned brief lands
   in the active `vX.Y/`; a brief scoped to a single change lands in
   `docs/_changes/<CHANGE-ID>/refs/`.
3. **Commit immediately.** An untracked artifact is a data-loss risk.
4. `.md` files in this folder need standard front-matter (the doctor checks it);
   binary files (PNG/SVG) do not.
5. **`design-system.md` wins on conflict.** If an artifact here disagrees with
   `docs/design-system.md`, the design-system wins — it is a precedence-2 contract
   and this folder is precedence-5 working memory. Fix the artifact, or open a
   change to amend the contract.
