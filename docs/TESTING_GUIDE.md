# 🎮 WebSocket End-to-End Testing Guide

## Quick Test (5 Minutes)

### Step 1: Open Test Page
Open your browser and go to:
```
http://localhost:3000/test-websocket.html
```

You'll see a beautiful interface with **two player panels** side by side.

### Step 2: Test Flow

#### A. Connect Both Players
1. Click **"Connect"** button on Player 1 (left panel)
2. Click **"Connect"** button on Player 2 (right panel)
3. ✅ You should see "🟢 Connected" status on both panels

#### B. Join the Game
1. Click **"Join Game"** on Player 1
2. Click **"Join Game"** on Player 2
3. ✅ Watch the logs - you'll see "Room updated" messages
4. ✅ Status should change to "⏳ In lobby (2/4)"

#### C. Start the Game
1. Click **"Start Game"** on either player
2. ✅ You'll see "🎮 Game started!" in both logs
3. ✅ The game state will appear in the JSON view
4. ✅ Current player's "Roll Dice" button will be enabled

#### D. Play a Turn
1. **Current player** clicks "Roll Dice"
2. ✅ You'll see: `🎲 player_1 rolled: [3, 5]`
3. ✅ Legal moves will appear in a list
4. Click on any **legal move** from the list
5. ✅ Token moves and turn passes to next player

#### E. Continue Playing
1. **Next player** clicks "Roll Dice"
2. Select a move from the list
3. Repeat until someone wins!

---

## What You'll See

### Connection Success
```
[12:34:56] Connecting to Socket.IO server...
[12:34:57] ✅ Connected! Socket ID: abc123xyz
```

### Joining Game
```
[12:35:00] Joining room: test-room...
[12:35:01] ✅ Joined game! Room: test-room, Players: 1
[12:35:05] 👥 Room updated: player_1, player_2 (2 players)
```

### Starting Game
```
[12:35:10] Starting game...
[12:35:11] 🎮 Game started! Current player: player_1
[12:35:11] 📊 Game state updated
```

### Rolling Dice
```
[12:35:15] Rolling dice...
[12:35:16] 🎲 player_1 rolled: [5, 3]
[12:35:16] Legal moves: 2
```

### Moving Token
```
[12:35:20] Executing move: Token 0 to position 5
[12:35:21] 🚀 player_1 moved token 0 from -1 to 5
[12:35:21] ⏭️ Turn ended. Next player: player_2
```

### Capturing
```
[12:36:30] 🚀 player_1 moved token 0 from 10 to 15
[12:36:30] 💥 Captured player_2's token! Bonus: +20
```

### Winning
```
[12:40:00] 🏆 GAME OVER! Winner: player_1
```

---

## Test Scenarios

### ✅ Basic Flow Test
- [x] Both players connect
- [x] Both players join room
- [x] Game starts with 2 players
- [x] Players can roll dice
- [x] Players can move tokens
- [x] Turns alternate correctly

### ✅ Game Rules Test
- [x] Can only roll on your turn
- [x] Rolling a 5 allows leaving base
- [x] Legal moves are calculated correctly
- [x] Captures work (not on safe cells)
- [x] Bonus move granted on capture
- [x] Win detection works

### ✅ Error Handling Test
- [x] Can't roll on opponent's turn
- [x] Can't move invalid tokens
- [x] Can't join full room (4 players max)
- [x] Can't start with less than 2 players
- [x] Disconnect handling works

---

## Console Testing (Alternative Method)

If you prefer using browser console instead of the test page:

### Open Console (F12)
```javascript
// Player 1 in first browser window
const socket1 = io('http://localhost:3001');

socket1.on('connect', () => {
  console.log('Connected:', socket1.id);
  socket1.emit('game:join', { roomId: 'test', playerId: 'player_1' });
});

socket1.on('game:joined', (data) => {
  console.log('Joined:', data);
});

socket1.on('update:state', (data) => {
  console.log('State:', data.gameState);
});

socket1.on('roll:result', (data) => {
  console.log('Rolled:', data.dice, 'Moves:', data.legalMoves);
});

// Start game
socket1.emit('game:start', {});

// Roll dice
socket1.emit('roll:dice', {});

// Move token (example)
socket1.emit('move:token', { tokenId: 0, newPosition: 5 });
```

---

## Troubleshooting

### ❌ "Cannot connect to server"
**Solution**: Make sure Socket.IO server is running
```bash
node socket-server.js
```

### ❌ "404 Not Found" for test page
**Solution**: Make sure Next.js is running
```bash
npm run dev
```

### ❌ "Not your turn"
**Solution**: Wait for the other player to finish their turn. Check the logs to see whose turn it is.

### ❌ No legal moves
**Solution**: This is normal! If you can't move, turn automatically passes to next player.

### ❌ Page doesn't load Socket.IO
**Solution**: Check browser console for CDN errors. Try refreshing the page.

---

## Expected Game Flow

```
1. Player 1 connects → Status: Connected
2. Player 2 connects → Status: Connected
3. Player 1 joins → Lobby: 1/4
4. Player 2 joins → Lobby: 2/4
5. Either starts → Game begins
6. Player 1 rolls → Shows legal moves
7. Player 1 moves → Turn ends
8. Player 2 rolls → Shows legal moves
9. Player 2 moves → Turn ends
10. Repeat 6-9 until...
11. Someone wins → Game over popup
```

---

## Testing Checklist

Before marking complete, verify:

- [ ] Both players can connect simultaneously
- [ ] Room updates appear in both panels
- [ ] Game state syncs across both players
- [ ] Only current player can roll
- [ ] Legal moves are clickable
- [ ] Token movements animate in logs
- [ ] Captures are detected and logged
- [ ] Turn automatically advances
- [ ] Winner is announced with popup
- [ ] Disconnection is handled gracefully

---

## Advanced Testing

### Test with 3-4 Players
1. Open 3-4 browser tabs
2. Connect all as player_1, player_2, player_3, player_4
3. Test turn rotation with more players

### Test Reconnection
1. Disconnect Player 1 mid-game
2. Reconnect Player 1
3. Verify game state is preserved

### Test Different Rooms
1. Use different room IDs in inputs
2. Verify players in different rooms don't interact

---

## Next Steps After Testing

Once testing is complete:
1. Integrate WebSocket client into your actual game UI
2. Replace test buttons with game board interactions
3. Add animations for token movements
4. Add sound effects for dice rolls and captures
5. Implement player avatars and profiles

---

## Quick Reference

### Server Events (Client → Server)
- `game:join` - Join a room
- `game:start` - Start the game
- `roll:dice` - Roll dice
- `move:token` - Move a token
- `get:state` - Request current state

### Client Events (Server → Client)
- `game:joined` - Join confirmed
- `room:update` - Player list updated
- `game:started` - Game began
- `roll:result` - Dice result + legal moves
- `move:result` - Move outcome
- `update:state` - Game state sync
- `turn:end` - Turn changed
- `game:win` - Winner announced
- `player:left` - Player disconnected
- `error` - Error occurred

---

## Support

If you encounter issues:
1. Check server console for errors
2. Check browser console for client errors
3. Verify both servers are running (Next.js + Socket.IO)
4. Check the logs in both player panels
5. Try refreshing the page and reconnecting

Happy testing! 🎮
