---
doc: rule-language
title: UI Language Standard — 100% English
status: active
precedence: 0
owner: tech-lead
last_reviewed: 2026-11-27
---

# UI Language Standard — 100% English

> Applies to the entire BeautyAI web application (Storefront and Admin Console) and all user-facing API validation/status messages.

## Mandatory Rule
1. **100% English UI:** Every visible label, heading, button, placeholder, table header, status badge, toast notification, confirmation dialog, empty state, and error message MUST be written in clear, natural English.
2. **No Mixed Languages:** Do not mix Vietnamese and English in any screen, component, or API error message. Do not branch UI strings on `lang === 'vi'` in new or updated components.
3. **Consistent Locale Formatting:** Use `en-US` for dates, numbers, and USD currency formatting (e.g., `toLocaleDateString('en-US')`, `toLocaleString('en-US')`).
4. **Human-Readable Enum Labels:** Never render raw PascalCase/snake_case enum strings (e.g., `InProgress` → `In Progress`, `OutOfStock` → `Out of Stock`).
