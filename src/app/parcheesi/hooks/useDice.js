"use client";
import { useState, useEffect } from "react";
import { rollDice as wsRollDice, startGame as wsStartGame } from "@/client/ludo/client";

export function useDice(playerId, moveToIndexRef, currentPlayer) {
  const [isRolling, setIsRolling] = useState(false);
  const [animatedDice, setAnimatedDice] = useState([1, 1]);
  const [legalMoves, setLegalMoves] = useState([]); // store legal moves

  const rollDice = () => {
    if (isRolling) return;
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    setIsRolling(true);
    setAnimatedDice([1, 1]); // placeholder while rolling

    wsRollDice((err, serverData) => {
      if (err) {
        console.error("Dice roll error:", err);
        setIsRolling(false);
        return;
      }

      const { dice, legalMoves: serverLegalMoves } = serverData || {};
      console.log("[useDice] ✅ Final backend dice:", dice);
      console.log("[useDice] 🎯 Legal moves:", serverLegalMoves);

      // 🔹 Animate dice to backend results
      setAnimatedDice(dice);

      // Store legal moves for token highlighting
      setLegalMoves(serverLegalMoves || []);

      // stop rolling after animation completes
      setTimeout(() => {
        setIsRolling(false);
      }, 1500);
    });
  };

  const startGame = () => {
    wsStartGame((err) => {
      if (err) alert("Failed to start game: " + err.message);
    });
  };

  return { isRolling, rollDice, startGame, animatedDice, legalMoves };
}
