#!/usr/bin/env python3
"""doctor.py — quality gate for Syntheprise Framework - The Human-Governed Agentic Development Framework.

Run from repo root:
  python scripts/doctor.py --template       # reusable template package
  python scripts/doctor.py                  # local health check
  python scripts/doctor.py --strict         # initialized project / CI
  python scripts/doctor.py --quality-gate   # strict + traceability/doc checks

Exit code 0 = pass, 1 = fail.
"""
from pathlib import Path
import argparse, os, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--template", action="store_true", help="allow template placeholders and template folders")
parser.add_argument("--strict", action="store_true", help="warnings fail the build")
parser.add_argument("--quality-gate", action="store_true", help="run strict project quality gate")
args = parser.parse_args()

TEMPLATE = args.template
STRICT = args.strict or args.quality_gate
errors, warnings = [], []

# Tier awareness: an initialized project may drop a `.syntheprise-tier` marker (0/1/2)
# so the REQUIRED set scales to what that tier actually ships. With no marker
# (the full framework repo) everything is required.
_tier_marker = ROOT / ".syntheprise-tier"
try:
    TIER = int(_tier_marker.read_text(encoding="utf-8").strip()) if _tier_marker.exists() else None
except Exception:
    TIER = None


def _required():
    base = [
        "AGENTS.md", "core-principles.md", "requirements.md", "project-charter.md",
        "VERSION",
        "docs/_changes/BUGFIX-template/bugfix.md",
        "docs/_changes/FASTLANE-template/change.md",
        ".agents/workflows/qa-test-design.md",
        ".agents/workflows/quality-gate.md",
        ".agents/workflows/onboard-existing.md",
        ".agents/skills/qa-test-design/SKILL.md",
        ".agents/skills/reverse-spec/SKILL.md",
        "scripts/syntheprise.py", "scripts/syntheprise_sync.py",
        "scripts/syntheprise_dashboard.py", "scripts/syntheprise_tracker.py",
        "scripts/check-secrets.py", "scripts/check-dependencies.py", "scripts/check-coverage.py",
    ]
    if TIER is None or TIER >= 1:
        base += [
            "docs/testing-strategy.md", "docs/qa-governance.md", "docs/traceability.md",
            "docs/_changes/CHANGE-template/proposal.md",
        ]
    # Adapter READMEs: require only adapters actually present in this repo.
    for a in ("antigravity", "codex", "claude-code"):
        if (ROOT / ".adapters" / a).exists():
            base.append(f".adapters/{a}/README.md")
    return base


REQUIRED = _required()
PLACEHOLDER_PATTERNS = [r"<PROJECT NAME>", r"<YYYY-MM-DD>", r"<\.\.\.>", r"\{\{[A-Z0-9_]+\}\}"]
EXEMPT = {"CLAUDE.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "LICENSE.md", "docs/CHUC_NANG_PHASE1_DO_AN.md"}
OS_JUNK = {".DS_Store", "Thumbs.db", "desktop.ini"}


def _tracked_files():
    """Set of git-tracked rel paths (None if not a git work tree). Used so local
    ignored OS junk (e.g. a contributor's .DS_Store) does not fail the gate — only
    COMMITTED junk is an error."""
    try:
        r = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT,
                           capture_output=True, text=True, timeout=60)
        if r.returncode == 0:
            return {x for x in r.stdout.split("\0") if x}
    except Exception:
        pass
    return None


TRACKED = _tracked_files()


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT)).replace(os.sep, "/")


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def has_frontmatter(text: str, keys) -> bool:
    if not text.startswith("---"):
        return False
    end = text.find("\n---", 3)
    if end == -1:
        return False
    head = text[3:end]
    return all(re.search(rf"(?m)^{re.escape(k)}\s*:", head) for k in keys)


def frontmatter_value(text: str, key: str):
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    head = text[3:end]
    m = re.search(rf"(?m)^{re.escape(key)}\s*:\s*(.+?)\s*$", head)
    return m.group(1).strip() if m else None


def is_template_file(r: str) -> bool:
    base = os.path.basename(r)
    return (
        base.endswith("-template.md")
        or r.endswith("/ADR-template.md")
        or bool(re.match(r"docs/_changes/[^/]+-template/", r))
        or r == "docs/test-matrix-template.md"
    )

# Required files
for r in REQUIRED:
    if not (ROOT / r).exists():
        errors.append(f"missing required file: {r}")

EXCLUDE_DIRS = {".git", ".venv", "venv", "node_modules", "dist", "build", "coverage", "__pycache__", ".pytest_cache", "worktrees", ".worktrees"}

