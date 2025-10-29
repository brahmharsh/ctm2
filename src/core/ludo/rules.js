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
  return gameState.players[gameState.currentPlayerIndex].id === playerId;
}

// Produce list of legal moves (token ids) for player given dice
export function getLegalMoves(gameState, playerId, dice) {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return [];
  return player.tokens
    .filter((t) => !t.finished)
    .filter((t) => t.position + dice <= TRACK_LENGTH) // must land <= end
    .map((t) => t.id);
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

  const dice = gameState.pendingDice; // dice awaiting resolution
  if (dice == null) {
    return { success: false, error: "No pending dice roll" };
  }
  const expectedPosition = token.position + dice;
  if (newPosition !== expectedPosition) {
    return { success: false, error: "Invalid position for dice" };
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
  if (dice === 6 && !gameState.gameOver) {
    bonusMove = true;
  }

  // Clear pending dice after move consumed
  gameState.pendingDice = null;
  gameState.lastActionAt = Date.now();

  return {
    success: true,
    tokenId,
    newPosition,
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
