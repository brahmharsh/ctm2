// Core game rules implementation - SPEC COMPLIANT (docs/parchessi_rules.md)
// Enforces house rules: barriers, safe squares, home row, exact home entry, +20 capture bonus

// Error codes from spec (Section 6)
export const ErrorCodes = {
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  TOKEN_FINISHED: 'TOKEN_FINISHED',
  NO_PENDING_DICE: 'NO_PENDING_DICE',
  DICE_ALREADY_USED: 'DICE_ALREADY_USED',
  NEED_SIX_TO_ENTER: 'NEED_SIX_TO_ENTER',
  BARRIER_BLOCKED: 'BARRIER_BLOCKED',
  CAPTURE_ON_SAFE: 'CAPTURE_ON_SAFE',
  OVERSHOOT_HOME: 'OVERSHOOT_HOME',
  INVALID_HOME_ROW_ENTRY: 'INVALID_HOME_ROW_ENTRY',
  MOVE_NOT_LEGAL: 'MOVE_NOT_LEGAL',
};

// Configuration constants (from spec Section 5 & 9)
const TOKENS_PER_PLAYER = 4;
const TRACK_LENGTH = 68; // Total cells in the main track (1-68)
const HOME_ENTRY_ROLL = 6; // Need 6 to enter from home
const HOME_ROW_DEPTH = 7; // Steps in home row (Y1-Y7); Home is at position 8
const HOME_FINISH_POSITION = HOME_ROW_DEPTH + 1; // Position 8 = finished
const CAPTURE_BONUS = 20; // Bonus move for capturing

// Color assignment for players (matches frontend constants)
const PLAYER_COLORS = ['yellow', 'blue', 'red', 'green'];
const PLAYER_COLORS_2_PLAYER = ['yellow', 'red'];
const START_CELLS = {
  yellow: 5,
  blue: 22,
  red: 39,
  green: 56,
};

// Safe cells from spec Section 5 (no captures allowed)
const SAFE_CELLS = new Set([5, 12, 17, 29, 34, 46, 51, 63]);

// Home row entry points: the square BEFORE which a token enters home row
// Each color enters home row when they would land on the square before their start
// (after completing the full circuit of 68 squares)
const HOME_ROW_ENTRY = {
  yellow: 4, // Yellow starts at 5, enters home row after passing 4
  blue: 21, // Blue starts at 22, enters home row after passing 21
  red: 38, // Red starts at 39, enters home row after passing 38
  green: 55, // Green starts at 56, enters home row after passing 55
};

// Create an initial game state for provided player ids
export function createGameState(playerIds) {
  const isTwoPlayer = playerIds.length === 2;
  const colors = isTwoPlayer ? PLAYER_COLORS_2_PLAYER : PLAYER_COLORS;
  return {
    players: playerIds.map((id, index) => {
      const color = colors[index % colors.length];
      return {
        id,
        color,
        startCell: START_CELLS[color],
        tokens: Array.from({ length: TOKENS_PER_PLAYER }).map((_, i) => ({
          id: `${id}-t${i}`,
          position: 'home', // 'home', cell number, or 'home_row:<N>'
          finished: false,
          inHomeRow: false,
          homeRowPosition: null, // 1-7 when in home row
        })),
        finishedTokens: 0,
      };
    }),
    currentPlayerIndex: 0,
    pendingDice: null, // [dice1, dice2] or null
    usedDice: [false, false], // track which dice have been used
    gameStarted: false,
    gameOver: false,
    winner: null,
    lastActionAt: Date.now(),
    rollStats: playerIds.reduce((acc, id) => {
      acc[id] = {
        totalRolls: 0,
        totalDice: 0,
        faces: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      };
      return acc;
    }, {}),
  };
}

// Roll dice - ALWAYS returns 2 dice (Parcheesi standard)
export function rollDice() {
  // Prefer cryptographically strong RNG if available.
  try {
    const { randomInt } = require('crypto');
    return [randomInt(1, 7), randomInt(1, 7)];
  } catch (err) {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }
}

