// Game Rooms Manager
// KISS: In-memory Map for multiple concurrent game rooms
// FUTURE: Replace Map with Redis for horizontal scaling

import { createGameState } from './rules.js';
import { logger } from '../api/logger.js';

// In-memory storage (REDIS INTEGRATION POINT #1)
// FUTURE: Replace with Redis hash operations
// - rooms Map → Redis HSET game:rooms
// - playerToRoom Map → Redis HSET player:rooms
const rooms = new Map(); // roomId → { gameState, players: Set, createdAt }
const playerToRoom = new Map(); // socketId → roomId
const socketToPlayer = new Map(); // socketId → playerId

/**
 * Create a new game room
 * @param {string} roomId - Unique room identifier
 * @returns {Object} Room creation result
 */
export function createRoom(roomId) {
  if (rooms.has(roomId)) {
    return { success: false, error: 'Room already exists' };
  }

  const room = {
    id: roomId,
    gameState: null, // Will be initialized when game starts
    players: new Set(), // Set of { socketId, playerId }
    createdAt: Date.now(),
    startedAt: null,
  };

  rooms.set(roomId, room);
  logger.info('Room created', { roomId });

  return { success: true, roomId };
}

/**
 * Join a player to a room
 * @param {string} roomId - Room to join
 * @param {string} socketId - Socket connection ID
 * @param {string} playerId - Player identifier (player_1, player_2, etc.)
 * @returns {Object} Join result
 */
export function joinRoom(roomId, socketId, playerId) {
  let room = rooms.get(roomId);

  // Auto-create room if it doesn't exist (KISS approach)
  if (!room) {
    const result = createRoom(roomId);
    if (!result.success) return result;
    room = rooms.get(roomId);
  }

  // Check if game already started
  if (room.gameState && room.gameState.gameStarted) {
    return { success: false, error: 'Game already in progress' };
  }

  // Check room capacity
  if (room.players.size >= 4) {
    return { success: false, error: 'Room is full' };
  }

  // Check if player already in room
  const playerInRoom = Array.from(room.players).some(p => p.playerId === playerId);
  if (playerInRoom) {
    return { success: false, error: 'Player already in room' };
  }

  // Add player to room
  room.players.add({ socketId, playerId });
  playerToRoom.set(socketId, roomId);
  socketToPlayer.set(socketId, playerId);

  logger.info('Player joined room', {
    roomId,
    playerId,
    playerCount: room.players.size,
  });

  return {
    success: true,
    roomId,
    playerId,
    playerCount: room.players.size,
    players: Array.from(room.players).map(p => p.playerId),
  };
}

/**
 * Start a game in a room
 * @param {string} roomId - Room to start
 * @returns {Object} Start result
 */
export function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.players.size < 2) {
    return { success: false, error: 'Need at least 2 players' };
  }

  if (room.gameState && room.gameState.gameStarted) {
    return { success: false, error: 'Game already started' };
  }

  // Initialize game state with players
  const playerIds = Array.from(room.players).map(p => p.playerId);
  room.gameState = createGameState(playerIds);
  room.gameState.gameStarted = true;
  room.startedAt = Date.now();

  logger.info('Game started', {
    roomId,
    playerCount: playerIds.length,
    players: playerIds,
  });

  return {
    success: true,
    gameState: room.gameState,
  };
}

/**
 * Get current game state for a room
 * @param {string} roomId - Room identifier
 * @returns {Object|null} Game state or null
 */
export function getGameState(roomId) {
  const room = rooms.get(roomId);
  return room ? room.gameState : null;
}

/**
 * Update game state (used after moves, captures, etc.)
 * @param {string} roomId - Room identifier
 * @param {Object} gameState - New game state
 * @returns {boolean} Success status
 */
export function updateGameState(roomId, gameState) {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.gameState = gameState;

  // REDIS INTEGRATION POINT #2
  // FUTURE: Persist to Redis
  // await redis.hset(`game:${roomId}`, 'state', JSON.stringify(gameState));

  return true;
}

/**
 * Remove a player from their room
 * @param {string} socketId - Socket connection ID
 * @returns {Object} Leave result
 */
export function leaveRoom(socketId) {
  const roomId = playerToRoom.get(socketId);
  if (!roomId) {
    return { success: false, error: 'Not in any room' };
  }

  const room = rooms.get(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  const playerId = socketToPlayer.get(socketId);

  // Remove player from room
  room.players = new Set(
    Array.from(room.players).filter(p => p.socketId !== socketId)
  );

  playerToRoom.delete(socketId);
  socketToPlayer.delete(socketId);

  logger.info('Player left room', {
    roomId,
    playerId,
    remainingPlayers: room.players.size,
  });

  // Clean up empty rooms
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
}

/**
 * Get room ID for a socket
 * @param {string} socketId - Socket connection ID
 * @returns {string|null} Room ID or null
 */
export function getRoomIdBySocket(socketId) {
  return playerToRoom.get(socketId) || null;
}

/**
 * Get player ID for a socket
 * @param {string} socketId - Socket connection ID
 * @returns {string|null} Player ID or null
 */
export function getPlayerIdBySocket(socketId) {
  return socketToPlayer.get(socketId) || null;
}

/**
 * Get all socket IDs in a room
 * @param {string} roomId - Room identifier
 * @returns {string[]} Array of socket IDs
 */
export function getSocketsInRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players).map(p => p.socketId);
}

/**
 * Get room info (for debugging/admin)
 * @param {string} roomId - Room identifier
 * @returns {Object|null} Room information
 */
export function getRoomInfo(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  return {
    id: room.id,
    playerCount: room.players.size,
    players: Array.from(room.players).map(p => p.playerId),
    gameStarted: room.gameState?.gameStarted || false,
    gameOver: room.gameState?.gameOver || false,
    winner: room.gameState?.winner || null,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
  };
}

/**
 * List all active rooms (for debugging/admin)
 * @returns {Array} Array of room info objects
 */
export function listRooms() {
  return Array.from(rooms.keys()).map(roomId => getRoomInfo(roomId));
}

// REDIS MIGRATION GUIDE:
// 1. Replace rooms Map with Redis hash operations:
//    - CREATE: HSET game:rooms {roomId} {roomData}
//    - READ: HGET game:rooms {roomId}
//    - DELETE: HDEL game:rooms {roomId}
//
// 2. Replace playerToRoom/socketToPlayer Maps:
//    - SET player:{socketId}:room {roomId}
//    - SET player:{socketId}:id {playerId}
//
// 3. Add Redis pub/sub for cross-server sync:
//    - PUBLISH game:updates {roomId}:{event}
//    - SUBSCRIBE game:updates
//
// 4. Use Redis TTL for room cleanup:
//    - EXPIRE game:rooms:{roomId} 3600
