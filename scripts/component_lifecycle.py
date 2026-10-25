#!/usr/bin/env python3
"""Offline, deterministic lifecycle policy for v2 components and blueprints."""
from __future__ import annotations

import json
import importlib.util
from datetime import date
from pathlib import Path
from typing import Any

try:
    import stack_composition
except ModuleNotFoundError:
    _STACK_SPEC = importlib.util.spec_from_file_location(
        "stack_composition", Path(__file__).with_name("stack_composition.py")
    )
    stack_composition = importlib.util.module_from_spec(_STACK_SPEC)
    _STACK_SPEC.loader.exec_module(stack_composition)


def _finding(code: str, subject: str, message: str) -> dict[str, str]:
    return {"code": code, "subject": subject, "message": message}


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return value


def _as_date(value: Any, field: str) -> date:
    if not isinstance(value, str):
        raise ValueError(f"{field} must be an ISO date")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field} must be an ISO date") from exc
    if parsed.isoformat() != value:
        raise ValueError(f"{field} must be an ISO date")
    return parsed


def load_policy(path: Path) -> dict[str, int]:
    data = _read_json(path)
    if data.get("schema_version") != 1:
        raise ValueError("lifecycle policy schema_version must be 1")
    result: dict[str, int] = {}
    for key in (
        "component_verification_max_age_days",
        "blueprint_verification_max_age_days",
        "security_exception_max_days",
    ):
        value = data.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or value < 1:
            raise ValueError(f"{key} must be a positive integer")
        result[key] = value
    return result


def evaluate_component(
    component: dict[str, Any], policy: dict[str, int], today: date
) -> list[dict[str, str]]:
    component_id = str(component.get("id", "(unknown)"))
    findings: list[dict[str, str]] = []
    try:
        verified = _as_date(
            component.get("last_verified"), f"{component_id}.last_verified"
        )
    except ValueError as exc:
        return [_finding("invalid-verification-date", component_id, str(exc))]
    age = (today - verified).days
    if age < 0 or age > policy["component_verification_max_age_days"]:
        findings.append(_finding(
            "stale-verification",
            component_id,
            f"last_verified is {age} day(s) from policy date; refresh official evidence",
        ))
    lifecycle = component.get("lifecycle", {})
    status = lifecycle.get("status")
    if status == "eol":
        findings.append(_finding(
            "unsupported-component",
            component_id,
            f"component is EOL; use {lifecycle.get('replacement')}",
        ))
    support_until = lifecycle.get("support_until")
    if support_until:
        try:
            support_date = _as_date(
                support_until, f"{component_id}.lifecycle.support_until"
            )
        except ValueError as exc:
            findings.append(_finding(
                "invalid-support-date", component_id, str(exc)
            ))
        else:
            if support_date < today:
                findings.append(_finding(
                    "support-window-ended",
                    component_id,
                    f"support ended {support_date.isoformat()}",
                ))
    return findings


def validate_security_exceptions(
    data: dict[str, Any], policy: dict[str, int], today: date
) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    if data.get("schema_version") != 1 or not isinstance(
        data.get("exceptions"), list
    ):
        return [_finding(
            "invalid-exception-file",
            "security-exceptions",
            "schema_version must be 1 and exceptions must be an array",
        )]
    seen: set[str] = set()
    for index, item in enumerate(data["exceptions"]):
        subject = f"exceptions[{index}]"
        if not isinstance(item, dict):
            findings.append(_finding(
                "invalid-exception", subject, "entry must be an object"
            ))
            continue
        exception_id = item.get("id")
        if not isinstance(exception_id, str) or not exception_id.strip():
            findings.append(_finding(
                "invalid-exception", subject, "id is required"
            ))
        elif exception_id in seen:
            findings.append(_finding(
                "invalid-exception", exception_id, "id must be unique"
            ))
        else:
            seen.add(exception_id)
            subject = exception_id
        required = ("target", "advisory", "owner", "reason")
        if any(
            not isinstance(item.get(field), str) or not item[field].strip()
            for field in required
        ):
            findings.append(_finding(
                "invalid-exception",
                subject,
                "target, advisory, owner and reason are required",
            ))
        try:
            created = _as_date(item.get("created_on"), f"{subject}.created_on")
            expires = _as_date(item.get("expires_on"), f"{subject}.expires_on")
        except ValueError as exc:
            findings.append(_finding(
                "invalid-exception", subject, str(exc)
            ))
            continue
        if expires < today:
            findings.append(_finding(
                "expired-exception",
                subject,
                f"expired on {expires.isoformat()}",
            ))
        if (expires - created).days > policy["security_exception_max_days"]:
            findings.append(_finding(
                "exception-too-long",
                subject,
                "exception duration exceeds policy",
            ))
    return findings


def check_catalog(
    components_root: Path,
    blueprints_root: Path,
    policy_path: Path,
    exceptions_path: Path,
    *,
    today: date | None = None,
) -> dict[str, Any]:
    policy_date = today or date.today()
    policy = load_policy(policy_path)
    components = stack_composition.discover_components(components_root)
    blueprints = stack_composition.discover_blueprints(blueprints_root)
    errors: list[dict[str, str]] = []
    for component_id in sorted(components):
        errors.extend(evaluate_component(
            components[component_id], policy, policy_date
        ))
    certified = [
        item for item in blueprints.values()
        if item["certification"]["status"] == "certified"
    ]
    for blueprint in sorted(certified, key=lambda item: item["id"]):
        subject = blueprint["id"]
        try:
            verified = _as_date(
                blueprint["certification"]["last_verified"],
                f"{subject}.certification.last_verified",
            )
        except ValueError as exc:
            errors.append(_finding(
                "invalid-certification-date", subject, str(exc)
            ))
            continue
        age = (policy_date - verified).days
        if age < 0 or age > policy["blueprint_verification_max_age_days"]:
            errors.append(_finding(
                "stale-certification",
                subject,
                f"certification is {age} day(s) from policy date",
            ))
    errors.extend(validate_security_exceptions(
        _read_json(exceptions_path), policy, policy_date
    ))
    errors.sort(key=lambda item: (
        item["subject"], item["code"], item["message"]
    ))
    return {
        "schema_version": 1,
        "policy_date": policy_date.isoformat(),
        "component_count": len(components),
        "certified_blueprint_count": len(certified),
        "errors": errors,
    }
