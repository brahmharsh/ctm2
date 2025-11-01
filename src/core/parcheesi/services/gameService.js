// Game service orchestrating rule application and turn flow
import {
  rollDice,
  getLegalMoves,
  applyMove,
  checkWin,
  advanceTurn,
  isPlayerTurn,
  attachPendingDice,
} from "../rules.js";
import { roomService } from "./roomService.js";

export const gameService = {
  startGame(roomId) {
    return roomService.startGame(roomId);
  },
  rollDice(roomId, playerId) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState || !gameState.gameStarted)
      return { success: false, error: "Game not started" };
    if (gameState.gameOver) return { success: false, error: "Game is over" };
    if (!isPlayerTurn(gameState, playerId))
      return { success: false, error: "Not your turn" };

    // Generate two dice
    const dice1 = rollDice();
    const dice2 = rollDice();
    const dice = [dice1, dice2];

    attachPendingDice(gameState, dice);
    const legalMoves = getLegalMoves(gameState, playerId, dice);

    let autoAdvanced = false;
    if (legalMoves.length === 0) {
      // No legal moves: advance turn and clear pending dice.
      gameState.pendingDice = null;
      advanceTurn(gameState);
      roomService.updateGameState(roomId, gameState);
      autoAdvanced = true;
    } else {
      // For now, auto-advance turn after showing dice (simplified Ludo - no move selection yet)
      // In full implementation, player would select which piece to move from legalMoves
      gameState.pendingDice = null;
      advanceTurn(gameState);
      roomService.updateGameState(roomId, gameState);
      autoAdvanced = true;
    }

    return {
      success: true,
      dice, // now an array of two dice
      legalMoves,
      autoAdvanced,
      gameState,
      nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
    };
  },
  moveToken(roomId, playerId, tokenId, newPosition) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState || !gameState.gameStarted || gameState.gameOver)
      return { success: false, error: "Invalid game state" };
    if (!isPlayerTurn(gameState, playerId))
      return { success: false, error: "Not your turn" };

    const moveResult = applyMove(gameState, playerId, tokenId, newPosition);
    if (!moveResult.success) return moveResult;

    const player = gameState.players.find((p) => p.id === playerId);
    let gameWon = false;
    if (checkWin(player)) {
      gameState.gameOver = true;
      gameState.winner = playerId;
      gameWon = true;
    }

    if (!moveResult.bonusMove && !gameWon) {
      advanceTurn(gameState);
    }

    roomService.updateGameState(roomId, gameState);
    return {
      success: true,
      ...moveResult,
      gameWon,
      gameState,
      nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
    };
  },
};
