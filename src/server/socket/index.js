// Aggregate and register all Socket.IO handlers
import { logger } from "../../shared/logging/logger.js";
import { registerGameHandlers } from "./handlers/gameHandlers.js";
import { roomService } from "../../core/parcheesi/services/roomService.js";

export function registerSocketHandlers(io) {
  logger.info("Registering Socket.IO handlers");
  io.on("connection", (socket) => {
    logger.info("Client connected", { socketId: socket.id });

    // Register grouped handlers
    registerGameHandlers(io, socket);

    socket.on("disconnect", () => {
      try {
        const roomId = roomService.getRoomIdBySocket(socket.id);
        const playerId = roomService.getPlayerIdBySocket(socket.id);
        if (roomId) {
          const result = roomService.leaveRoom(socket.id);
          if (result.success) {
            io.to(roomId).emit("player:left", {
              playerId,
              remainingPlayers: result.remainingPlayers,
            });
            logger.info("Player disconnected", { roomId, playerId });
          }
        } else {
          logger.info("Client disconnected (not in room)", {
            socketId: socket.id,
          });
        }
      } catch (error) {
        logger.error("disconnect handler error", { error: error.message });
      }
    });
  });
}
