# Quick Start Guide - WebSocket Multiplayer

## Installation (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cat > .env.local << EOF
SOCKET_PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NODE_ENV=development
EOF
```

## Run Servers (1 command)

```bash
npm run dev:all
```

This starts:
- Next.js on `http://localhost:3000`
- Socket.IO on `http://localhost:3001`

## Test in Browser Console

### Player 1 (Browser Window 1)
```javascript
// Open http://localhost:3000
// Press F12 for console

// Import socket client (in console)
const { joinGame, startGame, rollDice, moveToken, onStateUpdate, onTurnEnd } = await import('/src/lib/socket/client.js');

// Join room
joinGame('test-room', 'player_1', (err, data) => {
  console.log('Joined:', data);
});

// Listen for updates
onStateUpdate((data) => {
  console.log('State:', data.gameState);
});

onTurnEnd((data) => {
  console.log('Next turn:', data.nextPlayer);
});
```

### Player 2 (Browser Window 2)
```javascript
// Open http://localhost:3000 in new window
// Press F12

const { joinGame, startGame, rollDice, moveToken } = await import('/src/lib/socket/client.js');

// Join same room
joinGame('test-room', 'player_2', (err, data) => {
  console.log('Joined:', data);
});
```

### Start Game (Either Window)
```javascript
startGame((err, data) => {
  console.log('Game started!', data);
});
```

### Play (Player 1's Turn)
```javascript
// Roll dice
rollDice((err, data) => {
  console.log('Rolled:', data.dice);
  console.log('Legal moves:', data.legalMoves);
});

// Move token (example)
moveToken(0, 5, (err, data) => {
  console.log('Moved:', data);
});
```

## Expected Console Output

### When Player Joins
```
[Socket] Connected: abc123
[Socket] Joined game: { roomId: 'test-room', playerId: 'player_1', ... }
```

### When Game Starts
```
[Socket] Game started: { gameState: {...}, currentPlayer: 'player_1' }
[Socket] State updated: { gameState: {...} }
```

### When Dice Rolled
```
[Socket] Dice rolled: { playerId: 'player_1', dice: [3, 5], legalMoves: [...] }
```

### When Token Moved
```
[Socket] Token moved: { playerId: 'player_1', tokenId: 0, from: -1, to: 5 }
[Socket] State updated: { gameState: {...} }
[Socket] Turn ended: { nextPlayer: 'player_2' }
```

## Common Issues

### "Module not found"
```bash
# Make sure you installed dependencies
npm install
```

### "Socket connection failed"
```bash
# Check if socket server is running
# Should see: 🎮 Socket.IO server running on port 3001
```

### "Not your turn"
```bash
# Check whose turn it is in game state
# Only current player can roll/move
```

## Next: Integrate with UI

See `docs/WEBSOCKET_IMPLEMENTATION.md` for full integration guide.

## REST API Still Works

```bash
# Get state via REST
curl http://localhost:3000/api/game/state

# Join via REST
curl -X POST http://localhost:3000/api/game/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_1"}'
```

Both REST and WebSocket share the same game state!
