Parcheesi Feature Module
========================

Structure:
- config: constants and configuration values
- hooks: React hooks for UI state and canvas/game interactions
- components: React components (GameRoot, controls, lobby etc.)
- utils: Pure functions for drawing and path building
- services: (future) client-side abstractions for API/sockets if needed

Backend separation lives in `src/backend/games/parcheesi` for domain logic.
Transport (Socket.IO client) lives under `src/client`.

Aliases (jsconfig.json):
@frontend -> src/frontend
@backend -> src/backend
@shared -> src/shared
@client -> src/client

Migration Notes:
Legacy code under `src/features/parcheesi` and `src/core/parcheesi` is being phased out.
Use the new utils `buildPath` and `drawBoard` from this folder. Legacy files carry deprecation comments and will be deleted after verification.

Next Improvements:
1. Flesh out gameService with token movement logic.
2. Implement proper room/player association mapping (socketId -> playerId) in backend roomService.
3. Add tests for rules and services.
4. Expand README with gameplay invariants.
