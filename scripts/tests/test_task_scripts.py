import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


SCRIPTS = Path(__file__).resolve().parents[1]


def tracker(prefix=None, epics=True, number=1):
    prefix_line = f"task-id-prefix: '{prefix}'\n" if prefix is not None else ""
    epic_frontmatter = """epics:
  - value: 'poc'
    label: 'Proof of Concept'
    description: 'Validate the architecture.'
  - value: 'release'
    label: "Team's Release"
    description: 'Ship the product.'
""" if epics else ""
    anchor_prefix = prefix.lower() if prefix else "ot"
    return f"""---
{prefix_line}projects:
  - value: 'shared'
    label: 'Shared'
subprojects:
  - value: 'engine'
    label: 'Engine'
{epic_frontmatter}task-statuses:
  - value: 'pending'
    label: 'Pending'
  - value: 'in_progress'
    label: 'In Progress'
task-types:
  - value: 'feature'
    label: 'Feature'
---
# Tracker

| ID | Title | Project | Status | Type |
|:---|:------|:--------|:-------|:-----|
| {anchor_prefix.upper()}-{number:03d} | Original | Shared | Pending | Feature |

---

## Detailed Tasks

<a id="{anchor_prefix}-{number:03d}" class="task" data-project="shared" data-subproject="engine" data-status="pending" data-task-type="feature"></a>
### Original
**ID:** {anchor_prefix.upper()}-{number:03d}
**Project:** Shared
**Subproject:** Engine
**Status:** Pending
**Type:** Feature

**Description:**
Keep this description.
- [ ] First requirement
- [x] Second requirement

---

## Notes

See [original](#{anchor_prefix}-{number:03d}).

#### Projects (Rendered from frontmatter projects)
Placeholder
<!-- Table Sort Injection -->
"""


class TaskScriptsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "task tracker's file.md"
        self.path.write_text(tracker(), encoding="utf-8")
        self.env = os.environ.copy()
        self.env.pop("TASK_ID_PREFIX", None)
        self.env.pop("TASKS_FILE", None)

    def run_cli(self, command, *args, success=True, env=None):
        executable = ["bash"] if command == "get-tasks" else [sys.executable]
        result = subprocess.run(
            [*executable, str(SCRIPTS / command), *args, "-f", str(self.path)],
            env=self.env if env is None else env,
            text=True, capture_output=True,
        )
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result

    def get_task(self, task_id="1"):
        return json.loads(self.run_cli("get-task", task_id, "--json").stdout)

    def test_epic_add_update_clear_and_preserve(self):
        self.run_cli("add-task", "New task", "--epic", "Proof of Concept", "--subproject", "engine")
        task = self.get_task("OT-002")
        self.assertEqual((task["epic"], task["epic_label"]), ("poc", "Proof of Concept"))
        self.assertEqual(task["subproject"], "engine")
        self.assertIn('data-epic="poc"', task["raw_markdown"])
        self.assertIn("**Epic:** Proof of Concept", task["raw_markdown"])
        self.assertEqual(self.run_cli("get-task", "2", "--epic").stdout.strip(), "poc")
        self.assertIn("Epic: Proof of Concept", self.run_cli("get-task", "2", "--metadata-only").stdout)
        self.run_cli("update-task", "1", "--epic", "poc", "--status", "in_progress", "--check", "1")
        self.run_cli("update-task", "1", "--title", "Renamed")
        original = self.get_task()
        self.assertEqual(original["epic"], "poc")
        self.assertIn("Keep this description.", original["description"])
        self.assertIn("- [x] First requirement", original["description"])
        self.run_cli("update-task", "1", "--epic", "Team's Release", "--no-sync")
        self.assertEqual(self.get_task()["epic"], "release")
        self.run_cli("update-tasks")
        synced = self.path.read_text()
        self.run_cli("update-tasks")
        self.assertEqual(synced, self.path.read_text())
        self.assertIn("#### Epics (Rendered from frontmatter epics)", synced)
        self.run_cli("update-task", "1", "--clear-epic")
        self.assertEqual(self.get_task()["epic"], "")
        self.assertNotIn("**Epic:**", self.get_task()["raw_markdown"])
        self.run_cli("update-task", "2", "--epic", "")
        self.assertEqual(self.get_task("2")["epic"], "")

    def test_invalid_epic_does_not_write(self):
        before = self.path.read_text()
        for command, args in (
            ("add-task", ("Invalid", "--epic", "missing")),
            ("update-task", ("1", "--epic", "missing")),
        ):
            with self.subTest(command=command):
                result = self.run_cli(command, *args, success=False)
                self.assertIn("Unknown epic", result.stderr)
                self.assertEqual(before, self.path.read_text())

    def test_frontmatter_prefix_with_digits_and_large_ids(self):
        self.path.write_text(tracker(prefix="ab2-work", number=999))
        self.run_cli("add-task", "Thousandth", "--epic", "release")
        task = self.get_task("ab2-work-1000")
        self.assertEqual(task["number"], 1000)
        self.assertEqual(task["id"], "AB2-WORK-1000")
        self.assertEqual(task["anchor_id"], "ab2-work-1000")
        self.assertEqual(self.get_task("999")["anchor_id"], "ab2-work-0999")
        self.assertEqual(self.get_task("999")["id"], "AB2-WORK-0999")
        self.assertEqual(self.get_task("AB2-WORK-00999")["number"], 999)
        self.run_cli("update-task", "999", "--title", "Still padded", "--no-sync")
        self.assertIn("**ID:** AB2-WORK-0999", self.get_task("999")["raw_markdown"])
        self.run_cli("update-task", "AB2-WORK-1000", "--status", "pending")
        self.assertEqual(self.get_task("1000")["status"], "pending")
        env = {**self.env, "PATH": "/usr/bin:/bin"}
        output = self.run_cli("get-tasks", "--all", env=env).stdout
        self.assertLess(output.index("AB2-WORK-1000"), output.index("AB2-WORK-0999"))
        self.run_cli("get-task", "WRONG-1000", success=False)
        for invalid in ("abc", "1junk", "something 1000"):
            self.run_cli("get-task", invalid, success=False)

    def test_environment_override_migrates_ids_and_links(self):
        self.path.write_text(
            tracker(prefix="doc")
            + '\n[reference]: #doc-001\n<a href="#doc-001">Task</a>\n'
            + '[external](https://example.com/#doc-001)\n'
        )
        env = {**self.env, "TASK_ID_PREFIX": "env"}
        self.run_cli("update-tasks", env=env)
        text = self.path.read_text()
        self.assertIn('id="env-001"', text)
        self.assertIn("**ID:** ENV-001", text)
        self.assertIn("[original](#env-001)", text)
        self.assertIn("[reference]: #env-001", text)
        self.assertIn('href="#env-001"', text)
        self.assertIn("[external](https://example.com/#doc-001)", text)
        self.run_cli("add-task", "Next", env=env)
        task = json.loads(self.run_cli("get-task", "ENV-002", "--json", env=env).stdout)
        self.assertEqual(task["id"], "ENV-002")

    def test_default_prefix_without_epics_and_environment_file(self):
        self.path.write_text(tracker(epics=False))
        self.run_cli("update-tasks")
        self.assertEqual(self.get_task()["id"], "OT-001")
        self.assertEqual(self.get_task()["epic"], "")
        self.assertNotIn("| Epic", self.path.read_text())
        env = {**self.env, "TASKS_FILE": str(self.path)}
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "get-task"), "1", "--id"],
            env=env, text=True, capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "OT-001")

    def test_invalid_prefix_and_duplicate_numbers(self):
        for prefix in ("", "1BAD", "BAD SPACE", "BAD/"):
            with self.subTest(prefix=prefix):
                before = self.path.read_text()
                self.run_cli("update-tasks", env={**self.env, "TASK_ID_PREFIX": prefix}, success=False)
                self.assertEqual(before, self.path.read_text())
        text = self.path.read_text()
        chunk = text.split("## Detailed Tasks\n", 1)[1].split("\n---\n\n## Notes", 1)[0]
        self.path.write_text(text.replace("\n---\n\n## Notes", chunk + "\n---\n\n## Notes"))
        self.assertIn("Duplicate numeric task IDs", self.run_cli("update-tasks", success=False).stderr)

    def test_summary_table_conflict_handling(self):
        text = self.path.read_text()
        # Inject conflict markers surrounding and within the summary table
        conflicted = text.replace(
            "| ID | Title |",
            "<<<<<<< HEAD\n| ID | Title |\n=======\n| ID | Title | Project |\n>>>>>>> branch",
        )
        self.path.write_text(conflicted)
        self.run_cli("update-tasks")
        updated = self.path.read_text()
        self.assertNotIn("<<<<<<<", updated)
        self.assertNotIn("=======", updated)
        self.assertNotIn(">>>>>>>", updated)
        self.assertIn("OT-001", updated)
        self.assertIn("Original", updated)


    def test_listing_epic_filters_and_selection_fallback(self):
        self.run_cli("update-task", "1", "--epic", "release")
        self.run_cli("add-task", "Second", "--epic", "poc")
        env = {**self.env, "PATH": "/usr/bin:/bin"}
        output = self.run_cli("get-tasks", "--all", "--sort", "asc", env=env).stdout
        self.assertIn("Epic", output)
        self.assertLess(output.index("OT-001"), output.index("OT-002"))
        output = self.run_cli(
            "get-tasks", "--all", "--accept", "Epic:Team's Release", "--select", "ID,Epic", env=env,
        ).stdout
        self.assertIn("OT-001", output)
        self.assertNotIn("OT-002", output)
        self.assertNotIn("Title", output)
        output = self.run_cli("get-tasks", "--all", "--reject", "Epic:Proof of Concept", env=env).stdout
        self.assertNotIn("OT-002", output)
        self.assertIn("OT-001", output)
        for value in ("poc", "POC", "Proof of Concept"):
            with self.subTest(value=value):
                output = self.run_cli("get-tasks", "--accept", f"Epic:{value}", env=env).stdout
                self.assertIn("OT-002", output)
                self.assertNotIn("OT-001", output)
        output = self.run_cli("get-tasks", "--all", "--reject", "Epic:poc", env=env).stdout
        self.assertNotIn("OT-002", output)
        self.assertIn("OT-001", output)
        output = self.run_cli(
            "get-tasks", "--accept", "Epic:poc,release", "--accept", "Status:Triage", env=env,
        ).stdout
        self.assertIn("OT-002", output)
        self.assertNotIn("OT-001", output)
        self.assertNotIn("OT-001", self.run_cli("get-tasks", "--accept", "Epic:missing", env=env).stdout)

    def test_listing_external_filter_table_selects_epic(self):
        self.run_cli("update-tasks")
        stub = Path(self.temp.name) / "filter-table"
        stub.write_text("#!/bin/sh\nprintf '%s\\n' \"$@\"\n")
        stub.chmod(0o755)
        env = {**self.env, "PATH": f"{self.temp.name}:/usr/bin:/bin"}
        output = self.run_cli("get-tasks", "--all", "--accept", "Epic:Proof of Concept", env=env).stdout
        self.assertIn("ID,Title,Project,Subproject,Epic,Status", output)
        self.assertIn("Epic:Proof of Concept", output)
        output = self.run_cli(
            "get-tasks", "--all", "--accept", "epic:POC,release", "--reject", "Epic:release",
            "--accept", "Status:Pending", env=env,
        ).stdout
        self.assertIn("Epic:Proof of Concept,Team's Release", output)
        self.assertIn("Epic:Team's Release", output)
        self.assertIn("Status:Pending", output)
        self.assertNotIn("Epic:release", output)

    def test_filter_frontmatter_errors_are_reported(self):
        self.path.write_text("No frontmatter\n")
        env = {**self.env, "PATH": "/usr/bin:/bin"}
        result = self.run_cli("get-tasks", "--accept", "Epic:poc", env=env, success=False)
        self.assertIn("Error normalizing task filters: YAML frontmatter not found", result.stderr)

    def test_workflow_surfaces(self):
        self.run_cli("update-task", "1", "--epic", "poc")
        output = self.run_cli("work-on-task", "1", "--start").stdout
        self.assertIn("Proof of Concept", output)
        self.assertEqual(self.get_task()["status"], "in_progress")
        with patch.dict(os.environ, self.env, clear=True):
            sys.path.insert(0, str(SCRIPTS / "lib"))
            try:
                import task_context
                task = task_context.fetch_task("1", tasks_file=str(self.path))
                prompt = task_context.build_workflow_prompt(task, "testing", "Verify the task")
            finally:
                sys.path.pop(0)
        self.assertIn("- Epic: Proof of Concept (poc)", prompt)
        self.assertIn("--epic=poc", prompt)


if __name__ == "__main__":
    unittest.main()