# Walk files
for p in ROOT.rglob("*"):
    if any(part in EXCLUDE_DIRS for part in p.parts):
        continue
    r = rel(p)
    # Skip archive / review / research trees — these hold historical or scratch
    # material, not shipping docs, and should not be held to the doc standard.
    if (
        r.startswith("docs/_plans/_archive/")
        or r.startswith("docs/_states/_archive/")
        or r.startswith("docs/_review/")
        or r.startswith("docs/_research/")
        or r.startswith("docs/_intake/")
        or r.startswith("docs/_requirements/_archive/")
        or r.startswith("docs/_brd/")
        or r.startswith("docs/_prd/")
        or r.startswith("docs/_tech-solutions/")
        or r.startswith("docs/_playbook/")
        or r.startswith("docs/_ui-ux_design/")
        or r == "docs/_plans/beautyai_plan.md"
        or "/_archive/" in r
    ):
        continue
    if any(part == "__MACOSX" for part in p.parts) or p.name in OS_JUNK or p.name.startswith("._"):
        # Only COMMITTED OS junk is an error; local/ignored junk is skipped so a
        # contributor's untracked .DS_Store never makes the gate irreproducible.
        if TRACKED is None or r in TRACKED:
            errors.append(f"OS junk committed: {r}")
        continue
    if not p.is_file() or p.suffix != ".md":
        continue
    # Only check official documentation (repo root, docs/, or AI-config dirs
    # .agents/.claude/.codex). Skip detailed requirement notes under
    # docs/_requirements/.
    if "/" in r and (
        not (r.startswith("docs/") or r.startswith(".agents/") or r.startswith(".claude/") or r.startswith(".codex/"))
        or r.startswith("docs/_requirements/")
    ):
        continue
    text = read(p)

    # Workflows: description front matter.
    if r.startswith(".agents/workflows/"):
        head = text.split("---", 2)[1] if text.startswith("---") and "---" in text[3:] else ""
        if not re.search(r"(?m)^description\s*:", head):
            errors.append(f"workflow missing `description:` front matter: {r}")
        continue

    # Skills: name + description.
    if (r.startswith(".agents/skills/") or r.startswith(".claude/skills/")) and p.name == "SKILL.md":
        head = text.split("---", 2)[1] if text.startswith("---") and "---" in text[3:] else ""
        if not re.search(r"(?m)^name\s*:", head) or not re.search(r"(?m)^description\s*:", head):
            errors.append(f"SKILL.md missing `name:`/`description:`: {r}")
        continue

    # Agent rules are high-authority docs.
    if r.startswith(".agents/rules/"):
        if p.name == ".gitkeep":
            continue
        if not has_frontmatter(text, ["doc", "title", "status", "precedence"]):
            errors.append(f"agent rule missing valid front matter (doc/title/status/precedence): {r}")
        elif frontmatter_value(text, "precedence") != "0":
            warnings.append(f"agent rule should normally be precedence 0: {r}")
        continue

    if r.startswith((".agents/", ".claude/", ".codex/", ".github/")):
        continue

    # Project docs front-matter standard.
    if r not in EXEMPT and not has_frontmatter(text, ["doc", "title", "status", "precedence"]):
        errors.append(f"doc missing valid front matter (doc/title/status/precedence): {r}")

    # Placeholder warnings. Templates are allowed to keep placeholders.
    if not TEMPLATE and not is_template_file(r):
        for pat in PLACEHOLDER_PATTERNS:
            if re.search(pat, text):
                warnings.append(f"unfilled placeholder matching {pat!r} in {r}")
                break

    if re.search(r"(?m)^status\s*:\s*superseded", text):
        warnings.append(f"doc is status: superseded — ensure nothing cites it as authoritative: {r}")

# Internal link integrity for common repo-local links
LINK_RE = re.compile(r'(?<![\w/.])((?:docs|scripts|\.agents|\.adapters|\.claude|\.codex|\.github)/[A-Za-z0-9._/\-]+\.(?:md|py|json|toml|ya?ml))')

# Links to artifacts intentionally omitted by an initialized project tier should
# not make `doctor.py --template` noisy. The full framework repo (no `.syntheprise-tier`)
# still validates every link normally.
TIER2_LINKS = {
    "docs/data-contracts.md", "docs/api-contract.md", "docs/design-system.md",
    "docs/security-policy.md", "docs/domain-rules.md", "docs/glossary.md",
    "docs/observability-runbook.md", "docs/deployment-runbook.md",
    "docs/backup-restore.md", "docs/incident-response.md",
    "docs/release-checklist.md",
}
TIER1_PLUS_LINK_PREFIXES = (
    "docs/architecture.md", "docs/adr/", "docs/testing-strategy.md",
    "docs/qa-governance.md", "docs/traceability.md", "docs/test-matrix-template.md",
    "docs/_plans/", "docs/_requirements/", "docs/_review/", "docs/_changes/CHANGE-template/",
)
FRAMEWORK_LEVEL_LINK_PREFIXES = ("docs/company-rollout/",)

