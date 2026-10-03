# Project Scripts

This directory contains repository maintenance, release building, and legacy tracker automation scripts.

## Active Tooling

- **`build-release`**: Automated end-to-end release pipeline script (runs test suites, builds standalone `.zipapp`, generates SHA-256 checksums and manifests).
- **`package-release`**: Distribution packaging CLI for building reproducible self-contained `ot.zipapp` artifacts.

---

## Legacy Tracker Tooling (Retired)

> [!NOTE]
> Open Tasks is now fully self-hosted! Work items are managed directly in repository-native Markdown files under `.ot/tasks/` using the `./otw` project wrapper or `ot` CLI.

The legacy scripts below are preserved for historical reference and backward compatibility:

| Legacy Script | Modern Open Tasks Equivalent |
| :--- | :--- |
| `get-tasks` | `ot task list` (or `./otw task list`) |
| `get-task <ID>` | `ot task show <ID>` (or `./otw task show <ID>`) |
| `add-task` | `ot task create` (or `./otw task create`) |
| `update-task` | `ot task status`, `ot task comment`, `ot task add-dependency`, `ot task edit` |
| `update-tasks` | `ot check` / `ot check --fix` (or `./otw check`) |
| `triage` / `research` | Direct file editing or `./otw task edit` |
