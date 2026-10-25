"""Integration tests for `syntheprise new` / `syntheprise stack list` (CR-2026-001).

Stdlib-only (unittest + subprocess) so it runs anywhere without pytest.
Covers TC-INIT-01, 02, 04, 05, 10-ish (generated project passes doctor --template).
Run: python -m unittest tests.test_syntheprise_new   (from the repo root)
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[1]
SYNTHEPRISE = REPO / "scripts" / "syntheprise.py"
DOCTOR = REPO / "scripts" / "doctor.py"


def run(*args, cwd=None):
    return subprocess.run([sys.executable, *args], cwd=cwd, capture_output=True, text=True)


def _copy_kit(dst: Path):
    """Copy the kit's git-tracked files into `dst` (a plain dir, no .git — the CLI's
    rglob fallback then treats it as a kit). Used to synthesize a 'newer kit' for upgrade."""
    files = subprocess.run(["git", "ls-files", "-z"], cwd=REPO,
                           capture_output=True, text=True).stdout.split("\0")
    for rel in files:
        if not rel:
            continue
        s = REPO / rel
        if not s.is_file():
            continue
        d = dst / rel
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, d)


class TestSynthepriseNew(unittest.TestCase):
    def test_stack_list_shows_all_stacks(self):
        r = run(str(SYNTHEPRISE), "stack", "list")
        self.assertEqual(r.returncode, 0, r.stderr)
        for stack in ("python-fastapi", "node", "react-vite", "dotnet", "rust",
                      "java", "react-native", "angular", "nextjs-fullstack"):
            self.assertIn(stack, r.stdout)

    def test_unknown_stack_fails_and_lists_available(self):
        with tempfile.TemporaryDirectory() as d:
            r = run(str(SYNTHEPRISE), "new", str(Path(d) / "x"), "--stack", "does-not-exist")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("available stacks", r.stderr)

    def test_new_scaffolds_stack_project(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            r = run(str(SYNTHEPRISE), "new", str(target), "--stack", "python-fastapi")
            self.assertEqual(r.returncode, 0, r.stderr)
            # markers
            self.assertEqual((target / ".syntheprise-stack").read_text().strip(), "python-fastapi")
            self.assertTrue((target / ".syntheprise-project").exists())
            # guided intake inbox
            self.assertTrue((target / "docs" / "_intake" / "README.md").exists())
            for tpl in ("requirements-brief.md", "tech-stack-notes.md",
                        "domain-rules-notes.md", "constraints.md", "integrations.md"):
                self.assertTrue((target / "docs" / "_intake" / tpl).exists(), tpl)
            # runnable skeleton + stack-filled docs
            self.assertTrue((target / "app" / "main.py").exists())
            self.assertIn("FastAPI", (target / "docs" / "tech-stack.md").read_text())
            # NEXT STEPS guidance mentions the two-phase flow
            self.assertIn("docs/_intake/", r.stdout)
            self.assertIn("syntheprise kickoff", r.stdout)

    def test_required_tool_preflight_is_deterministic_and_nonblocking(self):
        syntheprise = self._load("syntheprise")
        available = {"npm"}
        missing = syntheprise._missing_required_tools(
            ["python", "npm", "docker", "npm"],
            which=lambda tool: f"/tools/{tool}" if tool in available else None,
        )
        self.assertEqual(missing, ["docker", "python"])

        with mock.patch.object(
            syntheprise.shutil, "which", return_value=None
        ), mock.patch("sys.stderr") as stderr, mock.patch.object(
            syntheprise.subprocess, "run"
        ) as setup_command:
            syntheprise._warn_missing_required_tools(["npm", "docker"])
        setup_command.assert_not_called()
        rendered = "".join(
            call.args[0] for call in stderr.write.call_args_list if call.args
        )
        self.assertIn("docker, npm", rendered)
        self.assertIn("No setup command was executed", rendered)

        with mock.patch.object(
            syntheprise.shutil, "which", return_value="/tools/present"
        ), mock.patch("sys.stderr") as present_stderr:
            syntheprise._warn_missing_required_tools(["npm", "docker"])
        present_stderr.write.assert_not_called()

    def test_legacy_catalog_declares_required_tools(self):
        syntheprise = self._load("syntheprise")
        for stack in syntheprise._available_stacks():
            with self.subTest(stack=stack):
                self.assertTrue(syntheprise._stack_required_tools(stack))

    def test_generated_project_passes_doctor_template(self):
        # Guards the .gitignore merge (base ignores survive) and _intake skip.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            r = run(str(target / "scripts" / "doctor.py"), "--template", cwd=target)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_no_ignored_or_secret_files_copied(self):
        # TC-H-01/04: the scaffold must never carry ignored/untracked/secret paths.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            forbidden = [".env", ".git", ".venv", "venv", "node_modules", "secrets",
                         Path(".claude") / "worktrees"]
            for rel in forbidden:
                self.assertFalse((target / rel).exists(), f"leaked into scaffold: {rel}")

    def test_refuses_nonempty_target_without_force(self):
        # TC-H-02: never silently overwrite a non-empty target.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            target.mkdir()
            sentinel = target / "requirements.md"
            sentinel.write_text("USER CONTENT", encoding="utf-8")
            r = run(str(SYNTHEPRISE), "new", str(target), "--stack", "node")
            self.assertNotEqual(r.returncode, 0)
            self.assertEqual(sentinel.read_text(encoding="utf-8"), "USER CONTENT")

    def test_force_allows_nonempty_target(self):
        # TC-H-03: --force scaffolds into a non-empty target.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            target.mkdir()
            (target / "keep.txt").write_text("x", encoding="utf-8")
            r = run(str(SYNTHEPRISE), "new", str(target), "--stack", "node", "--force")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertTrue((target / ".syntheprise-stack").exists())

    def test_angular_declares_build_angular(self):
        # TC-H-07: Angular skeleton must ship the builder its angular.json needs.
        import json
        pkg = json.loads((REPO / "presets" / "stacks" / "angular" / "skeleton" / "package.json").read_text())
        self.assertIn("@angular-devkit/build-angular", pkg.get("devDependencies", {}))

    def test_env_example_is_kept(self):
        # F1 regression guard: the intentional .env.example template must survive.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            self.assertTrue((target / ".env.example").exists(), ".env.example was dropped")
            self.assertFalse((target / ".env").exists())

    def test_doctor_recognizes_iso_snapshot(self):
        # TC-H-05: an ISO-dated snapshot satisfies the quality-gate snapshot check.
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            (target / "docs" / "_states" / f"state_{today}_x.md").write_text("# snapshot\n", encoding="utf-8")
            r = run(str(target / "scripts" / "doctor.py"), "--quality-gate", cwd=target)
            self.assertNotIn("no state snapshot for today", r.stdout + r.stderr)

    # ---- v5.7.3 governance-integrity negative / fault-injection tests ----

    def _load(self, modname):
        import importlib.util
        spec = importlib.util.spec_from_file_location(modname, str(REPO / "scripts" / f"{modname}.py"))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    def test_completeness_rejects_status_flip_bypass(self):
        # TC-G-01: flipping only `status: template`->`draft` must NOT pass.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            import shutil as _sh
            fake = target / "docs" / "_changes" / "CR-2026-050-bypass"
            _sh.copytree(target / "docs" / "_changes" / "CHANGE-template", fake)
            for f in fake.glob("*.md"):
                f.write_text(f.read_text().replace("CHANGE-ID-HERE", "CR-2026-050-bypass")
                             .replace("status: template", "status: draft"), encoding="utf-8")
            r = run(str(target / "scripts" / "check-change-completeness.py"), cwd=target)
            self.assertNotEqual(r.returncode, 0, "one-word status-flip bypass was accepted")

    def test_completeness_rejects_placeholder_token(self):
        # TC-G-02: a leftover placeholder token must fail.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            import shutil as _sh
            fake = target / "docs" / "_changes" / "CR-2026-051-token"
            _sh.copytree(target / "docs" / "_changes" / "CHANGE-template", fake)
            for f in fake.glob("*.md"):
                t = f.read_text().replace("CHANGE-ID-HERE", "CR-2026-051-token").replace("status: template", "status: draft")
                f.write_text(t, encoding="utf-8")
            # leave a placeholder token in one file
            p = fake / "proposal.md"
            p.write_text(p.read_text() + "\nTODO: <PROJECT NAME>\n", encoding="utf-8")
            r = run(str(target / "scripts" / "check-change-completeness.py"), cwd=target)
            self.assertNotEqual(r.returncode, 0)

    def test_force_rollback_removes_created_dirs(self):
        # TC-G-03: an injected failure during --force deploy leaves target unchanged.
        from unittest import mock
        syntheprise = self._load("syntheprise")
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "proj"
            target.mkdir()
            (target / "keep.txt").write_text("old", encoding="utf-8")
            staging = Path(d) / "staging"
            (staging / "new" / "deep").mkdir(parents=True)
            (staging / "new" / "deep" / "a.txt").write_text("a", encoding="utf-8")
            (staging / "keep.txt").write_text("new", encoding="utf-8")
            calls = {"n": 0}
            real = syntheprise.shutil.copy2
            def flaky(src, dst, *a, **k):
                calls["n"] += 1
                if calls["n"] >= 2:
                    raise OSError("injected")
                return real(src, dst, *a, **k)
            with mock.patch.object(syntheprise.shutil, "copy2", side_effect=flaky):
                with self.assertRaises(OSError):
                    syntheprise._deploy_from_staging(staging, target, force=True)
            self.assertEqual((target / "keep.txt").read_text(), "old", "file not restored")
            self.assertFalse((target / "new").exists(), "created directory left behind after rollback")

    def test_traceability_placeholder_is_not_full_coverage(self):
        # TC-G-07: a template matrix (only the FR-001 example) must read n/a, not 100%.
        trace = self._load("syntheprise_trace")
        placeholder = "| Requirement ID | Acceptance Criteria ID | Test Case ID | Implementation Task | PR | Release | Status | Notes |\n|---|---|---|---|---|---|---|---|\n| FR-001 | AC-001 | TC-001 | T-001 | - | - | planned | Draft (example) |\n"
        total, with_test = trace.coverage(placeholder)
        self.assertEqual(total, 0, "placeholder row counted as a real requirement")

    # ---- v5.7.4 project-boundary & fail-closed tests ----

    def test_force_rejects_symlink_escape(self):
        # F1: --force must NOT write through a symlink out of the target.
        syntheprise = self._load("syntheprise")
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            outside = d / "outside"; outside.mkdir()
            target = d / "proj"; target.mkdir()
            (target / "keep.txt").write_text("k", encoding="utf-8")
            (target / "docs").symlink_to(outside, target_is_directory=True)
            staging = d / "staging"; (staging / "docs").mkdir(parents=True)
            (staging / "docs" / "injected.txt").write_text("x", encoding="utf-8")
            with self.assertRaises(OSError):
                syntheprise._deploy_from_staging(staging, target, force=True)
            self.assertFalse((outside / "injected.txt").exists(), "wrote through symlink outside target")

    def test_fresh_project_has_no_framework_state(self):
        # F2/F3: a scaffold must not inherit the kit's change history / mode.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            changes = list((target / "docs" / "_changes").glob("CR-*"))
            self.assertEqual(changes, [], "framework change instances leaked into project")
            self.assertEqual(list((target / "docs" / "_changes" / "_archive").glob("CR-*")), [])
            self.assertEqual(list((target / "docs" / "_states").glob("state_2026*")), [])
            self.assertIn("mode: team", (target / ".syntheprise-quality.yml").read_text())
            self.assertIn("Archived changes: **0**", (target / "docs" / "_dashboard" / "status.md").read_text())

    def test_new_mode_solo_flag(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node", "--mode", "solo").returncode, 0)
            self.assertIn("mode: solo", (target / ".syntheprise-quality.yml").read_text())

    def test_lifecycle_rejects_empty_archive(self):
        # F4-B: an empty archive folder must fail the lifecycle gate.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            (target / "docs" / "_changes" / "_archive" / "CR-2099-999-empty").mkdir(parents=True)
            r = run(str(target / "scripts" / "check-lifecycle-consistency.py"), cwd=target)
            self.assertNotEqual(r.returncode, 0)

    def test_completeness_rejects_template_plus_one_line(self):
        # F5: template + a single appended line must still fail (sentinels remain).
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            import shutil as _sh
            fake = target / "docs" / "_changes" / "CR-2026-060-thin"
            _sh.copytree(target / "docs" / "_changes" / "CHANGE-template", fake)
            for f in fake.glob("*.md"):
                t = f.read_text().replace("CHANGE-ID-HERE", "CR-2026-060-thin").replace("status: template", "status: draft")
                f.write_text(t + "\nReviewed.\n", encoding="utf-8")
            r = run(str(target / "scripts" / "check-change-completeness.py"), cwd=target)
            self.assertNotEqual(r.returncode, 0, "template + one line bypass accepted")

    def test_trace_ac001_counts_as_real(self):
        # F9: a real row using AC-001 must NOT be treated as a placeholder.
        trace = self._load("syntheprise_trace")
        row = ["BG-AUTH", "FR-AUTH-001", "AC-001", "TC-AUTH-001", "T-AUTH-001", "PR-12", "R1", "Verified"]
        self.assertFalse(trace.is_placeholder(row))
        matrix = ("| Business Goal | Requirement ID | Acceptance Criteria ID | Test Case ID | Task | PR | Release | Status |\n"
                  "|---|---|---|---|---|---|---|---|\n"
                  "| " + " | ".join(row) + " |\n")
        total, with_test = trace.coverage(matrix)
        self.assertEqual(total, 1)

    # ---- v5.8.0 machine-readable kernel tests ----

    def test_status_json_shape(self):
        # TC-K-01: `syntheprise status --json` emits a valid, versioned model.
        import json
        r = run(str(SYNTHEPRISE), "status", "--json")
        self.assertEqual(r.returncode, 0, r.stderr)
        m = json.loads(r.stdout)
        self.assertEqual(m["schema_version"], 1)
        self.assertIn(m["kind"], ("kit", "project", "unknown"))
        self.assertIn("active", m["changes"])
        self.assertIn("archived", m["changes"])

    def test_validate_authoring_rejects_template_change(self):
        # TC-K-02: an unfilled template change fails authoring validation.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            import shutil as _sh
            fake = target / "docs" / "_changes" / "CR-2026-070-tmpl"
            _sh.copytree(target / "docs" / "_changes" / "CHANGE-template", fake)
            r = run(str(target / "scripts" / "syntheprise.py"), "validate", "--phase", "authoring", cwd=target)
            self.assertNotEqual(r.returncode, 0)

    def test_validate_clean_project_ok(self):
        # TC-K-03: a project with no active change validates clean.
        import json
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            r = run(str(target / "scripts" / "syntheprise.py"), "validate", "--phase", "authoring", "--json", cwd=target)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertTrue(json.loads(r.stdout)["ok"])
            # and the project got a kernel descriptor
            self.assertIn("kind: project", (target / ".syntheprise" / "project.yaml").read_text())

    def test_model_derives_merge_ready_state(self):
        # TC-K-04: a signed + fully-ticked active change derives as merge-ready.
        import json
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            import shutil as _sh
            ch = target / "docs" / "_changes" / "CR-2026-071-ready"
            _sh.copytree(target / "docs" / "_changes" / "CHANGE-template", ch)
            for f in ch.glob("*.md"):
                f.write_text(re.sub(r"(?m)^status:\s*\S+", "status: signed",
                                    f.read_text().replace("CHANGE-ID-HERE", "CR-2026-071-ready")), encoding="utf-8")
            (ch / "tasks.md").write_text("---\nstatus: done\n---\n\n# Tasks\n\n- [x] T1. done\n", encoding="utf-8")
            r = run(str(target / "scripts" / "syntheprise.py"), "status", "--json", cwd=target)
            m = json.loads(r.stdout)
            states = {c["id"]: c["state"] for c in m["changes"]["active"]}
            self.assertEqual(states.get("CR-2026-071-ready"), "merge-ready")

    # ---- v5.8.1 analyze tests ----

    def test_analyze_missing_change_exit_2(self):
        r = run(str(SYNTHEPRISE), "analyze", "CR-9999-000-nope")
        self.assertEqual(r.returncode, 2)

    def test_analyze_detects_review_vs_tasks(self):
        import json
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            ch = target / "docs" / "_changes" / "CR-2026-080-incons"
            ch.mkdir(parents=True)
            (ch / "review.md").write_text("---\nstatus: signed\n---\n# Review\nTests pass and are meaningful.\n", encoding="utf-8")
            (ch / "tasks.md").write_text("---\nstatus: done\n---\n# Tasks\n\n- [x] T1. a\n- [ ] T2. b\n", encoding="utf-8")
            # advisory by default -> exit 0
            r = run(str(target / "scripts" / "syntheprise.py"), "analyze", "CR-2026-080-incons", "--json", cwd=target)
            res = json.loads(r.stdout)
            codes = {f["code"] for f in res["findings"]}
            self.assertIn("review-vs-tasks", codes)
            # --strict -> exit non-zero because there are findings
            r2 = run(str(target / "scripts" / "syntheprise.py"), "analyze", "CR-2026-080-incons", "--strict", cwd=target)
            self.assertNotEqual(r2.returncode, 0)

    # ---- v5.8.2 converge tests ----

    def test_converge_missing_change_exit_2(self):
        r = run(str(SYNTHEPRISE), "converge", "CR-9999-000-nope")
        self.assertEqual(r.returncode, 2)

    def test_converge_proposes_sign_review(self):
        import json
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            ch = target / "docs" / "_changes" / "CR-2026-090-conv"
            ch.mkdir(parents=True)
            (ch / "review.md").write_text("---\nstatus: draft\n---\n# Review\n", encoding="utf-8")
            (ch / "tasks.md").write_text("---\nstatus: draft\n---\n# Tasks\n\n- [ ] T1. do it\n", encoding="utf-8")
            r = run(str(target / "scripts" / "syntheprise.py"), "converge", "CR-2026-090-conv", "--json", cwd=target)
            self.assertEqual(r.returncode, 0, r.stderr)
            res = json.loads(r.stdout)
            codes = {p["code"] for p in res["proposals"]}
            self.assertIn("sign-review", codes)
            self.assertIn("finish-tasks", codes)

    def test_converge_write_appends_tasks(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            ch = target / "docs" / "_changes" / "CR-2026-091-cw"
            ch.mkdir(parents=True)
            (ch / "review.md").write_text("---\nstatus: draft\n---\n# Review\n", encoding="utf-8")
            (ch / "tasks.md").write_text("---\nstatus: draft\n---\n# Tasks\n", encoding="utf-8")
            run(str(target / "scripts" / "syntheprise.py"), "converge", "CR-2026-091-cw", "--write", cwd=target)
            self.assertIn("Converge follow-ups", (ch / "tasks.md").read_text())

    def test_change_seq_scans_archive(self):
        # TC-H-06: change-id sequencing must not collide with an archived change.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            arch = (
                target / "docs" / "_changes" / "_archive"
                / "2026-07-25-CR-2026-009-old"
            )
            arch.mkdir(parents=True)
            (arch / "proposal.md").write_text("archived\n", encoding="utf-8")
            r = run(str(target / "scripts" / "syntheprise.py"), "change", "new", "next", "--type", "CR", cwd=target)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("CR-2026-010", r.stdout)

    def test_change_archive_preserves_canonical_change_id(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(
                run(
                    str(SYNTHEPRISE), "new", str(target),
                    "--stack", "node",
                ).returncode,
                0,
            )
            change_id = "CR-2099-010-canonical-archive"
            change = target / "docs" / "_changes" / change_id
            change.mkdir()
            (change / "proposal.md").write_text("archive fixture\n")
            result = run(
                str(target / "scripts" / "syntheprise.py"),
                "change", "archive", change_id,
                cwd=target,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(
                (target / "docs" / "_changes" / "_archive" / change_id).is_dir()
            )
            self.assertFalse(any(
                (target / "docs" / "_changes" / "_archive").glob(
                    f"????-??-??-{change_id}"
                )
            ))

    def test_managed_manifest_written_on_scaffold(self):
        # TC-PROV-01: v5.9 provenance — the scaffold records a managed-files manifest
        # with a SHA-256 per distributed file, but not for the manifest itself.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            mf = target / ".syntheprise" / "managed-files.json"
            self.assertTrue(mf.exists())
            data = json.loads(mf.read_text())
            self.assertEqual(data["schema_version"], 1)
            self.assertEqual(data["source"], "syntheprise-kit")
            self.assertTrue(data["kit_version"])
            self.assertIn("AGENTS.md", data["files"])
            self.assertRegex(data["files"]["AGENTS.md"]["sha256"], r"^[0-9a-f]{64}$")
            self.assertNotIn(".syntheprise/managed-files.json", data["files"])

    def _scaffold_and_newkit(self, d):
        """Scaffold a node project + a 'newer kit' (v9.9.9) whose AGENTS.md changed and
        that adds scripts/upg_new.py. Returns (project, newkit)."""
        project = Path(d) / "app"
        self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
        newkit = Path(d) / "newkit"
        _copy_kit(newkit)
        (newkit / "VERSION").write_text("v9.9.9\n", encoding="utf-8")
        with (newkit / "AGENTS.md").open("a", encoding="utf-8") as f:
            f.write("\n<!-- kit v9.9.9 -->\n")
        (newkit / "scripts" / "upg_new.py").write_text("# new kit helper\n", encoding="utf-8")
        return project, newkit

    def test_upgrade_dryrun_plans_without_mutating(self):
        # TC-UPG-01: dry-run classifies update/add and writes nothing.
        with tempfile.TemporaryDirectory() as d:
            project, newkit = self._scaffold_and_newkit(d)
            syntheprise = project / "scripts" / "syntheprise.py"
            before = (project / "AGENTS.md").read_text()
            r = run(str(syntheprise), "upgrade", "--from", str(newkit), "--json", cwd=project)
            self.assertEqual(r.returncode, 0, r.stderr)
            plan = json.loads(r.stdout)
            self.assertIn("AGENTS.md", plan["update"])
            self.assertIn("VERSION", plan["update"])
            self.assertIn("scripts/upg_new.py", plan["add"])
            # dry-run must not touch anything
            self.assertEqual((project / "AGENTS.md").read_text(), before)
            self.assertFalse((project / "scripts" / "upg_new.py").exists())
            self.assertNotIn("v9.9.9", (project / "VERSION").read_text())

    def test_upgrade_apply_updates_adds_and_advances_baseline(self):
        # TC-UPG-02: --apply overwrites pristine files, adds new ones, advances the manifest.
        with tempfile.TemporaryDirectory() as d:
            project, newkit = self._scaffold_and_newkit(d)
            syntheprise = project / "scripts" / "syntheprise.py"
            r = run(str(syntheprise), "upgrade", "--from", str(newkit), "--apply", cwd=project)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("v9.9.9", (project / "VERSION").read_text())
            self.assertIn("kit v9.9.9", (project / "AGENTS.md").read_text())
            self.assertTrue((project / "scripts" / "upg_new.py").exists())
            mf = json.loads((project / ".syntheprise" / "managed-files.json").read_text())
            self.assertEqual(mf["kit_version"], "v9.9.9")
            self.assertIn("scripts/upg_new.py", mf["files"])

    def test_upgrade_conflict_keeps_local_and_writes_syntheprise_new(self):
        # TC-UPG-03: when kit AND team both change a file, keep the team's copy and drop
        # the kit version as <file>.syntheprise-new — never clobber a local edit.
        with tempfile.TemporaryDirectory() as d:
            project, newkit = self._scaffold_and_newkit(d)
            # team edits the same managed file the kit changed
            with (project / "AGENTS.md").open("a", encoding="utf-8") as f:
                f.write("\nlocal team edit\n")
            syntheprise = project / "scripts" / "syntheprise.py"
            plan = json.loads(run(str(syntheprise), "upgrade", "--from", str(newkit),
                                  "--json", cwd=project).stdout)
            self.assertIn("AGENTS.md", plan["conflict"])
            self.assertEqual(run(str(syntheprise), "upgrade", "--from", str(newkit),
                                 "--apply", cwd=project).returncode, 0)
            body = (project / "AGENTS.md").read_text()
            self.assertIn("local team edit", body)       # local edit survives
            self.assertNotIn("kit v9.9.9", body)          # kit change NOT forced in
            sidecar = project / "AGENTS.md.syntheprise-new"
            self.assertTrue(sidecar.exists())
            self.assertIn("kit v9.9.9", sidecar.read_text())

    def test_upgrade_removes_pristine_dropped_file(self):
        # TC-UPG-04: a pristine managed file the newer kit dropped is removed on --apply.
        with tempfile.TemporaryDirectory() as d:
            project, newkit = self._scaffold_and_newkit(d)
            # drop a managed, pristine file from the newer kit
            victim = "core-principles.md"
            self.assertTrue((project / victim).exists())
            (newkit / victim).unlink()
            syntheprise = project / "scripts" / "syntheprise.py"
            plan = json.loads(run(str(syntheprise), "upgrade", "--from", str(newkit),
                                  "--json", cwd=project).stdout)
            self.assertIn(victim, plan["remove"])
            self.assertEqual(run(str(syntheprise), "upgrade", "--from", str(newkit),
                                 "--apply", cwd=project).returncode, 0)
            self.assertFalse((project / victim).exists())

    def test_upgrade_assess_known_legacy_stack_without_mutation(self):
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "legacy"
            project.mkdir()
            (project / ".syntheprise-stack").write_text(
                "python-fastapi\n", encoding="utf-8"
            )
            marker = project / "owner.txt"
            marker.write_text("keep\n", encoding="utf-8")
            before = {
                path.relative_to(project).as_posix(): path.read_bytes()
                for path in project.rglob("*") if path.is_file()
            }
            result = run(
                str(SYNTHEPRISE), "upgrade", "assess",
                "--path", str(project), "--json",
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout)
            self.assertEqual(report["status"], "ready")
            self.assertEqual(report["detected"]["legacy_stack"], "python-fastapi")
            self.assertEqual(
                report["target"]["components"], ["backend.python-fastapi"]
            )
            after = {
                path.relative_to(project).as_posix(): path.read_bytes()
                for path in project.rglob("*") if path.is_file()
            }
            self.assertEqual(after, before)

    def test_upgrade_assess_unknown_project_is_actionable_and_read_only(self):
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "unknown"
            project.mkdir()
            marker = project / "README.md"
            marker.write_text("owner content\n", encoding="utf-8")
            result = run(
                str(SYNTHEPRISE), "upgrade", "assess",
                "--path", str(project), "--json",
            )
            self.assertEqual(result.returncode, 2)
            report = json.loads(result.stdout)
            self.assertEqual(report["status"], "unsupported")
            self.assertTrue(report["blockers"])
            self.assertEqual(marker.read_text(), "owner content\n")

    def test_integrations_section_shipped_and_clean(self):
        # TC-INT-01: scaffolds ship the Integrations section; the template placeholder
        # row is skipped, so a fresh project reports 0 declared and no drift.
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
            self.assertIn("## Integrations", (project / "docs" / "tech-stack.md").read_text())
            r = run(str(project / "scripts" / "syntheprise.py"), "integrations", "--json", cwd=project)
            self.assertEqual(r.returncode, 0, r.stderr)
            rep = json.loads(r.stdout)
            self.assertEqual(rep["integrations"], [])
            self.assertEqual(rep["findings"], [])

    def test_integrations_detects_lifecycle_drift(self):
        # TC-INT-02: active-but-adapter-missing and removed-but-lingering are drift;
        # a present active adapter is clean; --strict exits 1 on drift.
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
            techstack = project / "docs" / "tech-stack.md"
            rows = (
                "\n| `stripe` | provider | `src/providers/stripe.js` | active | 2026-07 | ok |"
                "\n| `sendgrid` | service | `src/providers/sendgrid.js` | active | 2026-07 | missing |"
                "\n| `legacy` | service | `src/providers/legacy.js` | removed | 2026-01 | lingering |"
            )
            t = techstack.read_text()
            anchor = "_Replace the placeholder row with the project's real integrations, one per row._"
            techstack.write_text(t.replace(anchor, rows + "\n\n" + anchor, 1))
            prov = project / "src" / "providers"
            prov.mkdir(parents=True)
            (prov / "stripe.js").write_text("// present\n", encoding="utf-8")
            (prov / "legacy.js").write_text("// lingering removed adapter\n", encoding="utf-8")
            syntheprise = project / "scripts" / "syntheprise.py"
            rep = json.loads(run(str(syntheprise), "integrations", "--json", cwd=project).stdout)
            codes = {f["name"]: f["code"] for f in rep["findings"]}
            self.assertEqual(codes.get("sendgrid"), "adapter-missing")
            self.assertEqual(codes.get("legacy"), "lingering-adapter")
            self.assertNotIn("stripe", codes)  # present active adapter = clean
            # advisory by default (exit 0), strict fails (exit 1)
            self.assertEqual(run(str(syntheprise), "integrations", cwd=project).returncode, 0)
            self.assertEqual(run(str(syntheprise), "integrations", "--strict", cwd=project).returncode, 1)

    def _declare_integration(self, project, row):
        techstack = project / "docs" / "tech-stack.md"
        anchor = "_Replace the placeholder row with the project's real integrations, one per row._"
        t = techstack.read_text()
        techstack.write_text(t.replace(anchor, row + "\n\n" + anchor, 1))

    def test_integrations_undeclared_adapter_scan(self):
        # TC-INT-03 (v5.10): an adapter file in the seam not referenced by any row is
        # flagged undeclared-adapter; seam infra (index/__init__) is ignored.
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
            self._declare_integration(project, "| `stripe` | provider | `src/providers/stripe.js` | active | 2026-07 | ok |")
            prov = project / "src" / "providers"
            prov.mkdir(parents=True)
            (prov / "stripe.js").write_text("// declared\n", encoding="utf-8")
            (prov / "twilio.js").write_text("// undeclared\n", encoding="utf-8")
            (prov / "index.js").write_text("// seam infra\n", encoding="utf-8")
            (prov / "__init__.py").write_text("", encoding="utf-8")
            rep = json.loads(run(str(project / "scripts" / "syntheprise.py"), "integrations", "--json", cwd=project).stdout)
            undeclared = {u["adapter"] for u in rep["undeclared"]}
            self.assertIn("src/providers/twilio.js", undeclared)
            self.assertNotIn("src/providers/stripe.js", undeclared)   # declared
            self.assertNotIn("src/providers/index.js", undeclared)    # seam infra ignored
            self.assertFalse(any("__init__" in a for a in undeclared))
            self.assertEqual(run(str(project / "scripts" / "syntheprise.py"), "integrations", "--strict", cwd=project).returncode, 1)

    def test_integrations_providers_dir_configurable(self):
        # TC-INT-04 (v5.10): providers_dir in .syntheprise/project.yaml is honored.
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
            pj = project / ".syntheprise" / "project.yaml"
            pj.write_text(pj.read_text() + "providers_dir: app/adapters\n", encoding="utf-8")
            seam = project / "app" / "adapters"
            seam.mkdir(parents=True)
            (seam / "paypal.js").write_text("// undeclared in custom seam\n", encoding="utf-8")
            rep = json.loads(run(str(project / "scripts" / "syntheprise.py"), "integrations", "--json", cwd=project).stdout)
            self.assertEqual(rep["providers_dir"], "app/adapters")
            self.assertIn("app/adapters/paypal.js", {u["adapter"] for u in rep["undeclared"]})

    def test_gate_integrations_opt_in(self):
        # TC-INT-05 (v5.10): the project gate runs integrations --strict only when the
        # project opts in via `.syntheprise-quality.yml` (integrations: strict).
        with tempfile.TemporaryDirectory() as d:
            project = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(project), "--stack", "node").returncode, 0)
            syntheprise = project / "scripts" / "syntheprise.py"
            # drift present: active integration whose adapter is missing
            self._declare_integration(project, "| `sendgrid` | service | `src/providers/sendgrid.js` | active | 2026-07 | missing |")
            # opt-in OFF -> gate does not run the integrations check
            g_off = run(str(syntheprise), "gate", cwd=project)
            self.assertNotIn("syntheprise integrations", g_off.stdout + g_off.stderr)
            # opt-in ON -> gate runs integrations --strict
            q = project / ".syntheprise-quality.yml"
            q.write_text(q.read_text() + "gate:\n  integrations: strict\n", encoding="utf-8")
            g_on = run(str(syntheprise), "gate", cwd=project)
            self.assertIn("syntheprise integrations (strict)", g_on.stdout + g_on.stderr)

    def test_review_evidence_independent_approval_pure(self):
        # TC-REV-01 (v5.10.1): the pure GitHub-shape -> boolean helper.
        import importlib.util
        spec = importlib.util.spec_from_file_location("rev", REPO / "scripts" / "review_evidence_github.py")
        rev = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(rev)
        self.assertTrue(rev.independent_approval([{"state": "APPROVED", "author": {"login": "bob"}}], "alice"))
        self.assertFalse(rev.independent_approval([{"state": "APPROVED", "author": {"login": "alice"}}], "alice"))
        self.assertFalse(rev.independent_approval([{"state": "COMMENTED", "author": {"login": "bob"}}], "alice"))
        self.assertFalse(rev.independent_approval([], "alice"))

    def _make_signed_change(self, project):
        ch = project / "docs" / "_changes" / "CR-2026-500-demo"
        ch.mkdir(parents=True)
        (ch / "review.md").write_text("---\nstatus: signed\n---\n# Review\n", encoding="utf-8")
        (ch / "tasks.md").write_text("---\nstatus: done\n---\n# Tasks\n\n- [x] T1\n", encoding="utf-8")
        return ch

    def test_team_mode_requires_independent_review_evidence(self):
        # TC-REV-02 (v5.10.1): solo mode never requires evidence; team mode requires it
        # on merge; an `Independent-review:` line or the escape hatch satisfies it.
        with tempfile.TemporaryDirectory() as d:
            solo = Path(d) / "solo"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(solo), "--stack", "node", "--mode", "solo").returncode, 0)
            self._make_signed_change(solo)
            r = run(str(solo / "scripts" / "check-lifecycle-consistency.py"), "--merge", cwd=solo)
            self.assertNotIn("independent review", (r.stdout + r.stderr).lower())
        with tempfile.TemporaryDirectory() as d:
            team = Path(d) / "team"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(team), "--stack", "node", "--mode", "team").returncode, 0)
            ch = self._make_signed_change(team)
            chk = str(team / "scripts" / "check-lifecycle-consistency.py")
            r = run(chk, "--merge", cwd=team)
            self.assertIn("independent review", (r.stdout + r.stderr).lower())
            # attestation line satisfies the requirement
            rv = ch / "review.md"
            rv.write_text(rv.read_text() + "\nIndependent-review: @reviewer2 (approved)\n", encoding="utf-8")
            r2 = run(chk, "--merge", cwd=team)
            self.assertNotIn("independent review", (r2.stdout + r2.stderr).lower())
            # escape hatch bypasses even without a line
            rv.write_text("---\nstatus: signed\n---\n# Review\n", encoding="utf-8")
            r3 = subprocess.run([sys.executable, chk, "--merge"], cwd=team,
                                capture_output=True, text=True, env={**__import__("os").environ, "SYNTHEPRISE_ALLOW_SELF_REVIEW": "1"})
            self.assertNotIn("independent review", (r3.stdout + r3.stderr).lower())

    def test_managed_reports_clean_then_modified(self):
        # TC-PROV-02: `syntheprise managed --json` classifies pristine vs user-modified files.
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "app"
            self.assertEqual(run(str(SYNTHEPRISE), "new", str(target), "--stack", "node").returncode, 0)
            syntheprise = target / "scripts" / "syntheprise.py"
            r = run(str(syntheprise), "managed", "--json", cwd=target)
            self.assertEqual(r.returncode, 0, r.stderr)
            rep = json.loads(r.stdout)
            self.assertEqual(rep["counts"]["modified"], 0)
            self.assertEqual(rep["counts"]["missing"], 0)
            # user edits a managed file → it must show as modified
            (target / "AGENTS.md").write_text("# hand-edited\n", encoding="utf-8")
            r2 = run(str(syntheprise), "managed", "--json", cwd=target)
            rep2 = json.loads(r2.stdout)
            self.assertIn("AGENTS.md", rep2["modified"])
            self.assertGreaterEqual(rep2["counts"]["modified"], 1)

    def test_retired_identity_is_absent_from_tracked_tree(self):
        # Rebranding is a repository invariant: retired identifiers must not
        # return in either tracked paths or UTF-8 text content.
        retired = (
            "a" + "rdf",
            "eme" + "soft",
            "ai" + "-ready-development-framework",
            "trung" + " huynh",
            "trung" + " huỳnh",
            "trunghp-" + "eme" + "soft",
        )
        listed = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=REPO,
            capture_output=True,
            check=True,
        ).stdout.split(b"\0")
        violations = []
        for raw_path in listed:
            if not raw_path:
                continue
            rel = raw_path.decode("utf-8")
            lowered_path = rel.casefold()
            for fragment in retired:
                if fragment in lowered_path:
                    violations.append(f"path:{rel}:{fragment}")
            path = REPO / rel
            if not path.is_file():
                continue
            try:
                lowered_text = path.read_text(encoding="utf-8").casefold()
            except UnicodeDecodeError:
                continue
            for fragment in retired:
                if fragment in lowered_text:
                    violations.append(f"content:{rel}:{fragment}")
        self.assertEqual(violations, [], "\n".join(violations))


if __name__ == "__main__":
    unittest.main()
