---
name: spec-delta
description: Draft ADDED, MODIFIED, REMOVED, and DEPRECATED requirement deltas for change requests.
---

# Skill: spec-delta

## When to use
Use when a client request, bug, enhancement, or technical change modifies existing behavior.

## Procedure
1. Identify current canonical requirement/contract.
2. Classify each change as ADDED, MODIFIED, REMOVED, or DEPRECATED.
3. Write deltas in observable behavior terms.
4. Keep architecture out of requirements deltas unless documenting NFR impact.
5. Link affected docs and ADRs.
6. Flag conflicts with existing specs.

## Output
A completed `requirements-delta.md` section suitable for `docs/_changes/<CHANGE-ID>/`.
