// Room service (was part of rooms.js) - manages room membership/lifecycle
import { createGameState } from '#parcheesi/rules.js';
import { logger } from '#shared/logging/logger.js';

// In-memory structures (can be replaced by Redis adapter later)
const rooms = new Map(); // roomId -> room object
const playerToRoom = new Map(); // socketId -> roomId
const socketToPlayer = new Map(); // socketId -> playerId

function ensureRoom(roomId, requiredPlayers = 2) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      gameState: null,
      players: new Set(),
      requiredPlayers: requiredPlayers,
      createdAt: Date.now(),
      startedAt: null,
    });
    logger.info('Room created', { roomId, requiredPlayers });
  }
  return rooms.get(roomId);
}

export const roomService = {
  joinRoom(roomId, socketId, playerId, requiredPlayers = 2) {
    const room = ensureRoom(roomId, requiredPlayers);

    if (room.gameState && room.gameState.gameStarted) {
      return { success: false, error: 'Game already in progress' };
    }
    if (room.players.size >= 4) {
      return { success: false, error: 'Room is full' };
    }
    const already = Array.from(room.players).some(
      (p) => p.playerId === playerId
    );
    if (already) return { success: false, error: 'Player already in room' };

    room.players.add({ socketId, playerId });
    playerToRoom.set(socketId, roomId);
    socketToPlayer.set(socketId, playerId);

    logger.info('Player joined room', {
      roomId,
      playerId,
      playerCount: room.players.size,
    });

    const shouldAutoStart =
      room.players.size === room.requiredPlayers && !room.gameState;

    return {
      success: true,
      roomId,
      playerId,
      playerCount: room.players.size,
      requiredPlayers: room.requiredPlayers,
      players: Array.from(room.players).map((p) => p.playerId),
      shouldAutoStart,
    };
  },
  leaveRoom(socketId) {
    const roomId = playerToRoom.get(socketId);
    if (!roomId) return { success: false, error: 'Not in any room' };
    const room = rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const playerId = socketToPlayer.get(socketId);
    room.players = new Set(
      Array.from(room.players).filter((p) => p.socketId !== socketId)
    );
    playerToRoom.delete(socketId);
    socketToPlayer.delete(socketId);

    logger.info('Player left room', {
      roomId,
      playerId,
      remainingPlayers: room.players.size,
    });

    if (room.players.size === 0) {
      rooms.delete(roomId);
      logger.info('Room deleted (empty)', { roomId });
    }

    return {
      success: true,
      roomId,
      playerId,
      remainingPlayers: room.players.size,
    };
  },
  startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.players.size < 2)
      return { success: false, error: 'Need at least 2 players' };
    if (room.gameState && room.gameState.gameStarted)
      return { success: false, error: 'Game already started' };

    const playerIds = Array.from(room.players).map((p) => p.playerId);
    room.gameState = createGameState(playerIds);
    room.gameState.gameStarted = true;
    room.startedAt = Date.now();

    logger.info('Game started', { roomId, playerCount: playerIds.length });
    return { success: true, gameState: room.gameState };
  },
  getGameState(roomId) {
    const room = rooms.get(roomId);
    return room ? room.gameState : null;
  },
  updateGameState(roomId, gameState) {
    const room = rooms.get(roomId);
    if (!room) return false;
    room.gameState = gameState;
    return true;
  },
  getRoomIdBySocket(socketId) {
    return playerToRoom.get(socketId) || null;
  },
  getPlayerIdBySocket(socketId) {
    return socketToPlayer.get(socketId) || null;
  },
  listRooms() {
    return Array.from(rooms.keys()).map((roomId) => {
      const room = rooms.get(roomId);
      return {
        id: room.id,
        playerCount: room.players.size,
        players: Array.from(room.players).map((p) => p.playerId),
        gameStarted: room.gameState?.gameStarted || false,
        gameOver: room.gameState?.gameOver || false,
        winner: room.gameState?.winner || null,
        createdAt: room.createdAt,
        startedAt: room.startedAt,
      };
    });
  },
};
