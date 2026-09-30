# Codebase Simplification & Refactoring Plan (Phase 1)

This document outlines architectural recommendations and actionable tasks to simplify the OldBear VTT codebase, combine redundant types and files, decouple monolithic components, and improve long-term maintainability.

---

## Executive Summary of Findings

1. **Schema Duplication Across Entities**: The codebase currently defines three distinct representations for characters and creatures: `DnDCharacter` (5e sheet), `MonsterCard` (TetraCube/Universal Card schema), and `EntityStatBlock` (system-agnostic statblock with `EntityAction`). These should be unified under a single canonical entity model or adapter interface.
2. **Monolithic UI Components**: Four primary client components account for over 320 KB (~7,500 lines) of code:
   - `AppVtt.tsx` (~2,400 lines / 101 KB)
   - `ChatPanel.tsx` (~1,800 lines / 86 KB)
   - `DataBackupModal.tsx` (~1,700 lines / 77 KB)
   - `CharacterFlyout.tsx` (~1,200 lines / 60 KB)
3. **Scattered Ingestion & Parser Pipelines**: Importers are split between `packages/client/src/vtt/utils/` (`dndBeyondParser.ts`, `pathbuilderParser.ts`, `monsterParser.ts`) and `packages/client/src/common/utils/` (`open5eFetcher.ts`, `pf2eFetcher.ts`, `importDetector.ts`), each converting to different output targets.
4. **Canvas Engine & Pointer System Coupling**: `CanvasEngine.ts` and `PointerSystem.ts` contain intertwined tool logic (select, ruler, spray, marker, fog, props) in monolithic switch statements and state flags rather than modular tool strategies.
5. **Ad-Hoc Storage Access**: `localStorage` keys and `IndexedDB` calls are distributed across component lifecycle hooks, making migration, serialization, and testing error-prone.

---

## Refactoring Task Matrix

| Task ID | Component / Area | Focus | Complexity | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **REF-001** | `packages/shared/src/types.ts` | Unified Entity Statblock & Character Schema | Medium | High |
| **REF-002** | `packages/client/src/common/components/ChatPanel.tsx` | Modular Slash Command Registry & Evaluators | Medium | High |
| **REF-003** | `packages/client/src/vtt/AppVtt.tsx` | State Hook Extraction (`useVttState`, `useVttNetworking`) | High | High |
| **REF-004** | `packages/client/src/common/components/DataBackupModal.tsx` | Extraction of Headless `BackupService` & `BinderService` | Medium | Medium |
| **REF-005** | `packages/client/src/vtt/components/CharacterFlyout.tsx` | Modular Character Sheet Tabs & Editor Components | Medium | Medium |
| **REF-006** | `packages/client/src/vtt/utils/` & `common/utils/` | Unified `UniversalImporter` Pipeline | Low | High |
| **REF-007** | `packages/client/src/common/engine/PointerSystem.ts` | Strategy Pattern for Canvas Interaction Tools | High | Medium |
| **REF-008** | `packages/client/src/common/storage/` | Unified Storage Repository & Key Registry | Low | Medium |

---

## Detailed Task Specifications

### REF-001: Unified Entity Statblock & Character Schema Consolidation

**App:** Shared / Client  
**Current Files:**  
- `packages/shared/src/types.ts` (`DnDCharacter`, `MonsterCard`, `EntityStatBlock`, `Token`)  
- `packages/shared/src/protocol.ts`  
- `packages/client/src/common/components/ChatPanel.tsx`  
- `packages/client/src/vtt/components/CharacterFlyout.tsx`  

**Problem:**  
- `Token` currently has optional fields `.character?: DnDCharacter` and `.monsterData?: MonsterCard`, in addition to root-level stats (`currentHp`, `maxHp`, `initiativeBonus`).  
- `EntityStatBlock` (introduced in OB-180) supports system-agnostic actions (`EntityAction`), traits, AC, and HP.  
- Components like `ChatPanel` and `StatBlockCard` have to synthesize fallbacks and convert between `MonsterCard` and `DnDCharacter` dynamically to resolve actions or initiative rolls.  

**Proposed Refactor:**  
1. Make `EntityStatBlock` the single canonical statblock schema across the entire application.  
2. Redefine `Token.statblock?: EntityStatBlock`. Deprecate `.monsterData` and `.character` by adding bi-directional adapter functions (`characterToStatblock()`, `monsterCardToStatblock()`).  
3. Allow `Token` to directly derive its actions, spells, AC, and initiative bonuses from `statblock`.  

---