// Determine if it's the player's turn
export function isPlayerTurn(gameState, playerId) {
  return gameState.players[gameState.currentPlayerIndex].id === playerId;
}

// Helper: Check if a position has a barrier (2 same-color tokens)
function hasBarrier(gameState, position, excludeTokenId = null) {
  if (typeof position !== 'number') return false;

  const tokensAtPosition = [];
  gameState.players.forEach((player) => {
    player.tokens.forEach((token) => {
      if (
        token.position === position &&
        token.id !== excludeTokenId &&
        !token.finished
      ) {
        tokensAtPosition.push({
          playerId: player.id,
          color: player.color,
          tokenId: token.id,
        });
      }
    });
  });

  // Barrier exists if 2 tokens of same color occupy the square
  const colorCounts = {};
  tokensAtPosition.forEach((t) => {
    colorCounts[t.color] = (colorCounts[t.color] || 0) + 1;
  });

  return Object.values(colorCounts).some((count) => count >= 2);
}

// Helper: Check if path contains any barriers (for movement validation)
function pathContainsBarrier(
  gameState,
  startPos,
  distance,
  playerColor,
  tokenId
) {
  if (typeof startPos !== 'number') return false;

  // Check each square in the path
  for (let step = 1; step <= distance; step++) {
    let checkPos = startPos + step;

    // Wrap around the track
    if (checkPos > TRACK_LENGTH) {
      checkPos = checkPos - TRACK_LENGTH;
    }

    // Check if this position is the home row entry for this color
    if (checkPos === HOME_ROW_ENTRY[playerColor]) {
      // Token is entering home row - no more barrier checks needed
      return false;
    }

    if (hasBarrier(gameState, checkPos, tokenId)) {
      return true;
    }
  }
  return false;
}

// Helper: Get tokens at a specific position
function getTokensAtPosition(gameState, position, excludeTokenId = null) {
  const tokens = [];
  gameState.players.forEach((player) => {
    player.tokens.forEach((token) => {
      if (
        token.position === position &&
        token.id !== excludeTokenId &&
        !token.finished
      ) {
        tokens.push({ player, token });
      }
    });
  });
  return tokens;
}

// Helper: Check if a position lands on or passes the home row entry for a color
// Returns: { entersHomeRow: boolean, homeRowPosition: number }
function checkHomeRowEntry(currentPosition, diceValue, color) {
  const entrySquare = HOME_ROW_ENTRY[color];

  // Calculate the path the token will take
  const positions = [];
  for (let i = 1; i <= diceValue; i++) {
    let pos = currentPosition + i;
    // Wrap around the track
    if (pos > TRACK_LENGTH) {
      pos = pos - TRACK_LENGTH;
    }
    positions.push(pos);
  }

  // Check if any position passes through the entry square
  const entryIndex = positions.indexOf(entrySquare);
  if (entryIndex !== -1) {
    // Token enters home row
    // Remaining moves after entry = total moves - moves to reach entry - 1
    const homeRowPosition = diceValue - entryIndex - 1;
    return { entersHomeRow: true, homeRowPosition };
  }

  return { entersHomeRow: false, homeRowPosition: 0 };
}

// Helper: Calculate final position accounting for wrapping and home row entry
function calculateFinalPosition(currentPosition, diceValue, color) {
  const homeRowCheck = checkHomeRowEntry(currentPosition, diceValue, color);

  if (homeRowCheck.entersHomeRow) {
    return {
      type: 'home_row',
      position: homeRowCheck.homeRowPosition,
    };
  }

  // Normal track movement with wrapping
  let newPos = currentPosition + diceValue;
  if (newPos > TRACK_LENGTH) {
    newPos = newPos - TRACK_LENGTH;
  }

  return {
    type: 'track',
    position: newPos,
  };
}

