# Backlog Architecture & Implementation Guide

This document presents technical research, architecture choices, implementation suggestions, and task decompositions for all backlog items in OldBear VTT.

---

## 1. WebRTC Webcam Video Mesh & Video Tokens (OB-145, OB-146)

### Objective
Provide video streaming directly within OldBear:
- **OB-145**: Live video feeds rendered as avatars inside tokens on the canvas.
- **OB-146**: Draggable, floating Picture-in-Picture (PIP) webcam tiles.

### Technical Research & Architecture
1. **WebRTC Media Renegotiation**:
   - Currently, `VoiceManager.ts` manages audio-only `RTCPeerConnection` mesh connections with `addTrack(audioTrack)`.
   - To support video, call `peerConnection.addTrack(videoTrack, mediaStream)` when the user enables webcam.
   - Trigger SDP renegotiation (`createOffer` / `setLocalDescription`) sent via the existing signaling WebSocket (`protocol.ts` `SIGNAL_OFFER` / `SIGNAL_ANSWER`).
2. **Mesh Bandwidth Constraints & Optimization**:
   - Full-mesh peer-to-peer scales as $O(N^2)$. For 5 players, each client uploads 4 video streams and downloads 4 video streams.
   - **Recommendation**:
     - Constrain video resolution to **320x240 @ 15fps** (or 480x360 @ 24fps) using `getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } })`.
     - When a peer's video is minimized or hidden, disable video transmission (`videoTrack.enabled = false` or `videoTransceiver.direction = 'inactive'`) to save bandwidth.
3. **Canvas Token Rendering (OB-145)**:
   - Maintain hidden `<video autoplay playsinline muted />` HTML elements in the DOM for each remote peer.
   - In `TokenRenderer.ts`:
     ```typescript
     if (token.videoPeerId && peerVideoElements.has(token.videoPeerId)) {
       const video = peerVideoElements.get(token.videoPeerId)!;
       if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
         ctx.save();
         ctx.beginPath();
         ctx.arc(token.x, token.y, radius, 0, Math.PI * 2);
         ctx.clip();
         ctx.drawImage(video, token.x - radius, token.y - radius, radius * 2, radius * 2);
         ctx.restore();
       }
     }
     ```
   - Request `requestAnimationFrame` loop continuously while video tokens are active on the battlemap.

### Recommended Implementation Tasks
- **OB-146-A**: Expand `VoiceManager.ts` to `MediaManager.ts` with webcam capture and video track negotiation.
- **OB-146-B**: Create floating `<VideoMeshOverlay />` with draggable PIP video tiles and active speaker rings.
- **OB-145-A**: Add `videoPeerId?: string` to `Token` schema in `protocol.ts` and bind video streams in `TokenRenderer.ts`.

---

## 2. Discord Integrations (OB-147, OB-149)

### Objective
Integrate OldBear with Discord communities:
- **OB-147**: Two-way Discord chat and roll relay bot.
- **OB-149**: Discord Embedded App Activity (launching OldBear inside Discord voice channels).

### Technical Research & Architecture
1. **Two-Way Discord Bot Gateway (OB-147)**:
   - Use `@discordjs/core` or `discord.js` in a lightweight standalone daemon package (`packages/discord-bot` or embedded in `@oldbear/server`).
   - Configuration via `.env`: `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, `DISCORD_ROOM_ID`.
   - **Discord ➔ OldBear**:
     - Bot listens to `messageCreate` events.
     - Translates markdown to OldBear chat and broadcasts `type: 'chat:message'` with sender name `"Discord: " + msg.author.username`.
   - **OldBear ➔ Discord**:
     - Server hooks into room message events.
     - Forwards rolls and chat messages to Discord channel via Webhook (to avoid bot rate limits).
2. **Discord Embedded App SDK Activity (OB-149)**:
   - Discord Activities run inside an iframe inside Discord desktop/mobile clients.
   - Library: `@discord/embedded-app-sdk`.
   - Implementation Flow:
     1. Client initializes SDK: `const discordSdk = new DiscordSDK(CLIENT_ID); await discordSdk.ready();`
     2. Authenticate with Discord OAuth: `const { code } = await discordSdk.commands.authorize({ ... });`
     3. Client calls OldBear backend `/api/discord/token` to exchange `code` for an access token using `CLIENT_SECRET`.
     4. Map Discord voice channel ID to OldBear `roomId` so everyone in the voice channel joins the same battlemap automatically.
   - **Content Security Policy**: Must configure Discord URL mapping proxies (`https://*.discordsays.com`) to allow WebSocket signaling connections to OldBear.

