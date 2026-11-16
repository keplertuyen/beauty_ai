"""Verified product-image pipeline (BUGFIX-PRODUCT-IMAGES).

Offline tooling only — never imported by the runtime app.
Modules:
  base      — ImageSource interface, normalized types, retry + rate limit
  matcher   — brand/name verification (stdlib only)
  manifest  — provenance manifest read/append
  pipeline  — tiered orchestration with resume
"""