### REF-002: Modular Slash Command Registry & Evaluators

**App:** Client (Chat)  
**Current Files:**  
- `packages/client/src/common/components/ChatPanel.tsx` (~1,800 lines)  
- `packages/client/src/common/components/chat.test.ts`  

**Problem:**  
- `ChatPanel.tsx` handles UI rendering, token selection, command parsing (`/roll`, `/token`, `/as`, `/attack`, `/spell`, `/skill`, `/item`, `/monster`, `/import`, `/help`), Open5e API requests, PF2e pack fetching, and dice rolling in a single giant file.  
- Adding or modifying a command requires changing the main component and runs the risk of breaking unrelated chat interactions.  

**Proposed Refactor:**  
1. Create a command registry in `packages/client/src/common/chat/`:  
   - `types.ts`: `SlashCommandDefinition`, `SlashCommandContext`, `SlashCommandResult`.  
   - `CommandRegistry.ts`: Dispatches incoming slash commands to registered handlers.  
   - `commands/rollCommands.ts`: `/roll`, `/r`, `/as`.  
   - `commands/tokenCommands.ts`: `/token`.  
   - `commands/actionCommands.ts`: `/attack`, `/spell`, `/skill`, `/item`, `/ability`.  
   - `commands/importCommands.ts`: `/import`, `/monster?`.  
2. `ChatPanel.tsx` becomes a slim React UI container (~350 lines) rendering messages and the input bar.  

---

### REF-003: State Hook Extraction from `AppVtt.tsx`

**App:** Client (VTT)  
**Current Files:**  
- `packages/client/src/vtt/AppVtt.tsx` (~2,400 lines)  

**Problem:**  
- `AppVtt.tsx` holds more than 35 `useState` and `useRef` hooks managing modal visibility, token controls, fog-of-war, drawing markers, submap boundaries, initiative tracking, and audio playback.  
- Passing 30+ props down to modals makes tracing state changes difficult.  

**Proposed Refactor:**  
1. Extract modal visibility and active window state into `useVttModalManager()`:  
   - Manages active dialog states (`characterFlyout`, `mapSettings`, `soundboard`, `dataBackup`, `progressClocks`, `timerHud`, etc.).  
2. Extract WebSocket signaling and sync logic into `useVttNetworkSync()`:  
   - Handles remote token broadcasts, scene switches, chat message propagation, and sync reconciliation.  
3. Extract token interaction state into `useTokenSelection()`:  
   - Coordinates active token selection, multi-token drag, deletion, and rotation.  
4. Keep `AppVtt.tsx` strictly focused on layout composition and canvas orchestration (<600 lines).  

---

### REF-004: Extraction of Headless `BackupService` & `BinderService`

**App:** Client (Storage / Common)  
**Current Files:**  
- `packages/client/src/common/components/DataBackupModal.tsx` (~1,700 lines)  
- `packages/client/src/common/storage/BackupManager.ts`  
- `packages/client/src/common/storage/BinderPipeline.ts`  

**Problem:**  
- `DataBackupModal.tsx` contains extensive domain logic: building zip archives, fetching and encoding audio tracks, validating JSON schemas against `.binder` specifications, extracting monster cards, and generating data URLs.  
- This business logic cannot easily be reused in automated migrations or non-modal workflows.  

**Proposed Refactor:**  
1. Move archive generation and parsing into `src/common/storage/services/`:  
   - `BackupExportService.ts`: Collects scenes, tokens, characters, audio tracks, and compiles standard backups.  
   - `BinderExportService.ts`: Converts local data into schema-compliant `https://schemas.ttrpgwith.me/v1/binder.json` files and extracts `collections`.  
   - `ImportParserService.ts`: Validates and unpacks `.json`, `.binder`, and `.backup` streams.  
2. `DataBackupModal.tsx` is reduced to an options view with progress bars and buttons.  

---

### REF-005: Modular Character Sheet Tabs & Editor Components

**App:** Client (VTT)  
**Current Files:**  
- `packages/client/src/vtt/components/CharacterFlyout.tsx` (~1,200 lines)  

**Problem:**  
- Combines 5e sheet display, PF2e sheet display, saved characters list, D&D Beyond URL sync, Pathbuilder build ID fetcher, and manual stat edits in one file.  
- High cognitive load when editing layout or adding support for additional systems.  

