# Critical Fixes Needed

## Issues Found:
1. ❌ Tokens showing `position: 0` instead of `position: "home"` in logs
2. ❌ No tokens visible on board (because position is 0, not recognized as home)
3. ❌ No dice panel showing (because pendingDice is null, not an array)
4. ❌ No home token highlighting circles
5. ❌ Multiple node processes running (2 servers!)

## Root Causes:
- **OLD SERVER RUNNING**: Two node processes detected (PID 50449 and 47495)
- The old server has the buggy code where tokens initialize at position 0
- Current code is correct but not being used

## IMMEDIATE ACTIONS REQUIRED:

### 1. Kill ALL node servers:
```bash
cd /Users/gb9jya9/Desktop/ctm2
# Kill all node processes
pkill -f "node src/server"
# OR kill specific PIDs
kill -9 50449 47495
# Verify they're gone
ps aux | grep "node src/server" | grep -v grep
```

### 2. Restart the server:
```bash
# Start fresh server
node src/server/bootstrap/server.js
```

### 3. Hard refresh browser:
- Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows/Linux)
- This clears cached JavaScript

## What Should Happen After Restart:

### ✅ Backend logs should show:
```
position: "home"  // STRING, not number 0
```

### ✅ Frontend logs should show:
```javascript
[useGame] Player player_xxx (yellow): {
  totalTokens: 4,
  homeTokens: 4,  // All 4 should be in home
  tokens: [
    { id: "xxx-t0", position: "home", finished: false },
    // ... etc
  ]
}
```

### ✅ Visual Changes:
1. **4 tokens visible in each corner** (yellow bottom-right, blue top-right)
2. **Pulsing glow around home tokens** (radial gradient + white ring)
3. **Roll Dice button enabled** for current player
4. **After rolling**: 2 3D dice appear with values
5. **Click token**: Yellow outline appears
6. **Click die**: Token moves

## Token Entry on 6:
The backend already has this logic in `rules.js`:
```javascript
const HOME_ENTRY_ROLL = 6; // Need 6 to enter from home

// Token in home: needs 6 to enter
if (token.position === 'home') {
  return diceValue === HOME_ENTRY_ROLL ? [player.startCell] : [];
}
```

This means:
- Tokens at home can ONLY move if you roll a 6
- Rolling 6 moves token from home to start cell
- Any other number = no legal moves for home tokens

## Files Modified (Already Correct):
- ✅ `/src/backend/parcheesi/rules.js` - position: 'home'
- ✅ `/src/frontend/parcheesi/hooks/useGame.js` - handles position: 0 OR 'home'
- ✅ `/src/frontend/parcheesi/utils/drawing.js` - pulsing glow for home tokens
- ✅ `/src/frontend/parcheesi/components/Dice3D.jsx` - 3D rolling dice
- ✅ `/src/frontend/parcheesi/components/Controls.jsx` - shows 2 dice

## Next Steps:
1. **KILL OLD SERVERS** (commands above)
2. **START FRESH SERVER**
3. **HARD REFRESH BROWSER**
4. **Test flow**:
   - Create room
   - Join with 2nd player
   - Game auto-starts
   - See 8 tokens (4 yellow, 4 blue) in corners with glow
   - Roll dice (current player)
   - If no 6: "No legal moves" auto-advances turn
   - If 6: Click glowing home token, then click the die with 6, token moves to start cell

