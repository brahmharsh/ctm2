"use client";
import { useState, useEffect } from "react";
import {
  rollDice as wsRollDice,
  startGame as wsStartGame,
} from "@/client/ludo/client";

export function useDice(playerId, moveToIndexRef, currentPlayer) {
  const [isRolling, setIsRolling] = useState(false);
  const [animatedDice, setAnimatedDice] = useState([1, 1]);

  const rollDice = () => {
    if (isRolling) return;
    if (!currentPlayer || currentPlayer.id !== playerId) return; // prevent rolling out of turn

    setIsRolling(true);

    // Start local dice animation immediately
    const tempDice = [1, 1].map(() => Math.ceil(Math.random() * 6));
    setAnimatedDice(tempDice);

    // Ask server for actual dice result
    wsRollDice((err, serverData) => {
      if (err) {
        console.error("Dice roll error:", err);
        setIsRolling(false);
        return;
      }

      console.log("[useDice] Server dice result:", serverData);

      // Extract dice array from server response
      const { dice } = serverData;

      console.log("[useDice]Dice:", dice);
      // Animate dice to match server result
      setAnimatedDice(dice);

      setTimeout(() => {
        setIsRolling(false);

        // Move the piece locally
        if (moveToIndexRef.current) moveToIndexRef.current(dice);
      }, 1500);
    });
  };

  const startGame = () => {
    wsStartGame((err) => {
      if (err) alert("Failed to start game: " + err.message);
    });
  };

  return { isRolling, rollDice, startGame, animatedDice };
}

// // /hooks/useDice.js
// import { useState } from "react";
// import { rollDice as wsRollDice, startGame as wsStartGame } from "@/client/ludo/client";

// export function useDice(playerId, moveToIndexRef) {
//   const [isRolling, setIsRolling] = useState(false);
//   const [diceResult, setDiceResult] = useState([1, 1]);
//   const [animatedDice, setAnimatedDice] = useState([1, 1]);

//   const rollDice = () => {
//     if (isRolling) return;

//     setIsRolling(true);

//     const dice = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
//     setAnimatedDice(dice);

//     setTimeout(() => {
//       setIsRolling(false);
//       setDiceResult(dice);

//       // Move the piece locally
//       // if (moveToIndexRef.current) moveToIndexRef.current(dice);
//         if (moveToIndexRef.current) {
//     console.log("[useDice] Moving piece with dice:", dice);
//     moveToIndexRef.current(dice);
//   } else {
//     console.log("[useDice] moveToIndexRef.current is not set!");
//   }

//       // Send dice roll to server
//       wsRollDice(dice.reduce((a, b) => a + b, 0), (err) => {
//         if (err) console.error("Dice roll error:", err);
//       });
//     }, 1500);
//   };

//   const startGame = () => {
//     wsStartGame((err) => {
//       if (err) alert("Failed to start game: " + err.message);
//     });
//   };

//   return { isRolling, rollDice, startGame, diceResultRef: diceResult, animatedDice };
// }
