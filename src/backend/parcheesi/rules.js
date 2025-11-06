// Core game rules implementation
// This is a minimal rules engine enabling turn-based dice movement.
// It can be expanded later (captures, safe spots, entry logic, etc.).

// Configuration constants (could be externalized later)
const TOKENS_PER_PLAYER = 4;
const TRACK_LENGTH = 68; // Total cells in the main track (1-68)
const HOME_ENTRY_ROLL = 6; // Need 6 to enter from home

// Color assignment for players (matches frontend constants)
const PLAYER_COLORS = ['yellow', 'blue', 'red', 'green'];
const PLAYER_COLORS_2_PLAYER = ['yellow', 'red'];
const START_CELLS = {
  yellow: 5,
  blue: 22,
  red: 39,
  green: 56,
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
          position: 'home', // 'home' or cell number
          finished: false,
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
  };
}

// Roll dice - ALWAYS returns 2 dice (Parcheesi standard)
export function rollDice() {
  return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
}

// Determine if it's the player's turn
export function isPlayerTurn(gameState, playerId) {
  return gameState.players[gameState.currentPlayerIndex].id === playerId;
}

// Get legal moves for a specific token given a dice value
export function getTokenLegalMoves(token, diceValue, player) {
  if (token.finished) return [];

  // Token in home: needs 6 to enter
  if (token.position === 'home') {
    return diceValue === HOME_ENTRY_ROLL ? [player.startCell] : [];
  }

  // Token on track: can move forward
  const newPos = token.position + diceValue;

  // Don't allow moving past the end (simplified - real Ludo has final stretch)
  if (newPos > TRACK_LENGTH) return [];

  return [newPos];
}

// Produce list of legal moves for player given dice array and used status
export function getLegalMoves(gameState, playerId) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player || !gameState.pendingDice) return [];

  const moves = [];

  gameState.pendingDice.forEach((diceValue, diceIndex) => {
    if (gameState.usedDice[diceIndex]) return; // Skip used dice

    player.tokens.forEach((token) => {
      const possibleMoves = getTokenLegalMoves(token, diceValue, player);
      possibleMoves.forEach((newPos) => {
        moves.push({
          tokenId: token.id,
          diceIndex,
          diceValue,
          newPosition: newPos,
        });
      });
    });
  });

  return moves;
}

// Apply the chosen move using a specific dice
export function applyMove(gameState, playerId, tokenId, diceIndex) {
  if (!isPlayerTurn(gameState, playerId)) {
    return { success: false, error: 'Not your turn' };
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found' };

  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token) return { success: false, error: 'Token not found' };

  if (token.finished) {
    return { success: false, error: 'Token already finished' };
  }

  if (!gameState.pendingDice || !gameState.pendingDice[diceIndex]) {
    return { success: false, error: 'No pending dice roll' };
  }

  if (gameState.usedDice[diceIndex]) {
    return { success: false, error: 'Dice already used' };
  }

  const diceValue = gameState.pendingDice[diceIndex];

  // Validate move based on current position
  let newPosition;

  if (token.position === 'home') {
    // Must roll 6 to enter
    if (diceValue !== HOME_ENTRY_ROLL) {
      return { success: false, error: 'Need 6 to enter from home' };
    }
    newPosition = player.startCell;
  } else {
    // Move forward on track
    newPosition = token.position + diceValue;

    if (newPosition > TRACK_LENGTH) {
      return { success: false, error: 'Move exceeds track length' };
    }
  }

  // Execute move
  const oldPosition = token.position;
  token.position = newPosition;

  // Mark this dice as used
  gameState.usedDice[diceIndex] = true;

  let bonusMove = false;

  // Check if token reached finish (simplified - cell 68 or final stretch)
  // In real Ludo, tokens have a final home stretch per color
  if (token.position === TRACK_LENGTH) {
    token.finished = true;
    player.finishedTokens += 1;
  }

  // Bonus move if rolled a 6 (may be suppressed if chained consumed remaining die and both dice now used)
  if (diceValue === 6 && !gameState.gameOver) {
    bonusMove = true;
  }

  // Auto-chain second die when entering from home with a 6 and other die is NOT 6.
  let chainedMove = null;
  if (
    oldPosition === 'home' &&
    diceValue === HOME_ENTRY_ROLL &&
    Array.isArray(gameState.pendingDice) &&
    gameState.pendingDice.length === 2
  ) {
    const otherIndex = diceIndex === 0 ? 1 : 0;
    const otherVal = gameState.pendingDice[otherIndex];
    if (
      !gameState.usedDice[otherIndex] &&
      otherVal &&
      otherVal !== HOME_ENTRY_ROLL &&
      otherVal !== 1 && // Do NOT auto-chain a single extra step; let player decide
      typeof token.position === 'number'
    ) {
      const secondOldPosition = token.position;
      const secondNewPosition = token.position + otherVal;
      if (secondNewPosition <= TRACK_LENGTH) {
        token.position = secondNewPosition;
        gameState.usedDice[otherIndex] = true;
        chainedMove = {
          secondDiceIndex: otherIndex,
          secondDiceValue: otherVal,
          secondOldPosition,
          secondNewPosition,
        };
      }
    }
  }

  // Check if both dice are used (after potential chain application)
  const allDiceUsed = gameState.usedDice.every((used) => used);
  // If chain consumed second die and both dice used, suppress bonusMove (no extra action expected)
  if (chainedMove && allDiceUsed) {
    bonusMove = false;
  }

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
    chainedMove,
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
