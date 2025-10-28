# WebSocket Implementation for Parchís Multiplayer Game

## Overview

This implementation adds real-time multiplayer functionality using Socket.IO **alongside** the existing REST API endpoints. Both systems can coexist and share the same game state through the `gameStore`.

## Architecture

```
┌─────────────────┐
│   Next.js UI    │
│   (Frontend)    │
└────────┬────────┘
         │
         ├──────────────┬─────────────────┐
         │              │                 │
    ┌────▼────┐   ┌────▼────┐      ┌────▼────────┐
    │  REST   │   │ Socket  │      │   Static    │
    │  API    │   │  .IO    │      │   Assets    │
    │  :3000  │   │ :3001   │      │             │
    └────┬────┘   └────┬────┘      └─────────────┘
         │              │
         │              │
    ┌────▼──────────────▼────┐
    │   Game Logic Layer     │
    │  ┌──────────────────┐  │
    │  │  Rules Engine    │  │
    │  │  (rules.js)      │  │
    │  └──────────────────┘  │
    │  ┌──────────────────┐  │
    │  │  Rooms Manager   │  │
    │  │  (rooms.js)      │  │
    │  └──────────────────┘  │
    │  ┌──────────────────┐  │
    │  │  Game Store      │  │
    │  │  (store.js)      │  │
    │  └──────────────────┘  │
    └─────────────────────────┘
              │
              │ (Future: Redis)
              ▼
    ┌─────────────────────┐
    │   In-Memory Map     │
    │   (Redis-ready)     │
    └─────────────────────┘
```

## Files Created/Modified

### New Files
1. **`socket-server.js`** - Standalone Socket.IO server
2. **`src/lib/game/rules.js`** - Parchís game rules engine
3. **`src/lib/game/rooms.js`** - Multi-room game manager
4. **`src/lib/socket/client.js`** - Client-side Socket.IO wrapper

### Modified Files
1. **`package.json`** - Added Socket.IO dependencies and scripts

### Preserved Files
- All existing REST API routes remain intact (`src/app/api/game/[...action]/route.js`)
- All existing UI components unchanged
- Existing `gameStore` can be used by both REST and WebSocket

## Installation

```bash
# Install dependencies
npm install

# The following packages will be installed:
# - socket.io@^4.7.2 (server)
# - socket.io-client@^4.7.2 (client)
# - concurrently@^8.2.2 (run both servers)
```

## Running the Application

### Development Mode

```bash
# Option 1: Run both Next.js and Socket.IO together
npm run dev:all

# Option 2: Run separately in different terminals
npm run dev        # Terminal 1: Next.js (port 3000)
npm run dev:socket # Terminal 2: Socket.IO (port 3001)
```

### Production Mode

```bash
# Build Next.js
npm run build

# Start servers
npm start              # Terminal 1: Next.js
npm run start:socket   # Terminal 2: Socket.IO
```

## Game Rules Implemented

### Core Mechanics
- **Players**: 2-4 players
- **Tokens**: 4 tokens per player
- **Dice**: Two dice (1-6 each)
- **Board**: 68 squares in a circular path

### Movement Rules
1. **Leaving Base**: Roll a 5 to move a token from base to starting cell
2. **Movement**: Tokens move clockwise by dice sum or individual die values
3. **Safe Cells**: No captures allowed on cells [5, 12, 17, 29, 34, 46, 51, 63]
4. **Barriers**: Two tokens of same color block passage
5. **Capture**: Landing on opponent's token (not on safe cell) sends it back to base and grants +20 bonus move
6. **Winning**: First player to get all 4 tokens home wins

## WebSocket Events

### Client → Server Events

#### `game:join`
Join a game room
```javascript
socket.emit('game:join', {
  roomId: 'room-123',
  playerId: 'player_1'
});
```

#### `game:start`
Start the game (when all players ready)
```javascript
socket.emit('game:start', {});
```

