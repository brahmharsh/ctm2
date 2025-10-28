This project is a multiplayer Parchís (Ludo-like) game built as a minimal monolith: Next.js UI + REST API routes + Socket.IO real-time channel on a single port. After refactor, the codebase separates concerns into core (business logic), server (runtime + transport handlers), client (browser adapters), and shared utilities.

## Getting Started

### 1. Install dependencies & create env

```bash
npm install
cat > .env.local <<'EOF'
SOCKET_PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NODE_ENV=development
EOF
```

### 2. Run unified server (Next.js + Socket.IO same port)

```bash
npm run dev
```

This starts a single monolithic server on http://localhost:3000 providing:

- UI (Next.js)
- REST API under /api
- Socket.IO endpoint at /socket.io

Open the game page at http://localhost:3000/game.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

### Layered Architecture (Refactored)

```
src/
  app/                  Next.js UI + API routes (controllers layer)
    api/                REST endpoints (/api/*)
    game/               Game UI components/hooks/services
  core/                 Pure business logic (transport agnostic)
    game/               Game domain: rules + services
      services/         roomService + gameService
      rules.js          Rule/validation functions
      index.js          Barrel exports
  server/               Node-only runtime code
    bootstrap/          Custom unified server entry (server.js)
    socket/             Socket.IO registration
      handlers/         gameHandlers.js (delegates to core services)
  client/               Browser-side adapters
    socket/             Socket.IO client wrapper
  shared/               Cross-cutting utilities
    logging/            logger.js
```

Transport separation:

- REST: `/src/app/api/*` calls (will eventually delegate to `core` services)
- WebSocket: `/src/server/socket/handlers` mapping events to `core` services
- Domain state & rules: `/src/core/game`

Future scaling: replace in-memory maps with Redis adapter while preserving `core` contracts.

### Demo REST Counter Button

In the game UI controls you'll see a button: "🧪 Demo REST (Counter)".

- Each click calls the REST endpoint `/api/game/counter` (POST) to increment a process-local counter.
- Then fetches current value (GET) and logs to console.
- This demonstrates REST still functions alongside WebSockets.
  You can later hide/remove this button without affecting gameplay.

### WebSocket Events

Client emits:
`game:join`, `game:start`, `roll:dice`, `move:token`, `get:state`

Server emits/broadcasts:
`game:joined`, `room:update`, `game:started`, `roll:result`, `move:result`, `update:state`, `turn:end`, `game:win`, `player:left`, `game:error`

### Frontend Integration

`useGame` hook responsibilities:

- Initialize socket connection (`initSocket` from `src/client/socket/client.js`)
- Join a test room (`game:join`)
- Subscribe to real-time events (`update:state`, `turn:end`, `room:update`)
- Emit roll/move events instead of REST for real-time gameplay

### Selecting Legal Moves (Future)

Currently dice roll animation uses total steps (sum). Integrate UI to choose from `legalMoves` (emitted with `roll:result`) and then emit a `move:token` event. Placeholder console logs exist for debugging.

## Scripts

```bash
npm run dev        # Unified dev server (Next.js + Socket.IO on port 3000)
npm run build      # Build Next.js assets
npm run start      # Production unified server
```

## Next Steps / TODO

1. UI for selecting a legal move after dice roll.
2. Persist game & counter via Redis for multi-instance scaling.
3. Add authentication & player profiles (REST endpoints planned).
4. Spectator/chat channels via additional WebSocket events.
5. Replace placeholder color "unknown" when room update lacks full player data (ensure server includes color in `room:update`).

## Testing WebSocket APIs (Postman)

Postman supports Socket.IO.

1. Run server: `npm run dev`
2. In Postman create a WebSocket request selecting Socket.IO protocol.
3. URL: `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`
4. Send events:

- `game:join` body: `{ "roomId": "room-test", "playerId": "player_1" }`
- `game:start` body: `{}`
- `roll:dice` body: `{}`
- `move:token` body: `{ "tokenId": 0, "newPosition": 12 }`
- `get:state` body: `{}`

5. Listen for:

- `game:joined`, `room:update`, `game:started`, `roll:result`, `move:result`, `update:state`, `turn:end`, `game:win`, `player:left`, `game:error`

Error frame format:

```
{ "message": "Description", "event": "originating:event" }
```

CLI alternative quick script (example):

```
node scripts/test-socket.js
```

## Troubleshooting

| Issue                   | Check                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| 404 /socket.io polling  | Ensure using unified server (`npm run dev`); remove stale `NEXT_PUBLIC_SOCKET_URL` (use 3000) |
| Counter always 0        | Using GET before POST; click demo button which performs POST first                            |
| Dice roll error         | Confirm it's your turn; check server logs for `Not your turn` warning                         |
| Unexpected CORS error   | Verify `NEXT_PUBLIC_APP_URL` matches actual origin (`http://localhost:3000`)                  |
| WebSocket not upgrading | Check browser dev tools -> Network -> WS; ensure single server not behind proxy misconfig     |

Console logs prefixed with `[Socket]` and `[REST]` aid debugging.

## Deployment Notes

Monolithic deployment: `node src/server/bootstrap/server.js` (scripts still allow `node server.js` for backward compatibility). For scale-out:

1. Externalize `core` package (publish or copy to backend service repo).
2. Add Redis for room/game state & pub/sub adapter.
3. Introduce sticky sessions or a Redis adapter for multi-instance Socket.IO.

Current state intentionally favors simplicity over full DDD boundaries.