// Get legal moves for a specific token given a dice value (SPEC COMPLIANT)
export function getTokenLegalMoves(token, diceValue, player, gameState) {
  if (token.finished) return [];

  // Token in home: needs 6 to enter (Spec Section 3)
  if (token.position === 'home') {
    if (diceValue !== HOME_ENTRY_ROLL) return [];

    const startSquare = player.startCell;

    // Check if start square has barrier
    if (hasBarrier(gameState, startSquare, token.id)) {
      return []; // BARRIER_BLOCKED
    }

    // Check if start square has opponent on safe square
    const tokensAtStart = getTokensAtPosition(gameState, startSquare, token.id);
    const hasOpponent = tokensAtStart.some((t) => t.player.id !== player.id);

    if (hasOpponent && SAFE_CELLS.has(startSquare)) {
      return []; // Cannot capture on safe square
    }

    return [
      {
        position: startSquare,
        capturesPossible: hasOpponent && !SAFE_CELLS.has(startSquare),
      },
    ];
  }

  // Token in home row
  if (token.inHomeRow) {
    const newHomePos = token.homeRowPosition + diceValue;
    if (newHomePos === HOME_FINISH_POSITION) {
      return [{ position: 'finished', isFinish: true }];
    }
    if (newHomePos > HOME_FINISH_POSITION) {
      return []; // OVERSHOOT_HOME
    }
    return [
      { position: `home_row:${newHomePos}`, homeRowPosition: newHomePos },
    ];
  }

  // Token on track: calculate new position with home row entry check
  const finalPos = calculateFinalPosition(
    token.position,
    diceValue,
    player.color
  );

  if (finalPos.type === 'home_row') {
    const homeRowPos = finalPos.position;

    if (homeRowPos > HOME_FINISH_POSITION) {
      return []; // OVERSHOOT_HOME
    }
    if (homeRowPos === HOME_FINISH_POSITION) {
      return [{ position: 'finished', isFinish: true }];
    }
    return [
      {
        position: `home_row:${homeRowPos}`,
        homeRowPosition: homeRowPos,
        entersHomeRow: true,
      },
    ];
  }

  // Token stays on track
  const newPos = finalPos.position;

  // Check for barriers in path
  if (
    pathContainsBarrier(
      gameState,
      token.position,
      diceValue,
      player.color,
      token.id
    )
  ) {
    return []; // BARRIER_BLOCKED
  }

  // Check landing square for barrier
  if (hasBarrier(gameState, newPos, token.id)) {
    return []; // BARRIER_BLOCKED
  }

  // Check for capture possibility
  const tokensAtDest = getTokensAtPosition(gameState, newPos, token.id);
  const hasOpponent = tokensAtDest.some((t) => t.player.id !== player.id);
  const capturesPossible = hasOpponent && !SAFE_CELLS.has(newPos);

  return [{ position: newPos, capturesPossible }];
}

// Produce list of legal moves for player given dice array and used status (SPEC COMPLIANT)
export function getLegalMoves(gameState, playerId) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player || !gameState.pendingDice) return [];

  const moves = [];

  gameState.pendingDice.forEach((diceValue, diceIndex) => {
    if (gameState.usedDice[diceIndex]) return; // Skip used dice

    player.tokens.forEach((token) => {
      const possibleMoves = getTokenLegalMoves(
        token,
        diceValue,
        player,
        gameState
      );
      possibleMoves.forEach((moveInfo) => {
        moves.push({
          tokenId: token.id,
          diceIndex,
          diceValue,
          newPosition: moveInfo.position,
          capturesPossible: moveInfo.capturesPossible || false,
          isFinish: moveInfo.isFinish || false,
          entersHomeRow: moveInfo.entersHomeRow || false,
          homeRowPosition: moveInfo.homeRowPosition || null,
        });
      });
    });
  });

  return moves;
}

