# 🚀 Quick Testing Guide

## Fastest Way to Test the Game

### Option 1: Browser (30 seconds)

1. **Start server:**

   ```bash
   npm run dev
   ```

2. **Open in browser:**

   ```
   http://localhost:3000/simple-test.html
   ```

3. **Click:** "Connect & Auto-Join"

4. **Open same URL in another tab**

5. **Click:** "Connect & Auto-Join" again

6. **Game auto-starts!** Use "Roll Dice" to play

---

### Option 2: Postman WebSocket

1. **New WebSocket Request:**

   ```
   ws://localhost:3000/socket.io/?EIO=4&transport=websocket
   ```

2. **Connect**, then send:

   ```
   42["game:join",{"roomId":"test-room","playerId":"player_1"}]
   ```

3. **Open 2nd WebSocket tab**, connect and send:

   ```
   42["game:join",{"roomId":"test-room","playerId":"player_2"}]
   ```

4. **In either tab, send:**

   ```
   42["game:start",{}]
   ```

5. **Roll dice:**

   ```
   42["roll:dice",{}]
   ```

6. **Move token (use legal move from response):**
   ```
   42["move:token",{"tokenId":"player_1-t1","newPosition":15}]
   ```

---

## Why Game Board Doesn't Show Initially

The game at `/game` requires:

1. ✅ WebSocket connection
2. ✅ Join a room (2+ players needed)
3. ✅ Start the game

Use the test pages instead:

- **Simple:** http://localhost:3000/simple-test.html
- **Advanced:** http://localhost:3000/test-websocket.html

---

## Full Documentation

See `TESTING_GUIDE_WEBSOCKET.md` for complete instructions!