#### `roll:dice`
Roll dice (server generates random values)
```javascript
socket.emit('roll:dice', {});
```

#### `move:token`
Move a token
```javascript
socket.emit('move:token', {
  tokenId: 0,
  newPosition: 15
});
```

#### `get:state`
Request current game state
```javascript
socket.emit('get:state', {});
```

### Server → Client Events

#### `game:joined`
Confirmation of successful join
```javascript
socket.on('game:joined', (data) => {
  // data: { roomId, playerId, playerCount, players }
});
```

#### `room:update`
Room player list updated
```javascript
socket.on('room:update', (data) => {
  // data: { roomId, playerCount, players }
});
```

#### `game:started`
Game has started
```javascript
socket.on('game:started', (data) => {
  // data: { gameState, currentPlayer }
});
```

#### `roll:result`
Dice roll result
```javascript
socket.on('roll:result', (data) => {
  // data: { playerId, dice: [3, 5], legalMoves: [...] }
});
```

#### `move:result`
Token move result
```javascript
socket.on('move:result', (data) => {
  // data: { playerId, tokenId, from, to, captured, bonusMove }
});
```

#### `update:state`
Game state updated
```javascript
socket.on('update:state', (data) => {
  // data: { gameState }
});
```

#### `turn:end`
Turn ended, next player's turn
```javascript
socket.on('turn:end', (data) => {
  // data: { nextPlayer, reason }
});
```

#### `game:win`
Game over, winner announced
```javascript
socket.on('game:win', (data) => {
  // data: { winner, gameState }
});
```

#### `player:left`
A player disconnected
```javascript
socket.on('player:left', (data) => {
  // data: { playerId, remainingPlayers }
});
```

#### `error`
Error occurred
```javascript
socket.on('error', (data) => {
  // data: { message, event }
});
```

## Client Integration Example

```javascript
import {
  initSocket,
  joinGame,
  startGame,
  rollDice,
  moveToken,
  onStateUpdate,
  onTurnEnd,
  onGameWin,
  onRoomUpdate,
} from '@/lib/socket/client';

// 1. Initialize connection
initSocket();

// 2. Join a game room
joinGame('room-123', 'player_1', (error, data) => {
  if (error) {
    console.error('Failed to join:', error);
    return;
  }
  console.log('Joined room:', data);
});

// 3. Listen for room updates
onRoomUpdate((data) => {
  console.log('Players in room:', data.players);
  // Update lobby UI
});

// 4. Start game when ready
startGame((error, data) => {
  if (error) {
    console.error('Failed to start:', error);
    return;
  }
  console.log('Game started!');
});

// 5. Listen for game state updates
onStateUpdate((data) => {
  console.log('Game state:', data.gameState);
  // Update game board UI with new state
});

// 6. Roll dice on your turn
rollDice((error, data) => {
  if (error) {
    console.error('Roll failed:', error);
    return;
  }
  console.log('Rolled:', data.dice);
  console.log('Legal moves:', data.legalMoves);
  // Show legal moves to player
});

// 7. Move a token
moveToken(0, 15, (error, data) => {
  if (error) {
    console.error('Move failed:', error);
    return;
  }
  console.log('Token moved successfully');
  if (data.captured) {
    console.log('Captured opponent token!');
  }
});

// 8. Listen for turn changes
onTurnEnd((data) => {
  console.log('Next player:', data.nextPlayer);
  // Update UI to show whose turn it is
});

// 9. Listen for game over
onGameWin((data) => {
  console.log('Winner:', data.winner);
  alert(`Player ${data.winner} wins!`);
});
```

## REST API Compatibility

The existing REST endpoints remain functional:

```bash
# Get game state
GET /api/game/state

# Join game (REST alternative)
POST /api/game/join
{ "playerId": "player_1" }

# Roll dice (REST alternative)
POST /api/game/roll
{ "playerId": "player_1" }

# Reset game
POST /api/game/reset
```