### Recommended Implementation Tasks
- **OB-147-A**: Build `DiscordGatewayService.ts` on server with configurable channel-to-room mappings.
- **OB-147-B**: Add Discord bot command `/roll` that reflects rolls directly into the active VTT battlemap.
- **OB-149-A**: Add Discord SDK initialization wrapper and OAuth token exchange endpoint on server.
- **OB-149-B**: Support Discord auto-joining based on voice channel instance ID.

---

## 3. D&D Beyond CobaltSession Auth & Private Sheets (OB-148)

### Objective
Allow players and GMs to import private D&D Beyond character sheets and campaign homebrew without making character sheets public.

### Technical Research & Architecture
1. **Authentication Mechanism**:
   - D&D Beyond uses an HTTP cookie named `Cobalt-Session`.
   - When fetching private characters from `character-service.dndbeyond.com/character/v5/character/{id}`, requests with `Cookie: Cobalt-Session=<token>` authenticate successfully.
2. **Security & Privacy Considerations**:
   - The user's Cobalt session token grants full access to their D&D Beyond account.
   - **Never store Cobalt tokens permanently on the server or in shared databases.**
   - Store locally in client `localStorage` (`oldbear_cobalt_session`) or session storage.
   - The client passes the token to the server proxy in an ephemeral header: `X-Cobalt-Session: <token>`.
3. **Alternative: Browser Companion Extension**:
   - Provide a lightweight Manifest V3 Chrome Extension.
   - When the user visits a D&D Beyond character sheet, the extension injects a button: `"Send to OldBear"`.
   - The extension reads character data directly from the authenticated page and posts the JSON to OldBear via WebSocket or local clipboard.

### Recommended Implementation Tasks
- **OB-148-A**: Add optional `X-Cobalt-Session` header forwarding in `packages/server/src/dndbeyond.ts`.
- **OB-148-B**: Add "Private Sheet Authentication" settings accordion in `CharacterFlyout.tsx` with clear security disclaimers.

---

## 4. System-Agnostic Ruleset Manifests & Characterfiles (OB-150)

### Objective
Eliminate hardcoded 5e/PF2e assumptions by loading external ruleset manifests describing character stats, rolls, resource tracks, and sheet templates.

### Technical Research & Architecture
1. **Manifest Schema (`system.manifest.json`)**:
   ```json
   {
     "id": "blades-in-the-dark",
     "name": "Blades in the Dark",
     "attributes": [
       { "id": "insight", "label": "Insight", "skills": ["hunt", "study", "survey", "tinker"] },
       { "id": "prowess", "label": "Prowess", "skills": ["finesse", "prowl", "skirmish", "wreck"] },
       { "id": "resolve", "label": "Resolve", "skills": ["attune", "command", "consort", "sway"] }
     ],
     "pools": [
       { "id": "stress", "label": "Stress", "max": 9, "type": "counter" },
       { "id": "trauma", "label": "Trauma", "max": 4, "type": "tags" }
     ],
     "diceEngine": {
       "type": "pool_highest",
       "dice": "d6",
       "successThreshold": 6,
       "partialThreshold": 4
     }
   }
   ```
2. **Integration with `EntityStatBlock` (OB-180)**:
   - `EntityStatBlock` already supports arbitrary attributes, actions, traits, and damage types.
   - The manifest dictates how `EntityStatBlock` is rendered in `<StatBlockCard />` and the sheet viewer.
3. **Characterfiles.com Integration**:
   - Support dragging `.character` JSON files from characterfiles.com or GitHub rules repositories.

### Recommended Implementation Tasks
- **OB-150-A**: Define `RulesetManifest` interface in `packages/shared/src/types.ts`.
- **OB-150-B**: Build schema-driven dynamic character sheet renderer `<DynamicSheetViewer />`.
- **OB-150-C**: Create built-in manifests for D&D 5e, PF2e, Call of Cthulhu, and Blades in the Dark.

---

## 5. Pathfinder 2e Complete Ruleset Support (OB-153)

### Objective
Complete the PF2e implementation by adding Multiple Attack Penalty (MAP) calculation, 4-tier degrees of success, and full strike actions.

### Technical Research & Architecture
1. **Multiple Attack Penalty (MAP)**:
   - Standard attacks incur penalties: 1st attack (0), 2nd attack (-5), 3rd+ attack (-10).
   - Weapons with the `Agile` trait reduce penalties: 1st attack (0), 2nd attack (-4), 3rd+ attack (-8).
   - In `<StatBlockCard />` and token attack buttons, render three clickable attack roll buttons: `[Strike (+8)]`, `[-5 (+3)]`, `[-10 (-2)]`.
2. **Degrees of Success Engine**:
   - Compare roll total $R$ against Target DC:
     - $R \ge \text{DC} + 10$: **Critical Success**
     - $R \ge \text{DC}$: **Success**
     - $R < \text{DC}$: **Failure**
     - $R \le \text{DC} - 10$: **Critical Failure**
   - Natural 20 upgrades the result by one step; Natural 1 downgrades by one step.
   - Roll announcement banner displays badge: `Critical Success!`, `Success`, `Failure`, `Critical Failure`.

