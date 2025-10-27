// Central in-memory game store (server-side only)
// KISS: simple mutable object; in production you'd swap for DB or persistent cache.
import { PLAYERS } from "@/app/game/constants";

const initialState = () => ({
  players: [],
  currentPlayerIndex: 0,
});

let gameState = initialState();

function serializeState() {
  return {
    ...gameState,
    players: gameState.players.map((p) => ({
      ...p,
      // Ensure color + startCell derived from PLAYERS for consistency
      color: PLAYERS[p.id].color,
      startCell: PLAYERS[p.id].startCell,
    })),
  };
}

export const gameStore = {
  getState() {
    return serializeState();
  },
  reset() {
    gameState = initialState();
    return serializeState();
  },
  join(playerId) {
    if (!PLAYERS[playerId]) {
      return { success: false, error: "Unknown player" };
    }
    if (gameState.players.find((p) => p.id === playerId)) {
      return { success: false, error: "Player already in game" };
    }
    if (gameState.players.length >= 4) {
      return { success: false, error: "Game is full" };
    }
    gameState.players.push({
      id: playerId,
      position: PLAYERS[playerId].startCell,
    });
    return {
      success: true,
      data: { player: PLAYERS[playerId], gameState: serializeState() },
    };
  },
  leave(playerId) {
    gameState.players = gameState.players.filter((p) => p.id !== playerId);
    if (gameState.currentPlayerIndex >= gameState.players.length) {
      gameState.currentPlayerIndex = 0;
    }
    return { success: true, data: { gameState: serializeState() } };
  },
  roll(playerId) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { success: false, error: "Not your turn" };
    }
    const dice = Math.floor(Math.random() * 6) + 1;
    currentPlayer.position = (currentPlayer.position + dice) % 68;
    gameState.currentPlayerIndex =
      (gameState.currentPlayerIndex + 1) % gameState.players.length;
    return {
      success: true,
      data: {
        dice,
        player: playerId,
        newPosition: currentPlayer.position,
        nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
        gameState: serializeState(),
      },
    };
  },
};
