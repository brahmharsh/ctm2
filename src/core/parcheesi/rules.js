// Core game rules implementation
// This is a minimal rules engine enabling turn-based dice movement.
// It can be expanded later (captures, safe spots, entry logic, etc.).

// Configuration constants (could be externalized later)
const TOKENS_PER_PLAYER = 4;
const TRACK_LENGTH = 30; // Arbitrary path length to finish a token

// Color assignment for players (matches frontend constants)
const PLAYER_COLORS = ["yellow", "blue", "red", "green"];
const START_CELLS = {
  yellow: 5,
  blue: 22,
  red: 39,
  green: 56,
};

// Create an initial game state for provided player ids
export function createGameState(playerIds) {
  return {
    players: playerIds.map((id, index) => {
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      return {
        id,
        color,
        startCell: START_CELLS[color],
        tokens: Array.from({ length: TOKENS_PER_PLAYER }).map((_, i) => ({
          id: `${id}-t${i + 1}`,
          position: 0,
          finished: false,
        })),
        finishedTokens: 0,
      };
    }),
    currentPlayerIndex: 0,
    pendingDice: null, // dice value awaiting resolution
    gameStarted: false,
    gameOver: false,
    winner: null,
    lastActionAt: Date.now(),
  };
}

// Roll a standard 6-sided die
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// Determine if it's the player's turn
export function isPlayerTurn(gameState, playerId) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isTurn = currentPlayer && currentPlayer.id === playerId;
  
  // Debug logging
  if (!isTurn) {
    console.log(`[isPlayerTurn] Player ${playerId} is NOT the current player. Current player: ${currentPlayer?.id || 'none'}`);
    console.log(`[isPlayerTurn] Current player index: ${gameState.currentPlayerIndex}, Total players: ${gameState.players.length}`);
    console.log(`[isPlayerTurn] Game started: ${gameState.gameStarted}, Game over: ${gameState.gameOver}`);
  } else {
    console.log(`[isPlayerTurn] Player ${playerId} is the current player`);
  }
  
  return isTurn;
}

// Produce list of legal moves (token ids) for player given dice
// export function getLegalMoves(gameState, playerId, dice) {
//   const player = gameState.players.find((p) => p.id === playerId);
//   if (!player) return [];
//   return player.tokens
//     .filter((t) => !t.finished)
//     .filter((t) => t.position + dice <= TRACK_LENGTH) // must land <= end
//     .map((t) => t.id);
// }

export function getLegalMoves(gameState, playerId, diceArray) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return [];

  console.log("diceAdiceArraydiceArraydiceArrayrray", diceArray);

  const diceValues = Array.isArray(diceArray)
    ? diceArray.map((n) => parseInt(n, 10))
    : [parseInt(diceArray, 10)];

  const legalMoves = [];

  console.log("diceValuesdiceValuesdiceValuesdiceValuesdiceValues", diceValues);

  for (const die of diceValues) {
    player.tokens
      .filter((t) => !t.finished)
      .filter((t) => t.position + die <= TRACK_LENGTH)
      .forEach((t) => {
        legalMoves.push({
          tokenId: t.id,
          moveBy: die,
          newPosition: t.position + die,
        });
      });
  }

  return legalMoves;
}



// Apply the chosen move; ensures consistency with pending dice
export function applyMove(gameState, playerId, tokenId, newPosition) {
  if (!isPlayerTurn(gameState, playerId)) {
    return { success: false, error: "Not your turn" };
  }
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: "Player not found" };
  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token) return { success: false, error: "Token not found" };
  if (token.finished)
    return { success: false, error: "Token already finished" };

  const dice = gameState.pendingDice; // dice awaiting resolution (number or array)
  if (dice == null) {
    return { success: false, error: "No pending dice roll" };
  }
  // Support single die or an array of dice from the server.
  // If array, accept a move that matches ANY single die value and determine which die was used by delta.
  let usedDie = 0;
  if (Array.isArray(dice)) {
    const deltas = dice.map((d) => parseInt(d, 10) || 0);
    const delta = newPosition - token.position;
    if (!deltas.includes(delta)) {
      return { success: false, error: "Invalid position for dice, expected one of [" + deltas.join(",") + "] but got " + newPosition };
    }
    usedDie = delta;
  } else {
    const die = parseInt(dice, 10) || 0;
    const expectedPosition = token.position + die;
    if (newPosition !== expectedPosition) {
      return { success: false, error: "Invalid position for dice, expected " + expectedPosition + " but got " + newPosition };
    }
    usedDie = die;
  }
  if (newPosition > TRACK_LENGTH) {
    return { success: false, error: "Move exceeds track" };
  }

  // Execute move
  token.position = newPosition;
  let bonusMove = false;

  // Finish token if exact landing on TRACK_LENGTH
  if (token.position === TRACK_LENGTH) {
    token.finished = true;
    player.finishedTokens += 1;
  }

  // Basic bonus rule: rolling a 6 grants extra move (unless game won)
  if (usedDie === 6 && !gameState.gameOver) {
    bonusMove = true;
  }
  console.log("usedDieusedDieusedDieusedDieusedDie", usedDie, dice);
  // Update pending dice after consuming the used die
  if (Array.isArray(dice)) {
    const arr = dice.map((d) => parseInt(d, 10) || 0);
    const idx = arr.indexOf(usedDie);

      if (idx > -1) arr.splice(idx, 1);
    gameState.pendingDice = arr.length ? arr : null;

    // if (idx > -1) {
    //   // Remove the used die
    //   arr.splice(idx, 1);
      
    //   // If there are still dice left and we didn't get a bonus move, keep the remaining dice
    //   // If we got a bonus move, we'll roll again, so clear the pending dice
    //   if (arr.length > 0 && !bonusMove) {
    //     gameState.pendingDice = arr;
    //   } else {
    //     gameState.pendingDice = null;
    //   }
    // } else {
    //   // If we couldn't find the used die (shouldn't happen), clear the dice
    //   gameState.pendingDice = null;
    // }
  } else {
    // Single die, clear it after use
    gameState.pendingDice = null;
  }
  gameState.lastActionAt = Date.now();

  return {
    success: true,
    tokenId,
    from: token.position - usedDie, // Calculate the original position before the move
    to: newPosition,
    finished: token.finished,
    bonusMove,
  };
}

// Advance turn to next player (skipping none for now)
export function advanceTurn(gameState) {
  gameState.currentPlayerIndex =
    (gameState.currentPlayerIndex + 1) % gameState.players.length;
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
  gameState.lastActionAt = Date.now();
}
