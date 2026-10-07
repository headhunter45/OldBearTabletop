---
task-id-prefix: 'OB'
projects:
  - label: 'Old Bear VTT'
    path: '.'
    prefix: 'OBV'
    value: 'old-bear-vtt'
  - label: 'Old Bear Brawl'
    path: '.'
    prefix: 'OBB'
    value: 'old-bear-brawl'
  - label: 'Common'
    path: '.'
    prefix: 'CMN'
    value: 'cmn'
task-statuses:
  - label: 'Planning'
    value: 'planning'
    description: 'We do not yet know what it should do.'
  - label: 'Triage'
    value: 'triage'
    description: 'We do not yet know how to do it.'
  - label: 'Ready'
    value: 'ready'
    description: 'Task is ready to be worked on.'
  - label: 'In Progress'
    value: 'in-progress'
    description: 'Task is currently being worked on.'
  - label: 'Testing'
    value: 'testing'
    description: 'Task is currently being tested.'
  - label: 'Blocked'
    value: 'blocked'
    description: 'Task is waiting on external dependencies.'
  - label: 'Done'
    value: 'done'
    description: 'Task is completed and verified.'
task-types:
  - value: 'bug'
    prefix: 'BUG'
    label: 'Bug'
    description: 'The task is a bug to fix.'
  - value: 'feature'
    prefix: 'ENH'
    label: 'Feature'
    description: 'The task is a new feature to implement.'
  - value: 'chore'
    prefix: 'CHR'
    label: 'Chore'
    description: 'The task is a routine maintenance or administrative task.'
---

# Project Task Tracker

## Instructions for Working with Tasks

### Quick Start (Environment Setup)

Before running task commands, source the helper environment script in your shell to load convenient aliases and paths:

```bash
source ./scripts/env.sh
```

### Task ID Configuration

- Set the document-wide `task-id-prefix` in YAML frontmatter (this tracker uses `OB`).
- Optionally export `TASK_ID_PREFIX` in your shell or in the local settings sourced by `scripts/env.sh` (`scripts/env.sh.local` or `.env`). It overrides frontmatter; when neither is set, the default is `OT`.
- Prefixes must start with a letter and contain only letters, digits, underscores, or hyphens. Display IDs are uppercase and anchors are lowercase.
- Numbers remain globally monotonic across the document, with at least three digits. Project and task-type `prefix` fields do not control these IDs.
- After changing the prefix, run `update-tasks` to normalize existing IDs and internal anchor links. Numeric IDs can still be used with task commands.
- All task commands accept `-f /path/to/tasks.md`; `TASKS_FILE` supplies the default path when exported.

### Command Reference

You can manage tasks using the provided automation scripts in `./scripts/` (or via their aliases):

- **List tasks**:
  - `get-tasks` (or `./scripts/get-tasks`): Show active pending tasks.
  - `get-planning-tasks` (or `get-tasks --planning`): Show tasks in _Planning_ or _Triage_ status.
  - `get-tasks --all`: List all tasks regardless of status.
  - `get-tasks --accept "Status:In Progress"` / `get-tasks --reject "Project:Example"`: Filter tasks.
  - `get-tasks --all --accept "Epic:poc" --select "ID,Title,Epic"`: Filter or select the Epic column. Epic filters accept frontmatter values (`poc`) or labels (`Proof of Concept`), case-insensitively.
  - `get-tasks --all --reject "Epic:poc"`: Exclude an Epic by value or label; comma-separated lists such as `Epic:poc,bootstrap` also work.
- **View a specific task**:
  - `get-task OT-001` (or `./scripts/get-task 1`): Inspect task details, requirements, and metadata.
  - `get-task OT-001 --json`: Output task data in JSON format, including `epic` (value) and `epic_label`.
  - `get-task OT-001 --epic`: Output only the canonical Epic value.
- **Add a new task**:
  - `add-task "Task Title" --project=example-project --type=feature --status=triage`
  - (Optionally supply `-d "Description and checklist"`)
  - Add `--epic=poc` (or `--epic="Proof of Concept"`) to assign an Epic defined in frontmatter.
- **Update an existing task**:
  - `update-task OT-001 --status in_progress`
  - `update-task OT-001 --title "New Title"`
  - `update-task OT-001 --status done --check-all`
  - `update-task OT-001 --append-description "- [ ] Additional subtask"`
  - `update-task OT-001 --epic=poc` / `update-task OT-001 --clear-epic`: Assign or remove an Epic.
- **Synchronize document**:
  - `update-tasks` (or `./scripts/update-tasks`): Re-indexes task IDs, re-renders the summary progress table, and regenerates metadata enum tables.

### Workflow Guidelines

1. **Do Not Edit the Summary Table Manually**: The summary table below is automatically regenerated from the detailed task entries. Use `./scripts/add-task` and `./scripts/update-task`, or edit the detailed task blocks directly and run `./scripts/update-tasks`.
2. **Anchor Tags as SSOT**: Each task in `## Detailed Tasks` is defined by an anchor tag:
   `<a id="ot-XXX" class="task" data-project="PROJECT" data-epic="EPIC" data-status="STATUS" data-task-type="TYPE"></a>`
   The attributes on this anchor tag are the canonical source of truth for the task's state.
   `data-epic` is optional; its value comes from frontmatter `epics`. Summary and detail views display the corresponding label.
3. **Task Lifecycle**:
   - **Triage**: Conceptualization and scoping phase.
   - **Ready**: Ready to be picked up for implementation.
   - **In Progress**: Actively being worked on.
   - **Testing**: Code complete and ready for verification.
   - **Done**: Completed and verified.
   - **Blocked**: Waiting on external dependencies.

<a id="tasks-summary"></a>

## Overall Progress

<a id="tasks-list"></a>

