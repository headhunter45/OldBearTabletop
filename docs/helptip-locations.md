# HelpTip Integration Guide: Suggested Locations & Copy

This document catalogs recommended locations, UI components, and exact tooltip copy for integrating the `<HelpTip />` component across OldBear VTT.

---

## Overview & Design Principles

The `<HelpTip />` component provides non-intrusive contextual assistance for tabletop players and GMs. When placing HelpTips:
1. **Explain the Non-Obvious**: Focus on mechanics with jargon (e.g., "5-10-5 diagonals", "Submap staging", "Binder schema", "Inspection syntax `?`").
2. **Display Keyboard Shortcuts**: Always populate the `shortcut` prop when a hotkey exists.
3. **Prevent Obscuring Controls**: Use `placement="top"` or `placement="right"` for sidebars, and `placement="bottom"` for top headers.
4. **Clutter Control**: Group related controls under a single section header HelpTip rather than placing tips on every individual text field.

---

## 1. Map Management & Map Settings Modal (`MapSettingsModal.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Grid Calibration (Grid Size / DPI)** | `title="Grid Alignment"`<br>`placement="right"` | `"Set the pixel dimensions for a single square tile. Use the map alignment tool or calibrate against a known 5-foot grid cell on your image."` |
| **High** | **Grid Offsets (X / Y)** | `title="Grid Offset"`<br>`placement="right"` | `"Shifts the grid overlay in pixels. Useful for maps with decorative borders or tiles that don't start flush at the top-left corner (0,0)."` |
| **High** | **Secondary Submaps & Staging** | `title="Submaps & Staging"`<br>`placement="left"` | `"Secondary maps render alongside your main battlefield. Use Staging Areas to hide GM reinforcements off-grid, Floor portals for multi-story buildings, or Casualty Trays for defeated tokens."` |
| **Medium** | **Grid Rendering Order** | `title="Overlay Layering"`<br>`placement="top"` | `"Choose whether grid lines render on top of the map background or on top of tokens and fog-of-war."` |

---

## 2. Token Interaction Bar & Token Controls (`TokenControls.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **HP & Temporary HP** | `title="Hit Points & Temp HP"`<br>`placement="top"` | `"Incoming damage is automatically subtracted from Temporary HP before depleting your current HP pool. Temp HP does not stack."` |
| **High** | **Condition & Status Selector** | `title="Status Turn Lifecycles"`<br>`placement="top"` | `"Conditions with numbers (e.g. Blinded 2) automatically tick down at turn end in the Initiative Tracker. Conditions like Stunned clear after one full turn."` |
| **Medium** | **Token Rotation** | `title="Facing Angle"`<br>`placement="top"`<br>`shortcut="Shift + Drag"` | `"Click and drag or enter degrees to set token facing. Hold Shift while dragging on canvas to snap to 45° and 90° increments."` |
| **Medium** | **Player Control Assignment** | `title="Token Permissions"`<br>`placement="top"` | `"Assign which connected player has permission to move, rotate, and roll attacks for this token. GMs always retain full control."` |
| **Low** | **Token Dimensions (Size Scale)** | `title="Grid Footprint"`<br>`placement="top"` | `"Scales token footprint on the grid. 1 = Medium (1x1), 2 = Large (2x2), 3 = Huge (3x3), 4 = Gargantuan (4x4)."` |

---

## 3. Chat Panel & Command Bar (`ChatPanel.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **"Speaking as:" Selector Bar** | `title="Token Association"`<br>`placement="top"`<br>`shortcut="/token"` | `"Select which controllable token you are acting as. Rolls, attacks (/attack), and spells (/spell) will automatically attribute to that token's statblock and avatar."` |
| **High** | **Statblock Inspection Syntax (`?`)** | `title="Inspect vs Roll"`<br>`placement="top"` | `"Append a '?' to any command (e.g. /spell? Fireball, /attack? Greatsword, /monster? Goblin) to inspect rules cards in chat without rolling dice or spending actions."` |
| **High** | **Advanced Dice Syntax** | `title="Dice Formulas"`<br>`placement="top"`<br>`shortcut="/r"` | `"Supports standard polyhedrals, modifiers, drop lowest (4d6dl1), keep highest (2d20kh1), exploding dice (3d6!), and target success thresholds (5d6>4)."` |
| **Medium** | **PF2e & Open5e Reference Import** | `title="Quick Ingestion"`<br>`placement="top"`<br>`shortcut="/import"` | `"Paste public URLs from Open5e, D&D Beyond, or Foundry PF2e pack JSON to instantly render statblock cards and spawn tokens onto the canvas."` |
| **Medium** | **Chat History Navigation** | `title="Command History"`<br>`placement="left"`<br>`shortcut="↑ / ↓ Arrows"` | `"Cycle through previously typed commands to quickly re-roll or fix typos without retyping the entire command."` |

---

## 4. Initiative Tracker (`InitiativeTracker.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Next Turn & Round Transitions** | `title="Turn Lifecycle Trigger"`<br>`placement="bottom"`<br>`shortcut="Space"` | `"Advancing turns automatically updates the active actor, decrements round duration counters, expires temporary conditions, and logs announcements to chat."` |
| **Medium** | **Auto-Roll All Initiative** | `title="Batch Initiative"`<br>`placement="bottom"` | `"Rolls d20 + initiative bonus for all unrolled combatants. Uses Dexterity modifier or custom token initiative bonus."` |
| **Medium** | **Round Countdown Timer** | `title="Turn Timer Link"`<br>`placement="left"` | `"Attaches a countdown timer to the active combatant. The timer resets on every turn advance and alerts players when turn time expires."` |

---