def is_instance_link(m: str) -> bool:
    base = os.path.basename(m)
    # docs/_intake/ and docs/_baseline/ are created per-project by syntheprise new /
    # syntheprise onboard, so links to them are not broken in the framework kit.
    if m.startswith("docs/_intake/") or m.startswith("docs/_baseline/"):
        return True
    return base in {"MASTER-PLAN.md", "PHASE-PLAN.md"} or base.startswith("WG-") or "<" in m or "..." in m

def is_tier_optional_missing_link(m: str) -> bool:
    if TIER is None:
        return False
    if any(m.startswith(prefix) for prefix in FRAMEWORK_LEVEL_LINK_PREFIXES):
        return True
    if TIER < 2 and (m in TIER2_LINKS or any(m.startswith(x[:-3] + "/") for x in TIER2_LINKS if x.endswith(".md"))):
        return True
    if TIER < 1 and any(m == prefix.rstrip("/") or m.startswith(prefix) for prefix in TIER1_PLUS_LINK_PREFIXES):
        return True
    return False

for p in ROOT.rglob("*.md"):
    rp = rel(p)
    if (
        any(part in EXCLUDE_DIRS for part in p.parts)
        or rp.startswith("docs/_guides/")
        or rp.startswith("docs/_playbook/")
        or rp.startswith("docs/_brd/")
        or rp.startswith("docs/_prd/")
        or rp.startswith("docs/_tech-solutions/")
        or rp == "docs/_plans/beautyai_plan.md"
        or rp.startswith("docs/_plans/_archive/")
        or rp.startswith("docs/_states/_archive/")
        or rp.startswith("docs/_review/")
        or "/_archive/" in rp
    ):
        continue
    text = read(p)
    for m in set(LINK_RE.findall(text)):
        if is_instance_link(m) or is_tier_optional_missing_link(m):
            continue
        if not (ROOT / m).exists():
            warnings.append(f"broken internal link {m!r} in {rp}")

# .gitignore sanity
GITIGNORE_MUST = [".env", ".DS_Store", "__MACOSX", "._*"]
gi = ROOT / ".gitignore"
if gi.exists():
    gitignore = read(gi)
    for item in GITIGNORE_MUST:
        if item not in gitignore:
            errors.append(f".gitignore does not ignore {item}")
else:
    errors.append("missing .gitignore")

# Operating-mode declaration: mode-parameterized rules read `project.mode`
# from .syntheprise-quality.yml; absent => rules default to team.
_quality_yml = ROOT / ".syntheprise-quality.yml"
if _quality_yml.exists():
    _mode_m = re.search(r"^\s*mode:\s*([A-Za-z]+)\s*(?:#.*)?$", read(_quality_yml), re.MULTILINE)
    if not _mode_m:
        warnings.append(".syntheprise-quality.yml missing project.mode (solo|team) — mode-parameterized rules default to team")
    elif _mode_m.group(1) not in {"solo", "team"}:
        errors.append(f"invalid project.mode in .syntheprise-quality.yml: {_mode_m.group(1)!r} (expected solo|team)")

# The "Canonical docs/ folder taxonomy" section in AGENTS.md declares the
# docs/ subfolders that must exist on disk — catches constitution drift like
# a declared-but-missing docs/_dashboard/. Only the taxonomy section is
# scanned so references elsewhere (e.g. docs/_baseline/, scaffolded on demand)
# do not trigger false positives.
_agents_md = ROOT / "AGENTS.md"
if _agents_md.exists():
    _agents_txt = read(_agents_md)
    _tax_m = re.search(
        r"##\s*\d+\.\s*Canonical docs/ folder taxonomy(.*?)(?:\n##\s|\Z)",
        _agents_txt, re.DOTALL,
    )
    if _tax_m:
        _declared_docs_dirs = set(
            re.findall(r"`docs/((?:_[a-z0-9_-]+|adr))/`", _tax_m.group(1))
        )
        for _d in sorted(_declared_docs_dirs):
            if not (ROOT / "docs" / _d).is_dir():
                errors.append(
                    f"AGENTS.md folder taxonomy declares docs/{_d}/ but it does not exist on disk"
                )

# Stack-pack registry integrity (framework repo only): each presets/stacks/<name>/
# must declare the required manifest keys and ship a runnable skeleton/.
_stacks_dir = ROOT / "presets" / "stacks"
if _stacks_dir.is_dir():
    _required_stack_keys = ("name", "language", "description", "default_tier", "run")
    for _pack in sorted(p for p in _stacks_dir.iterdir() if p.is_dir()):
        _mf = _pack / "manifest.yaml"
        if not _mf.exists():
            errors.append(f"stack pack {_pack.name} missing manifest.yaml")
            continue
        _mtext = read(_mf)
        for _k in _required_stack_keys:
            if not re.search(rf"(?m)^{_k}:\s*\S", _mtext):
                errors.append(f"stack pack {_pack.name}: manifest.yaml missing key '{_k}'")
        if not (_pack / "skeleton").is_dir():
            errors.append(f"stack pack {_pack.name}: missing runnable skeleton/ directory")