| ID     | Title                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Project        | Status   | Type               |
|:-----|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------|:-------|:-----------------|
| OB-001 | In voice and audio settings the 4th button for streaming is mostly off screen                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-001) |
| OB-002 | When adding a new token to the board try to not put it on top of an existing one                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-002) |
| OB-003 | When uploading files allow selecting multiple files at once                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-003) |
| OB-004 | When uploading files allow drag and drop onto the window                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-004) |
| OB-005 | Fix map upload trigger                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Bug](#ob-005)     |
| OB-006 | Carry over image when syncing D&D Beyond with a token                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-006) |
| OB-007 | Save user characters in player and GM local storage during D&D Beyond import                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-007) |
| OB-008 | Show ability score modifier large and score small                                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-008) |
| OB-009 | Add trained and expertise skills to character sheet                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-009) |
| OB-010 | Add proficiency bonus to character sheet                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-010) |
| OB-011 | Add export/import option for all data (characters, uploaded files, maps, tokens)                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-011) |
| OB-012 | Fix initiative tracker button                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Bug](#ob-012)     |
| OB-013 | Fix dice roller button                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Bug](#ob-013)     |
| OB-014 | Configure available UI colors in source code                                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-014) |
| OB-015 | Allow GM to add sounds to the soundboard                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-015) |
| OB-016 | Duplicate selected token                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-016) |
| OB-017 | Allow assigning a player control over multiple tokens                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-017) |
| OB-018 | Make token preview icon square on bottom interaction bar                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-018) |
| OB-019 | Cycle selection through overlapping tokens on click/tap                                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-019) |
| OB-020 | Specify map dimensions in tiles or tile pixel size and grid offset on import                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-020) |
| OB-021 | Render configurable grid on top of map but under tokens                                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-021) |
| OB-022 | Animate mic and headphone icons in top bar when sending or receiving audio                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-022) |
| OB-023 | Fix "Send Players" on map to properly direct player view                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Bug](#ob-023)     |
| OB-024 | Make map edit component a modal or positioned non-obstructively                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Done     | [Feature](#ob-024) |
| OB-025 | Fix grid size input backspace behavior and auto-select text on focus                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Bug](#ob-025)     |
| OB-026 | Restructure map settings layout into two clean columns                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-026) |
| OB-027 | Remove redundant "Back to Maps List" button in modal context                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-027) |
| OB-028 | Add map deletion and map renaming                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-028) |
| OB-029 | Separate maps from scenes to allow sharing maps across multiple scenes                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-029) |
| OB-030 | Asset manager listing tokens, maps, and sounds with hash deduplication                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-030) |
| OB-031 | Asset manager UI grouping with previews, bulk delete, and rename                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-031) |
| OB-032 | Token image selection prompt when adding token with + button                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-032) |
| OB-033 | Token asset settings: border shape and clip/zoom/pan controls                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-033) |
| OB-034 | Map background color picker for imageless grids and outer canvas                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-034) |
| OB-035 | Fix hex grid snapping alignment                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Done     | [Bug](#ob-035)     |
| OB-036 | Quick control to cover entire map in fog                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-036) |
| OB-037 | Fog persistence fix and transparent fog rendering in GM view                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Bug](#ob-037)     |
| OB-038 | Fix trackpad pinch-to-zoom vs two-finger scroll on mobile and desktop                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Bug](#ob-038)     |
| OB-039 | Keyboard shortcuts for highlights (1-5), pan (h), select (s), fog (f), reveal (r), duplicate (d)                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-039) |
| OB-040 | Bulk move group of tokens to another map                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-040) |
| OB-041 | Spawn synced D&D Beyond token off map edge and update selected token                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-041) |
| OB-042 | Pre-create claimable player tokens when player joins                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-042) |
| OB-043 | Animated roll announcement toast with player name, formula, and result                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-043) |
| OB-044 | Remember previously used characters in local storage for quick selection                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-044) |
| OB-045 | Chat command system (/roll, /attack, /skill, /spell with adv/dis)                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-045) |
| OB-046 | Move client, server, and nginx ports to .env and .env.example                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-046) |
| OB-047 | Default mic to muted and defer permission request until unmuted                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Done     | [Feature](#ob-047) |
| OB-048 | Syllable-Based Fantasy Name Generator                                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-048) |
| OB-049 | Default GM user name to "GM" instead of "Adventurer"                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-049) |
| OB-050 | D&D Beyond Attacks and Actions Import Parsing                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-050) |
| OB-051 | Import and display initiative bonus, saving throws, passive perception, currency                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-051) |
| OB-052 | Automatically apply character initiative bonus in initiative tracker rolls                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-052) |
| OB-053 | Allow GM to manually set initiative scores in tracker                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-053) |
| OB-054 | Ephemeral /help and parameter validation for /attack, /spell, and /skill                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-054) |
| OB-055 | Support token index parameter in /sync command                                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Feature](#ob-055) |
| OB-056 | Add /tokens command listing controllable tokens and their indices                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-056) |
| OB-057 | Move hamburger menu to far left of top bar                                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-057) |
| OB-058 | Consolidate fog controls into submenu under single fog button                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-058) |
| OB-059 | Consolidate highlights and pointers into submenu under single button                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-059) |
| OB-060 | Rebind select tool to 's' key                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-060) |
| OB-061 | Rebind hand/grab tool to 'g' key                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-061) |
| OB-062 | Add box select tool below hand tool bound to 'b' key                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-062) |
| OB-063 | Fix chat bubble text color and remove bottom-left chat capsule                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Bug](#ob-063)     |
| OB-064 | Auto-dismiss full-map fog notification toasts                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-064) |
| OB-065 | Adaptive top and left toolbars for mobile and narrow screens                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-065) |
| OB-066 | Draggable non-modal windows with animated minimize chevrons                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-066) |
| OB-067 | Drag to reorder initiative tracker rows and inline score editing                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-067) |
| OB-068 | Per-user scrollable roll history in dice roller window                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-068) |
| OB-069 | Configurable toast display duration in .env                                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-069) |
| OB-070 | Create scene directly from map card in Asset Manager                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-070) |
| OB-071 | Highlight bonus actions and reactions in attacks list                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-071) |
| OB-072 | Interactive zoom, crop, and pan preview for token avatars                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-072) |
| OB-073 | TetraCube .monster Import with Dual-Drop Support                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-073) |
| OB-074 | Multi-File Drag-and-Drop Batch Asset Import Dialog                                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Done     | [Feature](#ob-074) |
| OB-075 | Immediate player nickname update in top bar icons on change                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-075) |
| OB-076 | Nickname persistence in player settings                                                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-076) |
| OB-077 | Animate hamburger menu slide-in from the left                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-077) |
| OB-078 | Multi-token box select for bulk movement, assignment, and duplication                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-078) |
| OB-079 | Inline initiative score editing in tracker row                                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Feature](#ob-079) |
| OB-080 | Persist reordered initiative tracker rows                                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-080) |
| OB-081 | Pan/focus canvas on token click in initiative tracker                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-081) |
| OB-082 | Fix minimized initiative tracker window clipping                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Bug](#ob-082)     |
| OB-083 | Record chat command rolls in dice roller history                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-083) |
| OB-084 | Prevent duplicate player connection entries on page refresh                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-084) |
| OB-085 | Fix submenu flyout visibility for selection and fog tools                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Bug](#ob-085)     |
| OB-086 | Combine grid tools into single flyout (snap toggle and show/hide icons)                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-086) |
| OB-087 | Remove standalone sound icons from top bar                                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-087) |
| OB-088 | Move toggle chat button into left menu toolbar                                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Feature](#ob-088) |
| OB-089 | Reorganize tools and audio controls in hamburger menu                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-089) |
| OB-090 | Prefill D&D Beyond sync URL when character ID is known                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-090) |
| OB-091 | Index-based selection for /spell, /skill, /attack, /item suggestions                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-091) |
| OB-092 | Add /spell quick link at top of chat                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-092) |
| OB-093 | Real-time Asset Manager refresh when dragging assets in                                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-093) |
| OB-094 | Fix double vertical scrollbar in scene settings modal                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Bug](#ob-094)     |
| OB-095 | Fix hex grid rendering and snapping across scenes                                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Bug](#ob-095)     |
| OB-096 | Display imported monsters and characters in Asset Manager                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-096) |
| OB-097 | Interactive measuring tape tool                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Done     | [Feature](#ob-097) |
| OB-098 | Live dimensions preview while drawing shapes (radius, length, box)                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Done     | [Feature](#ob-098) |
| OB-099 | Ensure microphone starts muted by default                                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-099) |
| OB-100 | Pass client and server ports from .env into Dockerfile                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Chore](#ob-100)   |
| OB-101 | Production compose.yaml and .env.production configuration                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-101) |
| OB-102 | Production CI container build script (scripts/ci-build.sh)                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Chore](#ob-102)   |
| OB-103 | Log initiative rolls to dice history with modifiers                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-103) |
| OB-104 | Inline input positioning during initiative tracker row editing                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Feature](#ob-104) |
| OB-105 | Discord Webhook One-Way Chat & Roll Sync                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-105) |
| OB-106 | CLI / Terminal Chat Client (oldbearchat)                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-106) |
| OB-107 | Track props like tokens in Asset Manager                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-107) |
| OB-108 | Reorganize Hamburger Menu Hierarchy                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-108) |
| OB-109 | Favicon generation prompt (FAVICON_PROMPT.md)                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-109) |
| OB-110 | Add dedicated Props tab to Asset Manager                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-110) |
| OB-111 | Persistent Highlights and Drawings with Lock & Delete                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-111) |
| OB-112 | Floating Non-Modal Asset Manager with Map Drag-Drop                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-112) |
| OB-113 | Support decimal tile dimensions for props                                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-113) |
| OB-114 | Prop rotation controls in settings and bottom toolbar                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-114) |
| OB-115 | Prop Versatility, Rotation Widget, and Token Lock/Unlock                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-115) |
| OB-116 | Display application version in top bar                                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-116) |
| OB-117 | Trackpad Scrolling vs Zooming Separation and Auto-Revert Box Select                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-117) |
| OB-118 | Arc / Cone Spell Template Indicator Tool with Dual-Color Visualization                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-118) |
| OB-119 | Draggable target indicator with distance preview                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-119) |
| OB-120 | Draggable floating dice roller window                                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-120) |
| OB-121 | Draggable floating character sheet window                                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-121) |
| OB-123 | Maintain battlemap visibility during asset drag-and-drop                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-123) |
| OB-124 | Build Version with Short Git Hash in Top Bar and CI                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Chore](#ob-124)   |
| OB-125 | Add feedback and GitHub repository links                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-125) |
| OB-126 | Add MIT License file                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Old Bear VTT   | Done     | [Feature](#ob-126) |
| OB-127 | Window Z-Index Elevation on Drag                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-127) |
| OB-128 | Modular / Tileable Maps & Snapping Map Tiles                                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-128) |
| OB-129 | Persistent Indicator Properties Bar, Multi-Aura Labeling & Token Tethering                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-129) |
| OB-130 | Submaps & Secondary Logical Maps per Scene                                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-130) |
| OB-131 | Custom Configurable Statuses with Counters & Turn Lifecycles                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-131) |
| OB-132 | Timers & Segmented Pie-Wedge Progress Clocks                                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Done     | [Feature](#ob-132) |
| OB-133 | Advanced Dice Expression Engine & Action-Tied Rolls                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-133) |
| OB-134 | Custom Image "Spray" Indicator Tool                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-134) |
| OB-135 | Universal `.binder` Export/Import Pipeline                                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Bug](#ob-135)     |
| OB-136 | Client Architectural Refactoring: Restructure into `src/common`, `src/vtt`, and `src/brawl`                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Chore](#ob-136)   |
| OB-137 | *Mobile Touch Hit-Box & Finger Offset Calibration*                                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Planning | [Feature](#ob-137) |
| OB-138 | *Mobile Token Interaction Bar & Left Menu Clipping*                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Planning | [Feature](#ob-138) |
| OB-139 | Reusable Help & Tooltip Component                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-139) |
| OB-140 | Direct JSON Paste / Drop Import for Characters & Monsters                                                                                                                                                                                                                                                                                                                                                                                                                            | Old Bear VTT   | Done     | [Feature](#ob-140) |
| OB-141 | `/item` Command with Local Caching & D&D Beyond Fetch                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear VTT   | Done     | [Feature](#ob-141) |
| OB-142 | D&D Beyond Monster, Item & Character Direct Fetch by URL/ID                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-142) |
| OB-143 | Direct Token Creation from D&D Beyond Monster/Character URL                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-143) |
| OB-144 | Pathbuilder 2e (PF2e) JSON Character Import                                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Done     | [Feature](#ob-144) |
| OB-145 | *Live Video Feed Tokens*                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Planning | [Feature](#ob-145) |
| OB-146 | *WebRTC Webcam Video Mesh with Draggable PIP Tiles*                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Planning | [Feature](#ob-146) |
| OB-147 | *Discord Two-Way Bot Sync Gateway*                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Planning | [Feature](#ob-147) |
| OB-148 | *D&D Beyond CobaltSession Auth & Private Sheets Support*                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Planning | [Feature](#ob-148) |
| OB-149 | *Discord Embedded App SDK Activity Integration*                                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Planning | [Feature](#ob-149) |
| OB-150 | *System-Agnostic Ruleset Manifest & Characterfiles Integration*                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Planning | [Feature](#ob-150) |
| OB-151 | Switch Container CI/CD to GitHub Container Registry (ghcr.io)                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Bug](#ob-151)     |
| OB-152 | *Integrate Help & Tooltip Component Across UI*                                                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Triage   | [Feature](#ob-152) |
| OB-153 | *Pathfinder 2e (PF2e) Ruleset Support*                                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Triage   | [Feature](#ob-153) |
| OB-154 | `GAME_MODE` Environment Configuration & Deployment Toggles                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Testing  | [Feature](#ob-154) |
| OB-155 | Army, Unit, and Model Domain Hierarchy & Disambiguation                                                                                                                                                                                                                                                                                                                                                                                                                              | Old Bear Brawl | Testing  | [Feature](#ob-155) |
| OB-156 | Unit Coherency Graph Engine & Real-Time Warning Halos                                                                                                                                                                                                                                                                                                                                                                                                                                | Old Bear Brawl | Testing  | [Feature](#ob-156) |
| OB-157 | Battle Round Stepper & Wargaming Phase Engine                                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear Brawl | Testing  | [Feature](#ob-157) |
| OB-158 | Dual-Player Chess Clocks with Turn Countdown & Active Switching                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear Brawl | Testing  | [Feature](#ob-158) |
| OB-159 | Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear Brawl | Testing  | [Feature](#ob-159) |
| OB-160 | Objective Marker Control Zone Calculation & Auto-Scoring                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear Brawl | Testing  | [Feature](#ob-160) |
| OB-161 | Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz`                                                                                                                                                                                                                                                                                                                                                                                                                    | Old Bear Brawl | Testing  | [Chore](#ob-161)   |
| OB-162 | Deployment Zones, Casualty Trays & Staging Submap Templates                                                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear Brawl | Testing  | [Feature](#ob-162) |
| OB-163 | Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear Brawl | Testing  | [Feature](#ob-163) |
| OB-164 | My persistent indicators disappear when I change to another type of tool and they change to a different type of indicator when I change to a different indicator tool.                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-164) |
| OB-165 | Token Tether is logically attached to two tokens, but is technically attached to one and pointing to the other. I can unattach it from one, but then can't attach it to another. I can't unattach it to the other token it is attached to.                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Feature](#ob-165) |
| OB-166 | My browser (Brave) prevented me from downloading the .binder file by default and required me to click keep to keep it.                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-166) |
| OB-167 | The box to name/rename an indicator doesn't have a way to apply the value and it isn't realtime.                                                                                                                                                                                                                                                                                                                                                                                     | Old Bear VTT   | Done     | [Feature](#ob-167) |
| OB-168 | Token bar is too spread out. Make things like HP, temp HP, and rotation stack their children vertically instead of horizontally, or take inspiration from the indicator bar for layout.                                                                                                                                                                                                                                                                                              | Old Bear VTT   | Done     | [Feature](#ob-168) |
| OB-169 | Add a square option for sprays.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Done     | [Feature](#ob-169) |
| OB-170 | Since they need settings edited to be useful non-persistent sprays don't make sense. They should not show up unless the mode is set to persistent. The reverse is true for the laser pointer. It should only be visible in non-persistent mode. That or they should always act in the only mode they support.                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-170) |
| OB-171 | Remove the /roll 5(d6+2)/4 syntax for success threshold of 4. It should just be invalid syntax. The other option makes more sense.                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Done     | [Feature](#ob-171) |
| OB-172 | The timer seems to be using our draggable window wrong as well it has a close button, but no title or minimize button and the close button is an unstyled button with an x on it.                                                                                                                                                                                                                                                                                                    | Old Bear VTT   | Done     | [Feature](#ob-172) |
| OB-173 | Floating Screen Widgets & Progress Clocks Overhaul                                                                                                                                                                                                                                                                                                                                                                                                                                   | Old Bear VTT   | Done     | [Feature](#ob-173) |
| OB-174 | Universal .binder Collections & Card Schema Compliance                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Done     | [Feature](#ob-174) |
| OB-175 | Like everything else that toasts the timer should log to chat when time is up.                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Feature](#ob-175) |
| OB-176 | HelpTip components inside draggable windows have their tooltips clipped by the window. Can we make it float above the window like an ov4erlay?                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Done     | [Bug](#ob-176)     |
| OB-177 | Pathfinder 2e Reference Data Import (Foundry PF2e Packs)                                                                                                                                                                                                                                                                                                                                                                                                                             | Old Bear VTT   | Done     | [Feature](#ob-177) |
| OB-178 | Make draggable windows use a common title bar component that contains an icon on the left then title text left aligned and ellipsized if it cant fit, followed by the minimize and close buttons. the minimize action should know what height to animate to based on the height of this component and possibly some extra padding/margin. Give an opinion on whether this should be part of a window component or something similar or if we should just have the title bar for now. | Old Bear VTT   | Done     | [Feature](#ob-178) |
| OB-179 | Chat Input Message History Navigation (Up/Down Arrow Keys)                                                                                                                                                                                                                                                                                                                                                                                                                           | Old Bear VTT   | Done     | [Bug](#ob-179)     |
| OB-180 | System-Agnostic EntityAction Schema & Statblock Card Renderer                                                                                                                                                                                                                                                                                                                                                                                                                        | Old Bear VTT   | Done     | [Feature](#ob-180) |
| OB-181 | Statblock Inspection Syntax (`?`) for Chat Commands                                                                                                                                                                                                                                                                                                                                                                                                                                  | Old Bear VTT   | Done     | [Feature](#ob-181) |
| OB-182 | Associate Controllable Token with Chat Panel                                                                                                                                                                                                                                                                                                                                                                                                                                         | Old Bear VTT   | Testing  | [Feature](#ob-182) |
| OB-183 | Codebase Simplification & Refactoring Plan (docs/refactor-1.md)                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Testing  | [Chore](#ob-183)   |
| OB-184 | HelpTip Component & Placement Guide (docs/helptip-locations.md)                                                                                                                                                                                                                                                                                                                                                                                                                      | Old Bear VTT   | Testing  | [Feature](#ob-184) |
| OB-185 | Backlog Research & Implementation Guide (docs/backlog-implementation-guide.md)                                                                                                                                                                                                                                                                                                                                                                                                       | Old Bear VTT   | Testing  | [Feature](#ob-185) |
| OB-186 | Unable to create new maps or duplicate existing ones.                                                                                                                                                                                                                                                                                                                                                                                                                                | Shared         | Done     | [Bug](#ob-186)     |
| OB-187 | Submap & Deployment Zone Customization UI (Position, Dimensions, Colors, Background Images)                                                                                                                                                                                                                                                                                                                                                                                          | Old Bear VTT   | Ready    | [Feature](#ob-187) |
| OB-188 | Relative Dragging for Tokens, Modular Tiles, and Props                                                                                                                                                                                                                                                                                                                                                                                                                               | Old Bear VTT   | Ready    | [Feature](#ob-188) |
| OB-189 | *Add a way to edit tiles after they have been uploaded.*                                                                                                                                                                                                                                                                                                                                                                                                                             | Common         | Triage   | [Feature](#ob-189) |
| OB-190 | When tiles is selected the tab bar in the asset manager is positioned up underneath the header.                                                                                                                                                                                                                                                                                                                                                                                      | Common         | Ready    | [Bug](#ob-190)     |
| OB-191 | Make no ring color be the default for props and tiles.                                                                                                                                                                                                                                                                                                                                                                                                                               | Common         | Ready    | [Feature](#ob-191) |
| OB-192 | *Custom statuses can't be created.'*                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Common         | Triage   | [Bug](#ob-192)     |
| OB-193 | *Add a way to change token images to existing images.*                                                                                                                                                                                                                                                                                                                                                                                                                               | Common         | Triage   | [Feature](#ob-193) |
| OB-194 | The hitbox for tapping a token should be anywhere within it's ring border.                                                                                                                                                                                                                                                                                                                                                                                                           | Common         | Ready    | [Bug](#ob-194)     |
| OB-195 | *Add zoom and offset to the PRESET_TOKENS in TokenPickerModal.*                                                                                                                                                                                                                                                                                                                                                                                                                      | Common         | Triage   | [Feature](#ob-195) |
| OB-196 | Move chat back to the left sidebar. Put it below the measuring tape icon.                                                                                                                                                                                                                                                                                                                                                                                                            | Common         | Ready    | [Feature](#ob-196) |
| OB-197 | Brawl mode does not have a top bar so I cannot switch back. See [OB-154](#ob-154).                                                                                                                                                                                                                                                                                                                                                                                                   | Common         | Ready    | [Bug](#ob-197)     |
| OB-198 | Reveal fog should be 'shift-f' instead of 'r' for the shortcut key.                                                                                                                                                                                                                                                                                                                                                                                                                  | Vtt            | Ready    | [Feature](#ob-198) |
| OB-199 | *Make fog be a single layer.*                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Vtt            | Triage   | [Feature](#ob-199) |
| OB-200 | I want to be able to add attacks to a token without syncing it with a character.                                                                                                                                                                                                                                                                                                                                                                                                     | Vtt            | Ready    | [Feature](#ob-200) |
| OB-201 | When a player spawns a token it should automatically be controlled by them. See [OB-143](#ob-143).                                                                                                                                                                                                                                                                                                                                                                                   | Vtt            | Ready    | [Bug](#ob-201)     |
| OB-202 | *Make help in chat look better.*                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Common         | Triage   | [Feature](#ob-202) |
| OB-203 | *Make draggable windows resizable on desktop. Especially chat.*                                                                                                                                                                                                                                                                                                                                                                                                                      | Common         | Triage   | [Feature](#ob-203) |
| OB-204 | *Error when trying to import pf2 content with /import*                                                                                                                                                                                                                                                                                                                                                                                                                               | Vtt            | Triage   | [Bug](#ob-204)     |
| OB-205 | The add to character sheet button on an inspected spell adds to the currently selected character. Not the as token.                                                                                                                                                                                                                                                                                                                                                                  | Vtt            | Ready    | [Bug](#ob-205)     |
| OB-206 | Inspecting a spell like /spell? magic missile' shows the spell, but it has the wrong buttons.                                                                                                                                                                                                                                                                                                                                                                                        | Vtt            | Ready    | [Bug](#ob-206)     |
| OB-207 | Changing to a token without a bound character sheet should reset the form to the token's state.                                                                                                                                                                                                                                                                                                                                                                                      | Vtt            | Ready    | [Bug](#ob-207)     |
| OB-208 | Update the Open5EFetcher to use the v2 api.                                                                                                                                                                                                                                                                                                                                                                                                                                          | Vtt            | Ready    | [Feature](#ob-208) |
| OB-209 | There is no settings button next to the active scene name in the top bar.                                                                                                                                                                                                                                                                                                                                                                                                            | Common         | Done     | [Bug](#ob-209)     |
| OB-210 | Remove references to rodeo and obr to be nice.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Common         | Done     | [Chore](#ob-210)   |

---

<a id="task-details"></a>

## Detailed Tasks

<a id="ob-001" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### In voice and audio settings the 4th button for streaming is mostly off screen
**ID:** OB-001
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

In voice and audio settings the 4th button for streaming is mostly off screen

<a id="ob-002" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### When adding a new token to the board try to not put it on top of an existing one
**ID:** OB-002
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

When adding a new token to the board try to not put it on top of an existing one

<a id="ob-003" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### When uploading files allow selecting multiple files at once
**ID:** OB-003
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

When uploading files allow selecting multiple files at once

<a id="ob-004" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### When uploading files allow drag and drop onto the window
**ID:** OB-004
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

When uploading files allow drag and drop onto the window

<a id="ob-005" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix map upload trigger
**ID:** OB-005
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix map upload trigger

<a id="ob-006" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Carry over image when syncing D&D Beyond with a token
**ID:** OB-006
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Carry over image when syncing D&D Beyond with a token

<a id="ob-007" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Save user characters in player and GM local storage during D&D Beyond import
**ID:** OB-007
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Save user characters in player and GM local storage during D&D Beyond import

<a id="ob-008" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Show ability score modifier large and score small
**ID:** OB-008
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Show ability score modifier large and score small

<a id="ob-009" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add trained and expertise skills to character sheet
**ID:** OB-009
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add trained and expertise skills to character sheet

<a id="ob-010" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add proficiency bonus to character sheet
**ID:** OB-010
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add proficiency bonus to character sheet

<a id="ob-011" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add export/import option for all data (characters, uploaded files, maps, tokens)
**ID:** OB-011
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add export/import option for all data (characters, uploaded files, maps, tokens)

<a id="ob-012" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix initiative tracker button
**ID:** OB-012
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix initiative tracker button

<a id="ob-013" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix dice roller button
**ID:** OB-013
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix dice roller button

<a id="ob-014" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Configure available UI colors in source code
**ID:** OB-014
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Configure available UI colors in source code

<a id="ob-015" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Allow GM to add sounds to the soundboard
**ID:** OB-015
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Allow GM to add sounds to the soundboard

<a id="ob-016" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Duplicate selected token
**ID:** OB-016
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Duplicate selected token

<a id="ob-017" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Allow assigning a player control over multiple tokens
**ID:** OB-017
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Allow assigning a player control over multiple tokens

<a id="ob-018" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Make token preview icon square on bottom interaction bar
**ID:** OB-018
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Make token preview icon square on bottom interaction bar

<a id="ob-019" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Cycle selection through overlapping tokens on click/tap
**ID:** OB-019
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Cycle selection through overlapping tokens on click/tap

<a id="ob-020" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Specify map dimensions in tiles or tile pixel size and grid offset on import
**ID:** OB-020
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Specify map dimensions in tiles or tile pixel size and grid offset on import

<a id="ob-021" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Render configurable grid on top of map but under tokens
**ID:** OB-021
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Render configurable grid on top of map but under tokens

<a id="ob-022" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Animate mic and headphone icons in top bar when sending or receiving audio
**ID:** OB-022
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Animate mic and headphone icons in top bar when sending or receiving audio

<a id="ob-023" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix "Send Players" on map to properly direct player view
**ID:** OB-023
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix "Send Players" on map to properly direct player view

<a id="ob-024" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Make map edit component a modal or positioned non-obstructively
**ID:** OB-024
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Make map edit component a modal or positioned non-obstructively

<a id="ob-025" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix grid size input backspace behavior and auto-select text on focus
**ID:** OB-025
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix grid size input backspace behavior and auto-select text on focus

<a id="ob-026" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Restructure map settings layout into two clean columns
**ID:** OB-026
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Restructure map settings layout into two clean columns

<a id="ob-027" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Remove redundant "Back to Maps List" button in modal context
**ID:** OB-027
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Remove redundant "Back to Maps List" button in modal context

<a id="ob-028" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add map deletion and map renaming
**ID:** OB-028
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add map deletion and map renaming

<a id="ob-029" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Separate maps from scenes to allow sharing maps across multiple scenes
**ID:** OB-029
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Separate maps from scenes to allow sharing maps across multiple scenes

<a id="ob-030" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Asset manager listing tokens, maps, and sounds with hash deduplication
**ID:** OB-030
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Asset manager listing tokens, maps, and sounds with hash deduplication

<a id="ob-031" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Asset manager UI grouping with previews, bulk delete, and rename
**ID:** OB-031
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Asset manager UI grouping with previews, bulk delete, and rename

<a id="ob-032" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Token image selection prompt when adding token with + button
**ID:** OB-032
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Token image selection prompt when adding token with + button

<a id="ob-033" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Token asset settings: border shape and clip/zoom/pan controls
**ID:** OB-033
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Token asset settings: border shape and clip/zoom/pan controls

<a id="ob-034" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Map background color picker for imageless grids and outer canvas
**ID:** OB-034
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Map background color picker for imageless grids and outer canvas

<a id="ob-035" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix hex grid snapping alignment
**ID:** OB-035
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix hex grid snapping alignment

<a id="ob-036" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Quick control to cover entire map in fog
**ID:** OB-036
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Quick control to cover entire map in fog

<a id="ob-037" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fog persistence fix and transparent fog rendering in GM view
**ID:** OB-037
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fog persistence fix and transparent fog rendering in GM view

<a id="ob-038" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix trackpad pinch-to-zoom vs two-finger scroll on mobile and desktop
**ID:** OB-038
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix trackpad pinch-to-zoom vs two-finger scroll on mobile and desktop

<a id="ob-039" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Keyboard shortcuts for highlights (1-5), pan (h), select (s), fog (f), reveal (r), duplicate (d)
**ID:** OB-039
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Keyboard shortcuts for highlights (1-5), pan (h), select (s), fog (f), reveal (r), duplicate (d)

<a id="ob-040" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Bulk move group of tokens to another map
**ID:** OB-040
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Bulk move group of tokens to another map

<a id="ob-041" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Spawn synced D&D Beyond token off map edge and update selected token
**ID:** OB-041
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Spawn synced D&D Beyond token off map edge and update selected token

<a id="ob-042" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Pre-create claimable player tokens when player joins
**ID:** OB-042
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Pre-create claimable player tokens when player joins

<a id="ob-043" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Animated roll announcement toast with player name, formula, and result
**ID:** OB-043
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Animated roll announcement toast with player name, formula, and result

<a id="ob-044" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Remember previously used characters in local storage for quick selection
**ID:** OB-044
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Remember previously used characters in local storage for quick selection

<a id="ob-045" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Chat command system (/roll, /attack, /skill, /spell with adv/dis)
**ID:** OB-045
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Chat command system (/roll, /attack, /skill, /spell with adv/dis)

<a id="ob-046" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Move client, server, and nginx ports to .env and .env.example
**ID:** OB-046
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Move client, server, and nginx ports to .env and .env.example

<a id="ob-047" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Default mic to muted and defer permission request until unmuted
**ID:** OB-047
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Default mic to muted and defer permission request until unmuted

<a id="ob-048" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Syllable-Based Fantasy Name Generator
**ID:** OB-048
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Generates random fantasy names for newly connected users from customizable syllable arrays for male, female, and neutral profiles.

<a id="ob-049" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Default GM user name to "GM" instead of "Adventurer"
**ID:** OB-049
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Default GM user name to "GM" instead of "Adventurer"

<a id="ob-050" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### D&D Beyond Attacks and Actions Import Parsing
**ID:** OB-050
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Parse weapon and natural attack blocks from D&D Beyond character endpoints, generating structured attack actions with reach/range, to-hit modifiers, and damage dice formulas.

<a id="ob-051" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Import and display initiative bonus, saving throws, passive perception, currency
**ID:** OB-051
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Import and display initiative bonus, saving throws, passive perception, currency

<a id="ob-052" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Automatically apply character initiative bonus in initiative tracker rolls
**ID:** OB-052
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Automatically apply character initiative bonus in initiative tracker rolls

<a id="ob-053" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Allow GM to manually set initiative scores in tracker
**ID:** OB-053
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Allow GM to manually set initiative scores in tracker

<a id="ob-054" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Ephemeral /help and parameter validation for /attack, /spell, and /skill
**ID:** OB-054
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Ephemeral /help and parameter validation for /attack, /spell, and /skill

<a id="ob-055" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Support token index parameter in /sync command
**ID:** OB-055
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Support token index parameter in /sync command

<a id="ob-056" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add /tokens command listing controllable tokens and their indices
**ID:** OB-056
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add /tokens command listing controllable tokens and their indices

<a id="ob-057" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Move hamburger menu to far left of top bar
**ID:** OB-057
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Move hamburger menu to far left of top bar

<a id="ob-058" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Consolidate fog controls into submenu under single fog button
**ID:** OB-058
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Consolidate fog controls into submenu under single fog button

<a id="ob-059" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Consolidate highlights and pointers into submenu under single button
**ID:** OB-059
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Consolidate highlights and pointers into submenu under single button

<a id="ob-060" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Rebind select tool to 's' key
**ID:** OB-060
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Rebind select tool to 's' key

<a id="ob-061" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Rebind hand/grab tool to 'g' key
**ID:** OB-061
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Rebind hand/grab tool to 'g' key

<a id="ob-062" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add box select tool below hand tool bound to 'b' key
**ID:** OB-062
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add box select tool below hand tool bound to 'b' key

<a id="ob-063" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix chat bubble text color and remove bottom-left chat capsule
**ID:** OB-063
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix chat bubble text color and remove bottom-left chat capsule

<a id="ob-064" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Auto-dismiss full-map fog notification toasts
**ID:** OB-064
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Auto-dismiss full-map fog notification toasts

<a id="ob-065" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Adaptive top and left toolbars for mobile and narrow screens
**ID:** OB-065
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Adaptive top and left toolbars for mobile and narrow screens

<a id="ob-066" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Draggable non-modal windows with animated minimize chevrons
**ID:** OB-066
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Draggable non-modal windows with animated minimize chevrons

<a id="ob-067" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Drag to reorder initiative tracker rows and inline score editing
**ID:** OB-067
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Drag to reorder initiative tracker rows and inline score editing

<a id="ob-068" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Per-user scrollable roll history in dice roller window
**ID:** OB-068
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Per-user scrollable roll history in dice roller window

<a id="ob-069" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Configurable toast display duration in .env
**ID:** OB-069
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Configurable toast display duration in .env

<a id="ob-070" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Create scene directly from map card in Asset Manager
**ID:** OB-070
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Create scene directly from map card in Asset Manager

<a id="ob-071" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Highlight bonus actions and reactions in attacks list
**ID:** OB-071
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Highlight bonus actions and reactions in attacks list

<a id="ob-072" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Interactive zoom, crop, and pan preview for token avatars
**ID:** OB-072
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Interactive zoom, crop, and pan preview for token avatars

<a id="ob-073" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### TetraCube .monster Import with Dual-Drop Support
**ID:** OB-073
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Support importing TetraCube `.monster` files as monster/NPC assets with full stats, AC, HP, speed, and actions:

- Drop `.monster` onto Battlemap directly: saves to Asset Manager and drops token at cursor.
- Drop `.monster` into Asset Manager: saves to library for encounter prep without placing on map.
- Spawning tokens from Asset Manager auto-numbers duplicate names (e.g. Ankheg 1, Ankheg 2) with clickable statblock actions.

<a id="ob-074" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Multi-File Drag-and-Drop Batch Asset Import Dialog
**ID:** OB-074
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

When multiple image files are dragged into the window simultaneously, present a unified batch import dialog allowing each file to be classified as a Map, Token, or Prop with bulk selection buttons ("Set all to Tokens", "Set all to Maps", "Set all to Props").

<a id="ob-075" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Immediate player nickname update in top bar icons on change
**ID:** OB-075
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Immediate player nickname update in top bar icons on change

<a id="ob-076" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Nickname persistence in player settings
**ID:** OB-076
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Nickname persistence in player settings

<a id="ob-077" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Animate hamburger menu slide-in from the left
**ID:** OB-077
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Animate hamburger menu slide-in from the left

<a id="ob-078" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Multi-token box select for bulk movement, assignment, and duplication
**ID:** OB-078
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Multi-token box select for bulk movement, assignment, and duplication

<a id="ob-079" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Inline initiative score editing in tracker row
**ID:** OB-079
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Inline initiative score editing in tracker row

<a id="ob-080" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Persist reordered initiative tracker rows
**ID:** OB-080
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Persist reordered initiative tracker rows

<a id="ob-081" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Pan/focus canvas on token click in initiative tracker
**ID:** OB-081
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Pan/focus canvas on token click in initiative tracker

<a id="ob-082" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix minimized initiative tracker window clipping
**ID:** OB-082
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix minimized initiative tracker window clipping

<a id="ob-083" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Record chat command rolls in dice roller history
**ID:** OB-083
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Record chat command rolls in dice roller history

<a id="ob-084" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Prevent duplicate player connection entries on page refresh
**ID:** OB-084
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Prevent duplicate player connection entries on page refresh

<a id="ob-085" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix submenu flyout visibility for selection and fog tools
**ID:** OB-085
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix submenu flyout visibility for selection and fog tools

<a id="ob-086" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Combine grid tools into single flyout (snap toggle and show/hide icons)
**ID:** OB-086
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Combine grid tools into single flyout (snap toggle and show/hide icons)

<a id="ob-087" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Remove standalone sound icons from top bar
**ID:** OB-087
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Remove standalone sound icons from top bar

<a id="ob-088" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Move toggle chat button into left menu toolbar
**ID:** OB-088
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Move toggle chat button into left menu toolbar

<a id="ob-089" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Reorganize tools and audio controls in hamburger menu
**ID:** OB-089
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Reorganize tools and audio controls in hamburger menu

<a id="ob-090" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Prefill D&D Beyond sync URL when character ID is known
**ID:** OB-090
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Prefill D&D Beyond sync URL when character ID is known

<a id="ob-091" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Index-based selection for /spell, /skill, /attack, /item suggestions
**ID:** OB-091
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Index-based selection for /spell, /skill, /attack, /item suggestions

<a id="ob-092" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add /spell quick link at top of chat
**ID:** OB-092
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add /spell quick link at top of chat

<a id="ob-093" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Real-time Asset Manager refresh when dragging assets in
**ID:** OB-093
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Real-time Asset Manager refresh when dragging assets in

<a id="ob-094" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix double vertical scrollbar in scene settings modal
**ID:** OB-094
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix double vertical scrollbar in scene settings modal

<a id="ob-095" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Fix hex grid rendering and snapping across scenes
**ID:** OB-095
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Fix hex grid rendering and snapping across scenes

<a id="ob-096" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Display imported monsters and characters in Asset Manager
**ID:** OB-096
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Display imported monsters and characters in Asset Manager

<a id="ob-097" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Interactive measuring tape tool
**ID:** OB-097
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Interactive measuring tape tool

<a id="ob-098" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Live dimensions preview while drawing shapes (radius, length, box)
**ID:** OB-098
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Live dimensions preview while drawing shapes (radius, length, box)

<a id="ob-099" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Ensure microphone starts muted by default
**ID:** OB-099
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Ensure microphone starts muted by default

<a id="ob-100" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="chore"></a>
### Pass client and server ports from .env into Dockerfile
**ID:** OB-100
**Project:** Old Bear VTT
**Status:** Done
**Type:** Chore


**Description:**

Pass client and server ports from .env into Dockerfile

<a id="ob-101" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Production compose.yaml and .env.production configuration
**ID:** OB-101
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Production compose.yaml and .env.production configuration

<a id="ob-102" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="chore"></a>
### Production CI container build script (scripts/ci-build.sh)
**ID:** OB-102
**Project:** Old Bear VTT
**Status:** Done
**Type:** Chore


**Description:**

Production CI container build script (scripts/ci-build.sh)

<a id="ob-103" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Log initiative rolls to dice history with modifiers
**ID:** OB-103
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Log initiative rolls to dice history with modifiers

<a id="ob-104" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Inline input positioning during initiative tracker row editing
**ID:** OB-104
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Inline input positioning during initiative tracker row editing

<a id="ob-105" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Discord Webhook One-Way Chat & Roll Sync
**ID:** OB-105
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add one-way sync from OldBearBattles to a Discord text channel via a Discord webhook URL:

- `/discord webhook <webhook url>` to configure webhook URL.
- `/discord webhook none` to clear/disable webhook.
- All `/discord` command output is ephemeral (visible only to the user).
- Only GMs may execute `/discord` commands.
- Automatically relays all public chat messages and dice rolls to Discord.

<a id="ob-106" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### CLI / Terminal Chat Client (oldbearchat)
**ID:** OB-106
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Lightweight terminal chat and dice rolling client (`bin/oldbearchat`):

- Connects directly to the WebSocket server (`/ws`).
- Supports joining via URL or `/join <invite url>`.
- Local command history via up/down arrow keys.
- Inspired by IRC/mIRC command ergonomics.

<a id="ob-107" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Track props like tokens in Asset Manager
**ID:** OB-107
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Track props like tokens in Asset Manager

<a id="ob-108" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Reorganize Hamburger Menu Hierarchy
**ID:** OB-108
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Standardize hamburger menu ordering:

1. Sound status / volume bar
2. Chat
3. Characters (renamed from Character Sheets and Spells)
4. Initiative Tracker
5. Add Token (tokens, props, monsters, characters)
6. Soundboard
7. Asset Manager (including integrated Scene Manager)
8. Voice & Audio Settings

<a id="ob-109" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Favicon generation prompt (FAVICON_PROMPT.md)
**ID:** OB-109
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Favicon generation prompt (FAVICON_PROMPT.md)

<a id="ob-110" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add dedicated Props tab to Asset Manager
**ID:** OB-110
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add dedicated Props tab to Asset Manager

<a id="ob-111" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Persistent Highlights and Drawings with Lock & Delete
**ID:** OB-111
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Persistent canvas drawings and spell templates:

- `📌 Persist` toggle in drawing tools flyout (`⚡ Quick Ping` fades after 4s vs `📌 Persist` stays on map).
- Persistent shapes (circle, rectangle, arrow, target) live on a drawing layer above the grid but below tokens.
- Selectable and movable with the Select (`s`) tool.
- Floating toolbar with Delete `🗑️` and Lock `🔒` toggle.

<a id="ob-112" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Floating Non-Modal Asset Manager with Map Drag-Drop
**ID:** OB-112
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Make the Asset Manager a draggable, non-modal floating window without a dark backdrop overlay:

- Battlemap remains interactive while Asset Manager is open.
- Drag tokens, props, monsters, and characters directly onto the canvas to spawn at cursor.
- "Deploy to Map" button on each asset card (dropping near viewport center).
- Includes minimize/collapse and close controls.

<a id="ob-113" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Support decimal tile dimensions for props
**ID:** OB-113
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Support decimal tile dimensions for props

<a id="ob-114" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Prop rotation controls in settings and bottom toolbar
**ID:** OB-114
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Prop rotation controls in settings and bottom toolbar

<a id="ob-115" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Prop Versatility, Rotation Widget, and Token Lock/Unlock
**ID:** OB-115
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Refine prop and token toolbar controls:

- Remove HP, temp HP, and assigned user controls from props.
- Add rotation degree text input and interactive compass rotation wheel widget.
- Add lock/unlock toggle `🔒` for tokens and props (locked entities can be selected but not moved).

<a id="ob-116" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Display application version in top bar
**ID:** OB-116
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Display application version in top bar

<a id="ob-117" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Trackpad Scrolling vs Zooming Separation and Auto-Revert Box Select
**ID:** OB-117
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Input ergonomics refinement:

- Separate two-finger trackpad panning (`e.ctrlKey === false`) from pinch-to-zoom (`e.ctrlKey === true`).
- Expose sensitivity constants in `CanvasEngine.ts` (`TRACKPAD_PAN_SENSITIVITY`, `TRACKPAD_ZOOM_SENSITIVITY`, `MOUSE_WHEEL_ZOOM_SENSITIVITY`).
- Auto-revert to the Select (`s`) arrow tool immediately after a box select completes.

<a id="ob-118" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Arc / Cone Spell Template Indicator Tool with Dual-Color Visualization
**ID:** OB-118
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Directional cone and arc drawing tool:

- Click/tap origin (caster) and drag outward to set direction and length/radius with live distance badge.
- Preset angle spread chips (`53°`, `60°`, `90°`, `120°`, `180°`) with draggable angle handle.
- Dual-color rendering: circular cone arc rendered in primary highlight color; outer triangle difference rendered in darker accent color to visualize both circular and triangular ruleset interpretations.
- Fully supports `📌 Persist` toggle, selection, rotation, locking, and deletion.

<a id="ob-119" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Draggable target indicator with distance preview
**ID:** OB-119
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Draggable target indicator with distance preview

<a id="ob-120" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Draggable floating dice roller window
**ID:** OB-120
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Draggable floating dice roller window

<a id="ob-121" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Draggable floating character sheet window
**ID:** OB-121
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Draggable floating character sheet window

<a id="ob-123" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Maintain battlemap visibility during asset drag-and-drop
**ID:** OB-123
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Maintain battlemap visibility during asset drag-and-drop

<a id="ob-124" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="chore"></a>
### Build Version with Short Git Hash in Top Bar and CI
**ID:** OB-124
**Project:** Old Bear VTT
**Status:** Done
**Type:** Chore


**Description:**

Single source of truth for application version (`VERSION` file) passed into CI build scripts, Docker tags, and rendered in top bar subtitle with short git commit hash (e.g. `v0.1.0-alpha5 (c292e59)`).

<a id="ob-125" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add feedback and GitHub repository links
**ID:** OB-125
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add feedback and GitHub repository links

<a id="ob-126" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add MIT License file
**ID:** OB-126
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add MIT License file

<a id="ob-127" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Window Z-Index Elevation on Drag
**ID:** OB-127
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

When dragging any floating non-modal window (chat, initiative tracker, dice roller, asset manager, character sheet), automatically elevate its `z-index` above all other open floating windows so it stays visibly on top during interaction.

<a id="ob-128" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Modular / Tileable Maps & Snapping Map Tiles
**ID:** OB-128
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Dynamic map tile assembly on the canvas during play:

- Snap modular map tiles edge-to-edge on the fly with magnetic grid alignment (for dungeon rooms, corridors, or wargame terrain tiles).
- Asset Manager "Tile Bucket": folder containing modular tiles with individually configurable grid size, offsets, and edge-snapping sockets.
- In-play deployment: pick specific tiles or draw randomly from the deck (card deck style) and drag/spawn them adjacent to existing tiles.

<a id="ob-129" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Persistent Indicator Properties Bar, Multi-Aura Labeling & Token Tethering
**ID:** OB-129
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Bottom context toolbar for persistent indicators and multi-aura support:

- Bottom toolbar appears when a persistent indicator is selected (matching token/prop editor style):
  - Rename/label custom indicator (e.g. "Spirit Guardians", "Captain 6\" Aura", "Threat Range", "Facing").
  - Colors, opacity, radius/dimensions, cone spread angle, and compass rotation widget.
  - Anchor toggle: `Center` vs `Base Edge` (measuring aura from perimeter boundary).
  - Multiple active indicators per token, individually labeled and styled.
  - Duplicating/copying a token automatically duplicates its active attached indicators.
  - Lock toggle `🔒` to prevent accidental dragging.
- Token/Prop Tethering:
  - Tool to tether one token to another token or prop.
  - Connecting line with configurable styles (`straight` vs `wiggly` sine wave with frequency/amplitude controls), color, and stroke width.
  - Line dynamically follows both connected entities on move.

<a id="ob-130" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Submaps & Secondary Logical Maps per Scene
**ID:** OB-130
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Support multiple logical submaps within a single canvas scene:

- Primary map serves as the scene thumbnail and primary battleground.
- Secondary submaps exist in canvas space with independent names, background colors, dimensions, and grid settings.
- Unifies multiple gameplay concepts under a single engine abstraction:
  - Multi-floor buildings (Floor 1, Floor 2, Basement side-by-side in one scene).
  - Connected portal dungeons (Tavern + Cavern).
  - Wargaming Deployment Zones (color-coded and labeled).
  - Casualty Tray / Graveyard (off-table area for slain models to facilitate resurrection and VP scoring).
  - Off-Table Staging Area (Strategic Reserves, Deep Strike, and Embarked units inside Transports).
- Scene Templates: duplicate a base scene layout (including all submaps and staging boxes) and swap just the primary map image.

<a id="ob-131" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Custom Configurable Statuses with Counters & Turn Lifecycles
**ID:** OB-131
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

System-agnostic token status conditions with automatic numeric counters and turn transition triggers:

- Schema:
  ```json
  {
    "label": "Dying",
    "description": "The unit is dying",
    "color": "red",
    "counter": { "start": 1, "update": 1, "max": 3 },
    "showOnToken": true,
    "clearWhen": "beginning_of_turn",
    "updates": "end_of_turn"
  }
  ```
- Storage hierarchy: global/account defaults in `localStorage` + per-scene overrides.
- Automatic updates: advances counters or clears statuses on turn change based on `beginning_of_turn` or `end_of_turn`.

<a id="ob-132" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Timers & Segmented Pie-Wedge Progress Clocks
**ID:** OB-132
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Round timers and Blades in the Dark style progress clocks:

- Timers:
  - Chat command `/timer <duration>` supporting minutes/seconds and decimals (`/timer 10 min`, `/timer 30s`, `/timer 2.5m`).
  - Floating / docked HUD badge with start, pause, reset, and completion chime/toast.
- Pie-Wedge Clocks:
  - Circular clock divided into an arbitrary number of pie wedges (defaulting to 8).
  - Placeable on the canvas or tracked in a floating window.
  - Nameable and colorable.
  - Click `+` to light up the next clockwise wedge; click `-` to dim a wedge.

<a id="ob-133" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Advanced Dice Expression Engine & Action-Tied Rolls
**ID:** OB-133
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Tie custom dice macros directly to action buttons on tokens, units, and monsters:

- Grouped modified rolls: `/roll 40(d6+3)` rolls 40 individual d6s, applies +3 to each, displays all results, and sums total raw rolls + `3 * 40`.
- Threshold success/failure counting: `/roll 10(d6+2 >= 5)` evaluates boolean condition per die and reports success/failure totals.
- Dice pool botch/glitch tracking (e.g. 1s counting as botches for Shadowrun / Vampire: The Masquerade, reporting net successes, total successes, and glitch alerts).

<a id="ob-134" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Custom Image "Spray" Indicator Tool
**ID:** OB-134
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-136](#ob-136)

Deploy custom image decals, objective markers, and hazard overlays:

- Click center point, drag outward with live distance preview to set diameter.
- When `📌 Persist` is enabled, position and dimensions remain editable with selection, locking `🔒`, and rotation controls.

<a id="ob-135" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Universal `.binder` Export/Import Pipeline
**ID:** OB-135
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

**Depends On:** [OB-136](#ob-136)

Establish an open, system-agnostic `.binder` (`application/json`) interchange format based on the schema draft in `docs/schema/binder.json` (to be formally hosted at `https://schemas.ttrpgwith.me/v1/binder.json`):

- **Schema Structure & Compatibility:**
  - Required field: `schemaVersion: 1`.
  - Optional `collections` (`[{ name, cards: [] }]`) and `dashboard` fields preserved for compatibility with external card/collection apps (e.g. MonsterCards).
  - Private extension namespace under `_oldbear`: `{ "_oldbear": { "vtt": {}, "brawl": {} } }`. The `_` prefix convention designates our data as private application data (analogous to `vnd/*` MIME types) that other apps should ignore or preserve without error.
- **Module Payloads:**
  - `_oldbear.vtt`: scenes, maps, tokens, props, characters, markers, fog, and custom statuses.
  - `_oldbear.brawl`: army rosters, units, points, coherency settings, battle rounds, and objectives.
- **Content Policy:**
  - Strictly User-Generated Content (UGC) with zero hardcoded copyrighted material bundled in the source. This is a note that we are not including any external content in the source; users have full rights to export and back up whatever content they create or enter.
- **Functionality:**
  - Single-file `.binder` export and import for campaigns, army rosters, scenes, and cross-session asset transfer.

<a id="ob-136" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="chore"></a>
### Client Architectural Refactoring: Restructure into `src/common`, `src/vtt`, and `src/brawl`
**ID:** OB-136
**Project:** Old Bear VTT
**Status:** Done
**Type:** Chore


**Description:**

Reorganize `packages/client/src/` into three distinct domain folders to decouple shared engine infrastructure from game-specific UI and enable clean multi-mode development:

- `src/common/`: Shared canvas engine (`CanvasEngine`, `Viewport`), generic floating windows, audio/WebRTC mesh, WebSocket signaling, asset storage, drawing/indicator tools, and general utilities.
- `src/vtt/`: TTRPG-specific client layer (D&D 5e / PF2e character sheets, spellbooks, D&D Beyond sync, TetraCube monster importers, and VTT entrypoint/shell).
- `src/brawl/`: Tabletop wargaming client layer (Army roster viewer, unit coherency indicators, chess clocks, phase steppers, and Brawl entrypoint/shell).
- Rules & Boundaries:
  - `src/common/` must **never** import from `src/vtt/` or `src/brawl/`.
  - `src/vtt/` and `src/brawl/` import from `src/common/`, but never import from each other.
- Execution Priority: **ASAP (Step 0)**. Must be executed first upon resuming active development so tasks OB-128 through OB-135 land directly in `src/common/`.

<a id="ob-137" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### Mobile Touch Hit-Box & Finger Offset Calibration
**ID:** OB-137
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
**Depends On:** [OB-136](#ob-136)

Add a Touch Slop / Hit Radius Buffer in `CanvasEngine.ts` (`touchHitRadius = Math.max(tokenRadius, 28)` for touch events) to eliminate tap-selection misses on mobile touchscreens. When a touch begins within the expanded radius of a selected token, explicitly lock viewport panning and treat touch-drag as token movement.

<a id="ob-138" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### Mobile Token Interaction Bar & Left Menu Clipping
**ID:** OB-138
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
CSS layout adjustments for mobile viewports:

- Add `safe-area-inset` padding (`env(safe-area-inset-bottom)`) to floating HUD.
- Center token action bar at `bottom: 4.5rem; left: 50%; transform: translateX(-50%)` with `max-width: 90vw`.
- Add `max-height: calc(100dvh - 5rem); overflow-y: auto` to `.floating-hud-toolbar` in landscape media queries.

<a id="ob-139" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Reusable Help & Tooltip Component
**ID:** OB-139
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**
Build an accessible, reusable `<HelpTip text="..." />` component with a subtle `?` icon, smooth hover/focus tooltip balloon, and a hotkey cheat-sheet modal triggered by `?` or `Shift + /`. (Integration of tooltips across application views is tracked in follow-up task [OB-152](#ob-152---integrate-help--tooltip-component-across-ui)).

<a id="ob-140" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Direct JSON Paste / Drop Import for Characters & Monsters
**ID:** OB-140
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add a drag-and-drop listener for pre-exported D&D Beyond or generic character/monster JSON files, enabling instant local import without requiring network scraping or authentication. Any file we can import I want to be able to drag and drop onto the app and have it either auto import and be added to the current scene or if that doesn't make sense like a map for instance or sound file added to just assets. When importing more complex objects or multiple items at once we should ask for confirmation with a reasonable description of what we are importing (full backup with 48 assets 0.5 MB or binder with 37 npcs and 2 characters).

<a id="ob-141" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### `/item` Command with Local Caching & D&D Beyond Fetch
**ID:** OB-141
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Client-side command parser for `/item <query>`, `/item? <query>`, and `/item list`, caching fetched D&D Beyond / Open5e items locally in storage by ID (`slug`) for fast offline access and chat card rendering.

<a id="ob-142" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### D&D Beyond Monster, Item & Character Direct Fetch by URL/ID
**ID:** OB-142
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-140](#ob-140)

Fetch public D&D Beyond / Open5e monsters, items, and characters directly by URL, ID, or `/monster? <query>`, mapping stats into local entities and caching images in local asset storage.

<a id="ob-143" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Direct Token Creation from D&D Beyond Monster/Character URL
**ID:** OB-143
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-142](#ob-142)

Spawn tokens directly onto the active battlemap from D&D Beyond monster or character URLs/IDs, caching the official avatar art and populating the statblock and attack actions on the token.

<a id="ob-144" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Pathbuilder 2e (PF2e) JSON Character Import
**ID:** OB-144
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Import Pathbuilder 2e characters via build ID URL (`https://pathbuilder2e.com/json.php?id=<build_id>`) or exported `.json` file:

- Fetch or parse character JSON schema from Pathbuilder 2e exports.
- Extract character stats, abilities, saving throws, skills, perception, HP, AC, speed, strikes, and spells.
- Store imported character in local storage and support spawning ready-to-use tokens with avatar art.
- (PF2e-specific ruleset mechanics and action economy are tracked in [OB-153](#ob-153---pathfinder-2e-pf2e-ruleset-support)).

The format is described below.
Pathbuilder 2e does not maintain an official published JSON Schema (such as a standard JSON Schema draft specification), but its character export format (retrieved via `[https://pathbuilder2e.com/json.php?id=](https://pathbuilder2e.com/json.php?id=)<ID>` or web/app export) follows a well-established, standardized JSON structure used widely by VTT importers like Pathmuncher and Foundry VTT.

#### Root Object Structure

The top-level JSON contains a status flag and a `build` object housing all character details:

```json
{
  "success": true,
  "build": {
    "name": "Valeros",
    "class": "Fighter",
    "dualClass": null,
    "level": 5,
    "ancestry": "Human",
    "heritage": "Versatile Heritage",
    "background": "Guard",
    "alignment": "N",
    "gender": "Male",
    "age": "28",
    "deity": "Gorum",
    "size": 2,
    "keyability": "str",
    "languages": ["Common", "Orcish"],
    "attributes": {
      "ancestryhp": 8,
      "classhp": 10,
      "bonushp": 0,
      "bonushpPerLevel": 0,
      "speed": 25,
      "speedBonus": 0
    },
    "abilities": {
      "str": 18,
      "dex": 14,
      "con": 14,
      "int": 10,
      "wis": 12,
      "cha": 10,
      "breakdown": {}
    },
    "proficiencies": {
      "classDC": 2,
      "perception": 4,
      "fortitude": 4,
      "reflex": 2,
      "will": 2,
      "heavy": 2,
      "medium": 2,
      "light": 2,
      "unarmored": 2,
      "martial": 4,
      "simple": 4,
      "advanced": 0,
      "unarmed": 4,
      "castingArcane": 0,
      "castingDivine": 0,
      "castingOccult": 0,
      "castingPrimal": 0,
      "acrobatics": 0,
      "arcana": 0,
      "athletics": 4,
      "crafting": 0,
      "deception": 0,
      "diplomacy": 0,
      "intimidation": 2,
      "medicine": 0,
      "nature": 0,
      "occultism": 0,
      "performance": 0,
      "religion": 0,
      "society": 0,
      "stealth": 0,
      "survival": 0,
      "thievery": 0
    },
    "mods": {},
    "feats": [
      ["Sudden Charge", null, "Class Feat", 1],
      ["Toughness", null, "General Feat", 3]
    ],
    "specials": ["Attack of Opportunity", "Shield Block"],
    "lores": [["Warfare Lore", 2]],
    "equipment": [
      ["Longsword", 1],
      ["Steel Shield", 1],
      ["Breastplate", 1]
    ],
    "weapons": [],
    "armor": [],
    "spellCasters": [],
    "focus": {},
    "formula": [],
    "pets": []
  }
}
```

#### Core Data Formats & Conventions

- **Proficiency Scaling:**
  Proficiencies are stored as numeric integers representing proficiency rank:
- `0` = Untrained
- `2` = Trained
- `4` = Expert
- `6` = Master
- `8` = Legendary

- **Feats Format (`build.feats`):**
  Represented as a 2D array of tuples:
  `[ FeatName (string), ExtraChoice/Sub-selection (string | null), FeatType (string), LevelAcquired (int) ]`
- _Example:_ `["Natural Ambition", "Sudden Charge", "Ancestry Feat", 1]`

- **Specials (`build.specials`):**
  An array of strings representing granted class features, ancestry passive traits, and inherent abilities that are not standard selectable feats (e.g., `"Bravery"`, `"Fighter Weapon Mastery"`).
- **Lores (`build.lores`):**
  An array of tuples:
  `[ LoreName (string), ProficiencyRank (int) ]`
- _Example:_ `[["Warfare Lore", 2], ["Academia Lore", 4]]`

- **Spellcasters (`build.spellCasters`):**
  Contains an array of spellcasting entries detailing:
- `name`: Name/source of the casting tradition.
- `magicTradition`: `"arcane"`, `"divine"`, `"occult"`, or `"primal"`.
- `spellcastingType`: `"prepared"` or `"spontaneous"`.
- `ability`: Casting attribute (e.g., `"cha"`).
- `spells`: An array of objects indexed by spell level containing spell names and prepared/known status.

<a id="ob-145" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### Live Video Feed Tokens
**ID:** OB-145
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
Render a player's live webcam video feed directly inside their controlling token on the canvas battlemap using `ctx.drawImage(videoElement)` within the 60 FPS canvas loop.

<a id="ob-146" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### WebRTC Webcam Video Mesh with Draggable PIP Tiles
**ID:** OB-146
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
Floating, draggable picture-in-picture webcam tiles for players with volume sliders, active speaking rings, and minimize/dock controls over the WebRTC peer mesh.

<a id="ob-147" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### Discord Two-Way Bot Sync Gateway
**ID:** OB-147
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
**Depends On:** [OB-105](#ob-105)

Run a persistent Discord gateway bot daemon providing full two-way synchronization: messages typed in Discord text channels are relayed into OldBear room chat, and vice versa.

<a id="ob-148" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### D&D Beyond CobaltSession Auth & Private Sheets Support
**ID:** OB-148
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
**Depends On:** [OB-140](#ob-140)

Support importing private character sheets and homebrew content via user-supplied D&D Beyond `CobaltSession` authentication tokens or companion browser extension.

<a id="ob-149" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### Discord Embedded App SDK Activity Integration
**ID:** OB-149
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
Embed OldBear directly inside Discord voice channels using the Discord Embedded App SDK so players can launch and join sessions with a single click from their voice call without external links.

<a id="ob-150" class="task" data-project="old-bear-vtt" data-status="planning" data-task-type="feature"></a>
### System-Agnostic Ruleset Manifest & Characterfiles Integration
**ID:** OB-150
**Project:** Old Bear VTT
**Status:** Planning
**Type:** Feature


**Description:**
**Depends On:** [OB-135](#ob-135)

Overhaul system handling by loading external system definition manifests (display templates, stat attributes, resource pools, roll expressions) to render character sheets and token overlays dynamically without hardcoding game rules into the core VTT engine.

<a id="ob-151" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Switch Container CI/CD to GitHub Container Registry (ghcr.io)
**ID:** OB-151
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Transition the production container publishing pipeline from the private registry to GitHub Container Registry (`ghcr.io`):

- Update `.github/workflows/docker-ci.yml` to authenticate against `ghcr.io` using the automatic `GITHUB_TOKEN` with `packages: write` permissions.
- Update `scripts/ci-build.sh` default registry prefix to `ghcr.io/<owner>/`.
- Update `compose.prod.yaml` image references to pull from `ghcr.io/<owner>/oldbear_*`.
- Keep images private until ready for public release, accessible to production hosts via GitHub Personal Access Token (PAT).

<a id="ob-152" class="task" data-project="old-bear-vtt" data-status="triage" data-task-type="feature"></a>
### Integrate Help & Tooltip Component Across UI
**ID:** OB-152
**Project:** Old Bear VTT
**Status:** Triage
**Type:** Feature


**Description:**

**Depends On:** [OB-139](#ob-139)

Deploy the `<HelpTip />` component across the application once help text is settled:

- Toolbars and drawing tool flyouts.
- Token controls and persistent marker properties bar.
- Scene settings, map manager, and asset manager.
- Dice roller, initiative tracker, and chat commands.

<a id="ob-153" class="task" data-project="old-bear-vtt" data-status="triage" data-task-type="feature"></a>
### Pathfinder 2e (PF2e) Ruleset Support
**ID:** OB-153
**Project:** Old Bear VTT
**Status:** Triage
**Type:** Feature


**Description:**

**Depends On:** [OB-144](#ob-144)

Implement PF2e-specific ruleset mechanics and sheet visualization:

- Tag characters and tokens with `system: 'pf2e'`.
- Support PF2e 3-action economy glyphs (`◆`, `◆◆`, `◆◆◆`, `↺`, `◇`) on attacks and actions.
- Support Multiple Attack Penalty (MAP) buttons on strikes (0, -5, -10 or -4, -8 for agile).
- Support TEML (Trained, Expert, Master, Legendary) proficiency progression for skills, saving throws, and perception.
- PF2e roll modifiers and degree-of-success rules (critical success on DC +10 or nat 20).

<a id="ob-154" class="task" data-project="old-bear-vtt" data-status="testing" data-task-type="feature"></a>
### `GAME_MODE` Environment Configuration & Deployment Toggles
**ID:** OB-154
**Project:** Old Bear VTT
**Status:** Testing
**Type:** Feature


**Description:**

Support multi-mode deployment and runtime game mode selection via environment variables (`GAME_MODE=vtt`, `GAME_MODE=brawl`, or `GAME_MODES=vtt,brawl`):

- Single-mode instances restrict the room interface to either VTT or Brawl (ideal for dedicated subdomains like `vtt.oldbear.app` and `brawl.oldbear.app`).
- Multi-mode instances allow per-room/per-session selection (e.g. room creation dialog or `/room/:id?mode=brawl`).
- Update top navigation branding, module headers, and feature availability based on active game mode.

<a id="ob-155" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Army, Unit, and Model Domain Hierarchy & Disambiguation
**ID:** OB-155
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-154](#ob-154)

Establish the core tabletop wargaming domain model (`Army` ➔ `Unit` ➔ `Model`):

- **Data Models**:
  - `Army`: id, name, faction, pointsLimit, ruleCards, units array, and `.binder` export.
  - `Unit`: id, name, coherencyDistance, baseActions, and models array.
  - `Model`: id, name, unitId, position, baseShape, collision, attachedIndicators, and action overrides.
- **Base Geometry**:
  - Store model base shapes in millimeters (`circle`, `oval`, `rect`, `polygon`).
  - Calculate true base-to-base (perimeter-to-perimeter) measurements in inches (`"`).
- **Auto-Naming & Disambiguation**:
  - Automatic model naming defaulting to `<Unit Name> <Number>` (e.g., `Terminators 1`, `Terminators 2`).
  - Automatic duplicate unit disambiguation: `Terminators A 1`, `Terminators B 1`.
- **UI**: Interactive Army Roster Flyout and unit/model inspector panels.

<a id="ob-156" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Unit Coherency Graph Engine & Real-Time Warning Halos
**ID:** OB-156
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-155](#ob-155)

Real-time graph-based unit coherency validation engine:

- Configurable horizontal and vertical distance thresholds (defaulting to 2″ horizontal, 5″ vertical).
- Graph connectivity algorithm:
  - Units of 2–5 models: Each model must be within distance of at least 1 other model in the unit.
  - Units of 6+ models: Each model must be within distance of at least 2 other models in the unit.
- Visual feedback on canvas:
  - Pulsing warning halo on any model violating coherency.
  - Optional visual tether lines connecting models within valid coherency range.
  - Real-time evaluation during model dragging and movement.

<a id="ob-157" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Battle Round Stepper & Wargaming Phase Engine
**ID:** OB-157
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-154](#ob-154)

Battle round and turn phase management system for tabletop wargames:

- **Phases**: Standard phase stepper (e.g. Command, Movement, Shooting, Charge, Fight, Morale/Battleshock).
- **Rounds**: Tracks battle rounds (Rounds 1 through 5) and active player turns (Player 1 vs Player 2).
- **Announcements**: Animated banner at the top of the canvas and automated chat audit logs upon phase/round transitions.
- **Turn Lifecycles**: Triggers phase-specific status counter updates and scoring checks.

<a id="ob-158" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Dual-Player Chess Clocks with Turn Countdown & Active Switching
**ID:** OB-158
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-132](#ob-132)

Dedicated wargaming chess clock system for competitive matches:

- Per-player countdown timers with configurable match limits (e.g. 1 hour 30 minutes per player).
- Single-click active player clock toggle button.
- Overtime tracking with visual warning colors when player time expires.
- Pause/resume controls, audible chime alerts on player switches and low time thresholds.
- Draggable, floating HUD widget with compact minimization.

<a id="ob-159" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail
**ID:** OB-159
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-154](#ob-154)

Multi-metric match scoreboard and game resource tracker:

- Tracks Primary Victory Points (VP), Secondary VP, Command Points (CP), and Casualties for each player.
- Real-time audit trail: every score or resource modification generates a chat log message and an animated toast notification.
- Action-tied resource triggers: model or stratagem action buttons can automatically deduct CP or grant VP.

<a id="ob-160" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Objective Marker Control Zone Calculation & Auto-Scoring
**ID:** OB-160
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-134](#ob-134), [OB-159](#ob-159)

Interactive objective markers with automated control calculation:

- Deployable objective markers on canvas (e.g. 40mm center with 3″ control radius aura).
- Calculates model presence and Objective Control (OC) totals per player within the control radius.
- Automated or on-demand control checks at round start, round end, or scoring phase.
- Automatically awards VP to the controlling player, logs audit messages in chat, and toasts score updates.

<a id="ob-161" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="chore"></a>
### Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz`
**ID:** OB-161
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Chore


**Description:**

**Depends On:** [OB-155](#ob-155)

Army roster import pipeline for popular wargaming army builder exports:

- Parse NewRecruit JSON and BattleScribe `.rosz` / `.ros` XML zip archives.
- Extract army factions, detachments, point totals, units, model counts, weapon profiles, and abilities.
- Strict UGC adherence: import user roster data without bundling proprietary or copyrighted rule texts in the app codebase.
- Assign default base shapes/tokens with individual model customization, storing imported armies under the Armies tab in Asset Manager.

<a id="ob-162" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Deployment Zones, Casualty Trays & Staging Submap Templates
**ID:** OB-162
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-130](#ob-130)

Pre-configured submap templates tailored for wargaming battle scenes:

- **Deployment Zones**: Shaded, color-coded, and labeled zones matching mission pack deployment maps.
- **Casualty Tray / Graveyard**: Designated staging submap off the battlefield for eliminated models (enabling easy apothecary revives, reanimation, or casualty counting).
- **Strategic Reserves & Transports Staging**: Submap area for off-table units, deep strikers, and embarked transport units.
- One-click model transfers between the primary battlefield and staging submaps.

<a id="ob-163" class="task" data-project="old-bear-brawl" data-status="testing" data-task-type="feature"></a>
### Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls
**ID:** OB-163
**Project:** Old Bear Brawl
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-157](#ob-157), [OB-159](#ob-159)

Match administration and spectator management for events and tournaments:

- **Tournament Organizer (TO) Role**: Administrative view with ability to override scores, adjust chess clocks, pause matches, and log official rulings in chat.
- **Spectator Mode**: Read-only view for spectators with live board and scoreboard access, hiding secret secondary objectives or hidden reserve lists.
- **Match Report Export**: Export completed match summaries (scores, round history, casualty tallies, and timestamps) in JSON or printable format.

<a id="ob-164" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### My persistent indicators disappear when I change to another type of tool and they change to a different type of indicator when I change to a different indicator tool.
**ID:** OB-164
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

My persistent indicators disappear when I change to another type of tool and they change to a different type of indicator when I change to a different indicator tool.

<a id="ob-165" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Token Tether is logically attached to two tokens, but is technically attached to one and pointing to the other. I can unattach it from one, but then can't attach it to another. I can't unattach it to the other token it is attached to.
**ID:** OB-165
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Token Tether is logically attached to two tokens, but is technically attached to one and pointing to the other. I can unattach it from one, but then can't attach it to another. I can't unattach it to the other token it is attached to.

<a id="ob-166" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### My browser (Brave) prevented me from downloading the .binder file by default and required me to click keep to keep it.
**ID:** OB-166
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

My browser (Brave) prevented me from downloading the .binder file by default and required me to click keep to keep it.

<a id="ob-167" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### The box to name/rename an indicator doesn't have a way to apply the value and it isn't realtime.
**ID:** OB-167
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

The box to name/rename an indicator doesn't have a way to apply the value and it isn't realtime.

<a id="ob-168" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Token bar is too spread out. Make things like HP, temp HP, and rotation stack their children vertically instead of horizontally, or take inspiration from the indicator bar for layout.
**ID:** OB-168
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Token bar is too spread out. Make things like HP, temp HP, and rotation stack their children vertically instead of horizontally, or take inspiration from the indicator bar for layout.

<a id="ob-169" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Add a square option for sprays.
**ID:** OB-169
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Add a square option for sprays.

<a id="ob-170" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Since they need settings edited to be useful non-persistent sprays don't make sense. They should not show up unless the mode is set to persistent. The reverse is true for the laser pointer. It should only be visible in non-persistent mode. That or they should always act in the only mode they support.
**ID:** OB-170
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Since they need settings edited to be useful non-persistent sprays don't make sense. They should not show up unless the mode is set to persistent. The reverse is true for the laser pointer. It should only be visible in non-persistent mode. That or they should always act in the only mode they support.

<a id="ob-171" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Remove the /roll 5(d6+2)/4 syntax for success threshold of 4. It should just be invalid syntax. The other option makes more sense.
**ID:** OB-171
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Remove the /roll 5(d6+2)/4 syntax for success threshold of 4. It should just be invalid syntax. The other option makes more sense.

<a id="ob-172" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### The timer seems to be using our draggable window wrong as well it has a close button, but no title or minimize button and the close button is an unstyled button with an x on it.
**ID:** OB-172
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

The timer seems to be using our draggable window wrong as well it has a close button, but no title or minimize button and the close button is an unstyled button with an x on it.

<a id="ob-173" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Floating Screen Widgets & Progress Clocks Overhaul
**ID:** OB-173
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Overhauls progress clocks into a new first-class **Widget** UI paradigm, standardizes terminology on "steps", and cleans up the floating clock management window:

- **New "Widget" UI Element Paradigm**:
  - Introduce a screen-space HUD widget system operating at the same layer as draggable windows (above the canvas viewport, independent of map pan/zoom).
  - **Independent Per-User Positioning**: Clock widgets are visible to all users, but each client can drag and reposition them independently on their own screen without moving them for others.
  - **Contextual Interaction Bar**: Selecting a widget brings up a bottom toolbar (matching the token / indicator bar layout and interaction pattern).
- **Permissions & Contextual Widget Bar**:
  - **GM Edit Controls**: Only GMs can edit clock properties (step count, progress, title, color, delete). All property updates synchronize live to all connected players.
  - **Per-User Minimize Toggle**: Any user (player or GM) can toggle their own display between the radial dial and a compact horizontal progress bar via a button on the contextual bar.
- **Clock Display & Compact Mode**:
  - Radial clock display rendered with title/name displayed if non-empty.
  - Compact mode renders as a sleek 1–2 line progress bar:
    - With title: Title on top line, step progress (e.g., `3 / 6 steps`) on bottom line.
    - Without title: Step progress centered in the bar.
- **Terminology & Stepper Controls**:
  - Standardize terminology across UI and data models on **"steps"** (replacing "slices" and "wedges").
  - Use numeric stepper controls with `+` and `-` buttons (matching token bar controls) for both total step capacity and current filled steps.
- **Clocks Management Window Overhaul**:
  - Restructure floating Clocks window with standard draggable window frame controls (`useDraggableWindow`, title bar, minimize button, close button, consistent design tokens).
  - **Live Shared Instance**: Clocks in the management window and on-screen widgets are live-synced views of the exact same instance (not blueprint vs. instance).
  - **Color Picker**: Direct color selection in the management window without requiring placement in a scene.
- **Cross-Scene Persistence**:
  - Clocks persist globally across scene changes until explicitly cleared or deleted.

<a id="ob-174" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Universal .binder Collections & Card Schema Compliance
**ID:** OB-174
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-135](#ob-135)

Aligns `.binder` collection exports with the standard card schema (`docs/schema/card.json` / MonsterCards format) and adjusts import handling:

- **Export Card Schema Alignment (`card.json`)**:
  - Update `createBinderPayload()` to export collection cards adhering to the schema defined in `docs/schema/card.json` instead of the current ad-hoc wrapper (`{ id, name, type, imageUrl, data }`).
  - Flatten monster/character properties directly onto the card object (`schemaVersion: 1`, `id`, `name`, `size`, `type`, `subtype`, `alignment`, `strengthScore`, `dexterityScore`, `constitutionScore`, `intelligenceScore`, `wisdomScore`, `charismaScore`, `hitDice`, `walkSpeed`, `abilities`, `actions`, `reactions`, `legendaryActions`, etc.).
  - Map available asset `monsterData` (TetraCube/D&D 5e format) and `character` stat blocks into standard `MonsterCard` properties.
- **Collection Structure & Multiple Instances**:
  - Ensure collection objects include standard collection metadata: `id` (UUID), `name`, `description`, `cards: Card[]`.
  - Support multiple instances/duplicates of a monster, character, or NPC within a collection (e.g., multiple goblins in an encounter collection), each retaining a unique card instance ID.
- **Disable Importing from Collections & Dashboard (for now)**:
  - Remove/disable the fallback import from `collections` and `dashboard` in `importBinderData()`.
  - OldBear will import exclusively from the native `_oldbear` extension block until shared interchange rules and a unified schema are formalized.
  - Non-destructively preserve any third-party `collections` and `dashboard` payloads during re-export.

<a id="ob-175" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Like everything else that toasts the timer should log to chat when time is up.
**ID:** OB-175
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Like everything else that toasts the timer should log to chat when time is up.

<a id="ob-176" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### HelpTip components inside draggable windows have their tooltips clipped by the window. Can we make it float above the window like an ov4erlay?
**ID:** OB-176
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

HelpTip components inside draggable windows have their tooltips clipped by the window. Can we make it float above the window like an ov4erlay?

<a id="ob-177" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Pathfinder 2e Reference Data Import (Foundry PF2e Packs)
**ID:** OB-177
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Import public, open-licensed Pathfinder 2e / Starfinder 2e reference material (spells, equipment, feats, actions, bestiary statblocks) directly from public repository packs (such as the Foundry VTT PF2e compendium packs at `https://github.com/foundryvtt/pf2e/tree/v14-dev/packs`):

- Ingest raw JSON packs for spells, equipment, feats, and bestiary creatures without requiring heavy web scraping or full game engine dependencies.
- Map action point costs (1 Action `◆`, 2 Actions `◆◆`, 3 Actions `◆◆◆`, Reaction `↺`, Free Action `◇`) and trait lists (`[Agile]`, `[Evocation]`, `[Finesse]`, `[Magical]`) onto the unified `EntityAction` schema.
- Support referencing via chat inspection (`/spell? <name>`, `/item? <name>`) or direct command (`/import pf2e <url>`).

<a id="ob-178" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Make draggable windows use a common title bar component that contains an icon on the left then title text left aligned and ellipsized if it cant fit, followed by the minimize and close buttons. the minimize action should know what height to animate to based on the height of this component and possibly some extra padding/margin. Give an opinion on whether this should be part of a window component or something similar or if we should just have the title bar for now.
**ID:** OB-178
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Make draggable windows use a common title bar component that contains an icon on the left then title text left aligned and ellipsized if it cant fit, followed by the minimize and close buttons. the minimize action should know what height to animate to based on the height of this component and possibly some extra padding/margin. Give an opinion on whether this should be part of a window component or something similar or if we should just have the title bar for now.

<a id="ob-179" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="bug"></a>
### Chat Input Message History Navigation (Up/Down Arrow Keys)
**ID:** OB-179
**Project:** Old Bear VTT
**Status:** Done
**Type:** Bug


**Description:**

Enable cycling through sent chat messages and commands in the chat panel input box using the keyboard:

- Pressing **Up Arrow** when cursor is at the beginning of the input (or empty) cycles backward through previously sent messages/commands.
- Pressing **Down Arrow** cycles forward through previously sent messages, restoring the currently typed draft when reaching the bottom.
- Preserves unsaved in-progress message draft when beginning history traversal so user input is never lost.
- Allows fast fixing of typos in commands like `/roll`, `/spell`, or `/import` without retyping the entire string.

<a id="ob-180" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### System-Agnostic EntityAction Schema & Statblock Card Renderer
**ID:** OB-180
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

Create a unified, system-agnostic action and reference schema ([docs/system-agnostic-import.md](docs/system-agnostic-import.md)) that represents spells, attacks, equipment items, features, and feats consistently across systems:

- Define `EntityAction` with fields: `id`, `name`, `type`, `description`, `cost`, `traits`, `range`, `target`, `duration`, `savingThrow`, `rollFormula`, `damageFormula`, `damageType`, `sourceUrl`, and `sourceSystem`.
- Display action cost badges for D&D 5e (`Action`, `Bonus Action`, `Reaction`, `Free`) and PF2e (`◆`, `◆◆`, `◆◆◆`, `↺`, `◇`) alongside visual trait pills without hardcoded rules enforcement engines.
- Create rich `<StatBlockCard />` component for rendering compact, beautiful markdown statblocks in chat and hover tooltips.

<a id="ob-181" class="task" data-project="old-bear-vtt" data-status="done" data-task-type="feature"></a>
### Statblock Inspection Syntax (`?`) for Chat Commands
**ID:** OB-181
**Project:** Old Bear VTT
**Status:** Done
**Type:** Feature


**Description:**

**Depends On:** [OB-180](#ob-180)

Add a trailing question mark (`?`) convention to chat commands to display reference cards and statblocks without triggering a dice roll or spending an action:

- Support `/spell? <name>`, `/item? <name>`, `/attack? <name>`, `/ability? <name>`, and `/monster? <name>`.
- Standard usage without `?` performs the active roll/cast (e.g. `/spell magic-missile` makes the damage/attack roll).
- Inspection mode displays the formatted `<StatBlockCard />` in chat (or local popover) with action cost, traits, full rules text, and a `[+ Add to Character]` button.

<a id="ob-182" class="task" data-project="old-bear-vtt" data-status="testing" data-task-type="feature"></a>
### Associate Controllable Token with Chat Panel
**ID:** OB-182
**Project:** Old Bear VTT
**Status:** Testing
**Type:** Feature


**Description:**

Enable associating a controllable token with the chat panel so commands like `/attack`, `/spell`, rolls, and in-character speech are attributed directly to that token:

- Added **Speaking as:** selector bar above chat message input displaying controllable tokens and a `[Bind Selected]` button for the actively selected canvas token.
- Added `/token` slash commands:
  - `/token`: Lists controllable tokens with index numbers.
  - `/token <index|name>`: Associates speaking identity with that token.
  - `/token clear`: Clears the association back to player name.
  - `/as <name> <message>`: One-off in-character speech.
- Attributed chat actions:
  - `/attack [name]` and `/attack? [name]`: Uses the token's character sheet or monster actions.
  - `/spell [name]` and `/spell? [name]`: Casts or inspects spells from the associated token.
  - `/roll d20+init`: Automatically rolls initiative using the associated token's initiative bonus / dexterity modifier.
  - Attributed rolls and messages display `Player (TokenName)` and render the token's avatar image.

<a id="ob-183" class="task" data-project="old-bear-vtt" data-status="testing" data-task-type="chore"></a>
### Codebase Simplification & Refactoring Plan (docs/refactor-1.md)
**ID:** OB-183
**Project:** Old Bear VTT
**Status:** Testing
**Type:** Chore


**Description:**

Perform an architectural review of the codebase and create [docs/refactor-1.md](docs/refactor-1.md) detailing 8 high-impact refactoring tasks:

- **REF-001**: Unified Entity Statblock & Character Schema Consolidation (consolidating `DnDCharacter`, `MonsterCard`, and `EntityStatBlock`).
- **REF-002**: Modular Slash Command Registry & Evaluators (extracting handlers from monolithic `ChatPanel.tsx`).
- **REF-003**: State Hook Extraction from `AppVtt.tsx` (`useVttModalManager`, `useVttNetworkSync`, `useTokenSelection`).
- **REF-004**: Extraction of Headless `BackupService` & `BinderService` from `DataBackupModal.tsx`.
- **REF-005**: Modular Character Sheet Tabs & Editor Components (`CharacterFlyout.tsx` decomposition).
- **REF-006**: Unified `UniversalImporter` Pipeline (consolidating D&D Beyond, PF2e, Open5e, and TetraCube parsers).
- **REF-007**: Strategy Pattern for Canvas Interaction Tools (`CanvasEngine.ts` and `PointerSystem.ts` decoupling).
- **REF-008**: Unified Storage Repository & Key Registry (centralizing `localStorage` and `IndexedDB` access).

<a id="ob-184" class="task" data-project="old-bear-vtt" data-status="testing" data-task-type="feature"></a>
### HelpTip Component & Placement Guide (docs/helptip-locations.md)
**ID:** OB-184
**Project:** Old Bear VTT
**Status:** Testing
**Type:** Feature


**Description:**

**Depends On:** [OB-176](#ob-176)

Audit the user interface across all modals, panels, and toolbars and create [docs/helptip-locations.md](docs/helptip-locations.md) detailing exact integration points for `<HelpTip />`:

- Catalogs 9 core application areas: Map Settings (`MapSettingsModal`), Token Interaction Bar (`TokenControls`), Chat Panel (`ChatPanel`), Initiative Tracker (`InitiativeTracker`), Floating Clocks & Timers (`ClockWidgetBar`, `TimerHUD`), Character Sheet (`CharacterFlyout`), Canvas Tools (`ToolBar`, `MarkerControls`), Data Backup (`DataBackupModal`), and Audio Streaming (`VoiceSettingsModal`, `SoundboardModal`).
- Specifies placement properties (`title`, `placement`, `shortcut`, and exact copy) for each location with High, Medium, and Low priorities.
- Details a 3-phase execution roadmap prioritizing high-traffic onboarding friction points (grid alignment, token status lifecycles, and chat commands).

<a id="ob-185" class="task" data-project="old-bear-vtt" data-status="testing" data-task-type="feature"></a>
### Backlog Research & Implementation Guide (docs/backlog-implementation-guide.md)
**ID:** OB-185
**Project:** Old Bear VTT
**Status:** Testing
**Type:** Feature


**Description:**

Perform in-depth architectural and technical research across all backlog tasks and compile [docs/backlog-implementation-guide.md](docs/backlog-implementation-guide.md):

- **WebRTC Video Mesh & Tokens (OB-145, OB-146)**: Media renegotiation in `VoiceManager.ts`, resolution limits for mesh peer scaling, canvas `<video>` token avatars via `TokenRenderer.ts`, and floating PIP tiles.
- **Discord Integrations (OB-147, OB-149)**: Discord bot gateway architecture for two-way chat/roll sync and Discord Embedded App SDK activity authorization for one-click launching inside voice channels.
- **D&D Beyond Auth & Private Sheets (OB-148)**: Analysis of `Cobalt-Session` cookie auth, local client storage vs ephemeral proxy header forwarding, and browser companion extension options.
- **System-Agnostic Ruleset Manifests (OB-150)**: Schema design for dynamic attributes, pools, and dice engines, decoupling sheets from hardcoded 5e/PF2e code.
- **Pathfinder 2e Mechanics (OB-153)**: Multiple Attack Penalty (MAP) calculation buttons, 4-tier degrees of success (+10/-10 DC thresholds), and turn condition tracking.
- **Mobile Touch Usability (OB-137, OB-138)**: Ergonomic finger touch offset (-40px) to prevent finger occlusion during token drags, and mobile interaction bar safe-area insets.
- **Wargaming Engine Roadmap (OB-154 through OB-163)**: Multi-mode deployment (`GAME_MODE`), BattleScribe/NewRecruit roster ingestion, unit coherency graph checks, dual chess clocks, and objective zone scoring.

<a id="ob-186" class="task" data-project="shared" data-status="done" data-task-type="bug"></a>
### Unable to create new maps or duplicate existing ones.
**ID:** OB-186
**Project:** Shared
**Status:** Done
**Type:** Bug


**Description:**
The buttons do nothing when clicked.

- [x]

<a id="ob-187" class="task" data-project="old-bear-vtt" data-status="ready" data-task-type="feature"></a>
### Submap & Deployment Zone Customization UI (Position, Dimensions, Colors, Background Images)
**ID:** OB-187
**Project:** Old Bear VTT
**Status:** Ready
**Type:** Feature


**Description:**
Provide user interface controls to edit, position, resize, style, and set backgrounds for secondary submaps and deployment zones:

- [ ] **Submap Property Editor in MapSettingsModal**: Expandable editor or drawer for each submap in the Secondary Submaps & Staging section.
- [ ] **Positioning & Sizing Controls**: Inputs for canvas offset coordinates (X, Y) and dimensions (Width, Height) in pixels or grid cells.
- [ ] **Color & Border Styling**: Color picker/swatches for border outline (borderColor/colorCode) and background fill/tint (backgroundColor).
- [ ] **Background Image Support**: Asset picker or image URL input to set custom floor plans/battlemaps for submaps (imageUrl).
- [ ] **Testing**: Automated unit tests for updating submap properties and preserving them across scene saves and template duplications.

<a id="ob-188" class="task" data-project="old-bear-vtt" data-status="ready" data-task-type="feature"></a>
### Relative Dragging for Tokens, Modular Tiles, and Props
**ID:** OB-188
**Project:** Old Bear VTT
**Status:** Ready
**Type:** Feature


**Description:**
Make dragging tokens, modular tiles, and props relative to the initial cursor grab point instead of jumping the token origin or pivot to the cursor position on drag start.

### Requirements:

- [ ] On token drag start in `CanvasEngine`, record the cursor grab offset relative to the token origin or initial pointer position.
- [ ] During drag move, compute the token's raw position relatively using the initial grab offset (`worldPos - grabOffset`).
- [ ] Ensure grid snapping and magnetic edge-to-edge snapping maintain clean alignment to the grid without abruptly jumping the token center or pivot directly under the cursor.
- [ ] Preserve multi-token group drag relative offsets for all selected tokens.
- [ ] Verify dragging feels natural for both standard 1x1 tokens and large multi-tile props (e.g. 8x8 rooms, 4x1 corridors).

<a id="ob-189" class="task" data-project="cmn" data-status="triage" data-task-type="feature"></a>
### Add a way to edit tiles after they have been uploaded.
**ID:** OB-189
**Project:** Common
**Status:** Triage
**Type:** Feature


**Description:**
Add a way to edit tiles after they have been uploaded. I can't set their sizes or anything, but name them. Draw a random tile should pan the view so the tile is in the center.

- [ ]

<a id="ob-190" class="task" data-project="cmn" data-status="ready" data-task-type="bug"></a>
### When tiles is selected the tab bar in the asset manager is positioned up underneath the header.
**ID:** OB-190
**Project:** Common
**Status:** Ready
**Type:** Bug


**Description:**
When tiles is selected the tab bar in the asset manager is positioned up underneath the header. This happens for scenes as well once I make a third scene. It appears related to when the content height is large. When a scrollbar appears the tab bar moves up. When the scrollabe conten is even larger the tab bar moves up even further.

- [ ]

<a id="ob-191" class="task" data-project="cmn" data-status="ready" data-task-type="feature"></a>
### Make no ring color be the default for props and tiles.
**ID:** OB-191
**Project:** Common
**Status:** Ready
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-192" class="task" data-project="cmn" data-status="triage" data-task-type="bug"></a>
### Custom statuses can't be created.'
**ID:** OB-192
**Project:** Common
**Status:** Triage
**Type:** Bug


**Description:**
Custom statuses are saved and loaded at the global and scene levels, but they don't appear to be available in the add status dropdown on the token bar. There also does not appear to be any way to add/edit/remove them so there just aren't any. Even our 'DEFAULT_STATUS_DEFINITIONS' are only checked by the initiative tracker they are not displayed anywhere. See [OB-130](#ob-130).

- [ ]

<a id="ob-193" class="task" data-project="cmn" data-status="triage" data-task-type="feature"></a>
### Add a way to change token images to existing images.
**ID:** OB-193
**Project:** Common
**Status:** Triage
**Type:** Feature


**Description:**
I should be able to change the image on a token after it has been created. I can upload a new image, but I should be able to browse my saved tokens and the preset tokens to use one of those as well.

- [ ]

<a id="ob-194" class="task" data-project="cmn" data-status="ready" data-task-type="bug"></a>
### The hitbox for tapping a token should be anywhere within it's ring border.
**ID:** OB-194
**Project:** Common
**Status:** Ready
**Type:** Bug


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-195" class="task" data-project="cmn" data-status="triage" data-task-type="feature"></a>
### Add zoom and offset to the PRESET_TOKENS in TokenPickerModal.
**ID:** OB-195
**Project:** Common
**Status:** Triage
**Type:** Feature


**Description:**
I want to add zoom and offset or their equivalents to the PRESET_TOKENS in TokenPickerModal and use those values when showing the icons in the picker and when creating the tokens.

- [ ]

<a id="ob-196" class="task" data-project="cmn" data-status="ready" data-task-type="feature"></a>
### Move chat back to the left sidebar. Put it below the measuring tape icon.
**ID:** OB-196
**Project:** Common
**Status:** Ready
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-197" class="task" data-project="cmn" data-status="ready" data-task-type="bug"></a>
### Brawl mode does not have a top bar so I cannot switch back. See [OB-154](#ob-154).
**ID:** OB-197
**Project:** Common
**Status:** Ready
**Type:** Bug


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-198" class="task" data-project="vtt" data-status="ready" data-task-type="feature"></a>
### Reveal fog should be 'shift-f' instead of 'r' for the shortcut key.
**ID:** OB-198
**Project:** Vtt
**Status:** Ready
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-199" class="task" data-project="vtt" data-status="triage" data-task-type="feature"></a>
### Make fog be a single layer.
**ID:** OB-199
**Project:** Vtt
**Status:** Triage
**Type:** Feature


**Description:**
The Reveal fog tool only removes from the topmost layer of fog it encounters. We should only have 1 layer at a time and track it as an svg preferably or a raster image so we can brush it on and off later.

- [ ]

<a id="ob-200" class="task" data-project="vtt" data-status="ready" data-task-type="feature"></a>
### I want to be able to add attacks to a token without syncing it with a character.
**ID:** OB-200
**Project:** Vtt
**Status:** Ready
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-201" class="task" data-project="vtt" data-status="ready" data-task-type="bug"></a>
### When a player spawns a token it should automatically be controlled by them. See [OB-143](#ob-143).
**ID:** OB-201
**Project:** Vtt
**Status:** Ready
**Type:** Bug


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-202" class="task" data-project="cmn" data-status="triage" data-task-type="feature"></a>
### Make help in chat look better.
**ID:** OB-202
**Project:** Common
**Status:** Triage
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-203" class="task" data-project="cmn" data-status="triage" data-task-type="feature"></a>
### Make draggable windows resizable on desktop. Especially chat.
**ID:** OB-203
**Project:** Common
**Status:** Triage
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-204" class="task" data-project="vtt" data-status="triage" data-task-type="bug"></a>
### Error when trying to import pf2 content with /import
**ID:** OB-204
**Project:** Vtt
**Status:** Triage
**Type:** Bug


**Description:**
Error when trying to import pf2 content with /import Uncaught TypeError: Cannot read properties of undefined (reading 'toUpperCase') at StatBlockCard (StatBlockCard.tsx:330:48) See [OB-177](#0b-177).

- [ ]

<a id="ob-205" class="task" data-project="vtt" data-status="ready" data-task-type="bug"></a>
### The add to character sheet button on an inspected spell adds to the currently selected character. Not the as token.
**ID:** OB-205
**Project:** Vtt
**Status:** Ready
**Type:** Bug


**Description:**
Inspecting a spell like '/spell? magic missile' shows the spell adds the spell to the wrong character/token. The add to character sheet button adds to the currently selected character on the character sheet page, not to the 'as->' character in chat. See [OB-177](#0b-177).

<a id="ob-206" class="task" data-project="vtt" data-status="ready" data-task-type="bug"></a>
### Inspecting a spell like /spell? magic missile' shows the spell, but it has the wrong buttons.
**ID:** OB-206
**Project:** Vtt
**Status:** Ready
**Type:** Bug


**Description:**
Inspecting a spell like '/spell? magic missile' shows the spell, but it has a spawn token button and no add to character sheet button. Only gm can see or use the add to character sheet button. See [OB-177](#0b-177).

<a id="ob-207" class="task" data-project="vtt" data-status="ready" data-task-type="bug"></a>
### Changing to a token without a bound character sheet should reset the form to the token's state.
**ID:** OB-207
**Project:** Vtt
**Status:** Ready
**Type:** Bug


**Description:**
I added a token via Create without image. I already have my character sheet window open. I click on another token and see all the details for that token's character. I click the new 'Hero' token and the character sheet doesn't change. When I click on a token without a bound hero the character sheet should go to the default state and then let me select a character from the dropdown to synchronize with.

- [ ]

<a id="ob-208" class="task" data-project="vtt" data-status="ready" data-task-type="feature"></a>
### Update the Open5EFetcher to use the v2 api.
**ID:** OB-208
**Project:** Vtt
**Status:** Ready
**Type:** Feature


**Description:**
Describe task objectives and implementation requirements here.

- [ ]

<a id="ob-209" class="task" data-project="cmn" data-status="done" data-task-type="bug"></a>
### There is no settings button next to the active scene name in the top bar.
**ID:** OB-209
**Project:** Common
**Status:** Done
**Type:** Bug

**Description:**
Provide a dedicated settings button (gear icon) next to the active scene name in the top navigation bar to open the Scene Settings modal directly.

- [x] Add Settings icon button next to active scene name in `TopBar.tsx` for GMs.
- [x] Add Settings icon button next to active scene name in `BrawlTopBar.tsx` for Tournament Organizers.
- [x] Wire `onOpenSceneSettings` in `AppVtt.tsx` and `AppBrawl.tsx` to open `MapSettingsModal` for the active scene.
- [x] Preserve role-based access so non-GM players see the scene name without the settings trigger.
- [x] Verify component rendering and permissions with unit tests in `TopBar.test.ts` and `BrawlTopBar.test.ts`.

<a id="ob-210" class="task" data-project="cmn" data-status="done" data-task-type="chore"></a>
### Remove references to rodeo and obr to be nice.
**ID:** OB-210
**Project:** Common
**Status:** Done
**Type:** Chore

**Description:**
Describe task objectives and implementation requirements here.
- [ ]

---

## Notes

#### Projects (Rendered from frontmatter projects)

| Value          | Label          | Prefix | Path |
| :------------- | :------------- | :----- | :--- |
| old-bear-vtt   | Old Bear VTT   | OBV    | .    |
| old-bear-brawl | Old Bear Brawl | OBB    | .    |

#### Task Statuses (Rendered from frontmatter task-statuses)

| Value       | Label       | Description                               |
| :---------- | :---------- | :---------------------------------------- |
| triage      | Triage      | Task is still being defined.              |
| ready       | Ready       | Task is ready to be worked on.            |
| in-progress | In Progress | Task is currently being worked on.        |
| testing     | Testing     | Task is currently being tested.           |
| blocked     | Blocked     | Task is waiting on external dependencies. |
| done        | Done        | Task is completed and verified.           |

#### Task Types (Rendered from frontmatter task-types)

| Value   | Label   | Prefix | Description                                               |
| :------ | :------ | :----- | :-------------------------------------------------------- |
| bug     | Bug     | BUG    | The task is a bug to fix.                                 |
| feature | Feature | ENH    | The task is a new feature to implement.                   |
| chore   | Chore   | CHR    | The task is a routine maintenance or administrative task. |
