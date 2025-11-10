<!--
README generated from current repository state (no CI, tests, license, or Docker artifacts found). All content derived strictly from existing files.
-->

# ctm2 🧩 Multiplayer Parcheesi (Parchís/Ludo) Monolith

![Build Status](https://img.shields.io/badge/build-NO_CI-lightgrey) ![Coverage](https://img.shields.io/badge/coverage-N/A-lightgrey) ![License](https://img.shields.io/badge/license-NO_LICENSE-red) ![Version](https://img.shields.io/badge/version-0.1.0-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

> A minimal unified Next.js + Socket.IO real‑time game server implementing a multiplayer Parcheesi rules engine and canvas‑rendered frontend, optimized for quick local iteration.

## 🏁 Quick Start

Clone, install dependencies, create a local env file, and run the unified dev server.

```bash
git clone <REPO_URL> && cd ctm2
npm install
cat > .env.local <<'EOF'
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NODE_ENV=development
EOF
npm run dev
```

Open http://localhost:3000/parcheesi in two browser tabs, join the same room, and play.

Navigation: [Project Overview](#project-overview) · [Architecture](#architecture-summary) · [Build & Run](#build--run-instructions) · [Testing](#testing--quality) · [FAQ](#faq--troubleshooting) · [Contributing](#contributing--maintenance)

---

## 1. Project Overview

**Purpose**: Provide a lean, easily extensible foundation for a real‑time multiplayer Parcheesi game using modern React (Next.js App Router) and Socket.IO—all served from a single Node process.

**Audience**: Developers exploring real‑time board game mechanics, socket event orchestration, or monolithic Next.js server customization.

**Value Proposition**:

- Single‑port deployment simplifies local and early staging environments.
- Clear separation between pure game rules, state services, and transport handlers accelerates feature iteration.
- Extensible folder convention enables adding new games with minimal boilerplate.

> No demo media detected (e.g., gifs/videos). Add one under `public/` for richer onboarding.

## 2. Tech Stack & Dependencies

| Layer     | Tech                            |
| --------- | ------------------------------- |
| Runtime   | Node.js (ES Modules)            |
| Framework | Next.js 15 (App Router)         |
| UI        | React 19                        |
| Realtime  | Socket.IO (server + client)     |
| Styling   | Tailwind CSS (via postcss)      |
| Config    | dotenv for `.env.local` loading |

**Primary dependencies (from `package.json`):**

| Name                 | Version  | Purpose                             | Source Reference |
| -------------------- | -------- | ----------------------------------- | ---------------- |
| next                 | 15.5.4   | Web application framework & bundler | `package.json`   |
| react                | 19.1.0   | UI library                          | `package.json`   |
| react-dom            | 19.1.0   | DOM bindings for React              | `package.json`   |
| socket.io            | ^4.7.2   | Server realtime transport           | `package.json`   |
| socket.io-client     | ^4.7.2   | Client realtime transport           | `package.json`   |
| dotenv               | ^17.2.3  | Environment variable loading        | `package.json`   |
| tailwindcss          | ^4 (dev) | Utility‑first styling               | `package.json`   |
| @tailwindcss/postcss | ^4 (dev) | Tailwind PostCSS integration        | `package.json`   |

> No external services (AWS/DB/Redis) referenced. All state in memory.

**Minimum Requirements**:

- macOS/Linux/Windows with Node.js ≥18
- ~200MB RAM (small in‑memory structures; no DB) – estimated

## 3. Architecture Summary

High‑level separation of concerns:

| Module                                                  | Responsibility                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/server/bootstrap/server.js`                        | Unified HTTP + Next.js rendering + Socket.IO server startup & lifecycle |
| `src/backend/parcheesi/rules.js`                        | Pure game rules (dice, legal moves, turn logic, capture, win checking)  |
| `src/backend/parcheesi/services/roomService.js`         | Room membership, player tracking, game state storage (in memory)        |
| `src/backend/parcheesi/services/gameService.js`         | Orchestrates dice rolls, move application, win detection                |
| `src/backend/parcheesi/socket/handlers/gameHandlers.js` | Maps socket events to services & emits broadcasts                       |
| `src/frontend/parcheesi/hooks/*`                        | React hooks for game state, dice, canvas rendering & interaction        |
| `src/frontend/parcheesi/components/*`                   | Presentation/components (board, dice, lobby, controls)                  |
| `src/frontend/parcheesi/services/websocketClient.js`    | Thin client wrapper for Socket.IO events/handlers                       |
| `src/shared/logging/logger.js`                          | Simple console logger abstraction                                       |

### Data Flow (Mermaid Diagram)

```mermaid
flowchart LR
    Client[Browser UI / React Hooks] -->|emit game:join / roll:dice / move:token| SocketHandlers
    SocketHandlers[Socket Handlers\n(gameHandlers.js)] --> GameService[Game Service]
    GameService --> Rules[Rules Engine]
    GameService --> RoomService[Room Service]
    RoomService --> State[(In-Memory Game State)]
    GameService -->|broadcast updates| SocketHandlers
    SocketHandlers -->|emit update:state / roll:result / move:result| Client
```

### Game Loop Summary

1. Player joins room (`game:join`). Auto‑start when required player count met.
2. Current player rolls dice (`roll:dice`) → server attaches dice and computes legal moves.
3. Client highlights selectable tokens based on `legalMoves`.
4. Player selects token + die (`move:token`) → validation + move application + potential bonus.
5. Turn advances when all dice used (unless bonus grants extra roll) or no legal moves.
6. Win emitted when all tokens of a player finished.

### Scalability Notes

- All state is process memory (see `rooms` Map in `roomService.js`). Horizontal scaling would require Redis or similar pub/sub & shared state.
- Single port reduces deployment overhead but couples Next.js rendering with realtime layer.

### Key Entry Points

- HTTP + Next.js: `src/server/bootstrap/server.js`
- Socket.IO registration: `src/backend/parcheesi/socket/index.js`
- Rules core: `src/backend/parcheesi/rules.js`
- Frontend mount page: `src/app/parcheesi/page.js`

## 4. Setup & Installation

### Prerequisites

| Tool    | Version           | Install (macOS)     |
| ------- | ----------------- | ------------------- |
| Node.js | ≥18               | `brew install node` |
| npm     | Bundled with Node | —                   |

### Steps

```bash
git clone <REPO_URL>
cd ctm2
npm install
cp .env.local .env.local || echo 'Create .env.local manually'
```

Create `.env.local` (example):

```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NODE_ENV=development
```

> No `.env.example` found. Consider adding one for clarity.

### Configuration Variables

| Variable               | Default (in code)                | Description                     | Example               |
| ---------------------- | -------------------------------- | ------------------------------- | --------------------- |
| PORT                   | 3000                             | Unified HTTP + WS port          | 3000                  |
| NEXT_PUBLIC_APP_URL    | `http://localhost:3000` fallback | Client origin for CORS          | http://localhost:3000 |
| NEXT_PUBLIC_SOCKET_URL | `http://localhost:3000` fallback | Socket.IO client connection URL | http://localhost:3000 |

> No secrets present; runtime safe for public dev use.

### Troubleshooting Setup

- Port in use → change `PORT` in `.env.local`.
- Missing dependencies → rerun `npm install`.
- ES Module import errors → ensure Node ≥18 and `type: module` respected.

## 5. Build & Run Instructions

| Command         | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Start unified development server (Next.js + Socket.IO)   |
| `npm run build` | Build Next.js production assets (Turbopack flag present) |
| `npm run start` | Run production server using built assets                 |

Dev mode auto‑reloads React components and Next.js routes. Socket handlers restart only on process restart.

### Entry Lifecycle

- `server.js` loads `.env.local`, prepares Next app, attaches Socket.IO, registers handlers, listens.
- Graceful shutdown on `SIGTERM` closes socket and HTTP server.

## 6. Testing & Quality

> No test framework, test files, or scripts (`npm test`) detected. Add Jest or Vitest plus sample tests under `src/__tests__/`.

Suggested future commands:

```bash
npm run lint        # After adding ESLint config
npm test            # After adding Jest/Vitest
npm run coverage    # After configuring coverage collection
```

Quality Observations:

- Logging via custom `logger.js` abstraction; replace with Winston/Pino for structured logs.
- No lint/format script present; Tailwind present but no Prettier config.

## 7. Deployment

Current deployment model: run `node src/server/bootstrap/server.js` (or `npm run start`).

> No Dockerfile, container scripts, or CI workflow found. Add GitHub Actions for build/test and optional containerization.

Production Suggestions:

1. Introduce `.env.production` for deployment overrides.
2. Add health endpoint (basic `/api/health` exists under `src/app/api/health/route.js`).
3. Implement Redis adapter for Socket.IO scaling.

## 8. Development Workflows

Typical local loop:

1. Edit rules/service logic under `src/backend/parcheesi/`.
2. Reload page (Next.js hot reload updates frontend; server restart required for backend changes).
3. Observe realtime events in console (prefixed `[Socket]`).
4. Iterate on canvas rendering in `drawing.js` & hooks.

Feature Addition (Example: New Game):

1. Create `src/backend/<gameName>/` (rules + services + socket handlers).
2. Create `src/frontend/<gameName>/` (components + hooks + config).
3. Add `src/app/<gameName>/page.js` mounting frontend root component.
4. Register handlers in unified server (if new path not included by alias).

## 9. Code Conventions & Style

- ES Modules (`import/export`) throughout.
- CamelCase for functions; lowercase with underscores avoided.
- React components use PascalCase and reside in `components/`.
- Hooks (`useGame`, `useDice`) prefixed with `use` per React convention.
- Socket event names: kebab style (`game:join`, `roll:dice`).

### Directory Structure (Condensed)

```text
src/
  app/
    parcheesi/            # Route mounting Parcheesi UI
    api/                  # REST endpoints (health, counter)
  backend/parcheesi/
    rules.js              # Pure rules engine
    services/             # gameService & roomService
    socket/               # Socket handler registration
  frontend/parcheesi/
    components/           # UI components (Board, Dice, Lobby, etc.)
    hooks/                # useGame, useDice, canvas logic
    services/             # websocketClient
    config/               # constants.js board geometry/colors
    utils/                # drawing & path helpers
  server/bootstrap/       # Unified server entry
  shared/logging/         # logger.js
```

> No `.editorconfig`, commit hooks, or conventional commit tooling detected.

## 10. Integrations & APIs

**External Services**: None.

**Internal REST Endpoints** (from `src/app/api/`):

- `/api/health` – Health check (implementation present).
- `/api/game/counter` – Demo counter (GET/POST) process local.

**Socket Events**:

| Client Emits | Server Emits                                          |
| ------------ | ----------------------------------------------------- |
| `game:join`  | `game:joined`, `room:update`                          |
| `game:start` | `game:started`, `update:state`                        |
| `roll:dice`  | `roll:result`, optional `turn:end` (auto advance)     |
| `move:token` | `move:result`, `update:state`, `turn:end`, `game:win` |
| `get:state`  | `update:state`                                        |

> Auth/rate limits not implemented; add before public exposure.

## 11. Security & Performance

Security Observations:

- No authentication/authorization; all events accepted.
- In-memory state susceptible to loss on restart.
- No input sanitization beyond presence checks.

Performance Considerations:

- Lightweight state (Maps + arrays) – O(1)/O(n) simple operations.
- Potential optimization: offload dice RNG to crypto (already attempts `crypto.randomInt`).
- Canvas rendering centralized; ensure animation loops avoid state churn.

Suggested Improvements:

- Add rate limiting per socket for spammy events.
- Integrate structured logging with timestamps.
- Provide metrics endpoint (roll distribution exposed currently via `rollStats`).

## 12. FAQ & Troubleshooting

| Issue                     | Cause                             | Resolution                                            |
| ------------------------- | --------------------------------- | ----------------------------------------------------- |
| Dice roll rejected        | Not player's turn                 | Verify `currentPlayer.id === playerId` before rolling |
| No legal moves after roll | All tokens blocked/home without 6 | Turn auto‑advances (observe `turn:end`)               |
| Socket not connecting     | Wrong `NEXT_PUBLIC_SOCKET_URL`    | Set to same origin (`http://localhost:3000`)          |
| Tokens not selectable     | Missing legalMoves update         | Inspect `roll:result` payload & hook state            |
| Stale dice faces          | Placeholder removed intentionally | Wait for backend `roll:result` before UI update       |

Debug Tips:

- Add `logger.debug` entries (non‑production only) for deeper tracing.
- Use browser Network → WS panel to inspect event frames.

## 13. Contributing & Maintenance

> No `LICENSE`, `CONTRIBUTING.md`, or CI workflows found. Add these for external collaboration.

Suggested Process:

1. Fork repository.
2. Create feature branch: `feat/<short-description>`.
3. Implement changes + add tests (once test harness exists).
4. Run lint/tests locally.
5. Submit PR with summary & screenshots (if UI changes).

Maintenance Wishlist:

- Add GitHub Actions: Node matrix, install, lint, test.
- Introduce semantic versioning & `CHANGELOG.md`.
- Add CODEOWNERS for review control.

## 14. Additional Notes & Next Steps

Planned Enhancements (from existing comments & TODO cues):

- Token selection UI refinement & animation.
- Redis adapter for horizontal scaling.
- Player profiles & auth layer.
- Spectator/chat channels.
- Replace ad‑hoc color propagation with server authoritative mapping on `room:update`.

## 15. Changelog & Related Projects

> No `CHANGELOG.md` present. Begin one after next tagged release (v0.2.0 suggestion).

Related Ideas:

- Standalone rules package published to npm for reuse.
- Additional board games following same folder convention.

---

### ✅ Call to Action

If this structure helps you build realtime games faster, consider starring the repo and opening issues with improvement proposals.

_Happy hacking & may your dice roll sixes when needed!_