## 5. Floating Screen Widgets & Clocks (`ClockWidgetBar.tsx`, `ProgressClockModal.tsx`, `TimerHUD.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Progress Clock Segments** | `title="Progress Clocks"`<br>`placement="top"` | `"Track tension, stealth alerts, ritual completion, or faction goals in 4, 6, 8, or 12 segments (inspired by Blades in the Dark). Left-click adds a tick, right-click removes."` |
| **High** | **Round Timer Duration Parsing** | `title="Timer Durations"`<br>`placement="top"` | `"Enter natural durations like '2m', '90s', '1:30', or bare numbers. Broadcasts an alarm sound and chat log when time is up."` |
| **Medium** | **Widget Screen Pinning** | `title="Floating Overlay"`<br>`placement="bottom"` | `"Clocks and timers remain pinned above the battlemap while you pan and zoom. Drag the titlebar to reposition anywhere on your screen."` |

---

## 6. Character Sheet & Import Flyout (`CharacterFlyout.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **D&D Beyond Sync** | `title="D&D Beyond Character URL"`<br>`placement="right"` | `"Enter a public character URL or numeric ID (e.g. 49074997). The server fetches stats, actions, spells, and caches avatar images offline."` |
| **High** | **Pathbuilder 2e (PF2e) Import** | `title="Pathbuilder 2e Integration"`<br>`placement="right"` | `"Enter your 6-digit Pathbuilder 2e Build ID or upload a JSON export. Computes level-scaled proficiencies across Trained, Expert, Master, and Legendary ranks."` |
| **Medium** | **"Trained Only" Filter** | `title="Filter Skills"`<br>`placement="left"` | `"Toggles display to hide untrained skills, keeping your active modifiers and proficient checks front and center during combat."` |

---

## 7. Toolbar & Canvas Measurement (`ToolBar.tsx`, `MarkerControls.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Spell Area Templates (Sprays)** | `title="Persistent Templates"`<br>`placement="right"` | `"Place persistent spell areas (Cones, Spheres, Lines, and Squares) that stay on the map. Adjust radius, color, and border style in the template bar."` |
| **High** | **Laser Pointer** | `title="Ephemeral Laser"`<br>`placement="right"`<br>`shortcut="L"` | `"Click and drag to highlight positions for all players. The laser pointer fades immediately upon mouse release."` |
| **Medium** | **Modular Dungeon Tiles (Props)** | `title="Magnetic Edge Snapping"`<br>`placement="right"`<br>`shortcut="P"` | `"Tiles placed with the Prop tool magnetically snap flush against adjacent tile edges within 0.7 grid cells for rapid dungeon construction."` |
| **Medium** | **Ruler Diagonal Rules** | `title="Distance Measurement"`<br>`placement="right"`<br>`shortcut="M"` | `"Measures distance across grid tiles. Supports 5-10-5 alternating diagonal rules (D&D 5e standard) or direct Euclidean measurement."` |

---

## 8. Data Backup & Cross-Platform `.binder` Files (`DataBackupModal.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Universal `.binder` Export** | `title="Universal .binder Package"`<br>`placement="top"` | `"Exports an open, cross-platform collection document conforming to https://schemas.ttrpgwith.me/v1/binder.json. Preserves full VTT state while generating standard monster card decks for third-party tools."` |
| **High** | **OldBear Full Backup vs `.binder`** | `title="Backup Format Differences"`<br>`placement="top"` | `"OldBear Backup (.json) is an exact native dump of all scenes, audio, and settings. Universal .binder (.binder) is an open interoperable standard for sharing cards, tokens, and campaigns."` |
| **Medium** | **Drag-and-Drop Ingestion Threshold** | `title="File Drop Protection"`<br>`placement="top"` | `"Dropping single cards or small character files (<250 KB) imports instantly. Archives or files exceeding 250 KB display a confirmation preview with itemized breakdowns."` |

---

## 9. Voice Chat & Soundboard (`VoiceSettingsModal.tsx`, `SoundboardModal.tsx`)

| Priority | Location / Control | Props (`title`, `placement`, `shortcut`) | Recommended Tooltip Text |
| :--- | :--- | :--- | :--- |
| **High** | **Push-to-Talk (PTT)** | `title="Push-to-Talk Activation"`<br>`placement="right"`<br>`shortcut="V"` | `"Transmits audio only while holding the hotkey or mobile screen button. Open Mic transmits automatically based on volume threshold."` |
| **High** | **Broadcast Audio to Room** | `title="Soundboard Broadcast"`<br>`placement="top"` | `"When enabled, playing an audio track or sound effect streams the sound to all connected players in the room in real time."` |
| **Medium** | **GM Force-Mute** | `title="Room Moderation"`<br>`placement="left"` | `"GMs can mute any noisy or echoing participant for everyone in the room."` |

---

## Implementation Priority Roadmap

1. **Phase 1: High-Traffic Modals (Next Sprint)**
   - `ChatPanel.tsx` (Token selector and `/` command helpers).
   - `MapSettingsModal.tsx` (Grid calibration, offsets, and submaps).
   - `TokenControls.tsx` (Status turn lifecycles and temp HP).
2. **Phase 2: Tactical & Character Screens**
   - `CharacterFlyout.tsx` (D&D Beyond and Pathbuilder inputs).
   - `InitiativeTracker.tsx` (Turn lifecycles and timer linkage).
   - `ToolBar.tsx` (Persistent sprays vs laser pointer).
3. **Phase 3: System Utilities**
   - `DataBackupModal.tsx` (Universal `.binder` explanations).
   - `ClockWidgetBar.tsx` (Blades progress clock segments).
   - `VoiceSettingsModal.tsx` (PTT and moderation).
