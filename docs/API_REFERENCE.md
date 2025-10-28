# WebSocket API Reference

## Event Flow Diagram

```
Player 1                Server                 Player 2
   │                       │                       │
   ├──game:join──────────►│                       │
   │◄─game:joined─────────┤                       │
   │                       ├──room:update────────►│
   │                       │                       │
   │                       │◄──game:join───────────┤
   │◄─room:update──────────┤                       │
   │                       ├──game:joined─────────►│
   │                       │                       │
   ├──game:start─────────►│                       │
   │◄─game:started────────┤──game:started────────►│
   │◄─update:state────────┤──update:state────────►│
   │                       │                       │
   ├──roll:dice──────────►│                       │
   │◄─roll:result─────────┤──roll:result─────────►│
   │                       │                       │
   ├──move:token─────────►│                       │
   │◄─move:result─────────┤──move:result─────────►│
   │◄─update:state────────┤──update:state────────►│
   │◄─turn:end────────────┤──turn:end────────────►│
   │                       │                       │
   │                       │◄──roll:dice───────────┤
   │◄─roll:result─────────┤──roll:result─────────►│
   │                       │                       │
```

## Data Structures

### Game State
```javascript
{
  players: [
    {
      id: "player_1",
      color: "yellow",
      startCell: 5,
      tokens: [
        {
          id: 0,
          position: -1,    // -1 = in base, 0-67 = on board
          isHome: false    // true when reached final home
        },
        { id: 1, position: -1, isHome: false },
        { id: 2, position: -1, isHome: false },
        { id: 3, position: -1, isHome: false }
      ]
    },
    // ... more players
  ],
  currentPlayerIndex: 0,
  gameStarted: true,
  gameOver: false,
  winner: null,
  turnCount: 0
}
```

### Legal Move Object
```javascript
{
  tokenId: 0,
  from: -1,           // Current position
  to: 5,             // Target position
  steps: 5,          // Number of steps
  type: "leave_base" // or "move"
}
```

### Move Result
```javascript
{
  success: true,
  playerId: "player_1",
  tokenId: 0,
  from: -1,
  to: 5,
  captured: {        // null if no capture
    playerId: "player_2",
    tokenId: 1,
    position: 5
  },
  bonusMove: 20      // 0 if no bonus
}
```

## Client API

### Connection Management

#### `initSocket()`
Initialize Socket.IO connection
```javascript
import { initSocket } from '@/lib/socket/client';

const socket = initSocket();
// Returns socket instance
```

#### `getSocket()`
Get current socket instance
```javascript
import { getSocket } from '@/lib/socket/client';

const socket = getSocket();
// Returns socket or null if not connected
```

#### `disconnectSocket()`
Disconnect from server
```javascript
import { disconnectSocket } from '@/lib/socket/client';

disconnectSocket();
```

### Game Actions

#### `joinGame(roomId, playerId, callback)`
Join a game room
```javascript
import { joinGame } from '@/lib/socket/client';

joinGame('room-123', 'player_1', (error, data) => {
  if (error) {
    console.error('Join failed:', error.message);
    return;
  }
  
  console.log('Joined room:', data.roomId);
  console.log('Player count:', data.playerCount);
  console.log('All players:', data.players);
});
```

**Response Data:**
```javascript
{
  roomId: "room-123",
  playerId: "player_1",
  playerCount: 2,
  players: ["player_1", "player_2"]
}
```

#### `startGame(callback)`
Start the game
```javascript
import { startGame } from '@/lib/socket/client';

startGame((error, data) => {
  if (error) {
    console.error('Start failed:', error.message);
    return;
  }
  
  console.log('Current player:', data.currentPlayer);
  console.log('Game state:', data.gameState);
});
```

**Response Data:**
```javascript
{
  gameState: { /* see Game State structure */ },
  currentPlayer: "player_1"
}
```