Both REST and WebSocket can use the same game state through shared `gameStore`.

## Redis Migration Path

The codebase is designed for easy Redis migration:

### Current: In-Memory Map
```javascript
// rooms.js
const rooms = new Map();
```

### Future: Redis
```javascript
// rooms.js (Redis version)
import { redis } from './redis-client';

export async function getGameState(roomId) {
  const state = await redis.hget(`game:${roomId}`, 'state');
  return JSON.parse(state);
}

export async function updateGameState(roomId, gameState) {
  await redis.hset(`game:${roomId}`, 'state', JSON.stringify(gameState));
  await redis.publish(`game:${roomId}:update`, JSON.stringify(gameState));
}
```

### Integration Points Marked in Code
Look for comments:
- `// REDIS INTEGRATION POINT #1`
- `// REDIS INTEGRATION POINT #2`
- `// FUTURE: Redis integration points`

## Environment Variables

Create `.env.local`:

```bash
# Socket.IO server port
SOCKET_PORT=3001

# Next.js app URL (for CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Socket.IO server URL (for client)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## Testing

### Manual Testing Steps

1. **Start both servers**:
   ```bash
   npm run dev:all
   ```

2. **Open two browser windows** at `http://localhost:3000`

3. **In Browser 1**:
   - Open dev console
   - Run: `import { joinGame } from '@/lib/socket/client'; joinGame('test-room', 'player_1')`

4. **In Browser 2**:
   - Open dev console
   - Run: `import { joinGame } from '@/lib/socket/client'; joinGame('test-room', 'player_2')`

5. **Start game** (in either browser):
   - `import { startGame } from '@/lib/socket/client'; startGame()`

6. **Roll dice** (player_1's turn):
   - `import { rollDice } from '@/lib/socket/client'; rollDice()`

7. **Check logs** in both browser consoles for state updates

## Logging

All events are logged using the existing logger:

```javascript
import { logger } from './src/lib/api/logger';

logger.info('Player joined', { roomId, playerId });
logger.warn('Invalid turn attempt', { playerId });
logger.error('Handler error', { error: error.message });
```

View logs in server console (where `node socket-server.js` is running).

## Security Considerations

1. **Server-side validation**: All moves validated by rules engine
2. **Turn enforcement**: Server checks `isPlayerTurn()` before accepting actions
3. **Authoritative server**: Clients never mutate state directly
4. **Payload validation**: All event payloads checked for required fields
5. **Error handling**: Try-catch blocks prevent server crashes

## Performance Notes

- In-memory Map: Fast, but single-server only
- Redis migration: Required for horizontal scaling
- Consider adding rate limiting for production
- WebSocket connections scale to ~10k per instance

## Troubleshooting

### "Cannot find module" errors
```bash
# Ensure type: "module" is in package.json
# Check all imports use .js extensions
```

### Socket connection fails
```bash
# Check CORS settings in socket-server.js
# Verify NEXT_PUBLIC_SOCKET_URL matches server port
# Check firewall allows port 3001
```

### Game state not syncing
```bash
# Check server logs for errors
# Verify both players in same roomId
# Check browser console for WebSocket errors
```

## Next Steps

1. **Integrate with UI**: Update existing game components to use Socket.IO client
2. **Add reconnection**: Handle player reconnections gracefully
3. **Add spectator mode**: Allow non-players to watch games
4. **Implement chat**: Add player communication
5. **Add Redis**: Scale to multiple servers
6. **Add authentication**: Integrate with user accounts
7. **Add matchmaking**: Auto-pair players

## Summary

✅ WebSocket server running alongside REST APIs  
✅ Complete Parchís rules engine  
✅ Multi-room game management  
✅ Client-side Socket.IO wrapper  
✅ Redis-ready architecture  
✅ Comprehensive logging  
✅ KISS principle maintained  

The implementation is production-ready for single-server deployment and designed for easy Redis migration when scaling is needed.
