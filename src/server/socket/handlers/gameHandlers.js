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

      const result = roomService.joinRoom(
        roomId,
        socket.id,
        playerId,
        requiredPlayers
      );
      if (!result.success) {
        return socket.emit("game:error", {
          message: result.error,
          event: "game:join",
        });
      }

      socket.join(roomId);
      socket.emit("game:joined", {
        roomId,
        playerId,
        playerCount: result.playerCount,
        requiredPlayers: result.requiredPlayers,
        players: result.players,
      });
      io.to(roomId).emit("room:update", {
        roomId,
        playerCount: result.playerCount,
        requiredPlayers: result.requiredPlayers,
        players: result.players,
      });
      logger.info("Player joined successfully", { roomId, playerId });

      // Auto-start game when all players joined
      if (result.shouldAutoStart) {
        logger.info("Auto-starting game", {
          roomId,
          playerCount: result.playerCount,
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
      if (!roomId || !playerId)
        return socket.emit("game:error", {
          message: "Not in a game",
          event: "roll:dice",
        });

      // Generate two dice instead of one
      const dice1 = Math.ceil(Math.random() * 6);
      const dice2 = Math.ceil(Math.random() * 6);
      // Update game logic to handle two dice in your service
      const result = gameService.rollDice(roomId, playerId, [dice1, dice2]);
      // Ensure gameService.rollDice can accept array of dice now

      if (!result.success)
        return socket.emit("game:error", {
          message: result.error,
          event: "roll:dice",
        });

      io.to(roomId).emit("roll:result", {
        playerId,
        dice: [dice1, dice2], // send both dice to all clients
        legalMoves: result.legalMoves,
      });

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
    try {
      const { tokenId, newPosition } = payload;
      const roomId = roomService.getRoomIdBySocket(socket.id);
      const playerId = roomService.getPlayerIdBySocket(socket.id);
      if (!roomId || !playerId)
        return socket.emit("game:error", {
          message: "Not in a game",
          event: "move:token",
        });
      const result = gameService.moveToken(
        roomId,
        playerId,
        tokenId,
        newPosition
      );
      if (!result.success)
        return socket.emit("game:error", {
          message: result.error,
          event: "move:token",
        });

      io.to(roomId).emit("move:result", {
        playerId,
        tokenId,
        from: result.from,
        to: result.to,
        captured: result.captured,
        bonusMove: result.bonusMove,
      });

      if (result.gameWon) {
        io.to(roomId).emit("game:win", {
          winner: playerId,
          gameState: result.gameState,
        });
      } else {
        io.to(roomId).emit("update:state", { gameState: result.gameState });
        io.to(roomId).emit("turn:end", { nextPlayer: result.nextPlayer });
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
