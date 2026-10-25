"""Acceptance tests for CR-2026-014 composable stack kernel.

Stdlib-only. These tests intentionally construct packs in temporary directories
so registry behavior is proven without coupling the kernel to the eventual
production catalog.
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

REPO = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "stack_composition", REPO / "scripts" / "stack_composition.py"
)
stack_composition = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(stack_composition)


def write_component(root: Path, name: str, role: str, output: str, port: int,
                    *, provides=None, requires=None, required_tools=None) -> Path:
    pack = root / role / name
    (pack / "skeleton").mkdir(parents=True)
    (pack / "skeleton" / f"{name}.txt").write_text(name + "\n", encoding="utf-8")
    (pack / "docs").mkdir()
    (pack / "docs" / "architecture.md").write_text(
        f"{name} {role} architecture fragment.\n", encoding="utf-8"
    )
    (pack / "docs" / "tech-stack.md").write_text(
        f"{name} {role} technology fragment.\n", encoding="utf-8"
    )
    manifest = {
        "schema_version": 2,
        "id": f"{role}.{name}",
        "kind": "component",
        "role": role,
        "version": "1.0.0",
        "version_policy": "current-stable",
        "owner": "test",
        "last_verified": "2026-07-25",
        "lifecycle": {
            "status": "supported",
            "support_until": None,
            "replacement": None,
            "evidence": "https://example.test/releases",
        },
        "output": output,
        "capabilities": [f"{role}-app"],
        "commands": {
            "dev": f"run-{name}",
            "build": f"build-{name}",
            "test": f"test-{name}",
        },
        "required_tools": required_tools or [],
        "ports": [port],
        "contracts": {
            "provides": provides or [],
            "requires": requires or [],
        },
    }
    (pack / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    return pack


def write_blueprint(root: Path, name: str, components: list[str],
                    *, certified=False, overlay=False) -> Path:
    pack = root / name
    pack.mkdir(parents=True)
    manifest = {
        "schema_version": 2,
        "id": name,
        "kind": "blueprint",
        "components": components,
        "certification": {
            "status": "certified" if certified else "experimental",
            "last_verified": "2026-07-25" if certified else None,
            "evidence": "ci://test" if certified else None,
        },
    }
    if overlay:
        manifest["overlay"] = "overlay"
    (pack / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    if overlay:
        (pack / "overlay" / "scripts").mkdir(parents=True)
        (pack / "overlay" / "scripts" / "dev").write_text(
            "#!/bin/sh\n", encoding="utf-8"
        )
    return pack


class TestStackComposition(unittest.TestCase):
    def test_cli_json_error_has_stable_code_and_no_target(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "project"
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO / "scripts/syntheprise.py"),
                    "new",
                    str(target),
                    "--backend",
                    "does-not-exist",
                    "--plan",
                    "--json",
                ],
                cwd=REPO,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 2)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["error"]["code"], "unknown-component")
            self.assertFalse(target.exists())

    def test_valid_v2_component_is_auto_discovered(self):
        with tempfile.TemporaryDirectory() as d:
            components = Path(d) / "components"
            write_component(components, "api", "backend", "apps/api", 8080,
                            provides=["openapi"])
            found = stack_composition.discover_components(components)
            self.assertEqual(list(found), ["backend.api"])
            self.assertEqual(found["backend.api"]["output"], "apps/api")
            self.assertEqual(found["backend.api"]["required_tools"], [])

    def test_invalid_and_escaping_manifest_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            components = Path(d) / "components"
            pack = write_component(components, "api", "backend", "../escape", 8080)
            with self.assertRaises(stack_composition.StackValidationError) as ctx:
                stack_composition.discover_components(components)
            self.assertEqual(ctx.exception.code, "unsafe-output")
            self.assertIn(str(pack / "manifest.json"), str(ctx.exception))

    def test_required_tools_reject_invalid_unsafe_and_duplicate_values(self):
        with tempfile.TemporaryDirectory() as d:
            components = Path(d) / "components"
            pack = write_component(
                components, "api", "backend", "apps/api", 8080,
                required_tools=["python"],
            )
            path = pack / "manifest.json"
            baseline = json.loads(path.read_text())
            cases = (
                ("npm", "invalid-required-tools"),
                (["npm install"], "unsafe-required-tool"),
                (["npm", "npm"], "duplicate-required-tool"),
            )
            for required_tools, expected in cases:
                with self.subTest(required_tools=required_tools):
                    manifest = dict(baseline)
                    manifest["required_tools"] = required_tools
                    with self.assertRaises(
                        stack_composition.StackValidationError
                    ) as ctx:
                        stack_composition.validate_component(manifest, path)
                    self.assertEqual(ctx.exception.code, expected)

    def test_component_lifecycle_metadata_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            components = Path(d) / "components"
            pack = write_component(
                components, "api", "backend", "apps/api", 8080
            )
            path = pack / "manifest.json"
            manifest = json.loads(path.read_text())
            del manifest["lifecycle"]
            with self.assertRaises(stack_composition.StackValidationError) as ctx:
                stack_composition.validate_component(manifest, path)
            self.assertEqual(ctx.exception.code, "missing-lifecycle")

            manifest["lifecycle"] = {
                "status": "eol",
                "support_until": "2026-01-01",
                "replacement": None,
                "evidence": "https://example.test/eol",
            }
            with self.assertRaises(stack_composition.StackValidationError) as ctx:
                stack_composition.validate_component(manifest, path)
            self.assertEqual(ctx.exception.code, "missing-replacement")

    def test_resolves_backend_web_mobile_and_contract(self):
        with tempfile.TemporaryDirectory() as d:
            components = Path(d) / "components"
            write_component(components, "api", "backend", "apps/api", 8080,
                            provides=["openapi"],
                            required_tools=["python", "docker"])
            write_component(components, "web", "web", "apps/web", 5173,
                            requires=["openapi"],
                            required_tools=["npm", "docker"])
            write_component(components, "mobile", "mobile", "apps/mobile", 8081,
                            requires=["openapi"],
                            required_tools=["npm"])
            registry = stack_composition.discover_components(components)
            plan = stack_composition.resolve_plan(
                registry, ["backend.api", "web.web", "mobile.mobile"]
            )
            self.assertEqual([c["role"] for c in plan["components"]],
                             ["backend", "web", "mobile"])
            self.assertEqual(plan["ports"], [5173, 8080, 8081])
            self.assertEqual(
                plan["required_tools"], ["docker", "npm", "python"]
            )

    def test_duplicate_role_path_port_and_missing_contract_are_rejected(self):
        cases = (
            ("duplicate-role", [("a", "backend", "apps/a", 8080, [], []),
                                ("b", "backend", "apps/b", 8081, [], [])]),
            ("path-collision", [("api", "backend", "apps/shared", 8080, [], []),
                                ("web", "web", "apps/shared", 5173, [], [])]),
            ("port-collision", [("api", "backend", "apps/api", 8080, [], []),
                                ("web", "web", "apps/web", 8080, [], [])]),
            ("missing-capability", [("api", "backend", "apps/api", 8080, [], []),
                                    ("web", "web", "apps/web", 5173, [], ["openapi"])]),
        )
        for expected, rows in cases:
            with self.subTest(expected=expected), tempfile.TemporaryDirectory() as d:
                components = Path(d) / "components"
                ids = []
                for name, role, output, port, provides, requires in rows:
                    write_component(components, name, role, output, port,
                                    provides=provides, requires=requires)
                    ids.append(f"{role}.{name}")
                registry = stack_composition.discover_components(components)
                with self.assertRaises(stack_composition.StackResolutionError) as ctx:
                    stack_composition.resolve_plan(registry, ids)
                self.assertEqual(ctx.exception.code, expected)

    def test_blueprint_certification_requires_current_evidence(self):
        with tempfile.TemporaryDirectory() as d:
            blueprints = Path(d) / "blueprints"
            write_blueprint(blueprints, "good", ["backend.api"], certified=True)
            stale = write_blueprint(blueprints, "stale", ["backend.api"], certified=True)
            data = json.loads((stale / "manifest.json").read_text())
            data["certification"]["evidence"] = None
            (stale / "manifest.json").write_text(json.dumps(data), encoding="utf-8")
            found = stack_composition.discover_blueprints(blueprints)
            self.assertEqual(found["good"]["certification"]["status"], "certified")
            self.assertEqual(found["stale"]["certification"]["status"], "experimental")

    def test_blueprint_and_direct_selection_resolve_equivalent_component_graphs(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            components = base / "components"
            blueprints = base / "blueprints"
            selected = ["backend.api", "web.react", "mobile.react-native"]
            write_component(components, "api", "backend", "apps/api", 8080,
                            provides=["openapi"])
            write_component(components, "react", "web", "apps/web", 5173,
                            requires=["openapi"])
            write_component(
                components, "react-native", "mobile", "apps/mobile", 8081,
                requires=["openapi"],
            )
            write_blueprint(blueprints, "api-react-rn", selected, certified=True)

            component_registry = stack_composition.discover_components(components)
            direct = stack_composition.resolve_plan(component_registry, selected)
            from_blueprint = stack_composition.resolve_blueprint(
                component_registry,
                stack_composition.discover_blueprints(blueprints),
                "api-react-rn",
            )

            self.assertEqual(
                [item["id"] for item in direct["components"]],
                [item["id"] for item in from_blueprint["components"]],
            )
            self.assertEqual(direct["ports"], from_blueprint["ports"])
            self.assertEqual(direct["contracts"], from_blueprint["contracts"])
            self.assertIsNone(direct["blueprint"])
            self.assertEqual(from_blueprint["blueprint"], "api-react-rn")

    def test_blueprint_overlay_is_planned_and_materialized_safely(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            components = base / "components"
            blueprints = base / "blueprints"
            write_component(components, "api", "backend", "apps/api", 8080)
            blueprint_dir = write_blueprint(
                blueprints, "pilot", ["backend.api"], overlay=True
            )
            component_registry = stack_composition.discover_components(components)
            blueprint_registry = stack_composition.discover_blueprints(blueprints)
            plan = stack_composition.resolve_blueprint(
                component_registry, blueprint_registry, "pilot"
            )
            self.assertEqual(plan["overlay_files"], ["scripts/dev"])
            self.assertNotIn("_overlay_dir", json.loads(
                stack_composition.plan_json(plan)
            ))

            target = base / "target"
            target.mkdir()
            stack_composition.materialize_plan(plan, target)
            self.assertTrue((target / "scripts/dev").exists())

            (blueprint_dir / "overlay" / "apps/api").mkdir(parents=True)
            (blueprint_dir / "overlay" / "apps/api/api.txt").write_text(
                "collision\n", encoding="utf-8"
            )
            collision_plan = stack_composition.resolve_blueprint(
                component_registry,
                stack_composition.discover_blueprints(blueprints),
                "pilot",
            )
            untouched = base / "untouched"
            untouched.mkdir()
            with self.assertRaises(
                stack_composition.StackMaterializationError
            ) as ctx:
                stack_composition.materialize_plan(collision_plan, untouched)
            self.assertEqual(ctx.exception.code, "file-collision")
            self.assertEqual(list(untouched.iterdir()), [])

    def test_blueprint_overlay_rejects_unsafe_paths_and_symlinks(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            blueprints = base / "blueprints"
            escaping = write_blueprint(
                blueprints, "escaping", ["backend.api"], overlay=True
            )
            manifest = json.loads((escaping / "manifest.json").read_text())
            manifest["overlay"] = "../outside"
            (escaping / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaises(stack_composition.StackValidationError) as ctx:
                stack_composition.discover_blueprints(blueprints)
            self.assertEqual(ctx.exception.code, "unsafe-overlay")

        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            blueprints = base / "blueprints"
            pack = write_blueprint(
                blueprints, "symlink", ["backend.api"], overlay=True
            )
            outside = base / "outside.txt"
            outside.write_text("outside\n", encoding="utf-8")
            (pack / "overlay" / "escape").symlink_to(outside)
            with self.assertRaises(stack_composition.StackValidationError) as ctx:
                stack_composition.discover_blueprints(blueprints)
            self.assertEqual(ctx.exception.code, "unsafe-source")

    def test_production_pilot_catalog_and_blueprint_are_discoverable(self):
        components = stack_composition.discover_components(
            REPO / "presets/components"
        )
        blueprints = stack_composition.discover_blueprints(
            REPO / "presets/blueprints"
        )
        expected = {
            "backend.dotnet",
            "web.react-vite",
            "mobile.react-native-expo",
            "contract.openapi-http",
            "infra.compose-local",
        }
        self.assertTrue(expected.issubset(components))
        plan = stack_composition.resolve_blueprint(
            components, blueprints, "dotnet-react-rn"
        )
        self.assertEqual(plan["certification"], "certified")
        self.assertEqual(
            {item["id"] for item in plan["components"]}, expected
        )
        self.assertIn("scripts/generate-clients", plan["overlay_files"])
        with tempfile.TemporaryDirectory() as d:
            target = Path(d)
            stack_composition.materialize_plan(plan, target)
            self.assertTrue((target / "contracts/openapi.yaml").exists())
            self.assertTrue(os.access(target / "scripts/test", os.X_OK))
            web = (target / "apps/web/src/App.tsx").read_text()
            mobile = (target / "apps/mobile/App.tsx").read_text()
            self.assertIn("@syntheprise/api-client", web)
            self.assertIn("@syntheprise/api-client", mobile)
            generator = (target / "scripts/generate-clients").read_text()
            self.assertIn("openapi-generator-cli:v7.22.0", generator)
            self.assertIn('temporary_dir="$(mktemp -d)"', generator)
            lock = json.loads(
                (target / ".syntheprise/stack-lock.json").read_text()
            )
            self.assertIn("scripts/generate-clients", lock["overlay_files"])

    def test_phase3_production_catalog_and_blueprints_are_complete(self):
        components = stack_composition.discover_components(
            REPO / "presets/components"
        )
        blueprints = stack_composition.discover_blueprints(
            REPO / "presets/blueprints"
        )
        expected_components = {
            "backend.dotnet",
            "backend.java",
            "backend.node",
            "backend.python-fastapi",
            "backend.rust",
            "web.angular",
            "web.nextjs-web",
            "web.react-vite",
            "web.vanilla-js",
            "mobile.flutter",
            "mobile.react-native-expo",
            "contract.openapi-http",
            "infra.compose-local",
        }
        self.assertEqual(set(components), expected_components)
        self.assertTrue(
            all(component["required_tools"] for component in components.values())
        )

        expected_blueprints = {
            "java-angular-flutter": {
                "backend.java",
                "web.angular",
                "mobile.flutter",
                "contract.openapi-http",
                "infra.compose-local",
            },
            "node-next-rn": {
                "backend.node",
                "web.nextjs-web",
                "mobile.react-native-expo",
                "contract.openapi-http",
                "infra.compose-local",
            },
            "python-react-rn": {
                "backend.python-fastapi",
                "web.react-vite",
                "mobile.react-native-expo",
                "contract.openapi-http",
                "infra.compose-local",
            },
            "rust-react-rn": {
                "backend.rust",
                "web.react-vite",
                "mobile.react-native-expo",
                "contract.openapi-http",
                "infra.compose-local",
            },
        }
        for blueprint, expected in expected_blueprints.items():
            with self.subTest(blueprint=blueprint):
                plan = stack_composition.resolve_blueprint(
                    components, blueprints, blueprint
                )
                self.assertEqual(plan["certification"], "certified")
                self.assertEqual(
                    blueprints[blueprint]["certification"]["evidence"],
                    "https://github.com/trmn-ai/syntheprise-framework/"
                    "actions/runs/30182840270",
                )
                self.assertEqual(
                    {item["id"] for item in plan["components"]}, expected
                )
                self.assertIn("scripts/generate-clients", plan["overlay_files"])
                self.assertIn("package-lock.json", plan["overlay_files"])
                self.assertEqual(
                    plan["required_tools"],
                    sorted(set(plan["required_tools"])),
                )

    def test_phase3_web_boundaries_are_explicit(self):
        vanilla_package = json.loads(
            (
                REPO
                / "presets/components/web/vanilla-js/skeleton/package.json"
            ).read_text()
        )
        self.assertEqual(vanilla_package["type"], "module")
        self.assertEqual(vanilla_package["devDependencies"]["vite"], "8.1.5")
        catalog_workflow = (
            REPO / ".github/workflows/composable-stack-catalog.yml"
        ).read_text()
        self.assertIn("vanilla-js:", catalog_workflow)
        self.assertIn(
            "npm --workspace @app/web run build", catalog_workflow
        )

        next_root = REPO / "presets/components/web/nextjs-web/skeleton"
        next_manifest = json.loads(
            (
                REPO / "presets/components/web/nextjs-web/manifest.json"
            ).read_text()
        )
        self.assertIn(
            "external-api-consumer", next_manifest["capabilities"]
        )
        self.assertFalse((next_root / "app/api").exists())
        page = (next_root / "app/page.tsx").read_text()
        self.assertIn("@syntheprise/api-client", page)

        flutter = (
            REPO / "presets/components/mobile/flutter/skeleton/lib/main.dart"
        ).read_text()
        self.assertNotIn("dart:io", flutter)
        self.assertIn("HealthApi", flutter)
        flutter_manifest = json.loads(
            (
                REPO / "presets/components/mobile/flutter/manifest.json"
            ).read_text()
        )
        flutter_web_bootstrap = (
            "flutter create . --platforms web "
            "--project-name syntheprise_mobile"
        )
        self.assertIn(
            flutter_web_bootstrap, flutter_manifest["commands"]["build"]
        )
        java_flutter_build = (
            REPO
            / "presets/blueprints/java-angular-flutter/overlay/scripts/build"
        ).read_text()
        self.assertIn(flutter_web_bootstrap, java_flutter_build)
        self.assertLess(
            java_flutter_build.index(flutter_web_bootstrap),
            java_flutter_build.index("flutter build web"),
        )

    def test_generated_client_hash_ignores_build_artifacts_not_source(self):
        hash_script = (
            REPO
            / "presets/blueprints/java-angular-flutter/overlay/scripts"
            / "hash-generated.py"
        )
        with tempfile.TemporaryDirectory() as d:
            generated = Path(d) / "generated"
            generated.mkdir()
            source = generated / "client.ts"
            source.write_text("export const status = 'ok';\n")

            def generated_hash():
                return subprocess.run(
                    [sys.executable, str(hash_script), str(generated)],
                    check=True,
                    capture_output=True,
                    text=True,
                ).stdout.strip()

            baseline = generated_hash()
            (generated / "dist").mkdir()
            (generated / "dist/client.js").write_text("compiled\n")
            (generated / "node_modules/pkg").mkdir(parents=True)
            (generated / "node_modules/pkg/index.js").write_text("dependency\n")
            self.assertEqual(generated_hash(), baseline)

            source.write_text("export const status = 'changed';\n")
            self.assertNotEqual(generated_hash(), baseline)

    def test_plan_json_is_stable_and_materialization_writes_stack_lock(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            components = base / "components"
            write_component(components, "api", "backend", "apps/api", 8080,
                            provides=["openapi"])
            write_component(components, "web", "web", "apps/web", 5173,
                            requires=["openapi"])
            registry = stack_composition.discover_components(components)
            plan = stack_composition.resolve_plan(
                registry, ["backend.api", "web.web"]
            )
            first = stack_composition.plan_json(plan)
            second = stack_composition.plan_json(plan)
            self.assertEqual(first, second)
            self.assertIn('"required_tools"', first)

            target = base / "target"
            target.mkdir()
            stack_composition.materialize_plan(plan, target)
            self.assertTrue((target / "apps/api/api.txt").exists())
            self.assertTrue((target / "apps/web/web.txt").exists())
            lock = json.loads(
                (target / ".syntheprise/stack-lock.json").read_text()
            )
            self.assertEqual(lock["schema_version"], 1)
            self.assertEqual(lock["components"],
                             ["backend.api", "web.web"])

    def test_materialization_rejects_undeclared_existing_file_collision(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            components = base / "components"
            write_component(components, "api", "backend", "apps/api", 8080)
            plan = stack_composition.resolve_plan(
                stack_composition.discover_components(components), ["backend.api"]
            )
            target = base / "target"
            (target / "apps/api").mkdir(parents=True)
            (target / "apps/api/api.txt").write_text("owner content\n")
            with self.assertRaises(stack_composition.StackMaterializationError) as ctx:
                stack_composition.materialize_plan(plan, target)
            self.assertEqual(ctx.exception.code, "file-collision")
            self.assertEqual((target / "apps/api/api.txt").read_text(),
                             "owner content\n")

    def test_cli_composition_scaffolds_project_and_preserves_legacy_flow(self):
        cli_spec = importlib.util.spec_from_file_location(
            "syntheprise_composition_test", REPO / "scripts" / "syntheprise.py"
        )
        cli = importlib.util.module_from_spec(cli_spec)
        cli_spec.loader.exec_module(cli)
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            component_root = base / "components"
            write_component(component_root, "api", "backend", "apps/api", 8080,
                            provides=["openapi"],
                            required_tools=["python"])
            write_component(component_root, "web", "web", "apps/web", 5173,
                            requires=["openapi"],
                            required_tools=["npm"])
            registry = stack_composition.discover_components(component_root)
            target = base / "project"
            args = SimpleNamespace(
                target=str(target),
                stack=None,
                blueprint=None,
                backend="api",
                web="web",
                mobile=None,
                plan=False,
                json=False,
                tier="1",
                adapter="all",
                mode="team",
                force=False,
            )
            def assert_deployed_before_preflight(required_tools):
                self.assertTrue(target.exists())
                self.assertEqual(required_tools, ["npm", "python"])

            with mock.patch.object(
                cli, "_composition_registries",
                return_value=(stack_composition, registry, {}),
            ), mock.patch.object(
                cli, "_warn_missing_required_tools",
                side_effect=assert_deployed_before_preflight,
            ) as preflight:
                self.assertEqual(cli.cmd_new(args), 0)
            preflight.assert_called_once()
            self.assertTrue((target / "apps/api/api.txt").exists())
            self.assertTrue((target / "apps/web/web.txt").exists())
            architecture = (target / "docs/architecture.md").read_text()
            self.assertIn("backend.api", architecture)
            self.assertIn("web.web", architecture)
            self.assertTrue((target / "docs/_intake/README.md").exists())
            lock = json.loads(
                (target / ".syntheprise/stack-lock.json").read_text()
            )
            self.assertEqual(lock["components"],
                             ["backend.api", "web.web"])


if __name__ == "__main__":
    unittest.main()
