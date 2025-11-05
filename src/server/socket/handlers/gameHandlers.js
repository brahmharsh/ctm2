// Socket.IO game-related handlers extracted from previous socket-server.js
// Focus: translate transport events to core services.
import { logger } from "../../../shared/logging/logger.js";
import { roomService } from "../../../core/parcheesi/services/roomService.js";
import { gameService } from "../../../core/parcheesi/services/gameService.js";

export function registerGameHandlers(io, socket) {
  // game:join
  socket.on("game:join", (payload = {}) => {
    try {
      const { roomId, playerId, requiredPlayers } = payload;
      if (!roomId || !playerId) {
        return socket.emit("game:error", {
          message: "Missing roomId or playerId",
          event: "game:join",
        });
      }

      // First join the room without checking game state
      const joinResult = roomService.joinRoom(roomId, socket.id, playerId, requiredPlayers);
      if (!joinResult.success) {
        return socket.emit("game:error", {
          message: joinResult.error,
          event: "game:join",
        });
      }

      // Get the current game state if the game has started
      const gameState = roomService.getGameState(roomId);
      if (gameState?.gameStarted) {
        // If it's not the player's turn, don't prevent them from joining,
        // but do let them know it's not their turn
        if (gameState.currentPlayerIndex !== undefined && 
            gameState.players[gameState.currentPlayerIndex]?.id !== playerId) {
          console.log(`[DEBUG][game:join] Player ${playerId} joining but not their turn`);
          // Don't return an error, just continue with the join process
        }
      }

      socket.join(roomId);
      socket.emit("game:joined", {
        roomId,
        playerId,
        playerCount: joinResult.playerCount,
        requiredPlayers: joinResult.requiredPlayers,
        players: joinResult.players,
      });
      io.to(roomId).emit("room:update", {
        roomId,
        playerCount: joinResult.playerCount,
        requiredPlayers: joinResult.requiredPlayers,
        players: joinResult.players,
      });
      logger.info("Player joined successfully", { roomId, playerId });

      // Auto-start game when all players joined
      if (joinResult.shouldAutoStart) {
        logger.info("Auto-starting game", {
          roomId,
          playerCount: joinResult.playerCount,
        });
        setTimeout(() => {
          const startResult = gameService.startGame(roomId);
          if (startResult.success) {
            io.to(roomId).emit("game:started", {
              gameState: startResult.gameState,
              currentPlayer: startResult.gameState.players[0].id,
            });
            io.to(roomId).emit("update:state", {
              gameState: startResult.gameState,
            });
            logger.info("Game auto-started successfully", { roomId });
          }
        }, 1000); // Small delay for better UX
      }
    } catch (error) {
      logger.error("game:join handler error", { error: error.message });
      socket.emit("game:error", {
        message: "Internal server error",
        event: "game:join",
      });
    }
  });

  // game:start
  socket.on("game:start", () => {
    try {
      const roomId = roomService.getRoomIdBySocket(socket.id);
      if (!roomId)
        return socket.emit("game:error", {
          message: "Not in a room",
          event: "game:start",
        });
      const result = gameService.startGame(roomId);
      if (!result.success) {
        return socket.emit("game:error", {
          message: result.error,
          event: "game:start",
        });
      }
      io.to(roomId).emit("game:started", {
        gameState: result.gameState,
        currentPlayer: result.gameState.players[0].id,
      });
      io.to(roomId).emit("update:state", { gameState: result.gameState });
      logger.info("Game started successfully", { roomId });
    } catch (error) {
      logger.error("game:start handler error", { error: error.message });
      socket.emit("game:error", {
        message: "Internal server error",
        event: "game:start",
      });
    }
  });

// roll:dice
socket.on("roll:dice", () => {
  try {
    const roomId = roomService.getRoomIdBySocket(socket.id);
    const playerId = roomService.getPlayerIdBySocket(socket.id);

    if (!roomId || !playerId) {
      return socket.emit("game:error", {
        message: "Not in a game",
        event: "roll:dice",
      });
    }

    // Generate dice
    const dice1 = Math.ceil(Math.random() * 6);
    const dice2 = Math.ceil(Math.random() * 6);
    const diceArray = [dice1, dice2];


    // Call game logic
    const result = gameService.rollDice(roomId, playerId, diceArray);

    // Debug log for full trace
    console.log(
      "[DEBUG][roll:dice]",
      {
        socketId: socket.id,
        playerId,
        roomId,
        dice: [dice1, dice2],
        legalMoves: result.legalMoves,
        autoAdvanced: result.autoAdvanced,
        nextPlayer: result.nextPlayer,
      }
    );

    if (!result.success) {
      return socket.emit("game:error", {
        message: result.error,
        event: "roll:dice",
      });
    }

    // Emit dice roll to all clients in the room
    io.to(roomId).emit("roll:result", {
      playerId,
      dice: [dice1, dice2], // exact dice sent to clients
      legalMoves: result.legalMoves,
    });

    // Auto-advance turn if needed
    if (result.autoAdvanced) {
      io.to(roomId).emit("turn:end", {
        nextPlayer: result.nextPlayer,
        reason:
          result.legalMoves.length === 0 ? "no_legal_moves" : "auto_advance",
      });
      io.to(roomId).emit("update:state", { gameState: result.gameState });
    }
  } catch (error) {
    logger.error("roll:dice handler error", { error: error.message });
    socket.emit("game:error", {
      message: "Internal server error",
      event: "roll:dice",
    });
  }
});

  // move:token
  socket.on("move:token", (payload = {}) => {
    console.log("\n[DEBUG][move:token] ===== NEW MOVE REQUEST =====");
    console.log("[DEBUG][move:token] Socket:", socket.id);
    console.log("[DEBUG][move:token] Payload:", JSON.stringify(payload, null, 2));
    
    const { tokenId, newPosition } = payload;
    const roomId = roomService.getRoomIdBySocket(socket.id);
    // const playerId = roomService.getPlayerIdBySocket(socket.id);
    const playerId = tokenId.split("-")[0];

    if (!tokenId || !newPosition) {
      return
    }
      
    
    // Basic validation
    if (!roomId || !playerId) {
      const errorMsg = `[DEBUG][move:token] Invalid move - not in a game. Room: ${roomId || 'none'}, Player: ${playerId || 'none'}`;
      console.log(errorMsg);
      return socket.emit("game:error", {
        message: "Not in a game",
        event: "move:token",
        isTurnError: false,
        details: { roomId, playerId }
      });
    }
    
    // Get current game state for logging
    const gameState = roomService.getGameState(roomId);
    console.log(`[DEBUG][move:token] Game state for room ${roomId}:`, {
      currentPlayerIndex: gameState?.currentPlayerIndex,
      currentPlayer: gameState?.players?.[gameState?.currentPlayerIndex]?.id,
      gameStarted: gameState?.gameStarted,
      gameOver: gameState?.gameOver,
      playerCount: gameState?.players?.length
    });
    
    try {
      // Process the move
      const gameState = roomService.getGameState(roomId);

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== playerId) {
        console.log(`[DEBUG][move:token] Move rejected - Not player's turn. Current player: ${currentPlayer.id}, Attempted by: ${playerId}`);
        return;
      }
      
      const result = gameService.moveToken(roomId, playerId, tokenId, newPosition);
      
      // Handle move failure
      if (!result.success) {
        console.log(`[DEBUG][move:token] Move failed for player ${playerId}:`, result.error);
        // Only send error to the player who made the move
        return socket.emit("game:error", {
          message: result.error,
          event: "move:token",
          isTurnError: result.isTurnError,
          currentPlayer: result.currentPlayer
        });
      }
      
      // Log successful move
      console.log(`[DEBUG][move:token] Move successful`, {
        playerId,
        tokenId,
        from: result.from,
        to: result.to,
        nextPlayer: result.nextPlayer,
        legalMoves: result.legalMoves,
        advanced: result.advanced,
        gameWon: result.gameWon
      });

      // Send the move result to the player who made the move
      socket.emit("move:result", {
        playerId,
        tokenId,
        from: result.from,
        to: result.to,
        captured: result.captured,
        bonusMove: result.bonusMove,
        advanced: result.advanced,
        legalMoves: result.legalMoves,
        gameWon: result.gameWon,
        nextPlayer: result.nextPlayer
      });
      
      // Send an opponent move event to all other players in the room
      socket.to(roomId).emit("opponent:move", {
        playerId,
        tokenId,
        from: result.from,
        to: result.to,
        captured: result.captured,
        bonusMove: result.bonusMove,
        advanced: result.advanced,
        gameWon: result.gameWon,
        nextPlayer: result.nextPlayer
      });

      if (result.gameWon) {
        io.to(roomId).emit("game:win", {
          winner: playerId,
          gameState: result.gameState,
        });
      } else {
        io.to(roomId).emit("update:state", { gameState: result.gameState });
        if (result.advanced) {
          io.to(roomId).emit("turn:end", { nextPlayer: result.nextPlayer });
        }
      }
    } catch (error) {
      logger.error("move:token handler error", { error: error.message });
      socket.emit("game:error", {
        message: "Internal server error",
        event: "move:token",
      });
    }
  });

  // get:state
  socket.on("get:state", () => {
    try {
      const roomId = roomService.getRoomIdBySocket(socket.id);
      if (!roomId)
        return socket.emit("game:error", {
          message: "Not in a room",
          event: "get:state",
        });
      const gameState = roomService.getGameState(roomId);
      socket.emit("update:state", { gameState });
    } catch (error) {
      logger.error("get:state handler error", { error: error.message });
      socket.emit("game:error", {
        message: "Internal server error",
        event: "get:state",
      });
    }
  });
}
