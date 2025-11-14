// Game service orchestrating rule application and turn flow
import {
  rollDice,
  getLegalMoves as rulesGetLegalMoves,
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

  // Expose a read-only helper to compute legal moves from current state
  getLegalMoves(roomId, playerId) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState) return [];
    return rulesGetLegalMoves(gameState, playerId);
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
    console.log('[gameService.rollDice] Generated dice:', { playerId, dice });
    // Update per-player roll statistics
    if (gameState.rollStats && gameState.rollStats[playerId]) {
      const stats = gameState.rollStats[playerId];
      stats.totalRolls += 1;
      stats.totalDice += dice.length;
      dice.forEach((d) => {
        if (stats.faces[d] !== undefined) stats.faces[d] += 1;
      });
      console.log('[gameService.rollDice] Roll stats updated:', {
        playerId,
        totalRolls: stats.totalRolls,
        faces: stats.faces,
      });
    }
    attachPendingDice(gameState, dice);
    const legalMoves = rulesGetLegalMoves(gameState, playerId);
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
      rollStats: gameState.rollStats
        ? gameState.rollStats[playerId]
        : undefined,
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

    // Handle capture bonus (+20 from spec Section 3)
    // Bonus is a separate move that must be handled by the player choosing a token
    // For now, we track it for the UI to prompt the player
    let bonusPending = false;
    if (moveResult.captureBonus && moveResult.captureBonus > 0 && !gameWon) {
      bonusPending = true;
      // Store pending bonus in game state for next move
      gameState.pendingBonus = {
        playerId,
        amount: moveResult.captureBonus,
      };
    }

    // Check if turn should advance
    let turnAdvanced = false;
    const allDiceUsed = moveResult.allDiceUsed;

    // If bonus is pending, don't advance turn - player gets bonus move
    if (bonusPending) {
      // Clear dice for bonus move
      gameState.pendingDice = null;
      gameState.usedDice = [false, false];
    } else if (allDiceUsed && !gameWon) {
      advanceTurn(gameState);
      turnAdvanced = true;
    }

    roomService.updateGameState(roomId, gameState);

    return {
      success: true,
      ...moveResult,
      gameWon,
      gameState,
      turnAdvanced,
      bonusPending,
      nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
    };
  },
};
