// Client-side Socket.IO service
// KISS: Simple wrapper for WebSocket game events
// Use alongside existing REST APIs (both share gameStore on server)

"use client";

import { io } from 'socket.io-client';

// Socket.IO now runs on same port as Next.js (3000)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket = null;

/**
 * Initialize Socket.IO connection
 * @returns {Object} Socket instance
 */
export function initSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });

  return socket;
}

/**
 * Get current socket instance
 * @returns {Object|null} Socket instance or null
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a game room
 * @param {string} roomId - Room identifier
 * @param {string} playerId - Player identifier (player_1, player_2, etc.)
 * @param {Function} callback - Callback for join result
 */
export function joinGame(roomId, playerId, callback) {
  const s = initSocket();

  s.emit('game:join', { roomId, playerId });

  s.once('game:joined', (data) => {
    console.log('[Socket] Joined game:', data);
    if (callback) callback(null, data);
  });

  s.once('error', (error) => {
    console.error('[Socket] Join failed:', error);
    if (callback) callback(error, null);
  });
}

/**
 * Start the game in current room
 * @param {Function} callback - Callback for start result
 */
export function startGame(callback) {
  const s = getSocket();
  if (!s) {
    console.error('[Socket] Not connected');
    return;
  }

  s.emit('game:start', {});

  s.once('game:started', (data) => {
    console.log('[Socket] Game started:', data);
    if (callback) callback(null, data);
  });

  s.once('error', (error) => {
    console.error('[Socket] Start failed:', error);
    if (callback) callback(error, null);
  });
}

/**
 * Roll dice (server generates random values)
 * @param {Function} callback - Callback for roll result
 */
export function rollDice(callback) {
  const s = getSocket();
  if (!s) {
    console.error('[Socket] Not connected');
    return;
  }

  s.emit('roll:dice', {});

  s.once('roll:result', (data) => {
    console.log('[Socket] Dice rolled:', data);
    if (callback) callback(null, data);
  });

  s.once('error', (error) => {
    console.error('[Socket] Roll failed:', error);
    if (callback) callback(error, null);
  });
}

/**
 * Move a token to a new position
 * @param {number} tokenId - Token ID to move
 * @param {number} newPosition - Target position
 * @param {Function} callback - Callback for move result
 */
export function moveToken(tokenId, newPosition, callback) {
  const s = getSocket();
  if (!s) {
    console.error('[Socket] Not connected');
    return;
  }

  s.emit('move:token', { tokenId, newPosition });

  s.once('move:result', (data) => {
    console.log('[Socket] Token moved:', data);
    if (callback) callback(null, data);
  });

  s.once('error', (error) => {
    console.error('[Socket] Move failed:', error);
    if (callback) callback(error, null);
  });
}

/**
 * Request current game state
 */
export function requestGameState() {
  const s = getSocket();
  if (!s) {
    console.error('[Socket] Not connected');
    return;
  }

  s.emit('get:state', {});
}

/**
 * Subscribe to game state updates
 * @param {Function} callback - Callback for state updates
 * @returns {Function} Unsubscribe function
 */
export function onStateUpdate(callback) {
  const s = getSocket();
  if (!s) return () => {};

  s.on('update:state', (data) => {
    console.log('[Socket] State updated:', data);
    if (callback) callback(data);
  });

  return () => s.off('update:state', callback);
}

/**
 * Subscribe to turn end events
 * @param {Function} callback - Callback for turn end
 * @returns {Function} Unsubscribe function
 */
export function onTurnEnd(callback) {
  const s = getSocket();
  if (!s) return () => {};

  s.on('turn:end', (data) => {
    console.log('[Socket] Turn ended:', data);
    if (callback) callback(data);
  });

  return () => s.off('turn:end', callback);
}

/**
 * Subscribe to game win events
 * @param {Function} callback - Callback for game win
 * @returns {Function} Unsubscribe function
 */
export function onGameWin(callback) {
  const s = getSocket();
  if (!s) return () => {};

  s.on('game:win', (data) => {
    console.log('[Socket] Game won:', data);
    if (callback) callback(data);
  });

  return () => s.off('game:win', callback);
}

/**
 * Subscribe to room updates (player join/leave)
 * @param {Function} callback - Callback for room updates
 * @returns {Function} Unsubscribe function
 */
export function onRoomUpdate(callback) {
  const s = getSocket();
  if (!s) return () => {};

  s.on('room:update', (data) => {
    console.log('[Socket] Room updated:', data);
    if (callback) callback(data);
  });

  return () => s.off('room:update', callback);
}

/**
 * Subscribe to player left events
 * @param {Function} callback - Callback for player left
 * @returns {Function} Unsubscribe function
 */
export function onPlayerLeft(callback) {
  const s = getSocket();
  if (!s) return () => {};

  s.on('player:left', (data) => {
    console.log('[Socket] Player left:', data);
    if (callback) callback(data);
  });

  return () => s.off('player:left', callback);
}

// Example usage (plain JS):
/*
import {
  initSocket,
  joinGame,
  rollDice,
  moveToken,
  onStateUpdate,
  onGameWin
} from '@/lib/socket/client';

// Initialize connection
initSocket();

// Join a game
joinGame('room-123', 'player_1', (error, data) => {
  if (error) {
    console.error('Failed to join:', error);
    return;
  }
  console.log('Joined successfully:', data);
});

// Listen for state updates
onStateUpdate((data) => {
  console.log('Game state updated:', data.gameState);
  // Update your UI here
});

// Roll dice
rollDice((error, data) => {
  if (error) {
    console.error('Roll failed:', error);
    return;
  }
  console.log('Rolled:', data.dice);
  console.log('Legal moves:', data.legalMoves);
});

// Move a token
moveToken(0, 15, (error, data) => {
  if (error) {
    console.error('Move failed:', error);
    return;
  }
  console.log('Token moved:', data);
});

// Listen for winner
onGameWin((data) => {
  console.log('Winner:', data.winner);
  alert(`Player ${data.winner} wins!`);
});
*/