#### `rollDice(callback)`
Roll dice (server-generated)
```javascript
import { rollDice } from '@/lib/socket/client';

rollDice((error, data) => {
  if (error) {
    console.error('Roll failed:', error.message);
    return;
  }
  
  console.log('Dice:', data.dice);
  console.log('Legal moves:', data.legalMoves);
  
  // Show legal moves to player
  data.legalMoves.forEach(move => {
    console.log(`Token ${move.tokenId}: ${move.from} → ${move.to}`);
  });
});
```

**Response Data:**
```javascript
{
  playerId: "player_1",
  dice: [3, 5],
  legalMoves: [
    { tokenId: 0, from: -1, to: 5, type: "leave_base" },
    { tokenId: 1, from: 10, to: 13, steps: 3, type: "move" },
    { tokenId: 1, from: 10, to: 15, steps: 5, type: "move" }
  ]
}
```

#### `moveToken(tokenId, newPosition, callback)`
Move a token to new position
```javascript
import { moveToken } from '@/lib/socket/client';

moveToken(0, 5, (error, data) => {
  if (error) {
    console.error('Move failed:', error.message);
    return;
  }
  
  console.log('Moved from', data.from, 'to', data.to);
  
  if (data.captured) {
    console.log('Captured token!', data.captured);
    console.log('Bonus move:', data.bonusMove);
  }
});
```

**Response Data:**
```javascript
{
  playerId: "player_1",
  tokenId: 0,
  from: -1,
  to: 5,
  captured: {
    playerId: "player_2",
    tokenId: 1,
    position: 5
  },
  bonusMove: 20
}
```

#### `requestGameState()`
Request current game state
```javascript
import { requestGameState } from '@/lib/socket/client';

requestGameState();
// Listen via onStateUpdate()
```

### Event Subscriptions

#### `onStateUpdate(callback)`
Subscribe to game state updates
```javascript
import { onStateUpdate } from '@/lib/socket/client';

const unsubscribe = onStateUpdate((data) => {
  console.log('Game state updated:', data.gameState);
  
  // Update your game board UI
  renderGameBoard(data.gameState);
});

// Later, to unsubscribe:
unsubscribe();
```

#### `onTurnEnd(callback)`
Subscribe to turn end events
```javascript
import { onTurnEnd } from '@/lib/socket/client';

const unsubscribe = onTurnEnd((data) => {
  console.log('Next player:', data.nextPlayer);
  console.log('Reason:', data.reason); // e.g., "no_legal_moves"
  
  // Update UI to show whose turn
  highlightCurrentPlayer(data.nextPlayer);
});
```

#### `onGameWin(callback)`
Subscribe to game win events
```javascript
import { onGameWin } from '@/lib/socket/client';

const unsubscribe = onGameWin((data) => {
  console.log('Winner:', data.winner);
  
  // Show victory screen
  showVictoryScreen(data.winner, data.gameState);
});
```

#### `onRoomUpdate(callback)`
Subscribe to room updates
```javascript
import { onRoomUpdate } from '@/lib/socket/client';

const unsubscribe = onRoomUpdate((data) => {
  console.log('Room ID:', data.roomId);
  console.log('Player count:', data.playerCount);
  console.log('Players:', data.players);
  
  // Update lobby UI
  updatePlayerList(data.players);
});
```

#### `onPlayerLeft(callback)`
Subscribe to player disconnect events
```javascript
import { onPlayerLeft } from '@/lib/socket/client';

const unsubscribe = onPlayerLeft((data) => {
  console.log('Player left:', data.playerId);
  console.log('Remaining:', data.remainingPlayers);
  
  // Show notification
  showNotification(`${data.playerId} disconnected`);
});
```

## Complete Example

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
  onPlayerLeft,
} from '@/lib/socket/client';

// Initialize
const socket = initSocket();

// Subscribe to events
onRoomUpdate((data) => {
  updateLobby(data.players);
});

onStateUpdate((data) => {
  renderGameBoard(data.gameState);
});

onTurnEnd((data) => {
  highlightPlayer(data.nextPlayer);
  if (data.nextPlayer === myPlayerId) {
    enableControls();
  } else {
    disableControls();
  }
});

onGameWin((data) => {
  showWinner(data.winner);
});

onPlayerLeft((data) => {
  alert(`${data.playerId} left the game`);
});

