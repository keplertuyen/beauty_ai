#!/usr/bin/env python3
"""Syntheprise Framework session lock + worktree helpers (enforces the worktree-isolation rule).

Dependency-free. Provides:
  - git worktree awareness (is_main_worktree, current_branch, worktree_root)
  - a filesystem advisory lock that serialises git-write sequences (close-out)
    across DIFFERENT agent sessions/tools, since they may run in the same
    repository concurrently.

The lock is keyed by the acquiring **worktree path** (not pid), so all commits
made from the same worktree during one close-out are allowed, while a
concurrent close-out from a *different* worktree/checkout is blocked.

Lock file: <repo-root>/.syntheprise/locks/checkout.lock (repo-root = parent of the
common .git dir, shared across all linked worktrees).
"""
from __future__ import annotations

import json
import os
import subprocess
import time
from pathlib import Path

STALE_SECONDS = 2 * 60 * 60  # a lock older than 2h is considered abandoned


def _git(*args: str) -> str:
    try:
        out = subprocess.run(
            ["git", *args], capture_output=True, text=True, check=False
        )
        return out.stdout.strip()
    except Exception:
        return ""


def git_common_dir() -> Path:
    d = _git("rev-parse", "--git-common-dir") or ".git"
    return Path(d).resolve()


def git_dir() -> Path:
    d = _git("rev-parse", "--git-dir") or ".git"
    return Path(d).resolve()


def worktree_root() -> str:
    return _git("rev-parse", "--show-toplevel")


def is_main_worktree() -> bool:
    """True when running in the primary checkout (not a linked `git worktree`)."""
    return git_dir() == git_common_dir()


def current_branch() -> str:
    return _git("rev-parse", "--abbrev-ref", "HEAD")  # "main", "feat/x", or "HEAD"


def _lock_path() -> Path:
    # repo root = parent of the common .git dir
    repo_root = git_common_dir().parent
    return repo_root / ".syntheprise" / "locks" / "checkout.lock"


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except Exception:
        return False


def read() -> dict | None:
    p = _lock_path()
    if not p.exists():
        return None
    try:
        info = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None
    # stale if too old or holder pid dead
    if (time.time() - float(info.get("ts", 0))) > STALE_SECONDS:
        return None
    pid = int(info.get("pid", 0) or 0)
    if pid and not _pid_alive(pid):
        return None
    return info


def held_by_other() -> dict | None:
    """Return live lock info if a DIFFERENT worktree holds it, else None."""
    info = read()
    if not info:
        return None
    if info.get("worktree") == worktree_root():
        return None
    return info


def acquire(label: str = "close-out") -> bool:
    if held_by_other():
        return False
    p = _lock_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(
        json.dumps(
            {
                "worktree": worktree_root(),
                "branch": current_branch(),
                "pid": os.getpid(),
                "ts": time.time(),
                "label": label,
                "session": os.environ.get("SYNTHEPRISE_SESSION_ID", ""),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return True


def release() -> bool:
    info = read()
    p = _lock_path()
    # only the owning worktree may release (or a stale lock is cleared)
    if info and info.get("worktree") not in (worktree_root(), None):
        return False
    if p.exists():
        p.unlink()
    return True