**Proposed Refactor:**  
1. Split into focused subcomponents under `packages/client/src/vtt/components/character/`:  
   - `CharacterSheet5e.tsx`: 5e ability modifiers, proficiencies, spell slots, actions.  
   - `CharacterSheetPF2e.tsx`: PF2e 4-tier proficiency tracks, strikes, 3-action economy glyphs.  
   - `CharacterImportBar.tsx`: Tabbed inputs for D&D Beyond URL/ID, Pathbuilder ID, and file drag-and-drop.  
   - `SavedCharactersDrawer.tsx`: List and management of locally saved sheets.  
2. `CharacterFlyout.tsx` serves as the outer container and tab switcher.  

---

### REF-006: Unified `UniversalImporter` Pipeline

**App:** Client (Common)  
**Current Files:**  
- `packages/client/src/vtt/utils/dndBeyondParser.ts`  
- `packages/client/src/vtt/utils/pathbuilderParser.ts`  
- `packages/client/src/vtt/utils/monsterParser.ts`  
- `packages/client/src/common/utils/open5eFetcher.ts`  
- `packages/client/src/common/utils/pf2eFetcher.ts`  
- `packages/client/src/common/utils/importDetector.ts`  

**Problem:**  
- Parsers reside in two different packages directories (`vtt/utils` vs `common/utils`).  
- Every parser defines its own external shape and manually constructs varying internal representations.  

**Proposed Refactor:**  
1. Group all parsers into `packages/client/src/common/importers/`:  
   - `UniversalImporter.ts`: Detects format (D&D Beyond, Pathbuilder, TetraCube, Open5e, Foundry PF2e) and delegates to the appropriate parser.  
   - Standardize output: all creature/item/spell parsers return an `EntityStatBlock` or `Token`.  
2. Share common text cleanups (HTML stripping, markdown sanitizing, formula extraction) via `importerUtils.ts`.  

---

### REF-007: Strategy Pattern for Canvas Interaction Tools

**App:** Client (Engine)  
**Current Files:**  
- `packages/client/src/common/engine/CanvasEngine.ts` (~1,600 lines)  
- `packages/client/src/common/engine/PointerSystem.ts` (~1,350 lines)  

**Problem:**  
- `PointerSystem.ts` checks `activeTool` in large switch statements (`case 'select':`, `case 'marker':`, `case 'ruler':`, `case 'spray':`, `case 'fog':`, `case 'prop':`).  
- Mouse event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) are bloated with conditionals for each tool's private state (e.g. `activeSpray`, `rulerStart`, `fogRect`).  

**Proposed Refactor:**  
1. Define a `CanvasTool` interface:  
   ```typescript
   interface CanvasTool {
     onPointerDown(e: CanvasPointerEvent): void;
     onPointerMove(e: CanvasPointerEvent): void;
     onPointerUp(e: CanvasPointerEvent): void;
     renderOverlay?(ctx: CanvasRenderingContext2D): void;
     cleanup?(): void;
   }
   ```  
2. Implement discrete tool classes: `SelectTool`, `RulerTool`, `MarkerTool`, `SprayTool`, `FogTool`, `PropTool`.  
3. `PointerSystem` simply delegates events to the currently active `CanvasTool` strategy.  

---

### REF-008: Unified Storage Repository & Key Registry

**App:** Client (Common)  
**Current Files:**  
- `packages/client/src/vtt/storage/characterStorage.ts`  
- `packages/client/src/common/storage/db.ts`  
- `packages/client/src/common/status/StatusManager.ts`  
- Various components calling `localStorage.getItem()` / `setItem()`  

**Problem:**  
- Storage keys (e.g., `'oldbear_characters'`, `'oldbear_custom_statuses'`, `'vtt_active_scene'`, `'clock_widgets'`) are hardcoded string literals across files.  
- No central validation or error handling if `localStorage` quota is exceeded.  

**Proposed Refactor:**  
1. Create `packages/client/src/common/storage/StorageRegistry.ts`:  
   - Centralize all storage keys in an enum or const object.  
   - Provide typed getters and setters with schema validation and safe `try/catch` fallbacks.  
2. Standardize IndexedDB access through a unified database helper.  

---

## Recommended Execution Order

1. **Step 1 (Low Risk, Immediate Relief):** **REF-006** (Consolidate importers into `common/importers`) & **REF-008** (Storage key registry).  
2. **Step 2 (Feature Decoupling):** **REF-002** (Chat slash command registry) & **REF-004** (Headless backup/binder services).  
3. **Step 3 (Core Schema Alignment):** **REF-001** (Unified `EntityStatBlock`).  
4. **Step 4 (UI & Canvas Simplification):** **REF-005** (Character flyout tabs), **REF-003** (`AppVtt` hook extraction), and **REF-007** (Canvas tool strategies).  
