// Client-side Socket.IO service (moved to src/client/socket)
'use client';
import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
let socket = null;

export function initSocket() {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', (reason) =>
    console.log('[Socket] Disconnected:', reason)
  );
  socket.on('error', (error) => console.error('[Socket] Error:', error));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinGame(roomId, playerId, requiredPlayers, cb) {
  const s = initSocket();
  s.emit('game:join', { roomId, playerId, requiredPlayers });
  s.once('game:joined', (data) => {
    console.log('[Socket] Joined game:', data);
    cb && cb(null, data);
  });
  s.once('game:error', (error) => {
    const err = error?.message ? new Error(error.message) : error;
    console.error('[Socket] Join failed:', err);
    cb && cb(err, null);
  });
}
export function startGame(cb) {
  const s = getSocket();
  if (!s) return console.error('[Socket] Not connected');
  s.emit('game:start');
  s.once('game:started', (data) => {
    console.log('[Socket] Game started:', data);
    cb && cb(null, data);
  });
  s.once('game:error', (error) => {
    const err = error?.message ? new Error(error.message) : error;
    console.error('[Socket] Start failed:', err);
    cb && cb(err, null);
  });
}
export function rollDice(cb) {
  const s = getSocket();
  if (!s) return console.error('[Socket] Not connected');
  s.emit('roll:dice');
  s.once('roll:result', (data) => {
    console.log('[Socket] Dice rolled:', data);
    cb && cb(null, data);
  });
  s.once('game:error', (error) => {
    const err = error?.message ? new Error(error.message) : error;
    console.error('[Socket] Roll failed:', err);
    cb && cb(err, null);
  });
}
export function moveToken(tokenId, diceIndex, cb) {
  const s = getSocket();
  if (!s) return console.error('[Socket] Not connected');
  s.emit('move:token', { tokenId, diceIndex });
  s.once('move:result', (data) => {
    console.log('[Socket] Token moved:', data);
    cb && cb(null, data);
  });
  s.once('game:error', (error) => {
    console.error('[Socket] Move failed:', error);
    cb && cb(error, null);
  });
}
export function requestGameState() {
  const s = getSocket();
  if (!s) return;
  s.emit('get:state');
}
export function onStateUpdate(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('update:state', (d) => {
    // Reduced logging - only log when dice or turn changes
    if (
      d.gameState?.pendingDice ||
      d.gameState?.currentPlayerIndex !== undefined
    ) {
      console.log('[Socket] State updated');
    }
    cb && cb(d);
  });
  return () => s.off('update:state', cb);
}
export function onTurnEnd(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('turn:end', (d) => {
    console.log('[Socket] Turn ended');
    cb && cb(d);
  });
  return () => s.off('update:state', cb);
}
export function onGameWin(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('game:win', (d) => {
    console.log('[Socket] Game won:', d);
    cb && cb(d);
  });
  return () => s.off('game:win', cb);
}
export function onRoomUpdate(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('room:update', (d) => {
    console.log('[Socket] Room updated:', d);
    cb && cb(d);
  });
  return () => s.off('room:update', cb);
}
export function onPlayerLeft(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('player:left', (d) => {
    console.log('[Socket] Player left:', d);
    cb && cb(d);
  });
  return () => s.off('player:left', cb);
}
export function onGameStarted(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('game:started', (d) => {
    console.log('[Socket] Game started event:', d);
    cb && cb(d);
  });
  return () => s.off('game:started', cb);
}

export function onRollResult(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('roll:result', (d) => {
    console.log('[Socket] Roll result:', d);
    cb && cb(d);
  });
  return () => s.off('roll:result', cb);
}

export function onMoveResult(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('move:result', (d) => {
    console.log('[Socket] Move result:', d);
    cb && cb(d);
  });
  return () => s.off('move:result', cb);
}
