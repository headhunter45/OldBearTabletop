# Manual Task Verification Guide

This document provides step-by-step instructions for manually verifying all features currently in **Testing** status in [Tasks.md](file:///Users/tom/Projects/OldBearVTT/Tasks.md). Each entry includes the task ID, feature title, prerequisites/UI location, execution steps, and pass/fail criteria.

---

## Table of Contents

| Task ID | Feature Title | Domain | Status |
| :--- | :--- | :--- | :--- |
| **[OB-128](#ob-128---modular--tileable-maps--snapping-map-tiles)** | Modular / Tileable Maps & Snapping Map Tiles | VTT Engine | Testing |
| **[OB-130](#ob-130---submaps--secondary-logical-maps-per-scene)** | Submaps & Secondary Logical Maps per Scene | VTT Engine | Testing |
| **[OB-131](#ob-131---custom-configurable-statuses-with-counters--turn-lifecycles)** | Custom Configurable Statuses with Counters & Turn Lifecycles | VTT Engine | Testing |
| **[OB-143](#ob-143---direct-token-creation-from-dd-beyond-monstercharacter-url)** | Direct Token Creation from D&D Beyond Monster/Character URL | Character / Importers | Testing |
| **[OB-154](#ob-154---game_mode-environment-configuration--deployment-toggles)** | `GAME_MODE` Environment Configuration & Deployment Toggles | Platform / Brawl | Testing |
| **[OB-155](#ob-155---army-unit-and-model-domain-hierarchy--disambiguation)** | Army, Unit, and Model Domain Hierarchy & Disambiguation | Wargaming / Brawl | Testing |
| **[OB-156](#ob-156---unit-coherency-graph-engine--real-time-warning-halos)** | Unit Coherency Graph Engine & Real-Time Warning Halos | Wargaming / Brawl | Testing |
| **[OB-157](#ob-157---battle-round-stepper--wargaming-phase-engine)** | Battle Round Stepper & Wargaming Phase Engine | Wargaming / Brawl | Testing |
| **[OB-158](#ob-158---dual-player-chess-clocks-with-turn-countdown--active-switching)** | Dual-Player Chess Clocks with Turn Countdown & Active Switching | Wargaming / Brawl | Testing |
| **[OB-159](#ob-159---scoreboard--resource-tracker-vp-cp-casualties-with-audit-trail)** | Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail | Wargaming / Brawl | Testing |
| **[OB-160](#ob-160---objective-marker-control-zone-calculation--auto-scoring)** | Objective Marker Control Zone Calculation & Auto-Scoring | Wargaming / Brawl | Testing |
| **[OB-161](#ob-161---roster-ingestion-pipeline-newrecruit-json--battlescribe-rosz)** | Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz` | Wargaming / Brawl | Testing |
| **[OB-162](#ob-162---deployment-zones-casualty-trays--staging-submap-templates)** | Deployment Zones, Casualty Trays & Staging Submap Templates | Wargaming / Brawl | Testing |
| **[OB-163](#ob-163---tournament-organizer-to-mode-match-privacy--spectator-controls)** | Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls | Wargaming / Brawl | Testing |
| **[OB-177](#ob-177---pathfinder-2e-reference-data-import-foundry-pf2e-packs)** | Pathfinder 2e Reference Data Import (Foundry PF2e Packs) | Character / Importers | Testing |
| **[OB-180](#ob-180---system-agnostic-entityaction-schema--statblock-card-renderer)** | System-Agnostic EntityAction Schema & Statblock Card Renderer | Shared / VTT | Testing |
| **[OB-182](#ob-182---associate-controllable-token-with-chat-panel)** | Associate Controllable Token with Chat Panel | VTT / Chat | Testing |
| **[OB-183](#ob-183---codebase-simplification--refactoring-plan-docsrefactor-1md)** | Codebase Simplification & Refactoring Plan (`docs/refactor-1.md`) | Architecture / Plan | Testing |
| **[OB-184](#ob-184---helptip-component--placement-guide-docshelptip-locationsmd)** | HelpTip Component & Placement Guide (`docs/helptip-locations.md`) | UI / UX Guide | Testing |
| **[OB-185](#ob-185---backlog-research--implementation-guide-docsbacklog-implementation-guidemd)** | Backlog Research & Implementation Guide (`docs/backlog-implementation-guide.md`) | Architecture / Guide | Testing |

---

## VTT Engine & Map Tools

### OB-128 - Modular / Tileable Maps & Snapping Map Tiles
- **Reference in Tasks.md:** [Tasks.md: OB-128](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-128---modular--tileable-maps--snapping-map-tiles)
- **Primary Source Code:** [CanvasEngine.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/engine/CanvasEngine.ts), [PointerSystem.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/engine/PointerSystem.ts)
- **Where to find it:** The canvas viewport using the **Prop tool** on the left toolbar or dragging image assets onto the canvas.

#### Step-by-Step Instructions:
1. Open the VTT application at `http://localhost:3000/?mode=vtt` (or default route).
2. Select the **Prop tool** on the left floating toolbar (or drag two dungeon tile/room image assets onto the canvas).
3. Click and place the first tile onto the battlemap.
4. Place a second modular tile nearby on the canvas.
5. Click and drag the second tile slowly towards any edge or corner of the first tile (within ~0.7 grid cells distance).
6. Drag the tile away again to test detachment.

#### Expected Result (Pass Criteria):
- As the dragged tile approaches within the snapping threshold (~0.7 grid units), it magnetically snaps flush against the neighbor tile's boundary edge or corner socket with zero gap or overlap.
- Moving the cursor firmly away from the snapped boundary breaks the magnetic snap smoothly.

---

### OB-130 - Submaps & Secondary Logical Maps per Scene
- **Reference in Tasks.md:** [Tasks.md: OB-130](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-130---submaps--secondary-logical-maps-per-scene)
- **Primary Source Code:** [MapSettingsModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/MapSettingsModal.tsx), [CanvasEngine.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/engine/CanvasEngine.ts)
- **Where to find it:** Top navigation bar -> Click the **Gear icon** next to the active scene name to open [MapSettingsModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/MapSettingsModal.tsx).

#### Step-by-Step Instructions:
1. In VTT mode, open the Scene Settings by clicking the gear icon next to the active scene name in the top left header.
2. In the modal, scroll down to the **SECONDARY SUBMAPS & STAGING** section.
3. Click one of the quick preset buttons:
   - `+ Floor` (for upper/lower building floors)
   - `+ Dungeon` (for connected caverns/cellars)
   - `+ Staging Area` (for off-map GM reinforcement reserves)
   - `+ Casualty Tray` (for eliminated tokens)
4. Notice the submap entry appears with customizable title, width/height dimensions, grid size, and background color.
5. Change the label (e.g. to `"Upper Tower"`), adjust width/height, and click **Save Changes**.
6. Zoom out on the canvas viewport to view the full canvas extent.

#### Expected Result (Pass Criteria):
- The canvas displays the secondary submap alongside the primary map with its own styled boundary border, title banner pill, and independent grid layout.
- Tokens, props, and drawings can be placed, moved, and interacted with inside the submap boundary without disturbing the primary map.

---

### OB-131 - Custom Configurable Statuses with Counters & Turn Lifecycles
- **Reference in Tasks.md:** [Tasks.md: OB-131](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-131---custom-configurable-statuses-with-counters--turn-lifecycles)
- **Primary Source Code:** [StatusManager.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/status/StatusManager.ts), [TokenControls.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/TokenControls.tsx), [InitiativeTracker.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/vtt/components/InitiativeTracker.tsx)
- **Where to find it:** The **Token Interaction Bar** (appears at bottom of viewport when a token is selected) and the **Initiative Tracker** window.

#### Step-by-Step Instructions:
1. Click any token on the battlemap canvas to select it.
2. In the bottom token interaction bar, locate the status/conditions section on the right side.
3. Select a status that supports numeric counters or turn lifecycles (e.g. `Bleeding` or `Dying`).
4. Set a numeric counter value (e.g. `Bleeding 3`).
5. Click the **Init** button on the token interaction bar to roll and register the token into the initiative order.
6. Open the floating **Initiative Tracker** window (swords icon on top toolbar).
7. Advance rounds and turns by clicking the **Next Turn** button (`>`) in the initiative tracker.

#### Expected Result (Pass Criteria):
- As turns transition, [StatusManager.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/status/StatusManager.ts) automatically decrements the active counter (e.g. `Bleeding 3` ➔ `Bleeding 2`).
- When the counter reaches 0 (or when a turn-lifecycle condition expires, such as at end-of-turn), the status automatically clears from the token.
- A synchronized status transition audit message is posted to the table chat panel (e.g. `Bleeding expired on <Token>`).

---

### OB-182 - Associate Controllable Token with Chat Panel
- **Reference in Tasks.md:** [Tasks.md: OB-182](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-182---associate-controllable-token-with-chat-panel)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/ChatPanel.tsx), [tokenChatBinding.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/tokenChatBinding.ts)
- **Where to find it:** The **Table Chat & Dice** panel on the right side of the screen.

#### Step-by-Step Instructions:
1. Ensure at least one token is placed on the active battlemap (or spawn one via `/monster? goblin` -> `[Spawn Token]`).
2. Click the token on the canvas to select it.
3. Open the Chat Panel drawer. Look directly above the message input box:
   - Notice the **"Speaking as:"** bar.
   - Click the **`Bind Selected`** button (or select the token name from the dropdown).
4. Verify command line binding:
   - In chat, type `/token` and press **Enter** to see the numbered list of available controllable tokens.
   - Type `/token 1` (or `/token <name>`) and press **Enter**.
5. Type a standard in-character chat message (e.g. `I scout the perimeter!`) and press **Enter**.
6. Type `/attack` to see the token's available weapon actions, then type `/attack Scimitar` (or a weapon on the token) and press **Enter**.
7. Type `/roll d20+init` and press **Enter**.
8. Click **`Reset to Player`** (or type `/token clear`).

#### Expected Result (Pass Criteria):
- Selecting or binding the token updates the "Speaking as:" display to show the token's name and avatar.
- Sent chat messages display the token's avatar image and attribute the message to `PlayerName (TokenName)`.
- `/attack <weapon>` executes the roll using the token's specific attack modifiers and actions.
- `/roll d20+init` automatically resolves using the bound token's initiative bonus / dexterity modifier.
- Clicking `Reset to Player` or typing `/token clear` immediately restores chat identity to the player name.

---

## Character & Ruleset Integrations

### OB-143 - Direct Token Creation from D&D Beyond Monster/Character URL
- **Reference in Tasks.md:** [Tasks.md: OB-143](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-143---direct-token-creation-from-dnd-beyond-monstercharacter-url)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/ChatPanel.tsx), [dndBeyondParser.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/vtt/utils/dndBeyondParser.ts), [StatBlockCard.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/StatBlockCard.tsx)
- **Where to find it:** The chat input in the Chat Panel and the active battlemap canvas.

#### Step-by-Step Instructions:
1. Open the Chat Panel.
2. Enter an import command or inspect a monster:
   - E.g., type `/import https://www.dndbeyond.com/characters/47804290` OR
   - Type `/monster? goblin` and press **Enter**.
3. In the chat panel where the `<StatBlockCard />` is rendered, click the **`[Spawn Token]`** button.
4. Inspect the canvas viewport.
5. Click the newly spawned token on the canvas to inspect its bottom token bar.

#### Expected Result (Pass Criteria):
- A confirmation toast displays: `Spawned "Goblin" token on the battlemap!`.
- An ephemeral chat message confirms: `✨ Spawned token for Goblin on the canvas.`.
- A ready-to-fight token is instantiated on the canvas with correct grid scaling (Medium = 1 cell, Tiny = 0.8 cell, Large = 2 cells).
- The token is populated with the official avatar image, maximum HP, AC, speed, and attack actions on the bottom token controls bar.
- Spawning multiple tokens automatically offsets their placement coordinates so they do not stack on top of each other.

---

### OB-177 - Pathfinder 2e Reference Data Import (Foundry PF2e Packs)
- **Reference in Tasks.md:** [Tasks.md: OB-177](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-177---pathfinder-2e-reference-data-import-foundry-pf2e-packs)
- **Primary Source Code:** [pf2ePackFetcher.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/utils/pf2ePackFetcher.ts), [ChatPanel.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/ChatPanel.tsx)
- **Where to find it:** The Chat Panel input box.

#### Step-by-Step Instructions:
1. Open the Chat Panel.
2. Type `/help` and verify that the `/import [category] <url>` command is listed.
3. Type `/import` without arguments to verify usage instructions and supported categories (`pf2e`, `spell`, `item`, `monster`).
4. Ingest a Foundry PF2e pack JSON:
   - Type: `/import https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs/spells/1st-rank/acidic-burst.json` (or `/import pf2e https://raw.githubusercontent.com/foundryvtt/pf2e/master/packs/spells/1st-rank/acidic-burst.json`) and press **Enter**.
5. Test inspection fallback:
   - Type `/spell? acidic-burst` and press **Enter**.
6. Inspect the resulting card in chat and click **`[+ Add to Sheet]`**.

#### Expected Result (Pass Criteria):
- A glassmorphic `<StatBlockCard />` appears in chat for Acidic Burst without needing external browser scraping.
- Displays action cost glyph: `◆◆` (2 Actions).
- Displays subtitle: `Rank 1 Spell`.
- Displays trait pills: `Acid`, `Concentrate`, `Manipulate`.
- Displays damage: `2d6 Acid` and defense: `Basic Reflex`.
- Action buttons are present: `[+ Add to Sheet]`, `[Cast]`, and `[Spawn Token]`.
- Clicking `[+ Add to Sheet]` confirms that the action/spell is saved to the active character sheet.

---

### OB-180 - System-Agnostic EntityAction Schema & Statblock Card Renderer
- **Reference in Tasks.md:** [Tasks.md: OB-180](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-180---system-agnostic-entityaction-schema--statblock-card-renderer)
- **Primary Source Code:** [StatBlockCard.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/StatBlockCard.tsx), [types.ts](file:///Users/tom/Projects/OldBearVTT/packages/shared/src/types.ts), [docs/system-agnostic-import.md](file:///Users/tom/Projects/OldBearVTT/docs/system-agnostic-import.md)
- **Where to find it:** The Chat Panel using inspection commands (`/attack?`, `/spell?`, `/item?`, `/monster?`).

#### Step-by-Step Instructions:
1. Open the Chat Panel drawer.
2. Test Weapon/Attack Inspection:
   - Type `/attack? Longsword` and press **Enter**.
   - Verify that **no dice roll is made**.
   - Verify the card renders action cost (`Action` or `◆`), to-hit formula (`1d20+X`), damage (`1d8+X slashing`), and `[Attack / Roll]` button.
3. Test Spell Inspection:
   - Type `/spell? fireball` and press **Enter**.
   - Verify the card renders school, level, trait pills (`Evocation`), saving throw (`DEX Save`), and full spell description.
4. Test Item Inspection:
   - Type `/item? potion of healing` and press **Enter**.
   - Verify the card renders item rarity pill (`Common`) and consumable rules text.
5. Test Monster Inspection:
   - Type `/monster? goblin` and press **Enter**.
   - Verify the complete monster statblock renders with AC (`15`), HP (`7`), Speed (`30 ft.`), ability score grid, and sub-action buttons.

#### Expected Result (Pass Criteria):
- Inspection commands with `?` display the formatted `<StatBlockCard />` component in chat without executing rolls or triggering side-effects.
- Action cost glyphs dynamically map to `◆`, `◆◆`, `◆◆◆`, `↺`, `◇`, `Action`, `Bonus Action`, or `Reaction`.
- Trait pills render as distinct colored chips.
- Interactive action buttons (`[Attack / Roll]`, `[Cast]`, `[+ Add to Sheet]`, `[Spawn Token]`) function properly when clicked.

---

## Old Bear Brawl (Tabletop Wargaming Platform)

### OB-154 - `GAME_MODE` Environment Configuration & Deployment Toggles
- **Reference in Tasks.md:** [Tasks.md: OB-154](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-154---game_mode-environment-configuration--deployment-toggles)
- **Primary Source Code:** [App.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/App.tsx), [gameMode.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/config/gameMode.ts), [TopBar.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/vtt/components/TopBar.tsx), [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/BrawlTopBar.tsx)
- **Where to find it:** The application TopBar and URL search parameters (`?mode=`).

#### Step-by-Step Instructions:
1. In your browser, navigate to: `http://localhost:3000/?mode=brawl`.
   - Verify Old Bear Brawl loads with wargaming top bar, round stepper, chess clocks, and army roster tools.
2. In your browser, navigate to: `http://localhost:3000/?mode=vtt`.
   - Verify Old Bear Rodeo loads with tabletop RPG top bar, character sheet button, and initiative tracker.
3. Test TopBar Mode Switching:
   - While in VTT mode, locate the mode toggle pill next to the scene name: click **`⚔️ Brawl`**.
   - Notice the application transitions into Brawl mode and persists the preference in `localStorage`.
   - In Brawl mode, locate the top bar mode button: click **`🐻 VTT`**.
   - Notice the application transitions back into VTT mode.
4. (Optional) Single-Mode Lockdown Test:
   - Add `VITE_GAME_MODE=brawl` to `.env.local` and restart the client.
   - Verify the mode toggle button disappears from the TopBar and navigating to `?mode=vtt` is ignored (locks strictly to Brawl).

#### Expected Result (Pass Criteria):
- URL query parameter `?mode=` correctly sets and persists active game mode.
- Top bar pill switches cleanly between VTT and Brawl in multi-mode deployment.
- Single-mode environment configuration hides switcher controls and locks routing.

---

### OB-155 - Army, Unit, and Model Domain Hierarchy & Disambiguation
- **Reference in Tasks.md:** [Tasks.md: OB-155](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-155---army-unit-and-model-domain-hierarchy--disambiguation)
- **Primary Source Code:** [types.ts](file:///Users/tom/Projects/OldBearVTT/packages/shared/src/brawl/types.ts), [ArmyRosterFlyout.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/ArmyRosterFlyout.tsx), [rosterIngestion.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/utils/rosterIngestion.ts)
- **Where to find it:** The **Army Roster Flyout** in Brawl mode (`?mode=brawl` -> Shield icon in top bar).

#### Step-by-Step Instructions:
1. Navigate to `http://localhost:3000/?mode=brawl`.
2. Click the **Shield** icon in the top bar to open the Army Roster Flyout.
3. Observe the army summary header: points limit, points spent (e.g. `80 / 2000 pts`), faction, and detachment.
4. Expand the **Intercessor Squad** unit accordion:
   - Review datasheet statistics: M (Movement 6″), T (Toughness 4), Sv (Save 3+), W (Wounds 2), Ld (Leadership 6+), OC (Objective Control 2).
   - Review weapon actions (Bolt Rifle).
5. Click **`Deploy Unit to Battlemap`**.
6. Inspect the deployed models on the canvas.
7. Click **`Deploy Unit to Battlemap`** a second time to deploy a duplicate squad.

#### Expected Result (Pass Criteria):
- A confirmation toast displays: `Deployed Intercessor Squad (5 models) to battlefield!`.
- 5 model tokens spawn on the canvas in formation.
- Each model token is numbered: `Intercessor Squad 1` through `Intercessor Squad 5` with 2 wounds each.
- Deploying the same unit again disambiguates squad names automatically as `Intercessor Squad A` and `Intercessor Squad B`.

---

### OB-156 - Unit Coherency Graph Engine & Real-Time Warning Halos
- **Reference in Tasks.md:** [Tasks.md: OB-156](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-156---unit-coherency-graph-engine--real-time-warning-halos)
- **Primary Source Code:** [coherencyEngine.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/engine/coherencyEngine.ts), [CanvasEngine.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/engine/CanvasEngine.ts)
- **Where to find it:** The battlemap canvas in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. In Brawl mode (`?mode=brawl`), open the Army Roster Flyout and deploy a unit of 5 models.
2. Initially, all 5 models are placed in standard formation within 2″ distance:
   - Verify that **no warning halos** appear on any model.
3. Click and drag one of the models more than 2″ (~100 canvas pixels) away from the rest of the unit.
4. Move the isolated model back within 2″ of another unit member.
5. Daisy-Chain Test (units with 6+ models):
   - Deploy a 6+ model unit (or add models to make 6).
   - Position the models in a single extended straight line where the two outer end models only have 1 neighbor within 2″.
   - Reposition models into pairs or a clustered triangular formation where every model has at least 2 neighbors within 2″.

#### Expected Result (Pass Criteria):
- An isolated model exceeding 2″ distance immediately renders a pulsing red dashed warning halo around its base on the canvas.
- Moving the model back within 2″ clears the warning halo in real time.
- In units of 6+ models, models requiring $\ge 2$ neighbors within 2″ correctly trigger warning halos when daisy-chained, and clear when clustered properly.

---

### OB-157 - Battle Round Stepper & Wargaming Phase Engine
- **Reference in Tasks.md:** [Tasks.md: OB-157](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-157---battle-round-stepper--wargaming-phase-engine)
- **Primary Source Code:** [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/BrawlTopBar.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** The top bar phase stepper and canvas announcement banner in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl`.
2. Observe the top bar phase indicator: `Round 1 | Command >` with Player 1 highlighted.
3. Click the phase button (`Command >`).
4. Observe the banner and chat, then click through the remaining phases:
   - `Movement >`
   - `Shooting >`
   - `Charge >`
   - `Fight >`
   - `Morale >`
5. Click past `Morale >` to end Player 1's turn.
6. During Player 2's turn, click the **Pass Turn** button.

#### Expected Result (Pass Criteria):
- Stepping phases advances the phase label (`Movement >`, `Shooting >`, etc.).
- An animated canvas banner slides down announcing each phase (e.g. `MOVEMENT PHASE - Round 1 • Player 1's Turn`).
- Chat logs the phase advance: `⚔️ [Round 1] Player 1 advanced to Movement Phase.`.
- Stepping past Morale automatically completes Player 1's turn, begins Player 2's Command phase, awards Player 2 +1 CP, updates the active player indicator, and logs turn handover.
- Stepping Player 2 through Morale increments to `BATTLE ROUND 2` with Player 1.
- Clicking **Pass Turn** immediately transfers active turn to the opponent at Command Phase with chat audit.

---

### OB-158 - Dual-Player Chess Clocks with Turn Countdown & Active Switching
- **Reference in Tasks.md:** [Tasks.md: OB-158](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-158---dual-player-chess-clocks-with-turn-countdown--active-switching)
- **Primary Source Code:** [ChessClockWidget.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/ChessClockWidget.tsx), [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/BrawlTopBar.tsx)
- **Where to find it:** The Brawl top bar clock section and the floating `ChessClockWidget` popout (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl`.
2. In the top bar, note the dual clock display: `P1: 1:30:00 / P2: 1:30:00`.
3. Click the **Play** button (`▶`):
   - Notice Player 1's clock begins counting down every second with a glowing active highlight.
4. Click the popout icon (`ExternalLink`) next to Pass Turn to open the floating draggable `ChessClockWidget`.
5. Drag the floating window by its header across the canvas.
6. In either the floating widget or top bar, click **Pass Turn** (or click the active player's clock face):
   - Listen for an audible mechanical switch click.
   - Verify the clock swaps to Player 2 and begins ticking down Player 2's time while Player 1 pauses.
7. In the floating widget, click the settings gear icon:
   - Select a preset limit: `60 Min`, `75 Min`, `90 Min`, or `120 Min`.
   - Verify both timers reset to that duration.
8. Click the minimize button `_` on the floating widget header:
   - Verify it collapses into a sleek floating pill.
   - Click expand to restore the full widget.

#### Expected Result (Pass Criteria):
- Clocks count down accurately and switch instantaneously between players with mechanical audio feedback.
- The popout floating widget is draggable, minimizable, and synchronizes state with the top bar clock.
- Presets reset both clocks.
- Time remaining turns amber (<10m) and orange (<5m). Time dropping past 0 displays negative overtime (`-MM:SS OT`) in pulsing red without stopping.

---

### OB-159 - Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail
- **Reference in Tasks.md:** [Tasks.md: OB-159](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-159---scoreboard--resource-tracker-vp-cp-casualties-with-audit-trail)
- **Primary Source Code:** [MatchScoreboardModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/MatchScoreboardModal.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Top bar **`VP: 0 - 0`** button with the Trophy icon (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl` and click the **`VP: 0 - 0`** button in the top bar.
2. In the modal, observe columns for Player 1 (cyan) and Player 2 (pink) with Primary VP, Secondary VP, Command Points (CP initialized to 1), and Casualties.
3. In the optional reason input, type: `Secondary: Cleanse objective`.
4. Click `+4` on Player 1's Secondary VP.
5. Click `-1 CP` under Player 1 to record a stratagem use.
6. Click `+1` on Player 2's Casualties.
7. Switch to the **Audit Log** tab at the top of the modal.
8. Click the **Reset Scores** button in the modal header.

#### Expected Result (Pass Criteria):
- Player 1 Total VP updates to 4, and the top bar trophy indicator updates to `VP: 4 - 0`.
- An animated toast notification displays: `🎯 [Player 1] Secondary VP +4 ➔ 4 (Secondary: Cleanse objective). Total VP: 4`.
- A synchronized message is posted to table chat with player color accents.
- The Audit Log tab displays every score and resource modification in reverse-chronological order with timestamps, player color pills, previous/new values, and reasons.
- Resetting scores prompts confirmation, resets scores back to 0 VP and 1 CP, and appends a reset entry to the audit log.

---

### OB-160 - Objective Marker Control Zone Calculation & Auto-Scoring
- **Reference in Tasks.md:** [Tasks.md: OB-160](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-160---objective-marker-control-zone-calculation--auto-scoring)
- **Primary Source Code:** [ObjectiveControlModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/ObjectiveControlModal.tsx), [objectiveScoring.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/engine/objectiveScoring.ts)
- **Where to find it:** Top bar **Objectives** button (Target icon) in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl` and click the **Objectives** button in the top bar.
2. In the modal, click **Deploy Standard 5 Objectives**:
   - Inspect the canvas to confirm 5 numbered objective markers (Center, NW, NE, SW, SE) are placed with 40mm bases and 3″ control radius auras.
   - Note the modal shows all 5 markers as `Uncontested (0 OC)`.
3. Close the modal, open the Army Roster Flyout, and deploy a unit of models.
4. Drag 2 models (2 OC total) into Objective 1's (Center) 3″ radius.
5. Click the **Objectives** button in the top bar:
   - Notice Objective 1 now shows **Player 1 Control** (2 OC vs 0 OC).
6. Click **Score Objectives Now**:
   - Observe the score update and chat panel.
7. Move a Player 2 model with 3 OC into Objective 1's zone:
   - Re-open the modal and verify Objective 1 now shows **Player 2 Control** (2 OC vs 3 OC).

#### Expected Result (Pass Criteria):
- Objective markers render on canvas with distinct 3″ control zones.
- Real-time OC calculation sums model OC within 3″ of each objective marker.
- Markers reflect Player 1 control, Player 2 control, or Contested status if OC values are tied.
- Clicking "Score Objectives Now" automatically awards +4 Primary VP per controlled objective, updates the scoreboard, and broadcasts a chat announcement with the full scoring breakdown.

---

### OB-161 - Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz`
- **Reference in Tasks.md:** [Tasks.md: OB-161](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-161---roster-ingestion-pipeline-newrecruit-json--battlescribe-rosz)
- **Primary Source Code:** [rosterIngestion.ts](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/utils/rosterIngestion.ts), [ArmyRosterFlyout.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/ArmyRosterFlyout.tsx)
- **Where to find it:** The **Army Roster Flyout** -> **Import** button (`Upload` icon) in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl`.
2. Click the **Shield** icon in the top bar to open the Army Roster Flyout.
3. In the Army Meta header section, click the **Import** button (`Upload` icon).
4. Select a valid NewRecruit export `.json` or BattleScribe `.ros` / `.rosz` archive file (or drag and drop it onto the roster window).
5. Inspect the parsed roster:
   - Army name, faction, and points limit/spent update automatically.
   - Units appear in the list with calculated points, model counts, datasheet stats (M, T, Sv, W, Ld, OC), and weapons.
6. Expand any unit and click **Deploy Unit to Battlemap**:
   - Inspect the spawned model tokens on the canvas (verify base sizes: e.g. 32mm for standard infantry, 40mm for characters/terminators, 120x75mm for vehicles).
7. Test error handling: attempt to upload an invalid file extension (e.g. `.png` or `.txt`).

#### Expected Result (Pass Criteria):
- The roster parses client-side in real time without network round-trips.
- A green confirmation banner displays: `Imported <Army Name> (<N> units)`.
- Models deploy to the canvas with proper base sizes, wound counts, and disambiguated unit names.
- Invalid file formats gracefully display a red error message without crashing the application.

---

### OB-162 - Deployment Zones, Casualty Trays & Staging Submap Templates
- **Reference in Tasks.md:** [Tasks.md: OB-162](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-162---deployment-zones-casualty-trays--staging-submap-templates)
- **Primary Source Code:** [DeploymentStagingModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/DeploymentStagingModal.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Top bar **Deployment** button (Compass icon) in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl` and click the **Deployment** button in the top bar.
2. In the modal, select the **Dawn of War** preset.
3. Ensure both *Include Casualty Tray* and *Include Strategic Reserves* checkboxes are enabled.
4. Click **Apply Tournament Deployment Setup**.
5. Zoom out on the canvas to inspect the table layout:
   - Notice shaded deployment zones on the north (Player 1, cyan `#38bdf8`) and south (Player 2, pink `#f43f5e`).
   - Notice the crimson `💀 Casualty Tray / Graveyard` submap below the battlefield.
   - Notice the indigo `🚀 Strategic Reserves & Deep Strike` submap above the battlefield.
6. Test Model Transfers:
   - Select 2 tokens on the battlefield.
   - Open the Deployment modal (shows `Selected: 2 models`).
   - Click **💀 Send to Casualty Tray**:
     - Verify models move into the Casualty Tray, their HP is set to `0`, and `'Slain'` condition is applied.
   - Select the slain models and click **✨ Revive to Table**:
     - Verify models return to the active table center, HP is restored to maximum, and `'Slain'` is cleared.

#### Expected Result (Pass Criteria):
- Deployment zones and submaps generate accurately based on tournament presets (Dawn of War, Hammer and Anvil, Search and Destroy, Crucible of Battle).
- "Send to Casualty Tray" instantly moves models to the tray submap, zeros their HP, applies `'Slain'`, and updates the scoreboard casualty counter.
- "Revive to Table" repositions models back on the main battlefield with full HP and cleared status.

---

### OB-163 - Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls
- **Reference in Tasks.md:** [Tasks.md: OB-163](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-163---tournament-organizer-to-mode-match-privacy--spectator-controls)
- **Primary Source Code:** [TournamentOrganizerModal.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/components/TournamentOrganizerModal.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Top bar **TO / Admin** button (Gavel icon) in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:
1. Open `http://localhost:3000/?mode=brawl` and click the **TO / Admin** button in the top bar.
2. Test Role Switching:
   - Switch role from **Player** to **TO (Referee)**.
   - Enter TO Handle (e.g. `Head Judge Dave`).
   - Notice the top bar badge turns gold: `TO Mode`.
   - Switch role to **Spectator** and notice the badge turns cyan: `Spectator`. Switch back to **TO (Referee)**.
3. Test Admin Score & Clock Overrides:
   - Under Score & Resource Overrides, select Player 1, adjust Secondary VP by `+2`, and enter reason: `Fixed battle tactic card scoring error`.
   - Click **Apply Administrative Score Override**.
   - Under Chess Clock Admin Controls, click `+5m` to add 5 minutes to Player 1's clock.
4. Test Official Rulings:
   - Switch to the **Official Rulings** tab.
   - Context: `Does firing model have Line of Sight through ground floor window?`.
   - Ruling: `Per tournament terrain pack, all ground floor ruin windows are considered fully blocked.`.
   - Click **Broadcast Official Ruling to Table Chat**.
5. Test Match Report Export:
   - Switch to the **Export Match Report** tab.
   - Click **Download Match Report (JSON)** to download the structured tournament summary.
   - Click **Copy Printable Match Card** and paste into a text editor to inspect the formatted ASCII summary.

#### Expected Result (Pass Criteria):
- Role switching toggles permissions and updates the header badge appropriately.
- TO score and clock overrides update match state immediately and broadcast a gold judge announcement in table chat.
- Official rulings broadcast a gold announcement to table chat and persist in the permanent ruling log.
- Match export downloads a valid JSON document and copies a formatted plaintext tournament score card to the clipboard.

---

## Architectural & Documentation Deliverables

### OB-183 - Codebase Simplification & Refactoring Plan (`docs/refactor-1.md`)
- **Reference in Tasks.md:** [Tasks.md: OB-183](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-183---codebase-simplification--refactoring-plan-docsrefactor-1md)
- **Document Path:** [docs/refactor-1.md](file:///Users/tom/Projects/OldBearVTT/docs/refactor-1.md)
- **Where to find it:** Review the file directly in the repository filesystem.

#### Step-by-Step Instructions:
1. Open [docs/refactor-1.md](file:///Users/tom/Projects/OldBearVTT/docs/refactor-1.md).
2. Verify that all 8 architectural refactoring tasks are cataloged and specified:
   - **REF-001**: Unified Entity Statblock & Character Schema Consolidation
   - **REF-002**: Modular Slash Command Registry & Evaluators
   - **REF-003**: State Hook Extraction from `AppVtt.tsx` (`useVttModalManager`, `useVttNetworkSync`, `useTokenSelection`)
   - **REF-004**: Extraction of Headless `BackupService` & `BinderService` from `DataBackupModal.tsx`
   - **REF-005**: Modular Character Sheet Tabs & Editor Components (`CharacterFlyout.tsx` decomposition)
   - **REF-006**: Unified `UniversalImporter` Pipeline (consolidating D&D Beyond, PF2e, Open5e, and TetraCube)
   - **REF-007**: Strategy Pattern for Canvas Interaction Tools (`CanvasEngine.ts` and `PointerSystem.ts` decoupling)
   - **REF-008**: Unified Storage Repository & Key Registry (centralizing `localStorage` and `IndexedDB` access)
3. Confirm that each refactoring specification contains:
   - Problem Statement & Architectural Smells
   - Target Architecture & Types
   - Step-by-Step Migration Plan
   - Affected Files with exact clickable file links
   - Acceptance Criteria & Automated Test Plan

#### Expected Result (Pass Criteria):
- Document exists, is syntactically valid markdown, and provides comprehensive, actionable architectural plans for all 8 refactorings with concrete file references and schemas.

---

### OB-184 - HelpTip Component & Placement Guide (`docs/helptip-locations.md`)
- **Reference in Tasks.md:** [Tasks.md: OB-184](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-184---helptip-component--placement-guide-docshelptip-locationsmd)
- **Document Path:** [docs/helptip-locations.md](file:///Users/tom/Projects/OldBearVTT/docs/helptip-locations.md)
- **Component Path:** [HelpTip.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/HelpTip.tsx)
- **Where to find it:** Review the file directly in the repository filesystem.

#### Step-by-Step Instructions:
1. Open [docs/helptip-locations.md](file:///Users/tom/Projects/OldBearVTT/docs/helptip-locations.md).
2. Verify that 9 core application areas are audited:
   - Map Settings (`MapSettingsModal`)
   - Token Interaction Bar (`TokenControls`)
   - Chat Panel (`ChatPanel`)
   - Initiative Tracker (`InitiativeTracker`)
   - Floating Clocks & Timers (`ClockWidgetBar`, `TimerHUD`, `ChessClockWidget`)
   - Character Sheet Flyout (`CharacterFlyout`)
   - Canvas Tools (`ToolBar`, `MarkerControls`)
   - Data Backup & Storage (`DataBackupModal`)
   - Audio Streaming & Soundboard (`VoiceSettingsModal`, `SoundboardModal`)
3. Check each location specification for required props:
   - `title`: Short title of the tooltip
   - `placement`: Positioning (`top`, `bottom`, `left`, `right`)
   - `shortcut`: Keyboard shortcut if applicable
   - `copy`: Concise, high-value guidance text
   - `priority`: Priority classification (`High`, `Medium`, `Low`)
4. Verify the 3-phase rollout roadmap prioritizing high-friction onboarding points (grid alignment, token status lifecycles, and chat commands).

#### Expected Result (Pass Criteria):
- Document exists, is thoroughly cataloged with all 9 core UI surfaces, provides precise copy and positioning parameters, and aligns with the fixed portal implementation in [HelpTip.tsx](file:///Users/tom/Projects/OldBearVTT/packages/client/src/common/components/HelpTip.tsx).

---

### OB-185 - Backlog Research & Implementation Guide (`docs/backlog-implementation-guide.md`)
- **Reference in Tasks.md:** [Tasks.md: OB-185](file:///Users/tom/Projects/OldBearVTT/Tasks.md#ob-185---backlog-research--implementation-guide-docsbacklog-implementation-guidemd)
- **Document Path:** [docs/backlog-implementation-guide.md](file:///Users/tom/Projects/OldBearVTT/docs/backlog-implementation-guide.md)
- **Where to find it:** Review the file directly in the repository filesystem.

#### Step-by-Step Instructions:
1. Open [docs/backlog-implementation-guide.md](file:///Users/tom/Projects/OldBearVTT/docs/backlog-implementation-guide.md).
2. Verify technical architecture coverage for all key backlog areas:
   - **WebRTC Video Mesh & Tokens (OB-145, OB-146)**: Media renegotiation in `VoiceManager.ts`, resolution limits for mesh peer scaling, canvas `<video>` token avatars via `TokenRenderer.ts`, and floating PIP tiles.
   - **Discord Integrations (OB-147, OB-149)**: Discord bot gateway architecture for two-way chat/roll sync and Discord Embedded App SDK activity authorization for one-click launching inside voice channels.
   - **D&D Beyond Auth & Private Sheets (OB-148)**: Analysis of `Cobalt-Session` cookie auth, local client storage vs ephemeral proxy header forwarding, and browser companion extension options.
   - **System-Agnostic Ruleset Manifests (OB-150)**: Schema design for dynamic attributes, pools, and dice engines, decoupling sheets from hardcoded 5e/PF2e code.
   - **Pathfinder 2e Mechanics (OB-153)**: Multiple Attack Penalty (MAP) calculation buttons, 4-tier degrees of success (+10/-10 DC thresholds), and turn condition tracking.
   - **Mobile Touch Usability (OB-137, OB-138)**: Ergonomic finger touch offset (-40px) to prevent finger occlusion during token drags, and mobile interaction bar safe-area insets.
   - **Wargaming Engine Roadmap (OB-154 through OB-163)**: Multi-mode deployment (`GAME_MODE`), BattleScribe/NewRecruit roster ingestion, unit coherency graph checks, dual chess clocks, and objective zone scoring.
3. Check that code samples, architectural diagrams, schemas, and mitigation strategies are provided for each section.

#### Expected Result (Pass Criteria):
- Document exists, provides complete architectural blueprints, code snippets, schemas, and risk analyses for all 7 major technical research tracks.