# Composable v2 registry integrity (CR-2026-014). Validation is delegated to
# the same dependency-free kernel the CLI uses so local and CI semantics cannot
# drift. An empty v2 catalog is valid during the staged v6 migration.
_components_dir = ROOT / "presets" / "components"
_blueprints_dir = ROOT / "presets" / "blueprints"
if _components_dir.is_dir() or _blueprints_dir.is_dir():
    try:
        import stack_composition as _stack_composition
        _v2_components = _stack_composition.discover_components(_components_dir)
        _v2_blueprints = _stack_composition.discover_blueprints(_blueprints_dir)
        for _blueprint_id, _blueprint in _v2_blueprints.items():
            try:
                _stack_composition.resolve_blueprint(
                    _v2_components, _v2_blueprints, _blueprint_id
                )
            except _stack_composition.StackError as _exc:
                errors.append(f"blueprint {_blueprint_id}: {_exc}")
    except Exception as _exc:
        errors.append(f"composable stack registry invalid: {_exc}")

# Quality gate subprocess checks
if args.quality_gate:
    # Verify today's state snapshot exists to prevent forgetting (supports
    # multiple sessions with suffixes like _1, _2). The snapshot prefix is
    # generic (`state_`) and can be overridden via SYNTHEPRISE_STATE_PREFIX.
    from datetime import datetime
    _state_prefix = os.environ.get("SYNTHEPRISE_STATE_PREFIX", "state_")
    today_str = datetime.now().strftime("%Y-%m-%d")
    state_dir = ROOT / "docs" / "_states"
    has_today_state = False
    if state_dir.exists():
        for p in state_dir.glob(f"{_state_prefix}*.md"):
            if p.name.startswith(f"{_state_prefix}{today_str}"):
                has_today_state = True
                break
    if not has_today_state:
        # The state snapshot gates the CHANGE-ARCHIVE step (see AGENTS.md DoD and
        # change-management.md), not every quality-gate run. Warn by default so a
        # routine `syntheprise gate` is usable; set SYNTHEPRISE_REQUIRE_STATE_SNAPSHOT=1 (e.g.
        # during close-out) to make a missing snapshot fatal.
        _msg = f"no state snapshot for today: docs/_states/{_state_prefix}{today_str}*.md — required before change-archive/close-out."
        if os.environ.get("SYNTHEPRISE_REQUIRE_STATE_SNAPSHOT") == "1":
            errors.append(_msg)
        else:
            warnings.append(_msg)

    # Research notes must be committed: untracked files under docs/_research/ are
    # unrecoverable from git and are easily lost. Warn (fatal in strict/gate).
    if (ROOT / "docs" / "_research").exists():
        try:
            res = subprocess.run(["git", "status", "--porcelain", "--", "docs/_research"],
                                 cwd=ROOT, text=True, capture_output=True, timeout=30)
            for line in res.stdout.splitlines():
                if line.startswith("??"):
                    warnings.append(f"uncommitted research note — commit to preserve: {line[3:].strip()}")
        except Exception:
            pass

    for cmd in ([sys.executable, "scripts/check-traceability.py"],
                [sys.executable, "scripts/check-doc-drift.py"],
                [sys.executable, "scripts/check-version-consistency.py"],
                [sys.executable, "scripts/syntheprise_sync.py", "--check"],
                [sys.executable, "scripts/check-secrets.py"],
                [sys.executable, "scripts/check-dependencies.py"],
                [sys.executable, "scripts/check-coverage.py"]):
        try:
            res = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, timeout=60)
            if res.returncode != 0:
                errors.append(f"quality subcheck failed: {' '.join(cmd)}\n{res.stdout}{res.stderr}")
        except Exception as ex:
            errors.append(f"quality subcheck error: {' '.join(cmd)} — {ex}")

print("Syntheprise Framework doctor — repo health check\n" + "=" * 38)
for e in errors:
    print(f"  ERROR  {e}")
for w in sorted(set(warnings)):
    print(f"  warn   {w}")

fail = bool(errors) or (STRICT and bool(warnings))
if not errors and not warnings:
    print("  OK — clean.")
else:
    if TEMPLATE:
        note = " (template mode: placeholders allowed)"
    elif STRICT:
        note = " (strict/quality-gate: warnings count as errors)"
    else:
        note = " (use --strict after project initialization)"
    print(f"\n{len(errors)} error(s), {len(set(warnings))} warning(s).{note}")
sys.exit(1 if fail else 0)