### Recommended Implementation Tasks
- **OB-153-A**: Add MAP calculation buttons to PF2e actions in `<StatBlockCard />`.
- **OB-153-B**: Add PF2e degree-of-success evaluation helper in `AdvancedDiceEngine.ts`.
- **OB-153-C**: Add PF2e condition tracking (Frightened, Drained, Doomed) with auto-decrement in `StatusManager.ts`.

---

## 6. Mobile Touch & Interaction Polish (OB-137, OB-138)

### Objective
Deliver a responsive, ergonomic mobile experience on iOS and Android browsers:
- **OB-137**: Fix finger touch offset so players can see the token they are dragging under their finger.
- **OB-138**: Fix token interaction bar clipping the left navigation flyout on mobile viewports.

### Technical Research & Architecture
1. **Touch Finger Offset Calibration (OB-137)**:
   - When dragging a token on touch screens, the user's thumb or index finger covers the token artwork and grid intersection.
   - Solution: Apply a vertical drag offset (-40px in screen space) for touch pointer events (`e.pointerType === 'touch'`).
   - Render a visible tether or crosshair between the touch contact point and the offset token center so placement is pixel-accurate.
2. **Mobile Interaction Bar Layout & Safe Area Insets (OB-138)**:
   - On small screens (<768px), the bottom token interaction bar collides with the left floating toolbar and mobile bottom navigation.
   - Solution:
     - Wrap controls in `padding-bottom: env(safe-area-inset-bottom, 12px)`.
     - Collapse the token interaction bar into a compact bottom sheet on mobile with a swipe-up handle.
     - Set left menu flyout `z-index` higher than the token bar, or automatically dock the token bar when navigation is open.

### Recommended Implementation Tasks
- **OB-137-A**: Add touch offset detection and rendering in `PointerSystem.ts`.
- **OB-137-B**: Add user toggle in Settings: "Touch Drag Offset (None / Medium / Large)".
- **OB-138-A**: Update CSS layout of `TokenControls.tsx` for mobile viewports using container queries.

---

## 7. Wargaming / Brawl Platform Engine (OB-154 through OB-163)

### Objective
Transform OldBear into a tournament-grade wargaming platform (Warhammer 40k, Age of Sigmar, Warcry, Kill Team, The Old World).

### Technical Research & Architecture
1. **Game Mode Toggle (OB-154)**:
   - Support `GAME_MODE=vtt|brawl|all` via environment variable.
   - In `App.tsx`, route to either `AppVtt.tsx`, `AppBrawl.tsx`, or render a landing switcher.
2. **Army / Unit / Model Hierarchy (OB-155)**:
   - An `Army` contains `Unit`s. A `Unit` contains multiple `Model` tokens that move together or independently.
   - Group selection: Selecting any model highlights the entire squad with unit halo rings.
3. **Unit Coherency Graph Engine (OB-156)**:
   - Models in a squad must remain within 2" horizontal distance of at least one other model (or 2 models for squads $>6$).
   - Graph validation: Build an adjacency graph where edges exist if $\text{dist}(m_i, m_j) \le 2\text{ inches}$.
   - Connected components: If graph is disconnected, render red warning outline around out-of-coherency models.
4. **Dual Chess Clocks (OB-158)**:
   - High-contrast two-player timer (e.g. 1 hour 30 mins per player).
   - Spacebar or tap flips the clock to the opponent's time.
   - Audio alert when a player's clock dips below 5 minutes or hits 0 ("time out").
5. **Objective Marker Control Zone Calculation (OB-160)**:
   - 40mm objective markers on canvas.
   - Compute models within 3" radius of the marker center.
   - Calculate Total Objective Control (OC) for Player A vs Player B to determine scoring.
6. **Roster Ingestion Pipeline (OB-161)**:
   - Parse BattleScribe `.rosz` files (zipped XML `roster.xml`) using `jszip` + browser `DOMParser`.
   - Parse NewRecruit JSON export schema.
   - Instantiate full units and models onto the canvas staging area.

### Recommended Implementation Roadmap
- **Sprint 1 (Foundations)**: OB-154 (Mode Toggles), OB-155 (Army/Unit Models), OB-158 (Chess Clocks).
- **Sprint 2 (Spatial Mechanics)**: OB-156 (Unit Coherency Engine), OB-160 (Objective Control Zones).
- **Sprint 3 (Tournaments & Ingestion)**: OB-161 (BattleScribe/NewRecruit Parsers), OB-159 (Scoreboard/VP), OB-163 (TO Mode).
