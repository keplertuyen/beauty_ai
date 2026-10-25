#!/usr/bin/env python3
"""Syntheprise Framework dependency hygiene checker.

This checker is intentionally offline and dependency-free. It flags obvious
risky version patterns. Use ecosystem scanners for real vulnerability data.
"""
from __future__ import annotations
from pathlib import Path
import argparse, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {'.git', 'node_modules', '.venv', 'venv', 'dist', 'build'}

findings = []

def skip(p: Path) -> bool:
    rel = p.relative_to(ROOT)
    return any(part in EXCLUDE_DIRS for part in rel.parts)

def check_package_json(p: Path):
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
    except Exception as ex:
        findings.append((p, 'invalid-json', str(ex)))
        return
    for section in ('dependencies', 'devDependencies', 'peerDependencies'):
        deps = data.get(section, {}) or {}
        for name, ver in deps.items():
            if not isinstance(ver, str):
                continue
            if ver in ('*', 'latest') or ver.startswith('file:') or ver.startswith('http:'):
                findings.append((p, 'risky-node-version', f'{section}.{name}={ver}'))

def check_requirements(p: Path):
    for i, raw in enumerate(p.read_text(encoding='utf-8', errors='ignore').splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith('#') or line.startswith('-r '):
            continue
        if any(line.startswith(prefix) for prefix in ('git+', 'http://')):
            findings.append((p, 'risky-python-source', f'line {i}: {line}'))
        # Allow common comparison operators, flag bare names.
        if re.match(r'^[A-Za-z0-9_.-]+\s*(?:#.*)?$', line):
            findings.append((p, 'unpinned-python-requirement', f'line {i}: {line}'))

def check_csproj(p: Path):
    text = p.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r'<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]*)")?', text):
        name, ver = m.group(1), m.group(2) or ''
        if not ver or ver in ('*', 'latest'):
            findings.append((p, 'risky-dotnet-version', f'{name}={ver or "missing"}'))

def _pyproject_top_level_deps(text: str) -> list[str]:
    """Collect top-level dependency names from a pyproject.toml.

    Supports both Poetry ([tool.poetry.dependencies]) and PEP 621
    ([project] dependencies = [...]) layouts, without a TOML parser.
    """
    names: list[str] = []
    section = None
    in_pep621_deps = False
    for raw in text.splitlines():
        s = raw.strip()
        if s.startswith('[') and s.endswith(']'):
            section = s.strip('[]')
            in_pep621_deps = False
            continue
        # Poetry table: name = "version"
        if section == 'tool.poetry.dependencies' and '=' in s and not s.startswith('#'):
            name = s.split('=', 1)[0].strip().strip('"')
            if name and name.lower() != 'python':
                names.append(name)
            continue
        # PEP 621: dependencies = [ "pkg>=1.0", ... ]
        if section == 'project':
            if s.startswith('dependencies') and '=' in s:
                in_pep621_deps = True
                s = s.split('=', 1)[1].strip()
            if in_pep621_deps:
                for m in re.findall(r'["\']([^"\']+)["\']', s):
                    name = re.split(r'[<>=!~\[\s;]', m, maxsplit=1)[0].strip()
                    if name:
                        names.append(name)
                if ']' in s:
                    in_pep621_deps = False
    return names


def _requirements_names(text: str) -> list[str]:
    names: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or line.startswith('-'):
            continue
        name = re.split(r'[<>=!~\[\s;]', line, maxsplit=1)[0].strip()
        if name:
            names.append(name)
    return names


def check_tech_stack_drift():
    """Top-level deps in discovered manifests must appear in docs/tech-stack.md.

    Inventory drift check (warn-only, consistent with the rest of this checker).
    Manifest discovery is generic: any pyproject.toml / package.json /
    requirements.txt found in the repo (outside excluded dirs) is inspected,
    rather than hardcoding a specific monorepo layout.
    """
    inventory_path = ROOT / 'docs' / 'tech-stack.md'
    if not inventory_path.exists():
        return
    inventory = inventory_path.read_text(encoding='utf-8').lower()
    names: list[str] = []
    for m in ROOT.rglob('*'):
        if not m.is_file() or skip(m):
            continue
        try:
            if m.name == 'pyproject.toml':
                names += _pyproject_top_level_deps(m.read_text(encoding='utf-8', errors='ignore'))
            elif m.name == 'package.json':
                data = json.loads(m.read_text(encoding='utf-8'))
                names += list((data.get('dependencies') or {}).keys())
            elif m.name in {'requirements.txt', 'requirements-dev.txt'}:
                names += _requirements_names(m.read_text(encoding='utf-8', errors='ignore'))
        except Exception:
            continue
    for name in sorted(set(names)):
        if name.lower() not in inventory:
            findings.append((inventory_path, 'tech-stack-drift',
                             f'top-level dep {name!r} missing from docs/tech-stack.md'))


for p in ROOT.rglob('*'):
    if not p.is_file() or skip(p):
        continue
    if p.name == 'package.json':
        check_package_json(p)
    elif p.name in {'requirements.txt', 'requirements-dev.txt'}:
        check_requirements(p)
    elif p.suffix == '.csproj':
        check_csproj(p)

check_tech_stack_drift()

parser = argparse.ArgumentParser()
parser.add_argument(
    '--strict',
    action='store_true',
    help='fail on risky dependency declarations (inventory drift remains advisory)',
)
args = parser.parse_args()

print('Syntheprise Framework dependency hygiene check')
print('=' * 34)
if findings:
    for p, kind, detail in findings[:80]:
        level = 'warn' if kind == 'tech-stack-drift' else 'ERROR'
        print(f'  {level} {kind}: {p.relative_to(ROOT)} — {detail}')
    blocking = [item for item in findings if item[1] != 'tech-stack-drift']
    if args.strict and blocking:
        print(f'\n{len(blocking)} risky dependency declaration(s) block strict mode.')
        sys.exit(1)
    print('\nDependency hygiene warnings found. Review before release; use native vulnerability scanners where available.')
    sys.exit(0)
print('  OK — no obvious dependency hygiene issues found.')
