'use client';
import { useState, useEffect } from 'react';
import {
  rollDice as wsRollDice,
  startGame as wsStartGame,
  onRollResult,
} from '../services/websocketClient';

export function useDice(playerId, currentPlayer, setAnimatedDice) {
  const [isRolling, setIsRolling] = useState(false);
  const [legalMoves, setLegalMoves] = useState([]); // store legal moves

  const clearLegalMoves = () => setLegalMoves([]);

  const setLegalMovesFromServer = (moves) => {
    if (Array.isArray(moves)) {
      setLegalMoves(moves);
    }
  };

    useEffect(() => {
    const unsubscribe = onRollResult((data) => {
      if (!data?.dice) return;

      console.log('[useDice] 🎲 roll:result received:', data);

      setAnimatedDice(data.dice);

      if (Array.isArray(data.legalMoves)) {
        setLegalMovesFromServer(data.legalMoves);
      }

      setIsRolling(false);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const rollDice = () => {
    if (isRolling) return;
    if (!currentPlayer || currentPlayer.id !== playerId) {
      console.log('Not your turn to roll dice');
      return;
    }

    setIsRolling(true);
    // Do NOT overwrite previous dice with placeholder; keep last settled values until backend result.

    wsRollDice((err, serverData) => {
      if (err) {
        console.error('Dice roll error:', err);
        setIsRolling(false);
        return;
      }

      const { dice, legalMoves: serverLegalMoves } = serverData || {};
      console.log(
        '[useDice] ✅ Final backend dice:',
        dice,
        'Dice[0]:',
        dice?.[0],
        'Dice[1]:',
        dice?.[1]
      );
      console.log('[useDice] 🎯 Legal moves:', serverLegalMoves);

      // 🔹 Animate dice to backend results
      if (Array.isArray(dice) && dice.length === 2) {
        console.log('[useDice] Setting animated dice to:', dice);
        setAnimatedDice(dice);
      } else {
        console.error(
          '[useDice] Invalid dice data (keeping previous faces):',
          dice
        );
        // Do not overwrite existing animatedDice; preserve last valid faces
      }

      // Store legal moves for token highlighting
      setLegalMoves(serverLegalMoves || []);

      // stop rolling after animation completes (matches Dice3D duration)
      setTimeout(() => {
        setIsRolling(false);
      }, 1500);
    });
  };

  const startGame = () => {
    wsStartGame((err) => {
      if (err) alert('Failed to start game: ' + err.message);
    });
  };

  return {
    isRolling,
    rollDice,
    startGame,
    legalMoves,
    clearLegalMoves,
    setLegalMovesFromServer,
  };
}

// 'use client';
// import { useState } from 'react';
// import {
//   rollDice as wsRollDice,
//   startGame as wsStartGame,
// } from '../services/websocketClient';

// export function useDice(playerId, currentPlayer, setAnimatedDice) {
//   const [isRolling, setIsRolling] = useState(false);
//   const [legalMoves, setLegalMoves] = useState([]); // store legal moves

//   const clearLegalMoves = () => setLegalMoves([]);

//   // Allow consumers (useGame) to push updated legal moves from server (e.g., after first die used)
//   const setLegalMovesFromServer = (moves) => {
//     if (Array.isArray(moves)) {
//       setLegalMoves(moves);
//     }
//   };

//   const rollDice = () => {
//     if (isRolling) return;
//     if (!currentPlayer || currentPlayer.id !== playerId) {
//       console.log('Not your turn to roll dice');
//       return;
//     }

//     setIsRolling(true);
//     // Do NOT overwrite previous dice with placeholder; keep last settled values until backend result.

//     wsRollDice((err, serverData) => {
//       if (err) {
//         console.error('Dice roll error:', err);
//         setIsRolling(false);
//         return;
//       }

//       const { dice, legalMoves: serverLegalMoves } = serverData || {};
//       console.log(
//         '[useDice] ✅ Final backend dice:',
//         dice,
//         'Dice[0]:',
//         dice?.[0],
//         'Dice[1]:',
//         dice?.[1]
//       );
//       console.log('[useDice] 🎯 Legal moves:', serverLegalMoves);

//       // 🔹 Animate dice to backend results
//       if (Array.isArray(dice) && dice.length === 2) {
//         console.log('[useDice] Setting animated dice to:', dice);
//         setAnimatedDice(dice);
//       } else {
//         console.error(
//           '[useDice] Invalid dice data (keeping previous faces):',
//           dice
//         );
//         // Do not overwrite existing animatedDice; preserve last valid faces
//       }

//       // Store legal moves for token highlighting
//       setLegalMoves(serverLegalMoves || []);

//       // stop rolling after animation completes (matches Dice3D duration)
//       setTimeout(() => {
//         setIsRolling(false);
//       }, 1500);
//     });
//   };

//   const startGame = () => {
//     wsStartGame((err) => {
//       if (err) alert('Failed to start game: ' + err.message);
//     });
//   };

//   return {
//     isRolling,
//     rollDice,
//     startGame,
//     legalMoves,
//     clearLegalMoves,
//     setLegalMovesFromServer,
//   };
// }
