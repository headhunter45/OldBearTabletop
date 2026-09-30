# 🐻 Old Bear Rodeo

A lightweight, zero-install, mobile-friendly virtual tabletop (VTT) and tactical battlemap system designed for seamless tabletop roleplaying sessions. Built with modern TypeScript, WebRTC voice communication, HTML5 Canvas, and deep D&D Beyond character synchronization.

- 💬 **Feedback & Bug Reports**: [Feedback Form](https://forms.gle/zD9Rmqj4c3Dffpw39)
- 🐙 **GitHub Repository**: [headhunter45/OldBearRodeo](https://github.com/headhunter45/OldBearRodeo)

---

## Table of Contents
1. [Key Features](#key-features)
2. [Quickstart with Docker (Recommended)](#quickstart-with-docker-recommended)
3. [Building, Pushing & Production Deployment](#building-pushing--production-deployment)
   - [The Container Images](#1-the-container-images)
   - [Automated CI Build & Publish Script (`scripts/ci-build.sh`)](#2-automated-ci-build--publish-script-scriptsci-buildsh)
   - [Manual Docker Compose Workflow](#3-manual-docker-compose-workflow)
   - [Deploying on Your Production Server](#4-deploying-on-your-production-server)
   - [Reverse Proxy & Nginx Proxy Manager (NPM)](#5-reverse-proxy--nginx-proxy-manager-npm-configuration)
4. [Environment Variables Reference (`.env`)](#environment-variables-reference-env)
5. [Native Local Development](#native-local-development)
6. [User Manual & App Guide](#user-manual--app-guide)
   - [Starting a Game & Inviting Players](#starting-a-game--inviting-players)
   - [Map Management & Grid Alignment](#map-management--grid-alignment)
   - [Tokens & Combat Management](#tokens--combat-management)
   - [D&D Beyond Character Integration](#dd-beyond-character-integration)
   - [Voice Chat & Audio Streaming](#voice-chat--audio-streaming)
   - [Soundboard & Custom Audio](#soundboard--custom-audio)
   - [Dice Roller & Initiative Tracker](#dice-roller--initiative-tracker)
   - [Chat Commands & Token Association](#chat-commands--token-association)
   - [Tabletop Wargaming & Army Rosters (Brawl)](#tabletop-wargaming--army-rosters-brawl)
   - [Full Data Backup & Browser Migration](#full-data-backup--browser-migration)
   - [Global Drag and Drop](#global-drag-and-drop)
7. [Configuring Available Colors](#configuring-available-colors)
8. [Architecture & Technology Stack](#architecture--technology-stack)

---

## Key Features

- **Blazing-Fast HTML5 Canvas Engine**: Smooth 60 FPS rendering with pan, zoom, multi-touch pinch-to-zoom, grid snapping, and distance measurement.
- **Zero-Install Networking**: Instant WebSocket room synchronization with peer-to-peer WebRTC voice mesh.
- **Map Alignment & Grid Overlay**: Configure grid tile counts (X/Y), pixel tile size, and grid offsets (X/Y). Toggle grid overlay rendering on top of the map but underneath tokens.
- **Advanced Token Controls**: Duplicate tokens with `Ctrl+D` / `Cmd+D`, assign control of multiple tokens per player, cycle-click through overlapping tokens, and prevent token stacking on placement.
- **Full D&D Beyond Integration**: Import any public character sheet by URL or ID. Includes offline base64 avatar conversion, 5e standard ability score layout (modifier large, score small), proficiency bonus, and interactive trained & expertise skills list.
- **Low-Latency Voice Chat**: WebRTC mesh voice chat with Open Mic and Push-to-Talk (keyboard hotkey + on-screen mobile button), audio device selection, GM force-mute, and animated mic/headphone indicators for active transmission.
- **Soundboard & Custom Audio**: Synthesized one-shot sound effects and custom audio track uploads for GMs with looping, individual volume controls, and room broadcast.
- **Full Data Backup & Export**: One-click export of all maps, tokens, custom audio, character sheets, and session state into a portable `.json` backup file for moving between devices and browsers.

---

## Quickstart with Docker (Recommended)

Old Bear Rodeo provides a complete multi-container setup via Docker Compose, including the client application, signaling/API server, PostgreSQL database, and an Nginx reverse proxy.

### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Running the Stack
1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/your-org/OldBearRodeo.git
   cd OldBearRodeo
   ```

2. Start all containers in the background:
   ```bash
   docker compose up --build -d
   ```

3. Open your browser:
   - **Application URL**: [http://localhost](http://localhost) (Port 80 via Nginx)
   - **Direct Server API**: [http://localhost:3001](http://localhost:3001)

### Docker Service Topology
| Container Name | Service | Dockerfile | Internal Port | Exposed Port | Description |
|---|---|---|---|---|---|
| `oldbear_nginx` | Ingress Reverse Proxy | `docker/Dockerfile.nginx` | `80` | `80:80` | Baked-in gateway routing `/`, `/api/`, `/health`, and WebSocket `/ws` |
| `oldbear_client` | Frontend SPA | `docker/Dockerfile.client` | `80` | — | Nginx serving production Vite build |
| `oldbear_server` | Backend API & WebSocket | `docker/Dockerfile.server` | `3001` | `3001:3001` | Node.js 22 WebSocket signaling and D&D Beyond proxy |
| `oldbear_postgres` | Database | Upstream `postgres:16-alpine` | `5432` | `5432:5432` | Persistent campaign storage |

### Useful Docker Commands
- **View live logs**:
  ```bash
  docker compose logs -f
  ```
- **Stop all containers**:
  ```bash
  docker compose down
  ```
- **Reset database and volumes**:
  ```bash
  docker compose down -v
  ```

---

## Building, Pushing & Production Deployment

Old Bear Rodeo is packaged into three self-contained container images (`oldbear_server`, `oldbear_client`, and `oldbear_nginx`), allowing 1-step builds and zero-configuration remote deployments.

### 1. The Container Images

- **`oldbear_server`** (`docker/Dockerfile.server`): Multi-stage Node.js 22 Alpine build compiling `@oldbear/shared` and `@oldbear/server`, running the WebSocket signaling and REST server with production dependencies.
- **`oldbear_client`** (`docker/Dockerfile.client`): Multi-stage build running `vite build`, serving the optimized SPA bundle via Nginx Alpine.
- **`oldbear_nginx`** (`docker/Dockerfile.nginx`): Nginx Alpine gateway with the reverse proxy configuration (`docker/nginx.conf`) baked into `/etc/nginx/nginx.conf`. It routes static traffic to `client:80`, API traffic to `server:3001`, and manages the WebSocket `101 Switching Protocols` handshake with keep-alive timeouts.

> [!TIP]
> Because `nginx.conf` is baked into `oldbear_nginx`, you **do not** need to copy configuration files or map volume paths on your production host!

### 2. Automated CI Build & Publish Script (`scripts/ci-build.sh`)

Old Bear Rodeo includes an automated production build and publication script in [`scripts/ci-build.sh`](file:///Users/tom/Projects/OldBearRodeo/scripts/ci-build.sh). 

#### Single Source of Truth Versioning (`VERSION`)
The repository root contains a [`VERSION`](file:///Users/tom/Projects/OldBearRodeo/VERSION) file (e.g. `0.1.0-alpha5`). 
- When updated, this single file controls the application version across the Vite frontend, backend container metadata, and container registry image tags.
- The web app dynamically renders the version along with the short git commit hash, e.g. `v0.1.0-alpha5 (c292e59)`, in the TopBar and Mobile Drawer.
- The CI script automatically tags images with the version from `VERSION` (or custom `--tag`), the short git commit hash, and `:latest`.

```bash
./scripts/ci-build.sh [OPTIONS]
```

#### Command Options & Flags

| Flag | Parameter | Description | Default |
|:---|:---|:---|:---|
| `--registry` | `<URL>` | Container registry prefix (default: `ghcr.io/headhunter45/`) | `${IMAGE_REGISTRY:-ghcr.io/headhunter45/}` |
| `--tag` | `<TAG>` | Primary container image tag | Sourced from [`VERSION`](file:///Users/tom/Projects/OldBearRodeo/VERSION) (e.g. `0.1.0-alpha5`) |
| `--push` | *None* | Automatically push images to the container registry after building | `false` |
| `--test` | *None* | Execute automated test suites (`npm test`) before building images | `false` |
| `-h`, `--help` | *None* | Display usage information and available options | — |

#### Common CI Script Workflows

- **Local Production Build**:
  ```bash
  ./scripts/ci-build.sh
  ```
- **Test and Build**:
  ```bash
  ./scripts/ci-build.sh --test
  ```
- **Build, Tag with Git Commit, and Push to Default Registry**:
  ```bash
  ./scripts/ci-build.sh --test --push
  ```
- **Custom Registry and Semantic Version Release**:
  ```bash
  ./scripts/ci-build.sh --registry ghcr.io/myusername/ --tag v0.1.0 --test --push
  ```

---

### 3. Manual Docker Compose Workflow

You can also build and tag all three images manually using Docker Compose:

```bash
# Build all 3 images with your registry prefix
IMAGE_REGISTRY=ghcr.io/headhunter45/ docker compose build

# Push all 3 images to your registry
IMAGE_REGISTRY=ghcr.io/headhunter45/ docker compose push
```

This compiles and tags:
- `ghcr.io/headhunter45/oldbear_server:latest`
- `ghcr.io/headhunter45/oldbear_client:latest`
- `ghcr.io/headhunter45/oldbear_nginx:latest`

### 4. Deploying on Your Production Server

On your production server (e.g. behind Nginx Proxy Manager, Portainer, or standard Docker Compose):

> [!NOTE]
> **Authenticating with GitHub Container Registry (ghcr.io)**  
> While the container images remain private, authenticate your production Docker host using a GitHub Personal Access Token (PAT with `read:packages` scope):
> ```bash
> echo "$CR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
> ```

#### Option A: Using `docker-compose.yml` with `.env` (Recommended)

Place `docker-compose.yml` on the server and create a `.env` file with your settings:

```env
# 1. Container Registry
IMAGE_REGISTRY=ghcr.io/headhunter45/
IMAGE_TAG=latest

# 2. Ports
NGINX_PORT=20001
SERVER_PORT=3001

# 3. Persistent Host Storage
PGDATA_PATH=/mnt/Data/Apps/oldbear-vtt/pgdata

# 4. Database Credentials
POSTGRES_DB=oldbear_vtt
POSTGRES_USER=oldbear
POSTGRES_PASSWORD=oldbear_secret_password

# 5. Security & Network
NODE_ENV=production
SESSION_SECRET=generate_a_secure_random_secret_for_production
CORS_ORIGIN=*
MAX_UPLOAD_SIZE_MB=50
```

Deploy or update:
```bash
docker compose pull
docker compose up -d
```

#### Option B: Standalone Production Compose File (e.g., for Portainer Stacks)

If using Portainer, Dockge, or a single standalone file, no configuration files need to be copied to the host:

```yaml
services:
  client:
    container_name: oldbear_client
    image: ghcr.io/headhunter45/oldbear_client:latest
    restart: unless-stopped
    depends_on:
      - server

  nginx:
    container_name: oldbear_nginx
    image: ghcr.io/headhunter45/oldbear_nginx:latest
    restart: unless-stopped
    ports:
      - '20001:80'
    depends_on:
      - client
      - server

  postgres:
    container_name: oldbear_postgres
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: oldbear_vtt
      POSTGRES_PASSWORD: oldbear_secret_password
      POSTGRES_USER: oldbear
    healthcheck:
      interval: 3s
      retries: 5
      test:
        - CMD-SHELL
        - pg_isready -U oldbear -d oldbear_vtt
      timeout: 3s
    volumes:
      - /mnt/Data/Apps/oldbear-vtt/pgdata:/var/lib/postgresql/data

  server:
    container_name: oldbear_server
    image: ghcr.io/headhunter45/oldbear_server:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      CORS_ORIGIN: '*'
      DATABASE_URL: postgres://oldbear:oldbear_secret_password@postgres:5432/oldbear_vtt
      LOG_LEVEL: info
      MAX_UPLOAD_SIZE_MB: 50
      NODE_ENV: production
      PORT: 3001
      SESSION_SECRET: oldbear_session_development_secret_change_in_production
      STUN_SERVER_URL: stun:stun.l.google.com:19302
```

### 5. Reverse Proxy & Nginx Proxy Manager (NPM) Configuration

When hosting behind an upstream reverse proxy (like Nginx Proxy Manager, Cloudflare, Traefik, or Caddy):

- **Forward Host / IP**: IP address or hostname of your Docker host.
- **Forward Port**: Port mapped to `oldbear_nginx` (e.g. `20001` or `80`).
- **Websockets Support**: **MUST BE ENABLED (ON)**.
  > [!IMPORTANT]
  > In Nginx Proxy Manager, toggle **Websockets Support: ON** in the Proxy Host Details tab. If disabled, Nginx Proxy Manager strips the `Upgrade: websocket` and `Connection: Upgrade` headers, causing the WebSocket connection to `/ws` to fail with `404 Not Found`.


---

## Environment Variables Reference (`.env`)

Old Bear Rodeo is configured using environment variables defined in `.env` (or `.env.production` for production deployments). A template file [` .env.example`](file:///Users/tom/Projects/OldBearRodeo/.env.example) is provided in the root directory.

### Configuration Hierarchy
- **`.env.example`**: Complete template documenting all variables, defaults, and usage examples.
- **`.env`**: Local development environment configuration (read automatically by Docker Compose and Node.js).
- **`.env.production`**: Production overrides for deployed server instances.

---

### Variable Reference

#### 1. Network & Service Ports

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `CLIENT_PORT` | `3000` | Port for the Vite development client server | `3000` |
| `SERVER_PORT` | `3001` | Port for the Node.js Express API and WebSocket (`/ws`) server | `3001` |
| `NGINX_PORT` | `80` | Host port mapped to the Nginx reverse proxy gateway container | `80` or `20001` |
| `POSTGRES_PORT` | `5432` | Host port for the PostgreSQL database container | `5432` |

#### 2. Database Configuration

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `POSTGRES_USER` | `oldbear` | Username for the PostgreSQL database | `oldbear` |
| `POSTGRES_PASSWORD` | `oldbear_secret_password` | Password for PostgreSQL authentication | `your_secure_password` |
| `POSTGRES_DB` | `oldbear_vtt` | Name of the primary database | `oldbear_vtt` |
| `DATABASE_URL` | *See note* | Complete PostgreSQL connection URI. If omitted or unreachable, server falls back to in-memory mode | `postgres://oldbear:secret@postgres:5432/oldbear_vtt` |

#### 3. Environment & Runtime

| Variable | Default | Description | Allowed Values |
|:---|:---:|:---|:---|
| `NODE_ENV` | `development` | Node.js execution environment | `development`, `production` |
| `LOG_LEVEL` | `info` | Server console log verbosity | `debug`, `info`, `warn`, `error` |
| `GAME_MODE` | *None* | Strict single-mode deployment locking instance to VTT or Brawl (ideal for dedicated subdomains like `brawl.domain.com`) | `vtt`, `brawl` |
| `GAME_MODES` | `vtt,brawl` | Comma-separated list of enabled modes allowing runtime switching via URL parameter (`?mode=brawl`) or TopBar button | `vtt,brawl`, `vtt`, `brawl` |

#### 4. Upload & Storage Limits

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum file upload size limit in Megabytes for maps, tokens, and audio tracks | `50` (or `100` for high-res 4K maps) |

#### 5. Security & CORS

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `CORS_ORIGIN` | `*` | Allowed Origin header for REST API requests | `*` or `https://vtt.yourdomain.com` |
| `SESSION_SECRET` | *dev secret* | Secret key used for session signing and authentication | `generate_random_hex_for_production` |

#### 6. WebRTC Voice & P2P Networking (STUN / TURN)

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `STUN_SERVER_URL` | `stun:stun.l.google.com:19302` | Public STUN server for NAT discovery | `stun:stun.l.google.com:19302` |
| `TURN_SERVER_URL` | *None* | Optional TURN relay server for symmetric NATs and mobile carriers | `turn:turn.yourdomain.com:3478` |
| `TURN_USERNAME` | *None* | Authentication username for TURN relay | `turnuser` |
| `TURN_CREDENTIAL` | *None* | Authentication password/token for TURN relay | `turnsecret` |

#### 7. Container Registry & Remote Deployment

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `IMAGE_REGISTRY` | *None* | Docker container registry prefix with trailing slash | `ghcr.io/headhunter45/` or `registry.tomusan.com/` |
| `IMAGE_TAG` | `latest` | Tag used for pulling, building, or running container images | `latest`, `v0.1.0`, or git commit |
| `PGDATA_PATH` | *Named volume* | Host directory path for persistent PostgreSQL database storage | `/mnt/Data/Apps/oldbear-vtt/pgdata` |

#### 8. UI & Notification Timers

| Variable | Default | Description | Example |
|:---|:---:|:---|:---|
| `TOAST_DURATION_MS` | `4500` | Duration in milliseconds before ephemeral toasts and fog status banners auto-dismiss | `4500` |
| `VITE_TOAST_DURATION_MS` | `4500` | Client-side Vite environment variable mirroring toast duration | `4500` |

---

## Native Local Development

If running natively without Docker on macOS, Linux, or Windows:

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

### 1. Installation
Install all workspace dependencies from the repository root:
```bash
npm install
```

### 2. Build Packages
Build the shared protocol package, backend server, and frontend client:
```bash
npm run build
```

### 3. Run Automated Tests
Run unit tests across all workspaces:
```bash
npm test
```

### 4. Start Development Servers
Start both the client and backend server concurrently:
```bash
# Terminal 1: Backend Server
npm run dev -w @oldbear/server

# Terminal 2: Frontend Client
npm run dev -w @oldbear/client
```
- The frontend client runs on `http://localhost:3000` (or `http://localhost:5173`).
- The backend server runs on `http://localhost:3001`.

---

## User Manual & App Guide

### Starting a Game & Inviting Players
1. **Host as GM**: When you open the application without any query parameters, you are automatically assigned the **Game Master (GM)** role.
2. **Invite Players**: Click the **Share** button (invite link) in the top navigation bar. This copies a player join URL (e.g. `http://localhost:3000/?room=daring-dragon-42`).
3. **Player Access**: When players open the invite URL, they enter as players and have access only to their assigned tokens and visible map regions.

---

### Map Management & Grid Alignment
1. **Upload Maps**: Click the **Map** icon in the top bar to open the **Maps & Scenes Manager**.
   - You can upload single or **multiple map images** simultaneously (`.png`, `.jpg`, `.webp`).
   - You can also **drag and drop map files** anywhere onto the window.
2. **Grid Alignment (Tiles & Offsets)**:
   - Select any map and click the **Settings** icon to open the inline Map Settings editor.
   - **Tiles X / Tiles Y**: Specify the exact dimensions of your map in grid cells (e.g. 30 × 20).
   - **Tile Size (px)**: Fine-tune the cell size in pixels.
   - **Grid Offset X / Y**: Shift the grid overlay horizontally or vertically in pixels to align perfectly with pre-drawn map grids.
3. **Grid Overlay Toggle**:
   - In the left toolbar, click the **Grid Overlay (#)** button to instantly toggle grid visibility on or off.
   - The grid renders on top of the battlemap image but beneath all creature tokens and spell markers.
4. **Submaps, Multi-Floors & Staging Areas**:
   - Configure secondary submaps on any scene via the Map Settings modal.
   - Presets include:
     - **Building Floors**: Place adjacent upper levels or basements side-by-side on the same canvas scene.
     - **Connected Dungeons**: Portal caverns and connected battlegrounds.
     - **Deployment Zones**: Color-coded and labeled bounds for wargaming deployment.
     - **Casualty Tray / Graveyard**: Dedicated off-table area for slain models to facilitate resurrection and VP scoring.
     - **Off-Table Staging Area**: Holding area for Strategic Reserves, Deep Strike, and Embarked units inside Transports.
   - **Scene Templates**: Click the **Duplicate as Scene Template** icon in the Maps Manager to clone a scene's full submap and staging layout with new maps.

---

### Tokens & Combat Management
1. **Adding Tokens**: Click the **`+`** icon in the top bar or drag image files onto the board.
   - The engine automatically calculates the first free adjacent square to avoid stacking tokens on top of each other.
2. **Selecting & Overlapping Tokens**:
   - Click a token to select it.
   - If multiple tokens occupy the same cell, **click repeatedly to cycle through all tokens** in that position.
   - Controllable tokens are prioritized over non-controllable tokens.
3. **Duplicating Tokens**:
   - Select any token and press **`Ctrl + D`** (or **`Cmd + D`** on macOS) or click the **Duplicate** icon in the bottom floating token bar.
   - A copy will appear in the nearest unoccupied cell with identical stats, HP, and settings.
4. **Multi-Token Player Control**:
   - As GM, open the bottom token bar or click the edit pencil.
   - Under **Player Control**, select which player controls the token, or assign multiple tokens to a single player.

---

### D&D Beyond Character Integration
1. **Importing a Character**:
   - Open the **Character Sheet** (User icon in top bar).
   - Enter a D&D Beyond character URL or ID (e.g., `https://www.dndbeyond.com/characters/49074997` or `49074997`), or type `'demo'` for a sample character.
   - Click **Sync**.
2. **Token Avatar Synchronization**:
   - When synced, the character's name, HP, speed, and avatar image are automatically applied to the active token.
   - Avatars are downloaded and converted to self-contained Base64 Data URLs by the server, bypassing cross-origin (CORS) restrictions.
3. **5e Character Sheet Layout**:
   - **Ability Scores**: Displays the ability modifier **large and bold** (e.g. `+4`) and the base score **small** (e.g. `18`).
   - **Proficiency Bonus**: Displays level-based proficiency bonus in the vitals bar.
   - **Skills List**: Displays all 18 skills with indicators for untrained (`○`), proficient (`● PROF`), and expertise (`★ EXP`), with a "Trained Only" filter toggle.
4. **Saved Characters Storage**:
   - All imported characters are cached in both the player's and the GM's local storage.
   - Use the **Load Saved Character** dropdown to instantly switch characters without re-fetching from the internet.

---

### Pathbuilder 2e (PF2e) Character Integration
1. **Import by Build ID or URL**:
   - Open the **Characters** flyout and switch to the **Pathbuilder 2e (PF2e)** tab.
   - Enter your numeric Build ID or share URL (e.g. `https://pathbuilder2e.com/json.php?id=123456`) and click **Import**.
2. **File Upload & JSON Paste**:
   - Click **Upload .json File** to load an exported Pathbuilder character build from your device.
   - Alternatively, toggle **Paste JSON** to paste the raw export text.
3. **Global Drag and Drop**:
   - Drag and drop any Pathbuilder `.json` export file directly onto the canvas to instantly spawn a ready-to-fight token and save the character sheet.
4. **Calculated Mechanics & Strikes**:
   - Automatically calculates level-scaled proficiencies across all 4 ranks (Trained, Expert, Master, Legendary).
   - Computes Fortitude, Reflex, and Will saving throws, Perception DC, Armor Class (AC), and Hit Points (HP).
   - Converts weapons and unarmed strikes into actionable attacks with attack bonuses and damage expressions.
   - Populates core PF2e skills, granted Lore skills, feats, and spells.

---

### Voice Chat & Audio Streaming
1. **Quick Controls & Activity Indicators**:
   - The microphone icon pulses with a vibrant green wave when transmitting audio.
   - The headphone icon pulses with a sky-blue wave when receiving audio from other players.
2. **Voice Modes**:
   - **Open Microphone**: Transmits automatically based on microphone volume threshold.
   - **Push-to-Talk (PTT)**: Transmits only while holding the PTT key (default `V`, configurable in Voice Settings) or holding the on-screen mobile PTT button.
3. **GM Moderation**:
   - GMs can click the mute icon next to any player in the voice settings modal to force-mute them across the room.
   - Each player can adjust relative volume levels for every other participant.

---

### Soundboard & Custom Audio
1. **Built-in SFX**: Instant synthesized sound effects for weapon slashes, arcane spells, dice rattles, and victory fanfares that work out of the box.
2. **Adding Custom Sounds (GM)**:
   - Click the **Volume** icon in the top bar to open the Soundboard.
   - Click **`+ Add Sounds (Multi)`** or **drag and drop audio files** (`.mp3`, `.wav`, `.ogg`, `.m4a`) onto the window.
   - Tracks are stored in browser IndexedDB.
   - Each track features individual Play/Pause, Loop toggle, Volume slider, and Delete options.
   - Enable **Broadcast Sounds to Players** to play audio for everyone in the room.

---

### Dice Roller & Initiative Tracker
- **Dice Roller**: Roll polyhedral dice (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`) with modifiers and advantage/disadvantage. Rolls are broadcast to all players in the room with roll history.
- **Initiative Tracker**: Add characters and monsters with automated or manual initiative rolls, cycle through rounds, and highlight the active turn.

---

### Chat Commands & Token Association
The in-game chat panel supports full token association, enabling players and GMs to speak and roll as specific controllable tokens on the battlemap.

1. **Associating a Token**:
   - **Visual Selector**: Use the **"Speaking as:"** dropdown bar above the chat input to pick any token you control (or GM controls all tokens). Click **`Bind Selected`** to instantly associate whichever token is selected on the canvas.
   - **Slash Commands**:
     - `/token`: Lists all controllable tokens on the map with numeric indices.
     - `/token <name|index>`: Associates your chat with that token (e.g. `/token 1` or `/token Goblin Shaman`).
     - `/token clear`: Clears the association and returns speaking identity to your player name.
     - `/as <name> <message>`: Sends a one-off in-character message or speech bubble as that name.
2. **Token-Attributed Attacks & Spells**:
   - `/attack [name]`: Attacks with the associated token's weapons or actions (e.g. `/attack Greatsword`). If no name is provided, lists available actions.
   - `/attack? [name]`: Inspects the weapon's action card without rolling.
   - `/spell [name]` / `/spell? [name]`: Casts or inspects a spell from the associated character or monster statblock.
   - `/roll d20+init`: Automatically rolls initiative using the associated token's initiative bonus or dexterity modifier.
   - When a token is associated, rolls and messages display attribution in the format `Player Name (Token Name)` and display the token avatar.
3. **Command History Navigation**:
   - Press **Up Arrow** / **Down Arrow** in the chat message input to cycle through previously executed commands and messages.

---

### Tabletop Wargaming & Army Rosters (Brawl)
Old Bear Brawl provides a dedicated competitive tabletop wargaming environment with:
1. **Army ➔ Unit ➔ Model Hierarchy**:
   - Organize armies with points limits, factions, and unit rosters.
   - Automatic unit disambiguation: Duplicate squads are automatically labeled `A`, `B`, etc. (e.g. `Terminators A`, `Terminators B`).
   - Automatic model numbering: Models default to `<Unit Name> <Number>` (e.g., `Terminators A 1`, `Terminators A 2`).
2. **True Base-to-Base Geometry**:
   - Model base shapes defined in millimeters (`circle`, `oval`, `rect`, `polygon`).
   - True perimeter-to-perimeter edge distance calculations in inches (`"`).
3. **One-Click Unit Deployment**:
   - Open the **Army Roster Flyout** (shield icon in Brawl top bar) to view unit datasheets, points, weapons, and model profiles.
   - Click **`Deploy Unit to Battlemap`** to deploy the entire squad onto the canvas in formation.

---

### Full Data Backup & Universal `.binder` Pipeline
To switch computers or browsers without losing maps, audio, tokens, or characters:
1. Click the **Database** icon in the top bar (or "Backup & Transfer Data" in the mobile drawer).
2. **Export Universal `.binder` File**: Click **"Export .binder File"** to export an open, cross-platform tabletop collection document (`.binder`) conforming to the schema draft (`https://schemas.ttrpgwith.me/v1/binder.json`).
   - Includes private application state in `_oldbear.vtt` (scenes, tokens, custom statuses, audio, fog) and `_oldbear.brawl` (army rosters, units, points).
   - Generates third-party compatible card collections (`collections`) so tools like MonsterCards can read tokens and statblocks without losing application metadata.
   - User-Generated Content (UGC): Fully user-owned and free of hardcoded copyrighted material.
3. **Export Standard JSON**: Click **"Export JSON Backup"** to download a standard `oldbear-rodeo-backup-YYYY-MM-DD.json` file.
4. **Importing**: Select any `.binder` or `.json` file via **"Import .binder / JSON"** (or simply drag and drop the `.binder` or `.json` file onto the window). All scenes, tokens, sound tracks, characters, and rosters are restored automatically!

---

### Global Drag and Drop
You can drag and drop files from your desktop directly onto the Old Bear Rodeo window at any time:
- **Universal `.binder` Files (`.binder`)**: Restores tabletop campaign state, tokens, scenes, and rosters immediately.
- **Images (`.png`, `.jpg`, `.webp`)**: GMs are prompted to add them either as Creature Tokens or as Battlemaps; players have them added as Tokens at the drop position.
- **Audio (`.mp3`, `.wav`, `.ogg`)**: Added directly to the Soundboard library.
- **JSON (`.json`)**: Recognized as an Old Bear Rodeo backup or character/monster export and restored immediately.

---

### Help & Keyboard Shortcuts
- Press **`?`** (or **`Shift + /`**) anywhere on the virtual tabletop to open the searchable **Keyboard Shortcuts & Hotkeys Cheat Sheet**.
- Access shortcuts via mobile drawer or desktop drawer at any time.
- Integrated **`<HelpTip />`** components provide instant contextual assistance and hotkey badges throughout the UI.

---

### Modular / Tileable Maps & Snapping Map Tiles
- **Modular Map Tiles**: Construct sprawling dungeons, catacombs, and battlefields dynamically using tileable room and corridor assets placed directly on the `map` layer.
- **Magnetic Edge Snapping**: Moving tiles and map props automatically snap magnetically to the North, South, East, and West boundaries of adjacent tiles when brought within snap proximity.
- **Asset Manager Tile Bucket**:
  - Open the **Asset Manager** and select the **Tiles** tab to access the Modular Tile Bucket.
  - Standard Dungeon Tiles include: Corridors, Chambers, Crossroads, Dead Ends, and Great Halls.
  - Upload custom tile packs (`.png`, `.jpg`, `.webp`) or drag them straight onto the tabletop.
  - **In-Play Procedural Tile Generation (Deck)**: Click **"Draw Random Tile (Deck)"** to draw a random tile from the deck and seamlessly append it to the map during live play.

---

## Configuring Available Colors

To customize the colors available for player pointers, token borders, and drawing markers, edit the color definitions in:

```typescript
// File: packages/client/src/config/colors.ts (and packages/shared/src/constants.ts)

export const AVAILABLE_COLORS: ColorOption[] = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose Red', value: '#ef4444' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Crisp White', value: '#ffffff' },
];
```

---

## Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, HTML5 Canvas 2D Engine, Lucide Icons, Vanilla CSS Design System.
- **Client Storage**: IndexedDB (via `idb`) for high-resolution map and audio assets, LocalStorage for character caching and client preferences.
- **Real-Time Signaling**: Node.js, `ws` (WebSocket), TypeScript.
- **Audio & Voice**: WebRTC Mesh Audio (`RTCPeerConnection`), Web Audio API (`AudioContext`) for synthesized effects and audio metering.
- **Backend Proxy**: Express / Node.js native `fetch` with browser User-Agent headers for D&D Beyond API compatibility.
- **Containerization**: Multi-stage Docker builds (`node:22-alpine`, `nginx:alpine`) with Docker Compose.
