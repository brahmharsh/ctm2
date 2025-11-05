// /components/Game.js
'use client';

import { useGame } from '../hooks/useGame';
import Controls from './Controls';
import { useEffect } from 'react';

export default function Game({ roomId, playerId }) {
  const {
    canvasRef,
    diceResultRef,
    debug,
    pieceColor,
    imageLoaded,
    isRolling,
    players,
    currentPlayer,
    gameStarted,
    rollDice,
    toggleDebug,
    changeColor,
    startGame,
    animatedDice,
    legalMoves,
    onUseDie,
    selectedTokenId,
    usedDice,
  } = useGame(roomId, playerId);

  // Debug logging to see what's happening
  useEffect(() => {
    console.log('[Game Component] State:', {
      roomId,
      playerId,
      gameStarted,
      pieceColor,
      playersCount: players.length,
      imageLoaded,
      currentPlayer: currentPlayer?.id,
      animatedDice,
      isRolling,
    });
  }, [
    roomId,
    playerId,
    gameStarted,
    pieceColor,
    players.length,
    imageLoaded,
    currentPlayer,
    animatedDice,
    isRolling,
  ]);

  return (
    <div className="flex sm:flex-row flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 gap-4 p-4">
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-800 dark:text-white font-semibold">
              Initializing game...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Room: {roomId} | Player: {playerId}
            </p>
          </div>
        </div>
      )}
      {!pieceColor && gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <div className="animate-pulse text-4xl mb-4">🎨</div>
            <p className="text-gray-800 dark:text-white font-semibold">
              Assigning colors...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Players: {players.length}
            </p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="bg-white dark:bg-gray-800 w-[100vmin] h-[100vmin] border-2 border-gray-300 dark:border-gray-600 shadow-2xl rounded-2xl"
      />
      <Controls
        diceResultRef={diceResultRef}
        debug={debug}
        pieceColor={pieceColor}
        imageLoaded={imageLoaded}
        isRolling={isRolling}
        players={players}
        currentPlayer={currentPlayer}
        playerId={playerId}
        gameStarted={gameStarted}
        rollDice={rollDice}
        toggleDebug={toggleDebug}
        changeColor={changeColor}
        startGame={startGame}
        animatedDice={animatedDice}
        legalMoves={legalMoves}
        onUseDie={onUseDie}
        selectedTokenId={selectedTokenId}
        usedDice={usedDice}
      />
    </div>
  );
}
