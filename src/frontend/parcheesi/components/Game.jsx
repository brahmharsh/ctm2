// /components/Game.js
'use client';

import { useGame } from '../hooks/useGame';
import { GAME_RULES } from '../config/constants';
import Controls from './Controls';
import { useEffect, useState } from 'react';

export default function Game({ roomId, playerId }) {
  const [showRulesMobile, setShowRulesMobile] = useState(false);
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
    <div className="relative flex sm:flex-row flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 gap-4 p-4">
      {/* Header with Room and Player info - Positioned between board and controls */}
      <div className="absolute top-4 right-[10rem] flex flex-col gap-2 z-20 hidden lg:flex">
        <div className="px-3 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow">
          Room: {roomId}
        </div>
        <div className="px-3 py-1 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow">
          You: {playerId}
        </div>
      </div>
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

      {/* Game Rules - Left Side */}
      <div className="hidden lg:flex flex-col w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4 self-start">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            📜 Game Rules
          </h3>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 max-h-[70vh] overflow-y-auto">
          <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {GAME_RULES.map((rule, idx) => (
              <li key={idx} className="pl-2">
                {rule}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Mobile Rules Button (shows on smaller screens) */}
      <button
        onClick={() => setShowRulesMobile(!showRulesMobile)}
        className="lg:hidden fixed bottom-4 left-4 z-30 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-semibold text-sm flex items-center gap-2"
      >
        📜 Rules
      </button>

      {/* Mobile Rules Overlay */}
      {showRulesMobile && (
        <div className="lg:hidden fixed inset-0 bg-gray-900/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                📜 Game Rules
              </h3>
              <button
                onClick={() => setShowRulesMobile(false)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {GAME_RULES.map((rule, idx) => (
                  <li key={idx} className="pl-2">
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Canvas - Center */}
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
