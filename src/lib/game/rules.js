// Parchís Game Rules Engine
// KISS: Pure functions for game rule validation
// No side effects - just validate and compute legal moves

import { SAFE_CELLS, PLAYERS } from "../../app/game/constants.js";

const BOARD_SIZE = 68;
const TOKENS_PER_PLAYER = 4;
const HOME_ENTRY_ROLL = 5; // Rolling 5 allows token to leave base

/**
 * Initialize a fresh game state for a room
 * @param {string[]} playerIds - Array of player IDs (e.g., ['player_1', 'player_2'])
 * @returns {Object} Initial game state
 */
export function createGameState(playerIds) {
  const players = playerIds.map((playerId) => ({
    id: playerId,
    color: PLAYERS[playerId]?.color || 'unknown',
    startCell: PLAYERS[playerId]?.startCell || 0,
    tokens: Array(TOKENS_PER_PLAYER).fill(null).map((_, idx) => ({
      id: idx,
      position: -1, // -1 means in base (not on board)
      isHome: false, // true when token reaches final home
    })),
  }));

  return {
    players,
    currentPlayerIndex: 0,
    gameStarted: false,
    gameOver: false,
    winner: null,
    turnCount: 0,
  };
}

/**
 * Check if a square is a safe cell (no captures allowed)
 * @param {number} position - Board position (0-67)
 * @returns {boolean}
 */
export function isSafeCell(position) {
  return SAFE_CELLS.includes(position);
}

/**
 * Check if rolling a 5 allows token to leave base
 * @param {number[]} dice - Array of two dice values
 * @returns {boolean}
 */
export function canLeaveBase(dice) {
  return dice.includes(5);
}

/**
 * Get all tokens for a player that can leave base
 * @param {Object} player - Player object
 * @param {number[]} dice - Dice roll result
 * @returns {number[]} Array of token IDs that can leave
 */
export function getTokensThatCanLeaveBase(player, dice) {
  if (!canLeaveBase(dice)) return [];
  
  return player.tokens
    .filter(token => token.position === -1) // Still in base
    .map(token => token.id);
}

/**
 * Calculate new position after moving
 * @param {number} currentPos - Current position on board
 * @param {number} steps - Number of steps to move
 * @returns {number} New position (wraps around board)
 */
export function calculateNewPosition(currentPos, steps) {
  if (currentPos === -1) return -1; // Can't move from base without proper roll
  return (currentPos + steps) % BOARD_SIZE;
}

/**
 * Check if a position has a barrier (2+ tokens of same color)
 * @param {Object} gameState - Current game state
 * @param {number} position - Position to check
 * @param {string} excludePlayerId - Player ID to exclude from check
 * @returns {boolean}
 */
export function hasBarrier(gameState, position, excludePlayerId = null) {
  for (const player of gameState.players) {
    if (player.id === excludePlayerId) continue;
    
    const tokensAtPosition = player.tokens.filter(
      token => token.position === position && !token.isHome
    );
    
    if (tokensAtPosition.length >= 2) {
      return true;
    }
  }
  return false;
}

/**
 * Get all legal moves for a player given dice roll
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player making the move
 * @param {number[]} dice - Two dice values [die1, die2]
 * @returns {Array} Array of legal move objects
 */
export function getLegalMoves(gameState, playerId, dice) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return [];

  const legalMoves = [];
  const totalMove = dice[0] + dice[1];

  // Check tokens that can leave base
  const canLeave = canLeaveBase(dice);
  if (canLeave) {
    const tokensInBase = player.tokens.filter(t => t.position === -1);
    tokensInBase.forEach(token => {
      legalMoves.push({
        tokenId: token.id,
        from: -1,
        to: player.startCell,
        type: 'leave_base',
      });
    });
  }

  // Check tokens on board
  player.tokens.forEach(token => {
    if (token.position === -1 || token.isHome) return;

    // Try individual die moves
    [dice[0], dice[1], totalMove].forEach(steps => {
      const newPos = calculateNewPosition(token.position, steps);
      
      // Check if blocked by barrier
      if (hasBarrier(gameState, newPos, playerId)) {
        return; // Can't move through barrier
      }

      legalMoves.push({
        tokenId: token.id,
        from: token.position,
        to: newPos,
        steps,
        type: 'move',
      });
    });
  });

  return legalMoves;
}

/**
 * Check if a token can capture another at a position
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Attacking player
 * @param {number} position - Position to check
 * @returns {Object|null} Captured token info or null
 */
export function checkCapture(gameState, playerId, position) {
  // Can't capture on safe cells
  if (isSafeCell(position)) return null;

  for (const player of gameState.players) {
    if (player.id === playerId) continue; // Can't capture own tokens

    const tokenAtPosition = player.tokens.find(
      token => token.position === position && !token.isHome
    );

    if (tokenAtPosition) {
      return {
        playerId: player.id,
        tokenId: tokenAtPosition.id,
        position,
      };
    }
  }

  return null;
}

/**
 * Apply a move to game state (mutates state)
 * @param {Object} gameState - Game state to mutate
 * @param {string} playerId - Player making move
 * @param {number} tokenId - Token to move
 * @param {number} newPosition - Target position
 * @returns {Object} Move result with capture info, bonus, etc.
 */
export function applyMove(gameState, playerId, tokenId, newPosition) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const token = player.tokens.find(t => t.id === tokenId);
  if (!token) {
    return { success: false, error: 'Token not found' };
  }

  const oldPosition = token.position;
  let captured = null;
  let bonusMove = 0;

  // Check for capture
  if (newPosition !== -1) {
    captured = checkCapture(gameState, playerId, newPosition);
    if (captured) {
      // Send captured token back to base
      const capturedPlayer = gameState.players.find(p => p.id === captured.playerId);
      const capturedToken = capturedPlayer.tokens.find(t => t.id === captured.tokenId);
      capturedToken.position = -1;
      bonusMove = 20; // Bonus for capturing
    }
  }

  // Move the token
  token.position = newPosition;

  return {
    success: true,
    playerId,
    tokenId,
    from: oldPosition,
    to: newPosition,
    captured,
    bonusMove,
  };
}

/**
 * Check if a player has won (all tokens home)
 * @param {Object} player - Player object
 * @returns {boolean}
 */
export function checkWin(player) {
  return player.tokens.every(token => token.isHome);
}

/**
 * Advance to next player's turn
 * @param {Object} gameState - Game state to mutate
 */
export function advanceTurn(gameState) {
  gameState.currentPlayerIndex = 
    (gameState.currentPlayerIndex + 1) % gameState.players.length;
  gameState.turnCount++;
}

/**
 * Validate if it's a player's turn
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player to validate
 * @returns {boolean}
 */
export function isPlayerTurn(gameState, playerId) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  return currentPlayer && currentPlayer.id === playerId;
}

/**
 * Roll two dice (server-side randomness)
 * @returns {number[]} Array of two dice values [1-6, 1-6]
 */
export function rollDice() {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

// FUTURE: Redis integration points
// - Store game state in Redis hash: `game:${roomId}`
// - Use Redis pub/sub for cross-server state sync
// - Replace in-memory Map with Redis calls in rooms.js
