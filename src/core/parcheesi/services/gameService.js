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
  rollDice(roomId, playerId, diceArray) {
    const gameState = roomService.getGameState(roomId);
    if (!gameState || !gameState.gameStarted)
      return { success: false, error: "Game not started" };
    if (gameState.gameOver) return { success: false, error: "Game is over" };
    if (!isPlayerTurn(gameState, playerId))
      return { success: false, error: "Not your turn" };

    // Generate two dice
    // const dice1 = rollDice();
    // const dice2 = rollDice();
    // const dice = [dice1, dice2];

    attachPendingDice(gameState, diceArray);

    const legalMoves = getLegalMoves(gameState, playerId, diceArray);

    let autoAdvanced = false;
    if (legalMoves.length === 0) {
      // No legal moves: keep turn with current player but update state so clients know there are no moves
      roomService.updateGameState(roomId, gameState);
      autoAdvanced = false;
    } else {
      // Keep the turn with the roller so they can emit move:token; do not clear pendingDice here
      // The moveToken handler will apply the move and advance the turn accordingly
      roomService.updateGameState(roomId, gameState);
      autoAdvanced = false;
    }

    return {
      success: true,
      dice: diceArray, // now an array of two dice
      legalMoves,
      autoAdvanced,
      gameState,
      nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
    };
  },
  moveToken(roomId, playerId, tokenId, newPosition) {
    console.log(`[gameService] Starting moveToken for player ${playerId}, token ${tokenId}, position ${newPosition}`);
    
    const gameState = roomService.getGameState(roomId);
    
    // Log full game state for debugging
    console.log('[gameService] Current game state:', {
      roomId,
      gameStarted: gameState?.gameStarted,
      gameOver: gameState?.gameOver,
      currentPlayerIndex: gameState?.currentPlayerIndex,
      players: gameState?.players?.map(p => ({
        id: p.id,
        color: p.color,
        tokens: p.tokens
      })),
      pendingDice: gameState?.pendingDice
    });
    
    if (!gameState || !gameState.gameStarted || gameState.gameOver) {
      const errorMsg = !gameState ? 'No game state found' : 
                     !gameState.gameStarted ? 'Game not started' : 'Game over';
      console.log(`[gameService] Invalid game state: ${errorMsg}`);
      return { 
        success: false, 
        error: `Invalid game state: ${errorMsg}`,
        isTurnError: false
      };
    }
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isTurn = isPlayerTurn(gameState, playerId);
    
    console.log(`[gameService] Player ${playerId} turn check: ${isTurn ? 'YES' : 'NO'}`);
    console.log(`[gameService] Current player: ${currentPlayer?.id || 'none'}, Player index: ${gameState.currentPlayerIndex}`);
    
    // Check if it's the player's turn
    if (!isTurn) {
      const currentPlayerId = currentPlayer?.id || 'none';
      console.log(`[gameService] Move rejected - Not player's turn. Current player: ${currentPlayerId}, Attempted by: ${playerId}`);
      
      // Log all players for debugging
      console.log('[gameService] All players:', gameState.players.map((p, idx) => ({
        index: idx,
        id: p.id,
        isCurrent: idx === gameState.currentPlayerIndex
      })));
      
      return { 
        success: false, 
        error: `Not your turn. Current player: ${currentPlayerId}`,
        currentPlayer: currentPlayerId,
        isTurnError: true
      };
    }

    const moveResult = applyMove(gameState, playerId, tokenId, newPosition);
    if (!moveResult.success) return moveResult;

    const player = gameState.players.find((p) => p.id === playerId);
    let gameWon = false;
    if (checkWin(player)) {
      gameState.gameOver = true;
      gameState.winner = playerId;
      gameWon = true;
    }

    // Decide whether to advance turn now
    const hasPendingDice = Array.isArray(gameState.pendingDice)
      ? gameState.pendingDice.length > 0
      : !!gameState.pendingDice;
    let advanced = false;
    let nextLegalMoves = [];

    if (!moveResult.bonusMove && !gameWon && !hasPendingDice) {
      advanceTurn(gameState);
      advanced = true;
    } else if (hasPendingDice) {
      // Compute next legal moves for remaining dice for the same player
      nextLegalMoves = getLegalMoves(gameState, playerId, gameState.pendingDice);
    }

    roomService.updateGameState(roomId, gameState);
    return {
      success: true,
      ...moveResult,
      gameWon,
      advanced,
      legalMoves: nextLegalMoves,
      gameState,
      nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
    };
  },
};
