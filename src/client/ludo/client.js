// Client-side Socket.IO service (moved to src/client/socket)
"use client";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
let socket = null;

export function initSocket() {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => console.log("[Socket] Connected:", socket.id));
  socket.on("disconnect", (reason) =>
    console.log("[Socket] Disconnected:", reason)
  );
  socket.on("error", (error) => console.error("[Socket] Error:", error));
  socket.on("game:error", (error) =>
    console.error("[Socket] Game Error:", error)
  );

  return socket;
}
export function onMoveResult(cb) {
  const s = getSocket();
  if (!s) return () => {};
  
  const handler = (d) => {
    console.log("[Socket] Move result for current player:", d);
    cb && cb(d);
  };
  
  s.on("move:result", handler);
  return () => s.off("move:result", handler);
}

export function onOpponentMove(cb) {
  const s = getSocket();
  if (!s) return () => {};
  
  const handler = (d) => {
    console.log("[Socket] Opponent move result:", d);
    cb && cb(d);
  };
  
  s.on("opponent:move", handler);
  return () => s.off("opponent:move", handler);
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
  s.emit("game:join", { roomId, playerId, requiredPlayers });
  s.once("game:joined", (data) => {
    console.log("[Socket] Joined game:", data);
    cb && cb(null, data);
  });
  s.once("game:error", (error) => {
    console.error("[Socket] Join failed:", error);
    cb && cb(error, null);
  });
}
export function startGame(cb) {
  const s = getSocket();
  if (!s) return console.error("[Socket] Not connected");
  s.emit("game:start");
  s.once("game:started", (data) => {
    console.log("[Socket] Game started:", data);
    cb && cb(null, data);
  });
  s.once("game:error", (error) => {
    console.error("[Socket] Start failed:", error);
    cb && cb(error, null);
  });
}
export function rollDice(cb) {
  const s = getSocket();
  console.log("[Frontend] Using socket ID:", s.id);
  if (!s) return console.error("[Socket] Not connected");
  
  // Remove any existing listeners to prevent duplicates
  s.off("roll:result");
  s.off("game:error");
  
  // Set up the event listeners first
  const onRollResult = (data) => {
    console.log("[Socket] Dice rolled:", data.dice);
    // Clean up the listeners
    s.off("roll:result", onRollResult);
    s.off("game:error", onError);
    cb && cb(null, data);
  };
  
  const onError = (error) => {
    console.error("[Socket] Roll failed:", error);
    // Clean up the listeners
    s.off("roll:result", onRollResult);
    s.off("game:error", onError);
    cb && cb(error, null);
  };
  
  // Register the event listeners
  s.once("roll:result", onRollResult);
  s.once("game:error", onError);
  
  // Emit the roll event
  s.emit("roll:dice");
}
export function moveToken(tokenId, newPosition, cb) {
  const s = getSocket();
  if (!s) {
    console.error("[Socket] Not connected");
    return cb && cb(new Error("Not connected to server"), null);
  }
  
  console.log("[Frontend] Move token request:", { tokenId, newPosition });
  
  // Remove any existing move listeners to prevent duplicates
  s.off("move:result");
  s.off("game:error");
  
  // Set up the move result handler
  const onMoveResult = (data) => {
    console.log("[Socket] Move successful:", data);
    // Clean up the listeners
    s.off("move:result", onMoveResult);
    s.off("game:error", onMoveError);
    cb && cb(null, data);
  };
  
  // Set up the error handler
  const onMoveError = (error) => {
    console.error("[Socket] Move failed:", error);
    // Clean up the listeners
    s.off("move:result", onMoveResult);
    s.off("game:error", onMoveError);
    cb && cb(error, null);
  };
  
  // Register the event listeners
  s.once("move:result", onMoveResult);
  s.once("game:error", onMoveError);
  
  // Emit the move event
  s.emit("move:token", { tokenId, newPosition });
}
export function requestGameState() {
  const s = getSocket();
  if (!s) return;
  s.emit("get:state");
}
export function onStateUpdate(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("update:state", (d) => {
    console.log("[Socket] State updated:", d);
    cb && cb(d);
  });
  return () => s.off("update:state", cb);
}
export function onTurnEnd(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("turn:end", (d) => {
    console.log("[Socket] Turn ended:", d);
    cb && cb(d);
  });
  return () => s.off("turn:end", cb);
}
export function onGameWin(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("game:win", (d) => {
    console.log("[Socket] Game won:", d);
    cb && cb(d);
  });
  return () => s.off("game:win", cb);
}
export function onRoomUpdate(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("room:update", (d) => {
    console.log("[Socket] Room updated:", d);
    cb && cb(d);
  });
  return () => s.off("room:update", cb);
}
export function onPlayerLeft(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("player:left", (d) => {
    console.log("[Socket] Player left:", d);
    cb && cb(d);
  });
  return () => s.off("player:left", cb);
}
export function onGameStarted(cb) {
  const s = getSocket();
  if (!s) return () => {};
  s.on("game:started", (d) => {
    console.log("[Socket] Game started event:", d);
    cb && cb(d);
  });
  return () => s.off("game:started", cb);
}
