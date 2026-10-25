import importlib.util
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "component_lifecycle", REPO / "scripts" / "component_lifecycle.py"
)
component_lifecycle = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(component_lifecycle)
WORKFLOW_SPEC = importlib.util.spec_from_file_location(
    "workflow_security", REPO / "scripts" / "check-workflow-security.py"
)
workflow_security = importlib.util.module_from_spec(WORKFLOW_SPEC)
WORKFLOW_SPEC.loader.exec_module(workflow_security)


class ComponentLifecycleTests(unittest.TestCase):
    def test_repository_catalog_is_current_and_supported(self):
        report = component_lifecycle.check_catalog(
            REPO / "presets" / "components",
            REPO / "presets" / "blueprints",
            REPO / "presets" / "components" / "lifecycle-policy.json",
            REPO / "presets" / "security-exceptions.json",
            today=date(2026, 7, 26),
        )
        self.assertEqual(report["errors"], [])
        self.assertEqual(report["component_count"], 13)
        self.assertEqual(report["certified_blueprint_count"], 5)

    def test_stale_and_eol_components_fail_closed(self):
        policy = {
            "component_verification_max_age_days": 30,
            "blueprint_verification_max_age_days": 14,
            "security_exception_max_days": 90,
        }
        stale = {
            "id": "backend.stale",
            "last_verified": "2026-01-01",
            "lifecycle": {
                "status": "supported",
                "support_until": None,
                "replacement": None,
                "evidence": "https://example.test/releases",
            },
        }
        findings = component_lifecycle.evaluate_component(
            stale, policy, date(2026, 7, 26)
        )
        self.assertEqual({item["code"] for item in findings}, {"stale-verification"})

        stale["lifecycle"].update(
            status="eol",
            support_until="2026-07-01",
            replacement="backend.current",
        )
        findings = component_lifecycle.evaluate_component(
            stale, policy, date(2026, 7, 26)
        )
        self.assertIn("unsupported-component", {item["code"] for item in findings})

    def test_security_exceptions_require_owner_reason_and_valid_expiry(self):
        policy = {"security_exception_max_days": 90}
        invalid = {
            "schema_version": 1,
            "exceptions": [{
                "id": "SEC-1",
                "target": "backend.node",
                "advisory": "CVE-TEST",
                "owner": "",
                "reason": "",
                "created_on": "2026-01-01",
                "expires_on": "2026-07-01",
            }],
        }
        findings = component_lifecycle.validate_security_exceptions(
            invalid, policy, date(2026, 7, 26)
        )
        codes = {item["code"] for item in findings}
        self.assertIn("invalid-exception", codes)
        self.assertIn("expired-exception", codes)
        self.assertIn("exception-too-long", codes)

    def test_checker_output_is_deterministic(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "exceptions.json"
            path.write_text(
                json.dumps({"schema_version": 1, "exceptions": []}),
                encoding="utf-8",
            )
            first = component_lifecycle.validate_security_exceptions(
                json.loads(path.read_text()),
                {"security_exception_max_days": 90},
                date(2026, 7, 26),
            )
            second = component_lifecycle.validate_security_exceptions(
                json.loads(path.read_text()),
                {"security_exception_max_days": 90},
                date(2026, 7, 26),
            )
            self.assertEqual(first, second)

    def test_workflow_security_rejects_floating_ref_and_missing_permissions(self):
        with tempfile.TemporaryDirectory() as d:
            workflow = Path(d) / "unsafe.yml"
            workflow.write_text(
                "name: unsafe\n"
                "on: push\n"
                "jobs:\n"
                "  test:\n"
                "    steps:\n"
                "      - uses: vendor/action@main\n",
                encoding="utf-8",
            )
            findings = workflow_security.findings_for(workflow)
            self.assertTrue(any("permissions" in item for item in findings))
            self.assertTrue(any("floating ref" in item for item in findings))


if __name__ == "__main__":
    unittest.main()
