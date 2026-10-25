import re
import unittest
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
WORKFLOW = REPO / ".github" / "workflows" / "quality-gate.yml"
CATALOG_WORKFLOW = (
    REPO / ".github" / "workflows" / "composable-stack-catalog.yml"
)


class QualityGateWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow = WORKFLOW.read_text(encoding="utf-8")

    def _step(self, name: str) -> str:
        match = re.search(
            rf"(?ms)^      - name: {re.escape(name)}\n"
            rf"(.*?)(?=^      - name: |^  [a-zA-Z][\w-]*:|\Z)",
            self.workflow,
        )
        self.assertIsNotNone(match, f"workflow step not found: {name}")
        return match.group(0)

    def test_draft_state_transitions_trigger_the_workflow(self):
        pull_request = re.search(
            r"(?ms)^  pull_request:\n(.*?)(?=^  [a-zA-Z][\w-]*:|\Z)",
            self.workflow,
        )
        self.assertIsNotNone(pull_request)
        trigger = pull_request.group(0)
        self.assertIn("ready_for_review", trigger)
        self.assertIn("converted_to_draft", trigger)

    def test_draft_pr_uses_authoring_completeness_only(self):
        step = self._step("Draft change folders must be authoring-ready")
        self.assertIn("if: github.event.pull_request.draft == true", step)
        self.assertIn("python scripts/check-change-completeness.py", step)
        self.assertNotIn("--merge", step)

    def test_ready_pr_uses_merge_lifecycle_gate(self):
        step = self._step("Ready change folders must be complete AND merge-ready")
        self.assertIn("if: github.event.pull_request.draft == false", step)
        self.assertIn("python scripts/check-change-completeness.py", step)
        self.assertIn("python scripts/check-lifecycle-consistency.py --merge", step)

    def test_catalog_has_weekly_five_blueprint_security_matrix(self):
        workflow = CATALOG_WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(workflow, r"(?m)^  schedule:")
        self.assertIn("workflow_dispatch:", workflow)
        for blueprint in (
            "dotnet-react-rn",
            "java-angular-flutter",
            "node-next-rn",
            "python-react-rn",
            "rust-react-rn",
        ):
            self.assertIn(f"- {blueprint}", workflow)
        self.assertIn("check-component-lifecycle.py", workflow)
        self.assertIn("check-workflow-security.py", workflow)
        self.assertIn("check-dependencies.py --strict", workflow)


if __name__ == "__main__":
    unittest.main()
