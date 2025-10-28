# WebSocket Game Testing Guide

## Problem: Game Board Not Visible on localhost:3000/game

**Root Cause:** The game board requires players to:

1. Connect to WebSocket
2. Join a room
3. Start the game (requires 2+ players)

The game state is managed via WebSocket, not REST APIs. Here's how to test it properly.

---

## ✅ Solution 1: Test in Browser (Easiest)

### Option A: Use the Simple Test Page (Recommended)

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Open the simple test page:**

   ```
   http://localhost:3000/simple-test.html
   ```

3. **Click "Connect & Auto-Join"**

4. **Open the SAME URL in another tab/window** (or use incognito mode)

5. **Click "Connect & Auto-Join" in the second tab**

6. **Game will auto-start** when 2 players join!

7. **Use "Roll Dice"** button to play

### Option B: Use the Full Test Page

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Open the test page:**

   ```
   http://localhost:3000/test-websocket.html
   ```

3. **Follow the on-screen instructions:**
   - Click "Connect" for Player 1
   - Click "Join Game" for Player 1
   - Click "Connect" for Player 2
   - Click "Join Game" for Player 2
   - Click "Start Game" (either player)
   - Now you can roll dice and play!

### Option B: Open Multiple Browser Tabs/Windows

1. **Open TWO browser tabs/windows:**

   - Tab 1: `http://localhost:3000/game`
   - Tab 2: `http://localhost:3000/game` (incognito/private mode recommended)

2. **Open Developer Console in both tabs** (F12 or Cmd+Option+I on Mac)

3. **In Tab 1 Console, run:**

   ```javascript
   // This will trigger the join and start automatically
   // The useGame hook already does this, so just check the console logs
   // You should see:
   // [Init] Resetting game via REST before WebSocket join
   // [Socket] Connected: <socket-id>
   // [Socket] Joined room: {...}
   ```

4. **Wait for both tabs to connect**, then the game should start automatically

5. **If it doesn't auto-start, in Console run:**
   ```javascript
   // Get the socket from the client
   import { getSocket } from "../../../client/socket/client";
   const socket = getSocket();
   socket.emit("game:start", {});
   ```

---

## ✅ Solution 2: Test with Postman (WebSocket API Testing)

### Prerequisites

- Postman Desktop version 10.18+ (WebSocket support)
- Download from: https://www.postman.com/downloads/

### Method 1: Import Collection (Fastest)

1. **Open Postman**

2. **Import the collection:**

   - Click "Import" button
   - Select file: `docs/POSTMAN_WEBSOCKET_COLLECTION.json`
   - Or drag and drop the file into Postman

3. **Follow the collection steps** (it has detailed instructions for each request)

### Method 2: Manual Setup

#### Step 1: Create WebSocket Request for Player 1

1. **In Postman:**

   - Click "New" → "WebSocket Request"
   - Or use the URL bar and select "WebSocket" from dropdown

2. **Enter WebSocket URL:**

   ```
   ws://localhost:3000/socket.io/?EIO=4&transport=websocket
   ```

3. **Click "Connect"**
   - You should see connection successful message
   - Status will show "Connected"

#### Step 2: Join Game as Player 1

1. **In the message compose area, send:**

   ```
   42["game:join",{"roomId":"test-room","playerId":"player_1"}]
   ```

2. **Expected Response:**
   ```json
   42["game:joined",{"roomId":"test-room","playerId":"player_1","playerCount":1,"players":["player_1"]}]
   ```

#### Step 3: Create Second WebSocket Connection (Player 2)

1. **Open a NEW WebSocket Request** (click "+" or Cmd/Ctrl + T)

2. **Connect to same URL:**

   ```
   ws://localhost:3000/socket.io/?EIO=4&transport=websocket
   ```

3. **Join as Player 2:**

   ```
   42["game:join",{"roomId":"test-room","playerId":"player_2"}]
   ```

4. **Watch BOTH tabs** - you should see room:update in both:
   ```json
   42["room:update",{"roomId":"test-room","playerCount":2,"players":["player_1","player_2"]}]
   ```

#### Step 4: Start the Game

1. **In EITHER WebSocket tab, send:**

   ```
   42["game:start",{}]
   ```

2. **Expected in BOTH tabs:**
   ```json
   42["game:started",{"gameState":{...},"currentPlayer":"player_1"}]
   42["update:state",{"gameState":{...}}]
   ```

#### Step 5: Roll Dice (Player 1's turn)

1. **In Player 1's tab, send:**

   ```
   42["roll:dice",{}]
   ```

2. **Expected Response:**
   ```json
   42["roll:result",{"playerId":"player_1","dice":[3],"legalMoves":["player_1-t1","player_1-t2",...]}]
   ```

#### Step 6: Move a Token

