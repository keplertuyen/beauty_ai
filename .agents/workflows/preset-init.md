---
description: Apply the correct Syntheprise Framework preset and verify the initialized project is clean.
---
# /preset-init

Use when creating a project from a predefined Syntheprise Framework preset.

1. Select the preset: `greenfield-sme-webapp`, `brownfield-modernization`, or `odc-light`.
2. Run `./syntheprise init <target> --preset <preset> --adapter all`.
3. Confirm `.syntheprise-preset` and `.syntheprise-tier` are correct.
4. Run `python scripts/doctor.py --template` inside the target.
5. Fill project-specific placeholders before strict gates are enabled.
