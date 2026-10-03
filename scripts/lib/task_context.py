import argparse
import importlib.machinery
import importlib.util
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from agents import BaseAgent, get_agent, get_default_agent, list_agents


def load_get_task_module():
    """Dynamically load scripts/get-task."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    get_task_script = repo_root / "scripts" / "get-task"
    if not get_task_script.exists():
        raise FileNotFoundError(f"Could not find get-task script at {get_task_script}")
    loader = importlib.machinery.SourceFileLoader("get_task_mod", str(get_task_script))
    spec = importlib.util.spec_from_loader("get_task_mod", loader)
    if spec is None:
        raise ImportError(f"Could not load spec for {get_task_script}")
    mod = importlib.util.module_from_spec(spec)
    loader.exec_module(mod)
    return mod


def fetch_task(task_id: str, tasks_file: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve task dictionary using get_task."""
    mod = load_get_task_module()
    return mod.get_task(task_id, tasks_file=tasks_file)


def assert_task_status(task: Dict[str, Any], allowed_statuses: List[str], command_name: str) -> None:
    """Validate that the task status matches one of the allowed statuses, otherwise error and exit."""
    current_status = task.get("status", "").strip().lower()
    allowed_lower = [s.lower() for s in allowed_statuses]

    if current_status not in allowed_lower:
        if len(allowed_statuses) == 1:
            req_str = f"'{allowed_statuses[0]}'"
        else:
            req_str = " or ".join([f"'{s}'" for s in allowed_statuses])
        sys.stderr.write(
            f"Error: Task {task['id']} is in '{task['status']}' status. "
            f"{command_name.capitalize()} requires status to be {req_str}.\n"
        )
        sys.exit(1)


def build_workflow_prompt(
    task: Dict[str, Any],
    workflow_name: str,
    workflow_objective: str,
    extra_context: str = "",
) -> str:
    """Construct a standardized, high-fidelity prompt for an AI agent."""
    desc = task["description"].strip() if task.get("description") else "(No description provided yet)"
    subproj_line = f"- Subproject: {task['subproject']}\n" if task.get("subproject") else ""
    epic_line = f"- Epic: {task.get('epic_label', task['epic'])} ({task['epic']})\n" if task.get("epic") else ""
    epic_arg = f" --epic={task['epic']}" if task.get("epic") else ""

    prompt = f"""You are {workflow_name} task {task['id']} in the PlanBForGreatJustice repository.

### Target Task:
- ID: {task['id']}
- Title: {task['title']}
- Project: {task['project']}
{subproj_line}{epic_line}- Current Status: {task['status']}
- Type: {task['type']}

### Current Description & Checklist:
{desc}

### Repository Context & Guidelines:
1. SSoT & Task Management (GEMINI.md):
   - You MUST use `./scripts/update-task {task['id']} ...` to update task metadata, description, title, or checklist items.
   - If this task needs to be split into subtasks, use `./scripts/add-task "Subtask Title" --project={task['project']} --type={task['type']}{epic_arg}`.
   - Do NOT edit docs/tasks.md manually.
2. Architecture Overview:
   - C++ Story Engine: Engine/PlanB/Engine/ (Actions, Expressions, Sequences, GameState, StoryModel).
   - Desktop Editor: Editor/App/ (Tauri + Vite + React, Sequence Simulator, Expression Graph Canvas, XML converters).
   - Content: Content/Episode 1/Episode1/Episode.xml.
   - Specifications: docs/Schema/ (e.g., PBScript_Specification.md, grammar files).
   - Legacy Reference: Editor/Sources/ (WPF C# editor for comparison if applicable).
3. Objectives for this session:
{workflow_objective}
"""
    if extra_context:
        prompt += f"\n### Additional Context:\n{extra_context}\n"

    prompt += f"\nBegin by reviewing the task, inspecting the relevant code, and collaborating interactively with the user.\n"
    return prompt


def add_common_agent_arguments(parser: argparse.ArgumentParser) -> None:
    """Register reusable CLI flags for agent selection and tasks.md path."""
    registered = list_agents()
    agent_names = [a.name for a in registered]

    parser.add_argument(
        "--agent",
        choices=agent_names,
        default=None,
        help=f"AI agent CLI to use ({', '.join(agent_names)}). Defaults to $TASK_AGENT or first available.",
    )
    parser.add_argument("--hermes", action="store_true", help="Shortcut for --agent hermes")
    parser.add_argument("--agy", action="store_true", help="Shortcut for --agent antigravity")
    parser.add_argument("-f", "--file", default=None, help="Path to tasks.md (optional)")


def resolve_selected_agent(args: argparse.Namespace) -> BaseAgent:
    """Resolve which agent was requested via flags or environment."""
    if getattr(args, "hermes", False):
        agent = get_agent("hermes")
    elif getattr(args, "agy", False):
        agent = get_agent("antigravity")
    elif getattr(args, "agent", None):
        agent = get_agent(args.agent)
    else:
        agent = get_default_agent()

    if not agent:
        sys.stderr.write("Error: Could not resolve requested agent.\n")
        sys.exit(1)

    if not agent.is_available():
        sys.stderr.write(
            f"Error: Selected agent '{agent.name}' is not available on PATH. "
            f"Please verify installation.\n"
        )
        sys.exit(1)

    return agent
