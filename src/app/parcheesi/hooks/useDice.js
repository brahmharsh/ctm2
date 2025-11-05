"use client";
import { useState, useEffect } from "react";
import { rollDice as wsRollDice, startGame as wsStartGame } from "@/client/ludo/client";

export function useDice(playerId, moveToIndexRef, currentPlayer) {
  const [isRolling, setIsRolling] = useState(false);
  const [animatedDice, setAnimatedDice] = useState([1, 1]);
  const [legalMoves, setLegalMoves] = useState([]); // store legal moves
  const [remainingDice, setRemainingDice] = useState(null); // track remaining dice after a move

  const rollDice = () => {
    if (isRolling) {
      console.log('[useDice] Already rolling, ignoring duplicate roll');
      return;
    }
    
    // Only allow rolling if it's the current player's turn
    if (!currentPlayer || currentPlayer.id !== playerId) {
      console.log('[useDice] Not your turn to roll');
      return;
    }

    // Only allow rolling if there are no remaining dice from previous roll
    if (remainingDice && remainingDice.length > 0) {
      console.log("[useDice] Cannot roll - still have remaining dice to use");
      return;
    }

    console.log('[useDice] Starting dice roll...');
    setIsRolling(true);
    setAnimatedDice([1, 1]); // Show rolling animation

    wsRollDice((err, serverData) => {
      if (err) {
        console.error("[useDice] Roll error:", err);
        setIsRolling(false);
        return;
      }

      const { dice, legalMoves: serverLegalMoves, gameState } = serverData || {};
      console.log("[useDice] ✅ Roll result:", { 
        dice, 
        legalMoves: serverLegalMoves,
        pendingDice: gameState?.pendingDice 
      });

      // Update dice display
      setAnimatedDice(dice);
      
      // Store the remaining dice from the server
      setRemainingDice(gameState?.pendingDice || null);

      // Store legal moves for token highlighting
      setLegalMoves(serverLegalMoves || []);

      // Stop rolling animation after a delay
      setTimeout(() => {
        setIsRolling(false);
        
        // If no legal moves, automatically end turn
        if (!serverLegalMoves || serverLegalMoves.length === 0) {
          console.log('[useDice] No legal moves available, ending turn');
          // The server should handle the turn transition
        }
      }, 1500);
    });
  };

  const startGame = () => {
    wsStartGame((err) => {
      if (err) alert("Failed to start game: " + err.message);
    });
  };

  // Reset dice state when the current player changes
  useEffect(() => {
    // Reset dice state when it's a new player's turn
    if (currentPlayer && currentPlayer.id !== playerId) {
      console.log('[useDice] Player turn changed, resetting dice state');
      setAnimatedDice([1, 1]);
      setLegalMoves([]);
      setRemainingDice(null);
      setIsRolling(false);
    }
  }, [currentPlayer, playerId]);

  // Update remaining dice when legal moves change (after a move is made)
  useEffect(() => {
    if (legalMoves.length === 0) {
      // No more legal moves, clear remaining dice
      setRemainingDice(null);
    }
  }, [legalMoves]);

  return { 
    isRolling, 
    rollDice, 
    startGame, 
    animatedDice, 
    legalMoves,
    canRoll: !remainingDice || remainingDice.length === 0
  };
}
