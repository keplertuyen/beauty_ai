---
doc: agent-provider-abstraction-rules
title: Provider Abstraction Rules (external source layering)
status: stable
precedence: 0
owner: <Tech Lead>
last_reviewed: 2026-07-24
---

# Provider Abstraction Rules

Goal: the external data/library layer (whatever source you use today; a different one tomorrow) must be **replaceable without touching call-sites**. External data sources and third-party client libraries sit behind a `Provider`/adapter interface.

Rationale: call-sites coupled to a concrete source library force a rewrite every time the source changes; an adapter boundary confines that change to one file.

## Rules (guarded by `scripts/check-provider-abstraction.py`, an optional gate)

1. **Do not import a source library outside the adapters directory.** Third-party source/client libs may only be imported inside `src/providers/` (the adapters dir).
2. **Do not instantiate a concrete provider or call a private method at a call-site.** No `ConcreteProvider(...)`, no `provider._internal_call(...)`, no `._get_*_sync(...)` outside the adapters dir.
3. **Providers return a normalized shape** (e.g. `dict` / `list[dict]`). Source-specific parsing (DataFrame/JSON quirks) lives **inside** the provider.
4. **No business logic in a provider.** Derived values / computations are done by the consumer from stored data — a provider supplies raw inputs only.
5. **Adding a source = 1 adapter + 1 matrix line.** Do not edit call-sites when swapping or adding a source.

**Exception:** the composition root (the app's assembly/entry module) wires the concrete provider map — declare it explicitly in an allowlist (e.g. `scripts/provider_abstraction_allow.txt`) with a comment stating why. Keep the allowlist minimal.

## Do / Don't

```python
# ❌ Don't — import a source lib in a task/endpoint/service
from some_source_lib.api import Listing
df = Listing(source="X").all_items()

# ❌ Don't — instantiate a concrete provider / read concrete attributes
from src.providers.some_provider import SomeProvider
if SomeProvider(cb, tier="silver").effective_tier == "silver": ...

# ✅ Do — go through the provider interface (public method, normalized shape)
from src.providers.factory import get_provider
from src.providers.capabilities import Capability

rows = get_provider().list_items()                       # list[{id, name}]
if Capability.PREMIUM_FEED in get_provider("silver").capabilities(): ...
recs = get_provider(key).get_history_sync(key, start, end)
```

## When you need a new source or capability
1. Add a public method on the `Provider` base with a null/empty default (keeps other providers valid).
2. Override it in the specific adapter; parse the source shape **inside** the adapter.
3. Declare the capability in `capabilities()` + the matrix/registry.
4. Call-sites use the factory/resolver + the public method.
5. For a third source: add the adapter class + register it — do not edit call-sites.

The guard can run in the quality gate and at pre-commit; a `--changed-only` mode keeps pre-commit fast.