// Apply the chosen move using a specific dice (SPEC COMPLIANT with error codes)
export function applyMove(gameState, playerId, tokenId, diceIndex) {
  if (!isPlayerTurn(gameState, playerId)) {
    return {
      success: false,
      error: 'Not your turn',
      code: ErrorCodes.NOT_YOUR_TURN,
    };
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) {
    return {
      success: false,
      error: 'Player not found',
      code: ErrorCodes.PLAYER_NOT_FOUND,
    };
  }

  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token) {
    return {
      success: false,
      error: 'Token not found',
      code: ErrorCodes.TOKEN_NOT_FOUND,
    };
  }

  if (token.finished) {
    return {
      success: false,
      error: 'Token already finished',
      code: ErrorCodes.TOKEN_FINISHED,
    };
  }

  if (!gameState.pendingDice || !gameState.pendingDice[diceIndex]) {
    return {
      success: false,
      error: 'No pending dice roll',
      code: ErrorCodes.NO_PENDING_DICE,
    };
  }

  if (gameState.usedDice[diceIndex]) {
    return {
      success: false,
      error: 'Dice already used',
      code: ErrorCodes.DICE_ALREADY_USED,
    };
  }

  const diceValue = gameState.pendingDice[diceIndex];

  // PRE-VALIDATION: Check specific error conditions before generic legal move check

  // Validate move based on current position
  if (token.position === 'home') {
    if (diceValue !== HOME_ENTRY_ROLL) {
      return {
        success: false,
        error: 'Need 6 to enter from home',
        code: ErrorCodes.NEED_SIX_TO_ENTER,
      };
    }

    if (hasBarrier(gameState, player.startCell, token.id)) {
      return {
        success: false,
        error: 'Start square blocked by barrier',
        code: ErrorCodes.BARRIER_BLOCKED,
      };
    }
  } else if (token.inHomeRow) {
    const newHomePos = token.homeRowPosition + diceValue;
    if (newHomePos > HOME_FINISH_POSITION) {
      return {
        success: false,
        error: 'Move overshoots home',
        code: ErrorCodes.OVERSHOOT_HOME,
      };
    }
  } else {
    // Token on main track - check barriers and home row entry
    const finalPos = calculateFinalPosition(
      token.position,
      diceValue,
      player.color
    );

    if (finalPos.type === 'home_row') {
      // Entering home row - check overshoot
      if (finalPos.position > HOME_FINISH_POSITION) {
        return {
          success: false,
          error: 'Move overshoots home',
          code: ErrorCodes.OVERSHOOT_HOME,
        };
      }
    } else {
      // Staying on track - check for barriers
      // Check for barriers in path
      if (
        pathContainsBarrier(
          gameState,
          token.position,
          diceValue,
          player.color,
          token.id
        )
      ) {
        return {
          success: false,
          error: 'Path blocked by barrier',
          code: ErrorCodes.BARRIER_BLOCKED,
        };
      }

      if (hasBarrier(gameState, finalPos.position, token.id)) {
        return {
          success: false,
          error: 'Destination blocked by barrier',
          code: ErrorCodes.BARRIER_BLOCKED,
        };
      }
    }
  }

  // Get legal moves and validate this move is in the list
  const legalMoves = getTokenLegalMoves(token, diceValue, player, gameState);
  if (legalMoves.length === 0) {
    return {
      success: false,
      error: 'Move not legal',
      code: ErrorCodes.MOVE_NOT_LEGAL,
    };
  }

  const moveInfo = legalMoves[0]; // Should only be one legal destination per token+die
  let newPosition = moveInfo.position;

  // Set new position based on validated move
  if (token.position === 'home') {
    newPosition = player.startCell;
  } else if (token.inHomeRow) {
    const newHomePos = token.homeRowPosition + diceValue;
    if (newHomePos === HOME_FINISH_POSITION) {
      newPosition = 'finished';
    } else {
      newPosition = `home_row:${newHomePos}`;
    }
  } else {
    // Token on main track - use same logic as getTokenLegalMoves
    const finalPos = calculateFinalPosition(
      token.position,
      diceValue,
      player.color
    );

    if (finalPos.type === 'home_row') {
      if (finalPos.position === HOME_FINISH_POSITION) {
        newPosition = 'finished';
      } else {
        newPosition = `home_row:${finalPos.position}`;
      }
    } else {
      newPosition = finalPos.position;
    }
  }

  // Execute move
  const oldPosition = token.position;
  const oldInHomeRow = token.inHomeRow;

  // Update token position
  if (newPosition === 'finished') {
    token.finished = true;
    token.inHomeRow = true;
    token.homeRowPosition = HOME_FINISH_POSITION;
    token.position = 'finished';
    player.finishedTokens += 1;
  } else if (
    typeof newPosition === 'string' &&
    newPosition.startsWith('home_row:')
  ) {
    const homePos = parseInt(newPosition.split(':')[1]);
    token.inHomeRow = true;
    token.homeRowPosition = homePos;
    token.position = newPosition;

    if (homePos === HOME_FINISH_POSITION) {
      token.finished = true;
      token.position = 'finished';
      player.finishedTokens += 1;
    }
  } else {
    token.position = newPosition;
  }

  // Mark this dice as used
  gameState.usedDice[diceIndex] = true;

  let bonusMove = false;
  let capturedTokens = [];
  let captureBonus = 0;

  // Capture logic (Spec Section 3: +20 bonus for capture on non-safe square)
  if (
    typeof newPosition === 'number' &&
    !SAFE_CELLS.has(newPosition) &&
    !token.inHomeRow
  ) {
    gameState.players.forEach((p) => {
      if (p.id === playerId) return; // skip self
      p.tokens.forEach((oppToken) => {
        if (!oppToken.finished && oppToken.position === newPosition) {
          // Capture: send opponent token back to home
          oppToken.position = 'home';
          oppToken.finished = false;
          oppToken.inHomeRow = false;
          oppToken.homeRowPosition = null;
          capturedTokens.push({ playerId: p.id, tokenId: oppToken.id });
        }
      });
    });

    if (capturedTokens.length > 0 && !gameState.gameOver) {
      captureBonus = CAPTURE_BONUS; // +20 bonus per spec
    }
  }

  // Check if both dice are used
  const allDiceUsed = gameState.usedDice.every((used) => used);

  gameState.lastActionAt = Date.now();

  return {
    success: true,
    tokenId,
    oldPosition,
    newPosition,
    diceValue,
    finished: token.finished,
    bonusMove,
    allDiceUsed,
    capturedTokens,
    captureBonus, // For service to handle bonus move
    enteredHomeRow: !oldInHomeRow && token.inHomeRow,
  };
}

