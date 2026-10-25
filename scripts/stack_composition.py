#!/usr/bin/env python3
"""Dependency-free composable stack-pack kernel (CR-2026-014).

The module is deliberately independent from the CLI so resolver and
materialization behavior can be tested without creating complete framework
projects. Public data returned by the module is JSON-compatible except for the
private ``_pack_dir`` field attached to resolved components.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import date
from pathlib import Path, PurePosixPath
from typing import Any

SCHEMA_VERSION = 2
ROLES = ("backend", "web", "mobile", "contract", "infra")
APP_ROLES = ("backend", "web", "mobile")
ROLE_ORDER = {role: index for index, role in enumerate(ROLES)}
REQUIRED_COMMANDS = ("dev", "build", "test")
LIFECYCLE_STATUSES = ("supported", "maintenance", "deprecated", "eol")
TOOL_NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._+-]*$")


class StackError(ValueError):
    """Base error with a stable machine-readable code."""

    def __init__(self, code: str, message: str, *, source: Path | None = None):
        self.code = code
        self.source = source
        suffix = f" ({source})" if source else ""
        super().__init__(f"{code}: {message}{suffix}")


class StackValidationError(StackError):
    pass


class StackResolutionError(StackError):
    pass


class StackMaterializationError(StackError):
    pass


def _read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise StackValidationError(
            "invalid-json", f"cannot read JSON manifest: {exc}", source=path
        ) from exc
    if not isinstance(data, dict):
        raise StackValidationError(
            "invalid-manifest", "manifest root must be an object", source=path
        )
    return data


def _required_string(data: dict[str, Any], key: str, source: Path) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise StackValidationError(
            "missing-field", f"'{key}' must be a non-empty string", source=source
        )
    return value.strip()


def _string_list(data: dict[str, Any], key: str, source: Path) -> list[str]:
    value = data.get(key, [])
    if not isinstance(value, list) or any(
        not isinstance(item, str) or not item.strip() for item in value
    ):
        raise StackValidationError(
            "invalid-field", f"'{key}' must be an array of strings", source=source
        )
    return [item.strip() for item in value]


def _required_tools(data: dict[str, Any], source: Path) -> list[str]:
    value = data.get("required_tools", [])
    if not isinstance(value, list) or any(
        not isinstance(item, str) or not item.strip() for item in value
    ):
        raise StackValidationError(
            "invalid-required-tools",
            "'required_tools' must be an array of non-empty strings",
            source=source,
        )
    normalized = [item.strip() for item in value]
    unsafe = [item for item in normalized if not TOOL_NAME_PATTERN.fullmatch(item)]
    if unsafe:
        raise StackValidationError(
            "unsafe-required-tool",
            "required tool names must be executable names without whitespace "
            "or shell syntax",
            source=source,
        )
    if len(normalized) != len(set(normalized)):
        raise StackValidationError(
            "duplicate-required-tool",
            "'required_tools' must contain unique executable names",
            source=source,
        )
    return sorted(normalized)


def _safe_output(value: str, source: Path) -> str:
    if "\\" in value:
        raise StackValidationError(
            "unsafe-output", "output path must use POSIX separators", source=source
        )
    path = PurePosixPath(value)
    if path.is_absolute() or value in ("", ".") or ".." in path.parts:
        raise StackValidationError(
            "unsafe-output",
            "output must be a non-empty relative path without '..'",
            source=source,
        )
    return path.as_posix().rstrip("/")


def _safe_overlay(value: str, source: Path) -> str:
    try:
        return _safe_output(value, source)
    except StackValidationError as exc:
        raise StackValidationError(
            "unsafe-overlay",
            "overlay must be a non-empty relative path without '..'",
            source=source,
        ) from exc


def _iso_date(value: Any, field: str, source: Path) -> str:
    if not isinstance(value, str):
        raise StackValidationError(
            "invalid-date", f"'{field}' must be an ISO date", source=source
        )
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise StackValidationError(
            "invalid-date", f"'{field}' must be an ISO date", source=source
        ) from exc
    if parsed.isoformat() != value:
        raise StackValidationError(
            "invalid-date", f"'{field}' must be an ISO date", source=source
        )
    return value


def _component_lifecycle(data: dict[str, Any], source: Path) -> dict[str, Any]:
    lifecycle = data.get("lifecycle")
    if not isinstance(lifecycle, dict):
        raise StackValidationError(
            "missing-lifecycle",
            "'lifecycle' must be an object",
            source=source,
        )
    status = lifecycle.get("status")
    if status not in LIFECYCLE_STATUSES:
        raise StackValidationError(
            "invalid-lifecycle-status",
            f"lifecycle.status must be one of {', '.join(LIFECYCLE_STATUSES)}",
            source=source,
        )
    support_until = lifecycle.get("support_until")
    if support_until is not None:
        support_until = _iso_date(
            support_until, "lifecycle.support_until", source
        )
    replacement = lifecycle.get("replacement")
    if replacement is not None and (
        not isinstance(replacement, str) or not replacement.strip()
    ):
        raise StackValidationError(
            "invalid-replacement",
            "lifecycle.replacement must be null or a component id",
            source=source,
        )
    if status in ("deprecated", "eol") and not replacement:
        raise StackValidationError(
            "missing-replacement",
            "deprecated/EOL components require lifecycle.replacement",
            source=source,
        )
    evidence = lifecycle.get("evidence")
    if not isinstance(evidence, str) or not evidence.startswith("https://"):
        raise StackValidationError(
            "invalid-lifecycle-evidence",
            "lifecycle.evidence must be an HTTPS official-source URL",
            source=source,
        )
    return {
        "status": status,
        "support_until": support_until,
        "replacement": replacement.strip() if replacement else None,
        "evidence": evidence,
    }


def _source_files(
    root: Path, *, missing_code: str = "missing-source"
) -> list[tuple[Path, PurePosixPath]]:
    if root.is_symlink() or not root.is_dir():
        raise StackValidationError(
            missing_code, "source directory is missing or unsafe", source=root
        )
    files: list[tuple[Path, PurePosixPath]] = []
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise StackValidationError(
                "unsafe-source", "source trees may not contain symlinks", source=path
            )
        if path.is_file():
            files.append((path, PurePosixPath(path.relative_to(root).as_posix())))
    return files


def validate_component(data: dict[str, Any], source: Path) -> dict[str, Any]:
    if data.get("schema_version") != SCHEMA_VERSION:
        raise StackValidationError(
            "unsupported-schema",
            f"schema_version must be {SCHEMA_VERSION}",
            source=source,
        )
    if data.get("kind") != "component":
        raise StackValidationError(
            "invalid-kind", "component manifest kind must be 'component'", source=source
        )
    component_id = _required_string(data, "id", source)
    role = _required_string(data, "role", source)
    if role not in ROLES:
        raise StackValidationError(
            "unsupported-role", f"unsupported component role '{role}'", source=source
        )
    if not component_id.startswith(role + "."):
        raise StackValidationError(
            "invalid-id",
            f"component id must start with '{role}.'",
            source=source,
        )
    output = _safe_output(_required_string(data, "output", source), source)
    version_policy = _required_string(data, "version_policy", source)
    if version_policy != "current-stable":
        raise StackValidationError(
            "unsupported-version-policy",
            "v6 components must use version_policy 'current-stable'",
            source=source,
        )
    commands = data.get("commands")
    if not isinstance(commands, dict):
        raise StackValidationError(
            "invalid-commands", "'commands' must be an object", source=source
        )
    normalized_commands: dict[str, str] = {}
    for command in REQUIRED_COMMANDS:
        value = commands.get(command)
        if not isinstance(value, str) or not value.strip():
            raise StackValidationError(
                "missing-command",
                f"commands.{command} must be a non-empty string",
                source=source,
            )
        normalized_commands[command] = value.strip()
    ports = data.get("ports", [])
    if (
        not isinstance(ports, list)
        or any(not isinstance(port, int) or isinstance(port, bool)
               or port < 1 or port > 65535 for port in ports)
        or len(set(ports)) != len(ports)
    ):
        raise StackValidationError(
            "invalid-ports",
            "'ports' must contain unique integers between 1 and 65535",
            source=source,
        )
    contracts = data.get("contracts", {})
    if not isinstance(contracts, dict):
        raise StackValidationError(
            "invalid-contracts", "'contracts' must be an object", source=source
        )
    provides = _string_list(contracts, "provides", source)
    requires = _string_list(contracts, "requires", source)
    normalized = dict(data)
    normalized.update(
        {
            "id": component_id,
            "role": role,
            "output": output,
            "version": _required_string(data, "version", source),
            "owner": _required_string(data, "owner", source),
            "last_verified": _iso_date(
                _required_string(data, "last_verified", source),
                "last_verified",
                source,
            ),
            "lifecycle": _component_lifecycle(data, source),
            "version_policy": version_policy,
            "capabilities": _string_list(data, "capabilities", source),
            "commands": normalized_commands,
            "required_tools": _required_tools(data, source),
            "ports": list(ports),
            "contracts": {"provides": provides, "requires": requires},
        }
    )
    return normalized


def discover_components(root: Path) -> dict[str, dict[str, Any]]:
    registry: dict[str, dict[str, Any]] = {}
    if not root.is_dir():
        return registry
    for manifest_path in sorted(root.glob("*/*/manifest.json")):
        manifest = validate_component(_read_json(manifest_path), manifest_path)
        component_id = manifest["id"]
        if component_id in registry:
            raise StackValidationError(
                "duplicate-id",
                f"duplicate component id '{component_id}'",
                source=manifest_path,
            )
        manifest["_pack_dir"] = manifest_path.parent
        registry[component_id] = manifest
    return registry


def validate_blueprint(data: dict[str, Any], source: Path) -> dict[str, Any]:
    if data.get("schema_version") != SCHEMA_VERSION:
        raise StackValidationError(
            "unsupported-schema",
            f"schema_version must be {SCHEMA_VERSION}",
            source=source,
        )
    if data.get("kind") != "blueprint":
        raise StackValidationError(
            "invalid-kind", "blueprint manifest kind must be 'blueprint'", source=source
        )
    blueprint_id = _required_string(data, "id", source)
    components = _string_list(data, "components", source)
    if not components:
        raise StackValidationError(
            "missing-components",
            "blueprint must reference at least one component",
            source=source,
        )
    overlay_value = data.get("overlay")
    if overlay_value is not None and (
        not isinstance(overlay_value, str) or not overlay_value.strip()
    ):
        raise StackValidationError(
            "invalid-overlay",
            "'overlay' must be a non-empty relative path",
            source=source,
        )
    overlay = (
        _safe_overlay(overlay_value.strip(), source)
        if isinstance(overlay_value, str)
        else None
    )
    certification = data.get("certification", {})
    if not isinstance(certification, dict):
        raise StackValidationError(
            "invalid-certification",
            "'certification' must be an object",
            source=source,
        )
    status = certification.get("status", "experimental")
    if status not in ("experimental", "certified"):
        status = "experimental"
    if status == "certified" and not (
        isinstance(certification.get("last_verified"), str)
        and certification["last_verified"].strip()
        and isinstance(certification.get("evidence"), str)
        and certification["evidence"].strip()
    ):
        status = "experimental"
    normalized = dict(data)
    normalized["id"] = blueprint_id
    normalized["components"] = components
    normalized["overlay"] = overlay
    normalized["certification"] = {
        "status": status,
        "last_verified": certification.get("last_verified"),
        "evidence": certification.get("evidence"),
    }
    return normalized


def discover_blueprints(root: Path) -> dict[str, dict[str, Any]]:
    registry: dict[str, dict[str, Any]] = {}
    if not root.is_dir():
        return registry
    for manifest_path in sorted(root.glob("*/manifest.json")):
        manifest = validate_blueprint(_read_json(manifest_path), manifest_path)
        blueprint_id = manifest["id"]
        if blueprint_id in registry:
            raise StackValidationError(
                "duplicate-id",
                f"duplicate blueprint id '{blueprint_id}'",
                source=manifest_path,
            )
        manifest["_pack_dir"] = manifest_path.parent
        overlay = manifest.get("overlay")
        if overlay:
            overlay_dir = manifest_path.parent / PurePosixPath(overlay)
            files = _source_files(overlay_dir, missing_code="missing-overlay")
            manifest["_overlay_dir"] = overlay_dir
            manifest["overlay_files"] = [
                relative.as_posix() for _, relative in files
            ]
        else:
            manifest["overlay_files"] = []
        registry[blueprint_id] = manifest
    return registry


def select_component(
    registry: dict[str, dict[str, Any]], role: str, selector: str
) -> str:
    direct = selector if "." in selector else f"{role}.{selector}"
    manifest = registry.get(direct)
    if manifest is None or manifest["role"] != role:
        available = sorted(
            component_id for component_id, item in registry.items()
            if item["role"] == role
        )
        raise StackResolutionError(
            "unknown-component",
            f"unknown {role} component '{selector}'; available: "
            + (", ".join(available) or "(none)"),
        )
    return direct


def _paths_overlap(first: str, second: str) -> bool:
    a = PurePosixPath(first).parts
    b = PurePosixPath(second).parts
    return a == b or a == b[:len(a)] or b == a[:len(b)]


def resolve_plan(
    registry: dict[str, dict[str, Any]],
    component_ids: list[str],
    *,
    blueprint: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if len(component_ids) != len(set(component_ids)):
        raise StackResolutionError(
            "duplicate-component", "the same component was selected more than once"
        )
    missing = sorted(set(component_ids) - set(registry))
    if missing:
        raise StackResolutionError(
            "unknown-component", "unknown component(s): " + ", ".join(missing)
        )
    components = [dict(registry[item]) for item in component_ids]
    roles = [item["role"] for item in components]
    if roles.count("backend") != 1:
        code = "missing-backend" if "backend" not in roles else "duplicate-role"
        raise StackResolutionError(code, "composition requires exactly one backend")
    for role in ("web", "mobile"):
        if roles.count(role) > 1:
            raise StackResolutionError(
                "duplicate-role", f"composition allows at most one {role} component"
            )
    for index, first in enumerate(components):
        for second in components[index + 1:]:
            if _paths_overlap(first["output"], second["output"]):
                raise StackResolutionError(
                    "path-collision",
                    f"{first['id']}:{first['output']} overlaps "
                    f"{second['id']}:{second['output']}",
                )
    port_owner: dict[int, str] = {}
    for component in components:
        for port in component["ports"]:
            if port in port_owner:
                raise StackResolutionError(
                    "port-collision",
                    f"port {port} is declared by {port_owner[port]} and {component['id']}",
                )
            port_owner[port] = component["id"]
    provides = {
        capability
        for component in components
        for capability in component["contracts"]["provides"]
    }
    requires = {
        capability
        for component in components
        for capability in component["contracts"]["requires"]
    }
    unresolved = sorted(requires - provides)
    if unresolved:
        raise StackResolutionError(
            "missing-capability",
            "unresolved contract capabilities: " + ", ".join(unresolved),
        )
    components.sort(key=lambda item: (ROLE_ORDER[item["role"]], item["id"]))
    required_tools = sorted({
        tool
        for component in components
        for tool in component["required_tools"]
    })
    plan = {
        "schema_version": 1,
        "kind": "stack-plan",
        "blueprint": blueprint["id"] if blueprint else None,
        "certification": (
            blueprint.get("certification", {}).get("status", "experimental")
            if blueprint else "experimental"
        ),
        "components": components,
        "overlay_files": (
            list(blueprint.get("overlay_files", [])) if blueprint else []
        ),
        "ports": sorted(port_owner),
        "required_tools": required_tools,
        "contracts": {
            "provides": sorted(provides),
            "requires": sorted(requires),
        },
    }
    if blueprint and blueprint.get("_overlay_dir"):
        plan["_overlay_dir"] = blueprint["_overlay_dir"]
    return plan


def resolve_blueprint(
    components: dict[str, dict[str, Any]],
    blueprints: dict[str, dict[str, Any]],
    blueprint_id: str,
) -> dict[str, Any]:
    blueprint = blueprints.get(blueprint_id)
    if blueprint is None:
        raise StackResolutionError(
            "unknown-blueprint",
            f"unknown blueprint '{blueprint_id}'; available: "
            + (", ".join(sorted(blueprints)) or "(none)"),
        )
    return resolve_plan(
        components, list(blueprint["components"]), blueprint=blueprint
    )


def _public_plan(plan: dict[str, Any]) -> dict[str, Any]:
    public = {
        key: value for key, value in plan.items()
        if not key.startswith("_")
    }
    public["components"] = []
    for component in plan["components"]:
        item = {key: value for key, value in component.items()
                if not key.startswith("_")}
        public["components"].append(item)
    return public


def plan_json(plan: dict[str, Any]) -> str:
    return json.dumps(_public_plan(plan), indent=2, sort_keys=True) + "\n"


def render_docs(plan: dict[str, Any], target: Path) -> None:
    """Render deterministic component fragments into canonical stack docs."""
    specs = (
        ("architecture.md", "Composed Stack Architecture"),
        ("tech-stack.md", "Composed Stack Technology"),
    )
    docs_dir = target / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    for filename, title in specs:
        fragments: list[tuple[str, str]] = []
        for component in plan["components"]:
            fragment = Path(component["_pack_dir"]) / "docs" / filename
            if fragment.is_file():
                fragments.append(
                    (component["id"], fragment.read_text(encoding="utf-8").strip())
                )
        if not fragments:
            continue
        destination = docs_dir / filename
        existing = (
            destination.read_text(encoding="utf-8").rstrip()
            if destination.is_file() else ""
        )
        lines = [existing, "", f"## {title}", ""] if existing else [
            f"# {title}", ""
        ]
        for component_id, content in fragments:
            lines.extend((f"### {component_id}", "", content, ""))
        destination.write_text(
            "\n".join(lines).rstrip() + "\n", encoding="utf-8"
        )


def materialize_plan(plan: dict[str, Any], target: Path) -> None:
    """Copy a resolved plan and write a lock.

    The caller owns whole-project atomic staging. This function still performs
    a complete collision preflight before its first write.
    """
    copies: list[tuple[Path, Path]] = []
    destinations: dict[Path, Path] = {}

    def register_copy(source: Path, destination: Path) -> None:
        if source.is_symlink():
            raise StackMaterializationError(
                "unsafe-source", "refusing to copy a symlink", source=source
            )
        for owned, owner in destinations.items():
            if (
                destination == owned
                or destination in owned.parents
                or owned in destination.parents
            ):
                raise StackMaterializationError(
                    "file-collision",
                    f"{source} collides with {owner} at "
                    f"{destination.relative_to(target)}",
                    source=source,
                )
        if destination.exists():
            raise StackMaterializationError(
                "file-collision",
                f"refusing to overwrite existing file "
                f"{destination.relative_to(target)}",
                source=destination,
            )
        parent = destination.parent
        while parent != target and target in parent.parents:
            if parent.exists() and not parent.is_dir():
                raise StackMaterializationError(
                    "file-collision",
                    f"existing file blocks output directory "
                    f"{parent.relative_to(target)}",
                    source=parent,
                )
            parent = parent.parent
        destinations[destination] = source
        copies.append((source, destination))

    for component in plan["components"]:
        root = Path(component["_pack_dir"]) / "skeleton"
        try:
            files = _source_files(root, missing_code="missing-skeleton")
        except StackValidationError as exc:
            raise StackMaterializationError(
                exc.code, str(exc), source=exc.source
            ) from exc
        output = target / PurePosixPath(component["output"])
        for source, relative in files:
            register_copy(source, output / relative)
    overlay_dir = plan.get("_overlay_dir")
    if overlay_dir:
        try:
            overlay_files = _source_files(
                Path(overlay_dir), missing_code="missing-overlay"
            )
        except StackValidationError as exc:
            raise StackMaterializationError(
                exc.code, str(exc), source=exc.source
            ) from exc
        for source, relative in overlay_files:
            register_copy(source, target / relative)
    for source, destination in copies:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    render_docs(plan, target)
    state_dir = target / ".syntheprise"
    state_dir.mkdir(parents=True, exist_ok=True)
    lock = {
        "schema_version": 1,
        "blueprint": plan.get("blueprint"),
        "certification": plan.get("certification", "experimental"),
        "components": [item["id"] for item in plan["components"]],
        "overlay_files": list(plan.get("overlay_files", [])),
        "ports": plan["ports"],
        "contracts": plan["contracts"],
    }
    (state_dir / "stack-lock.json").write_text(
        json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
