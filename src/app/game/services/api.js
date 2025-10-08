// /services/api.js
import { PLAYERS } from "../constants";

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock game state
let gameState = {
  players: [],
  currentPlayerIndex: 0,
};

// Mock API endpoints
export const api = {
  // Get current game state
  getGameState: async () => {
    await delay(300);
    return {
      success: true,
      data: {
        ...gameState,
        players: gameState.players.map((player) => ({
          ...player,
          color: PLAYERS[player.id].color,
        })),
      },
    };
  },

  // Join game as a player
  joinGame: async (playerId) => {
    await delay(500);

    // Check if player already exists
    if (gameState.players.find((p) => p.id === playerId)) {
      return {
        success: false,
        error: "Player already in game",
      };
    }

    // Check if game is full
    if (gameState.players.length >= 4) {
      return {
        success: false,
        error: "Game is full",
      };
    }

    // Add player to game
    gameState.players.push({
      id: playerId,
      color: PLAYERS[playerId].color,
      position: 0,
      startCell: PLAYERS[playerId].startCell,
    });

    return {
      success: true,
      data: {
        player: {
          id: playerId,
          color: PLAYERS[playerId].color,
          startCell: PLAYERS[playerId].startCell,
        },
        gameState: {
          ...gameState,
          players: gameState.players.map((player) => ({
            ...player,
            color: PLAYERS[player.id].color,
          })),
        },
      },
    };
  },

  // Leave game
  leaveGame: async (playerId) => {
    await delay(300);

    gameState.players = gameState.players.filter((p) => p.id !== playerId);

    // Adjust current player index if needed
    if (
      gameState.currentPlayerIndex >= gameState.players.length &&
      gameState.players.length > 0
    ) {
      gameState.currentPlayerIndex = 0;
    }

    return {
      success: true,
      data: {
        gameState: {
          ...gameState,
          players: gameState.players.map((player) => ({
            ...player,
            color: PLAYERS[player.id].color,
          })),
        },
      },
    };
  },

  // Simulate rolling dice on the server
  rollDice: async (playerId) => {
    await delay(500);

    // Check if it's this player's turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return {
        success: false,
        error: "Not your turn",
      };
    }

    // Generate random dice result
    const result = Math.floor(Math.random() * 6) + 1;

    // Update player position (simplified for this example)
    currentPlayer.position = (currentPlayer.position + result) % 68;

    // Move to next player
    gameState.currentPlayerIndex =
      (gameState.currentPlayerIndex + 1) % gameState.players.length;

    // Return response in the format a real API might use
    return {
      success: true,
      data: {
        dice: result,
        timestamp: new Date().toISOString(),
        player: playerId,
        newPosition: currentPlayer.position,
        nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
      },
    };
  },

  // Reset game
  resetGame: async () => {
    await delay(300);

    gameState = {
      players: [],
      currentPlayerIndex: 0,
    };

    return {
      success: true,
      data: gameState,
    };
  },
};
