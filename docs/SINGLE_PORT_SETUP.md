# Single Port Configuration - Summary

## ✅ Changes Made

### 1. Created Custom Next.js Server (`server.js`)
- Integrates Socket.IO directly into Next.js
- Both run on **port 3000**
- No need to run two separate servers

### 2. Updated Package Scripts
```json
{
  "dev": "node server.js",           // ONE command to start everything
  "start": "NODE_ENV=production node server.js"
}
```

### 3. Updated Socket.IO Client URL
- Changed from `http://localhost:3001` → `http://localhost:3000`
- Updated in:
  - `src/lib/socket/client.js`
  - `public/test-websocket.html`

---

## 🚀 How to Run Now

### Development Mode
```bash
npm run dev
```
That's it! One command starts:
- Next.js (frontend + API routes) on port 3000
- Socket.IO (WebSocket server) on port 3000

### Production Mode
```bash
npm run build
npm start
```

---

## 🔧 Environment Variables

Update `.env.local`:
```bash
# Old (two ports)
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# New (one port) - REMOVE these or update:
# No SOCKET_PORT needed
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## 📡 REST API vs WebSocket

### WebSocket Handles (100% of gameplay):
✅ `game:join` - Join room  
✅ `game:start` - Start game  
✅ `roll:dice` - Roll dice  
✅ `move:token` - Move token  
✅ `get:state` - Get state  
✅ Real-time updates  
✅ Turn management  
✅ Win detection  

### REST APIs (Optional - Keep or Remove):
⚠️ `GET /api/game/state` - Query state (debugging)  
⚠️ `POST /api/game/join` - Join via HTTP (fallback)  
⚠️ `POST /api/game/roll` - Roll via HTTP (fallback)  
⚠️ `POST /api/game/reset` - Admin reset  

**Verdict**: You can safely remove REST APIs if you want WebSocket-only.

---

## 🗑️ What Can Be Removed (Optional)

If you want **WebSocket-only** (no REST):

### 1. Delete REST API Routes
```bash
# Can be deleted:
src/app/api/game/[...action]/route.js
src/app/api/health/route.js
```

### 2. Keep These (Required):
```bash
# Keep these - they're used by WebSocket:
src/lib/game/rules.js     # Game logic
src/lib/game/rooms.js     # Room management
src/lib/game/store.js     # Can keep or remove (not used by WebSocket)
src/lib/socket/client.js  # WebSocket client
server.js                 # Main server
```

### 3. Old Files (Can Delete)
```bash
# No longer needed:
socket-server.js          # Replaced by server.js
```

---

## 📊 Architecture Comparison

### Before (Two Servers):
```
┌─────────────┐     ┌──────────────┐
│  Next.js    │     │  Socket.IO   │
│  Port 3000  │     │  Port 3001   │
└─────────────┘     └──────────────┘
      │                     │
      └─────────┬───────────┘
                │
         ┌──────▼──────┐
         │  Game Logic │
         └─────────────┘
```

### After (One Server):
```
┌─────────────────────────────┐
│      Next.js Server         │
│  ┌──────────┬─────────────┐ │
│  │ Next.js  │  Socket.IO  │ │
│  │ (Pages)  │ (WebSocket) │ │
│  └──────────┴─────────────┘ │
│        Port 3000             │
└─────────────────────────────┘
              │
       ┌──────▼──────┐
       │  Game Logic │
       └─────────────┘
```

---

## ✅ Testing

### 1. Stop Any Running Servers
Press `Ctrl+C` in all terminals

### 2. Start New Unified Server
```bash
npm run dev
```

### 3. Open Test Page
```
http://localhost:3000/test-websocket.html
```

Everything now runs on **port 3000**!

---

## 🎯 Recommended Setup

### For This Game: **WebSocket Only**

**Remove REST APIs** because:
- Game is fully real-time
- WebSocket handles everything
- Simpler architecture
- Less code to maintain

**Keep REST APIs** if you need:
- Admin panel
- Game analytics
- Non-realtime mobile app
- Testing/debugging tools

---

## 📝 Migration Steps (If Removing REST)

1. **Delete REST API routes:**
   ```bash
   rm -rf src/app/api/game
   rm -rf src/app/api/health
   ```

2. **Remove unused store** (optional):
   ```bash
   # If not using REST, gameStore isn't needed
   # But it's small, so can keep it
   ```

3. **Update documentation:**
   - Remove REST API references
   - Update testing guides

---

## 🚦 Current Status

✅ **Single port setup complete**  
✅ **Both servers run together**  
✅ **No configuration changes needed**  
✅ **Test page updated**  
✅ **Client URLs updated**  

**Just run:** `npm run dev`

---

## 💡 Recommendation

For your Parchís multiplayer game:

**Use WebSocket Only**
- Simpler
- Faster
- Real-time by design
- Less code
- Easier to understand

**Delete:**
- `src/app/api/game/[...action]/route.js`
- `src/app/api/health/route.js`
- `socket-server.js` (replaced by `server.js`)

**Keep:**
- `server.js` (new unified server)
- All `src/lib/game/*` files
- `src/lib/socket/client.js`

This gives you a clean, WebSocket-only multiplayer game running on a single port! 🎮
