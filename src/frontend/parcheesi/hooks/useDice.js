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

      // Keep isRolling true for animation duration (1500ms to match Dice3D)
      setTimeout(() => {
        setIsRolling(false);
      }, 100);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const rollDice = () => {
    if (isRolling) return;
    if (!currentPlayer || currentPlayer.id !== playerId) {
      console.log('Not your turn to roll dice');
      return;
    }

    console.log('[useDice] Starting roll...');
    setIsRolling(true);

    // Just emit the roll event - the useEffect listener will handle the response
    wsRollDice((err) => {
      if (err) {
        console.error('[useDice] Dice roll error:', err);
        setIsRolling(false);
      }
      // Don't handle success here - let the useEffect onRollResult listener handle it
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
