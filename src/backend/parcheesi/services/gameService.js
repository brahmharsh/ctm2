// Game service orchestrating rule application and turn flow
import {
  rollDice,
  getLegalMoves,
  applyMove,
  checkWin,
  advanceTurn,
  isPlayerTurn,
  attachPendingDice,
  shouldAdvanceTurn,
} from '#parcheesi/rules.js';
import { roomService } from '#parcheesi/services/roomService.js';

export const gameService = {
  startGame(roomId) {
    return roomService.startGame(roomId);
  },

  rollDice(roomId, playerId) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState || !gameState.gameStarted)
      return { success: false, error: 'Game not started' };
    if (gameState.gameOver) return { success: false, error: 'Game is over' };
    if (!isPlayerTurn(gameState, playerId))
      return { success: false, error: 'Not your turn' };

    // Don't allow re-rolling if dice are pending
    if (gameState.pendingDice) {
      return { success: false, error: 'Dice already rolled, make your move' };
    }

    const dice = rollDice();
    console.log('[gameService.rollDice] Generated dice:', dice);
    attachPendingDice(gameState, dice);
    const legalMoves = getLegalMoves(gameState, playerId);
    console.log('[gameService.rollDice] Legal moves:', legalMoves);
    // If no legal moves, auto-advance turn
    if (legalMoves.length === 0) {
      advanceTurn(gameState);
      roomService.updateGameState(roomId, gameState);
      return {
        success: true,
        dice,
        legalMoves: [],
        autoAdvanced: true,
        gameState,
        nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
      };
    }

    // Save state with pending dice
    roomService.updateGameState(roomId, gameState);

    return {
      success: true,
      dice,
      legalMoves,
      autoAdvanced: false,
      gameState,
    };
  },

  moveToken(roomId, playerId, tokenId, diceIndex) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState || !gameState.gameStarted || gameState.gameOver)
      return { success: false, error: 'Invalid game state' };
    if (!isPlayerTurn(gameState, playerId))
      return { success: false, error: 'Not your turn' };

    const moveResult = applyMove(gameState, playerId, tokenId, diceIndex);
    if (!moveResult.success) return moveResult;

    const player = gameState.players.find((p) => p.id === playerId);
    let gameWon = false;

    if (checkWin(player)) {
      gameState.gameOver = true;
      gameState.winner = playerId;
      gameWon = true;
    }

    // Check if turn should advance (all dice used or game won)
    if ((shouldAdvanceTurn(gameState) && !moveResult.bonusMove) || gameWon) {
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