// Join game
joinGame('room-123', 'player_1', (error, data) => {
  if (error) {
    alert('Failed to join');
    return;
  }
  
  console.log('Joined successfully');
  
  // Start when ready
  document.getElementById('start-btn').onclick = () => {
    startGame((error, data) => {
      if (error) {
        alert('Failed to start');
        return;
      }
      console.log('Game started!');
    });
  };
});

// Roll dice button
document.getElementById('roll-btn').onclick = () => {
  rollDice((error, data) => {
    if (error) {
      alert(error.message);
      return;
    }
    
    showDice(data.dice);
    showLegalMoves(data.legalMoves);
  });
};

// Token click handler
function onTokenClick(tokenId, newPosition) {
  moveToken(tokenId, newPosition, (error, data) => {
    if (error) {
      alert(error.message);
      return;
    }
    
    if (data.captured) {
      showCaptureAnimation(data.captured);
    }
  });
}
```

## Error Handling

All errors are emitted via the `error` event:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // error.message - Human-readable error
  // error.event - Which event caused the error
});
```

Common errors:
- `"Not in a room"` - Must join a room first
- `"Not your turn"` - Wait for your turn
- `"Game not started"` - Start the game first
- `"Invalid request body"` - Missing required fields
- `"Room is full"` - Maximum 4 players
- `"Game already in progress"` - Can't join ongoing game

## Server-Side Rules Engine

### Available Functions

```javascript
import {
  createGameState,
  rollDice,
  getLegalMoves,
  applyMove,
  checkWin,
  advanceTurn,
  isPlayerTurn,
  isSafeCell,
  canLeaveBase,
  hasBarrier,
  checkCapture,
} from './src/lib/game/rules.js';
```

### Rules Documentation

#### Safe Cells
Cells where captures cannot occur: `[5, 12, 17, 29, 34, 46, 51, 63]`

#### Leaving Base
Requires rolling a 5 on either die

#### Barriers
Two tokens of the same color on one square block all other players

#### Captures
- Landing on opponent's token (not on safe cell)
- Sends opponent token back to base
- Grants +20 bonus move to capturing player

#### Winning
All 4 tokens must reach home position

## Performance Tips

1. **Batch Updates**: Server batches state updates to reduce events
2. **Selective Rendering**: Only re-render changed parts of UI
3. **Event Cleanup**: Always unsubscribe when component unmounts
4. **Connection Pooling**: Reuse socket connection across components

```javascript
// Good: Single connection
const socket = initSocket();

// Bad: Multiple connections
const socket1 = initSocket();
const socket2 = initSocket();
```

## Debugging

Enable debug logs:
```javascript
localStorage.setItem('debug', '*');
```

View Socket.IO debug info:
```javascript
localStorage.setItem('debug', 'socket.io-client:socket');
```

Server logs (in terminal):
```bash
node socket-server.js
# All events logged with timestamps and data
```

## Testing Checklist

- [ ] Two players can join same room
- [ ] Game starts with 2+ players
- [ ] Cannot start with <2 players
- [ ] Only current player can roll
- [ ] Dice values are random (1-6)
- [ ] Legal moves calculated correctly
- [ ] Cannot move on opponent's turn
- [ ] Tokens leave base on rolling 5
- [ ] Captures work on non-safe cells
- [ ] Captures don't work on safe cells
- [ ] Barriers block movement
- [ ] Bonus moves granted on capture
- [ ] Turn advances after move
- [ ] Win detected when all tokens home
- [ ] Disconnection handled gracefully

## Migration to Redis

When ready to scale, replace room manager:

```javascript
// rooms.js - Redis version
import Redis from 'ioredis';

const redis = new Redis();

export async function getGameState(roomId) {
  const state = await redis.get(`game:${roomId}:state`);
  return JSON.parse(state);
}

export async function updateGameState(roomId, gameState) {
  await redis.set(`game:${roomId}:state`, JSON.stringify(gameState));
  await redis.publish(`game:${roomId}:update`, JSON.stringify(gameState));
}
```

See Redis migration comments in `src/lib/game/rooms.js`
