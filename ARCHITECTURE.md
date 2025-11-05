# Parcheesi/Ludo Game Architecture - KISS Implementation

## Overview

This document explains the clean, KISS-principle architecture for the Parcheesi game with 2-dice mechanics and token movement.

## ✅ Architecture Decisions

### 1. **No External Libraries Needed**

- Using **Canvas API** for rendering (built-in)
- Using **WebSocket** (Socket.IO) for real-time sync (already in project)
- Using **React hooks** for state management (built-in)
- **Why?** Adding Phaser.js or other game libraries would violate KISS for this simple board game

### 2. **Clean Separation of Concerns**

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  BACKEND (Rules & State)                                │
│  ├── rules.js              - Pure game logic            │
│  ├── gameService.js        - Orchestrates rules         │
│  └── roomService.js        - Manages rooms              │
│                                                          │
│  SOCKET LAYER (Communication)                           │
│  ├── gameHandlers.js       - Event handlers             │
│  └── websocketClient.js    - Client socket API          │
│                                                          │
│  FRONTEND (Presentation)                                │
│  ├── Components                                         │
│  │   ├── ParcheesiGame.jsx - Main orchestrator         │
│  │   ├── Dice.jsx          - 2-dice UI                 │
│  │   ├── Lobby.jsx         - Game setup                │
│  │   └── WaitingRoom.jsx   - Pre-game lobby            │
│  ├── Hooks                                              │
│  │   ├── useParcheesiGame  - Game state & actions      │
│  │   └── useBoardCanvas    - Canvas rendering          │
│  └── Utils                                              │
│      ├── drawBoard.js      - Board drawing logic       │
│      └── buildPath.js      - Cell path mapping         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎲 Dice Mechanics (2 Dice System)

### State Structure

```javascript
{
  pendingDice: [3, 5],      // Two dice values
  usedDice: [false, false]  // Track which dice are used
}
```

### Flow

1. **Player clicks "Roll Dice"** → Backend generates `[x, y]`
2. **Both dice displayed** with individual values
3. **Player clicks token** → Token selected
4. **Player clicks a die** → Token moves by that die's value
5. **Die marked as used** → `usedDice[index] = true`
6. **Repeat** until both dice used or no legal moves
7. **Turn advances** automatically when both dice used

### Special Rules

- **Rolling 6**: Bonus turn (can roll again after using both dice)
- **Entering from home**: Requires exactly a 6
- **Auto-advance**: If no legal moves, turn ends automatically

## 🎮 Token Movement System

### Token State

```javascript
{
  id: "player_123-t0",     // Unique token ID
  position: "home" | 5,    // "home" or cell number (1-68)
  finished: false,         // Token reached end
  color: "green",          // Player color
  px: 120,                 // Pixel X (calculated)
  py: 240,                 // Pixel Y (calculated)
  selectable: true         // Can be selected this turn
}
```

### Home Positions (Grid Coordinates)

Each player has 4 tokens starting in their corner:

```javascript
HOME_POSITIONS = {
  yellow: [
    { x: 16, y: 16 }, // Token 0
    { x: 18, y: 16 }, // Token 1
    { x: 16, y: 18 }, // Token 2
    { x: 18, y: 18 }, // Token 3
  ],
  blue: [
    /* top-right corner */
  ],
  red: [
    /* top-left corner */
  ],
  green: [
    /* bottom-left corner */
  ],
};
```

### Interaction Flow

```
1. Canvas Click Detection
   ├── Calculate click position
   ├── Find token within radius
   └── Call handleTokenClick()

2. Token Selection
   ├── Validate: is it my turn?
   ├── Validate: is it my token?
   ├── Highlight selected token
   └── Wait for dice selection

3. Dice Selection
   ├── Validate: dice not used?
   ├── Send move to backend
   ├── Backend validates & updates
   └── Canvas re-renders with new position

4. Position Calculation
   ├── If position === "home" → Use HOME_POSITIONS
   └── If position === number → Map to track cell
```

## 🎨 Rendering System

### Dark Token Colors (Distinguishable)

```javascript
TOKEN_COLORS = {
  red: 'rgba(185, 28, 28, 1)', // Darker red
  blue: 'rgba(29, 78, 216, 1)', // Darker blue
  green: 'rgba(21, 128, 61, 1)', // Darker green (visible on light green bg)
  yellow: 'rgba(161, 98, 7, 1)', // Darker yellow
};
```

### Drawing Pipeline

