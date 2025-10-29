"use client";

import { useState, useEffect } from "react";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import Game from "./components/Game";
import {
  initSocket,
  joinGame,
  onRoomUpdate,
  onGameStarted,
} from "@/client/ludo/client";

export default function Page() {
  const [gameState, setGameState] = useState("lobby"); // 'lobby' | 'waiting' | 'playing'
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [players, setPlayers] = useState([]);
  const [requiredPlayers, setRequiredPlayers] = useState(2);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Subscribe to room updates
    const unsubscribeRoom = onRoomUpdate((data) => {
      console.log("[Room Update]", data);
      setPlayers(data.players.map((id) => ({ id })));

      // Auto-start game when all players joined
      if (data.players.length === requiredPlayers && gameState === "waiting") {
        console.log("[Auto-start] All players joined, transitioning to game");
        // Game will start via socket event
      }
    });

    // Subscribe to game started event
    const unsubscribeGameStarted = onGameStarted((data) => {
      console.log("[Game Started]", data);
      setGameState("playing");
    });

    return () => {
      unsubscribeRoom();
      unsubscribeGameStarted();
    };
  }, [requiredPlayers, gameState]);

  const handleCreateRoom = (playerCount) => {
    const newRoomId = generateRoomId();
    const newPlayerId = `player_${Date.now()}`;

    setRoomId(newRoomId);
    setPlayerId(newPlayerId);
    setRequiredPlayers(playerCount);
    setIsHost(true);

    // Join the room via WebSocket
    joinGame(newRoomId, newPlayerId, playerCount, (err, data) => {
      if (err) {
        console.error("[Join Error]", err);
        alert("Failed to create room: " + err.message);
        setGameState("lobby");
        return;
      }
      console.log("[Room Created]", data);
      setGameState("waiting");
    });
  };

  const handleJoinRoom = (enteredRoomId) => {
    const newPlayerId = `player_${Date.now()}`;

    setRoomId(enteredRoomId);
    setPlayerId(newPlayerId);
    setIsHost(false);

    // Join the room via WebSocket
    joinGame(enteredRoomId, newPlayerId, null, (err, data) => {
      if (err) {
        console.error("[Join Error]", err);
        alert("Failed to join room: " + err.message);
        return;
      }
      console.log("[Room Joined]", data);
      setRequiredPlayers(data.requiredPlayers || 2);
      setGameState("waiting");
    });
  };

  const handleLeaveRoom = () => {
    setGameState("lobby");
    setRoomId("");
    setPlayerId("");
    setPlayers([]);
    setIsHost(false);
  };

  // Render based on game state
  return (
    <>
      {gameState === "lobby" && (
        <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}
      {gameState === "waiting" && (
        <WaitingRoom
          roomId={roomId}
          players={players}
          requiredPlayers={requiredPlayers}
          isHost={isHost}
          onLeave={handleLeaveRoom}
        />
      )}
      {gameState === "playing" && <Game roomId={roomId} playerId={playerId} />}
    </>
  );
}

function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