1. **Use one of the legal moves from step 5:**

   ```
   42["move:token",{"tokenId":"player_1-t1","newPosition":15}]
   ```

2. **Expected Responses:**
   ```json
   42["move:result",{"playerId":"player_1","tokenId":"player_1-t1",...}]
   42["turn:end",{"nextPlayer":"player_2"}]
   42["update:state",{"gameState":{...}}]
   ```

#### Step 7: Continue Playing

1. **Now it's Player 2's turn**
2. **In Player 2's tab, send:**
   ```
   42["roll:dice",{}]
   ```
3. **Then move a token based on legal moves**
4. **Repeat until someone wins!**

### WebSocket Message Format Guide

All Socket.IO messages follow this format:

```
42["event_name",{payload}]
```

Where:

- `42` = Socket.IO message type (engine.io packet type)
- `"event_name"` = The event you're emitting
- `{payload}` = JSON object with data

### Common Events Reference

| Event        | Payload                                        | Description                          |
| ------------ | ---------------------------------------------- | ------------------------------------ |
| `game:join`  | `{"roomId":"test-room","playerId":"player_1"}` | Join a game room                     |
| `game:start` | `{}`                                           | Start the game (2+ players required) |
| `roll:dice`  | `{}`                                           | Roll dice (must be your turn)        |
| `move:token` | `{"tokenId":"player_1-t1","newPosition":15}`   | Move a token                         |
| `get:state`  | `{}`                                           | Request current game state           |

### Expected Server Events

| Event          | When                    | Data                        |
| -------------- | ----------------------- | --------------------------- |
| `game:joined`  | After joining           | Room and player info        |
| `room:update`  | When players join/leave | Player list                 |
| `game:started` | When game starts        | Initial game state          |
| `update:state` | After moves/turns       | Current game state          |
| `roll:result`  | After rolling dice      | Dice values and legal moves |
| `move:result`  | After moving token      | Move details                |
| `turn:end`     | After turn ends         | Next player info            |
| `game:win`     | When someone wins       | Winner info                 |
| `game:error`   | On errors               | Error message               |

---

## 🐛 Troubleshooting

### Game board doesn't show in browser

**Problem:** Opening `localhost:3000/game` shows blank/loading screen

**Solutions:**

1. Check browser console (F12) for errors
2. Verify server is running (`npm run dev`)
3. Use the simple test page instead: `localhost:3000/simple-test.html`
4. Make sure you have 2 players joined and game started

### WebSocket won't connect in Postman

**Problem:** Connection fails or times out

**Solutions:**

1. Make sure server is running
2. Use correct URL format: `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`
3. Don't use `wss://` (that's for SSL)
4. Check firewall/antivirus isn't blocking port 3000

### "Not in a room" error

**Problem:** Getting error when trying to roll dice or move

**Solutions:**

1. Make sure you joined a room first (`game:join`)
2. Make sure game has started (`game:start`)
3. Verify you're in the room by checking `game:joined` response

### "Not your turn" error

**Problem:** Can't roll dice or move token

**Solutions:**

1. Check the `currentPlayer` from `game:started` or last `turn:end` event
2. Wait for your turn
3. Look at `turn:end` events to track whose turn it is

### Invalid move error

**Problem:** Token move rejected

**Solutions:**

1. Only use token IDs from `legalMoves` in `roll:result`
2. Make sure you rolled dice first
3. Check that the position is valid based on dice roll

---

## 📝 Testing Checklist

- [ ] Server running on port 3000
- [ ] Can connect to WebSocket
- [ ] Can join game with player 1
- [ ] Can join game with player 2
- [ ] Receive room:update events
- [ ] Can start game
- [ ] Receive game:started event
- [ ] Can roll dice
- [ ] Receive legal moves
- [ ] Can move token
- [ ] Turn advances to next player
- [ ] Game state updates correctly
- [ ] Can complete full game to win

---

## 🎯 Quick Test Script

For fastest testing, open browser console on `localhost:3000/simple-test.html` and the WebSocket connection/join/start will happen automatically!

Or use this one-liner in browser console after opening `/game`:

```javascript
// Check if socket connected
const socket = io("http://localhost:3000");
socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("game:join", {
    roomId: "test",
    playerId: "player_" + Date.now(),
  });
});
```

---

## 📚 Additional Resources

- Full API Documentation: `docs/API_REFERENCE.md`
- WebSocket Implementation Details: `docs/WEBSOCKET_IMPLEMENTATION.md`
- Interactive Test Page: `http://localhost:3000/test-websocket.html`
- Simple Test Page: `http://localhost:3000/simple-test.html`
- Postman Collection: `docs/POSTMAN_WEBSOCKET_COLLECTION.json`

<function_calls>
<invoke name="read_file">
<parameter name="filePath">/Users/gb9jya9/Desktop/ctm2/src/app/game/hooks/useGame.js