```
Frame Loop (60fps)
  ├── Clear canvas
  ├── Draw track cells (light gray)
  ├── Draw debug numbers (if enabled)
  ├── Draw tokens
  │   ├── Shadow
  │   ├── Token body (dark color)
  │   ├── White border
  │   └── Highlight pulse (if selectable)
  └── Draw home markers (black circles)
```

## 📡 WebSocket Events

### Client → Server

- `game:join` - Join a room
- `game:start` - Start the game
- `roll:dice` - Roll two dice
- `move:token` - Move token with specific die
- `get:state` - Request current state

### Server → Client

- `game:joined` - Confirmation
- `room:update` - Player joined/left
- `game:started` - Game began
- `roll:result` - Dice values `[x, y]`
- `move:result` - Move executed
- `update:state` - Full game state sync
- `turn:end` - Turn changed

## 🔄 Game Flow Example

```
Turn 1: Yellow Player
─────────────────────────────
1. Click "Roll Dice"
   → Server: [4, 6]
   → Display: ⚃ ⚅

2. Click token at home
   → Selected: yellow-t0

3. Click die showing 6
   → Move yellow-t0 from "home" to cell 5
   → Mark die as used: [false, true]

4. Click same token again
   → Selected: yellow-t0 (now at cell 5)

5. Click die showing 4
   → Move yellow-t0 from cell 5 to cell 9
   → Mark die as used: [true, true]

6. Both dice used
   → Rolled a 6 = Bonus turn!
   → Dice reset: [null, null]
   → Can roll again

Turn 2: Yellow Player (Bonus)
─────────────────────────────
1. Click "Roll Dice"
   → Server: [2, 3]
   ...
```

## 🧪 Testing the Implementation

### Manual Test Steps

1. Start server: `npm run dev`
2. Open two browser tabs: `http://localhost:3000/parcheesi`
3. Tab 1: Create room (2 players)
4. Tab 2: Join with room code
5. Game auto-starts
6. Yellow player (turn 1):
   - Click "Roll Dice"
   - See two dice values
   - Click a token at home
   - Click the die showing 6 (if available)
   - Token should move to starting cell
   - Click remaining die or another token
7. Verify turn advances to next player

### Debug Mode

Enable debug in `drawBoard.js` to see cell numbers on the board:

```javascript
drawBoard(..., debug: true, ...)
```

## 📊 Key Files Changed

### Backend

- ✅ `rules.js` - 2-dice logic, home positions, partial dice usage
- ✅ `gameService.js` - Updated for new dice system
- ✅ `gameHandlers.js` - Changed `move:token` to use `diceIndex`

### Frontend

- ✅ `constants.js` - Added `TOKEN_COLORS`, `HOME_POSITIONS`, `TOKENS_PER_PLAYER`
- ✅ `Dice.jsx` - NEW: 2-dice component with click handlers
- ✅ `ParcheesiGame.jsx` - NEW: Main orchestrator component
- ✅ `useParcheesiGame.js` - Added dice state, token selection, dice selection
- ✅ `useBoardCanvas.js` - Token positioning, click detection
- ✅ `drawBoard.js` - Token rendering with dark colors
- ✅ `websocketClient.js` - Added `onRollResult`, `onMoveResult`

## ✨ KISS Principles Applied

1. **Single Responsibility**: Each file has ONE clear purpose
2. **No Over-Engineering**: No complex state machines, just React state
3. **Readable Code**: Clear function names, no cryptic abbreviations
4. **No Premature Optimization**: Simple loops, no caching unless needed
5. **Minimal Dependencies**: Only what we already had
6. **Flat Structure**: Easy to find files, no deep nesting
7. **Pure Functions**: `rules.js` functions have no side effects
8. **Event-Driven**: Clean socket events, no polling

## 🚀 Future Enhancements (Keep it Simple!)

If you want to add features later:

- ✅ **Captures**: Token lands on opponent → send back to home
- ✅ **Safe spots**: Certain cells can't be captured
- ✅ **Final stretch**: Color-specific finish lanes
- ✅ **Animations**: Smooth token movement (CSS transitions)
- ✅ **Sound effects**: Dice roll, token move sounds
- ❌ **Don't add**: Complex AI, 3D graphics, blockchain (KISS!)

## 📝 Summary

**Your current code already follows best practices!** The new implementation:

- ✅ Maintains KISS principle
- ✅ No new libraries needed
- ✅ Clean separation of concerns
- ✅ Readable and maintainable
- ✅ Scalable for future features
- ✅ Dark tokens visible on colored backgrounds
- ✅ 2-dice system with partial usage
- ✅ Click-based token selection
- ✅ Home positioning working

**Next steps**: Test the game and adjust token positions if needed!