// Advance turn to next player (skipping none for now)
export function advanceTurn(gameState) {
  // Clear dice state for new turn
  gameState.pendingDice = null;
  gameState.usedDice = [false, false];
  gameState.currentPlayerIndex =
    (gameState.currentPlayerIndex + 1) % gameState.players.length;
  console.log('[rules.advanceTurn] Advanced turn to player:', {
    playerId: gameState.players[gameState.currentPlayerIndex].id,
    currentPlayerIndex: gameState.currentPlayerIndex,
  });
  gameState.lastActionAt = Date.now();
}

// Check win condition (all tokens finished)
export function checkWin(player) {
  return player.finishedTokens === player.tokens.length;
}

// Attach the rolled dice to state (called indirectly via gameService.rollDice)
// Helper so gameService can persist pending dice result prior to move selection
export function attachPendingDice(gameState, dice) {
  gameState.pendingDice = dice;
  gameState.usedDice = dice.map(() => false); // dynamic length
  gameState.lastActionAt = Date.now();
}

// Check if turn should auto-advance (no legal moves or all dice used)
export function shouldAdvanceTurn(gameState) {
  return (
    Array.isArray(gameState.usedDice) &&
    gameState.usedDice.length > 0 &&
    gameState.usedDice.every((used) => used)
  );
}
