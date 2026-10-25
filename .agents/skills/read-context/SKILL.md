---
name: read-context
description: Load only the right docs for a task using the AGENTS.md context map and precedence ladder.
---

# Skill: read-context

**When:** at the start of any task, before planning or coding.

**Steps:**
1. Read `AGENTS.md` (constitution + precedence ladder + context map).
2. From the context map, open ONLY the files relevant to the task slice — do not load the whole requirements doc.
3. If two docs conflict, apply the precedence ladder and surface the conflict to the human.
4. Note the parent Work-Group plan (`docs/_plans/.../WG-*.md`) for current tasks/decisions.

**Output:** a short "context loaded" note listing which files were read and any conflicts found.
