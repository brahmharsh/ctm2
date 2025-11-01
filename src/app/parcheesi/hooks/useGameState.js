// /hooks/useGameState.js
import { useEffect, useState, useRef } from "react";
import {
  onStateUpdate,
  onTurnEnd,
  onRoomUpdate,
  requestGameState,
} from "@/client/ludo/client";

export function useGameState(initialRoomId, playerId, setPieceColor) {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Keep a ref to players to avoid stale closures in callbacks
  const playersRef = useRef([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    let unsubState = () => {};
    let unsubTurn = () => {};
    let unsubRoom = () => {};

    const init = async () => {
      try {
        // Listen for room updates (players joining/leaving)
        unsubRoom = onRoomUpdate((data) => {
          setPlayers((prev) => {
            if (prev.length && prev.every((p) => p.id)) {
              const idToPlayer = Object.fromEntries(prev.map((p) => [p.id, p]));
              return data.players.map(
                (pid) => idToPlayer[pid] || { id: pid, color: "unknown" }
              );
            }
            return data.players.map((pid) => ({ id: pid, color: "unknown" }));
          });
        });

        // Listen for full game state updates
        unsubState = onStateUpdate((data) => {
          if (!data?.gameState) return;
          const gs = data.gameState;

          // Update players list
          setPlayers(gs.players);

          // Set current player based on index
          if (gs.currentPlayerIndex != null && gs.players[gs.currentPlayerIndex]) {
            setCurrentPlayer(gs.players[gs.currentPlayerIndex]);
          }

          setGameStarted(gs.gameStarted);

          // Set this player's color
          const player = gs.players.find((p) => p.id === playerId);
          if (player?.color) setPieceColor(player.color);
        });

        // Listen for turn end events
        unsubTurn = onTurnEnd((data) => {
          if (data?.nextPlayer) {
            const nextPlayer = playersRef.current.find((p) => p.id === data.nextPlayer);
            if (nextPlayer) setCurrentPlayer(nextPlayer);
          }
        });

        // Request initial game state
        requestGameState();
      } catch (err) {
        console.error("[useGameState] Error initializing", err);
      }
    };

    init();

    return () => {
      unsubState();
      unsubTurn();
      unsubRoom();
    };
  }, [playerId, setPieceColor]);

  return { players, currentPlayer, gameStarted };
}
