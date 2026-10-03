---
name: task-management
description: >-
  Manage, query, create, triage, research, and update project tasks using the
  repository's task CLI scripts in scripts/ (get-tasks, get-task, add-task,
  update-task, update-tasks, triage, research) and docs/tasks.md. Activate this
  skill whenever reading, creating, editing, prioritizing, or updating tasks,
  checklists, or project progress.
---

# Task Management Skill

This skill provides operational guidelines and procedures for managing project tasks using the automation scripts in `scripts/` and the Single Source of Truth (SSOT) document `docs/tasks.md`.

---

## Quick Reference & Environment Setup

To make scripts available on your `PATH` and load shell aliases:

```bash
source ./scripts/env.sh
```

> **Note**: For local configurations that should not be committed (such as custom environment variables, agent endpoints, or tokens), create a `scripts/env.local.sh` or `.env.local` file. It will be automatically sourced by `env.sh` and is ignored by Git.

---

## Core Procedures

### 1. Querying and Inspecting Tasks

- **List active pending tasks**:
  ```bash
  ./scripts/get-tasks
  ```
- **List tasks in Planning and Triage**:
  ```bash
  ./scripts/get-tasks --planning
  # or alias: get-planning-tasks
  ```
- **List all tasks**:
  ```bash
  ./scripts/get-tasks --all
  ```
- **Filter tasks**:
  ```bash
  ./scripts/get-tasks --accept "Status:In Progress"
  ./scripts/get-tasks --reject "Project:Android"
  ./scripts/get-tasks --sort asc
  ```
- **Inspect a specific task**:
  ```bash
  ./scripts/get-task OT-001
  # Output as JSON:
  ./scripts/get-task OT-001 --json
  # View description and checklist only:
  ./scripts/get-task OT-001 --description-only
  ```

---

### 2. Creating New Tasks

Use `add-task` to add a new entry to `docs/tasks.md`. The script automatically assigns the next monotonic ID and re-synchronizes the summary table:

```bash
./scripts/add-task "Task Title" --project=<project-key> --type=<type> --status=<status> -d "Description text"
```

**Common Flags**:
- `-p`, `--project`: Project value from frontmatter (e.g., `example-project`, `android`, `ios`, `shared`).
- `-t`, `--type`: Task type (`feature`, `bug`, `chore`, `lint`). Default: `feature`.
- `-s`, `--status`: Initial status (`planning`, `triage`, `pending`, `in_progress`, `done`, `blocked`, `cancelled`, `research`). Default: `triage`.
- `-d`, `--description`: Initial description and markdown checklist items.
- `--subproject`: Subproject name if applicable.

---

### 3. Updating Tasks

Modify task attributes, title, status, and checklist items using `update-task`:

- **Change status**:
  ```bash
  ./scripts/update-task OT-001 --status in_progress
  ./scripts/update-task OT-001 --status done
  ```
- **Update title or description**:
  ```bash
  ./scripts/update-task OT-001 --title "Updated Descriptive Title"
  ./scripts/update-task OT-001 --description "New full description text"
  ```
- **Append checklist items or notes**:
  ```bash
  ./scripts/update-task OT-001 --append-description "- [ ] New requirement step"
  ```
- **Check/uncheck checklist items**:
  ```bash
  # Check all items:
  ./scripts/update-task OT-001 --check-all
  # Check specific item by keyword:
  ./scripts/update-task OT-001 --check-items "Define initial requirements"
  # Uncheck all items:
  ./scripts/update-task OT-001 --uncheck-all
  ```

---

### 4. Synchronizing the Document

If tasks are modified or if table alignment needs re-calculation, run `update-tasks`:

```bash
./scripts/update-tasks
```

This script:
1. Re-indexes and sorts all detailed task chunks strictly by numeric ID.
2. Re-renders the **Overall Progress Table** (`#tasks-list`).
3. Re-renders the metadata enum tables (**Projects**, **Task Statuses**, **Task Types**) based on frontmatter.

---

### 5. Running Triage & Research Workflows

- **Triage a task**:
  ```bash
  ./scripts/triage OT-001
  ./scripts/triage OT-001 --agy
  ```
- **Research a task**:
  ```bash
  ./scripts/research OT-001
  ./scripts/research OT-001 --agy
  ```

---

## Operational Rules & Best Practices

1. **Single Source of Truth (SSOT)**:
   - The `<a id="ot-XXX" class="task" data-project="..." data-status="..." data-task-type="..."></a>` anchor tag in `## Detailed Tasks` is the canonical record.
   - **Never manually edit the summary table** in `docs/tasks.md`. Always modify task entries using `update-task` or run `update-tasks` after editing details.
2. **Lifecycle Discipline**:
   - `planning`: Scoping and defining requirements.
   - `triage`: Prioritizing and deciding architecture.
   - `pending`: Clear scope, ready for execution.
   - `in_progress`: Work actively being executed.
   - `done`: All requirements verified and complete.
   - `blocked`: Waiting on an unresolved external dependency.
   - `cancelled`: No longer applicable.
   - `research`: Technical investigation needed before planning.
3. **Verification**:
   - Always run `./scripts/get-tasks` or `./scripts/get-task <ID>` after updating to verify that status transitions and checklist updates have persisted accurately.
