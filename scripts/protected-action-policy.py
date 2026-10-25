#!/usr/bin/env python3
"""Starter protected action policy hook.

Tool hooks can call this before shell commands. Because each agent client sends
hook input differently, this script is conservative: it reads stdin if present
and blocks only obvious destructive patterns.
"""
import sys, re

payload = sys.stdin.read() if not sys.stdin.isatty() else ""
blocked = [
    r"rm\s+-rf\s+/(\s|$)",
    r"rm\s+-rf\s+\.",
    r"cat\s+\.env",
    r"curl\s+[^|]+\|\s*(sh|bash)",
    r"wget\s+[^|]+\|\s*(sh|bash)",
]
for pat in blocked:
    if re.search(pat, payload, flags=re.I | re.S):
        print(f"BLOCKED by protected-action-policy: pattern {pat}", file=sys.stderr)
        sys.exit(2)
print("protected-action-policy: ok")
sys.exit(0)
