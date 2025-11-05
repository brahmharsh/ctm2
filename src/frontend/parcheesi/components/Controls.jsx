// /components/Controls.js
'use client';

import { useEffect, useRef, useState } from 'react';
import Dice3D from './Dice3D';

export default function Controls({
  debug,
  pieceColor,
  imageLoaded,
  isRolling,
  players,
  currentPlayer,
  playerId,
  rollDice,
  toggleDebug,
  changeColor,
  gameStarted,
  startGame,
  animatedDice,
  legalMoves,
  onUseDie,
  selectedTokenId,
}) {
  const currentPlayerIndex = players?.findIndex((p) => p.id === playerId) ?? -1;
  const playerNumber = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : 0;
  const isMyTurn = currentPlayer && currentPlayer.id === playerId;

  return (
    <div className="flex flex-col w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            You are:
          </span>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor:
                  pieceColor === 'yellow'
                    ? '#FCD34D'
                    : pieceColor === 'blue'
                    ? '#60A5FA'
                    : pieceColor === 'red'
                    ? '#F87171'
                    : pieceColor === 'green'
                    ? '#4ADE80'
                    : '#D1D5DB',
              }}
            />
            <span className="font-semibold text-gray-800 dark:text-white capitalize">
              {pieceColor || 'Waiting...'}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Player {playerNumber} of {players?.length || 0}
        </div>
      </div>

      <div
        className={`rounded-xl p-4 border-2 transition-all ${
          isMyTurn
            ? 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400'
            : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Current Turn:
          </span>
          <div className="flex items-center space-x-2">
            {isMyTurn && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <span
              className={`font-semibold capitalize ${
                isMyTurn
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {currentPlayer?.color || 'Waiting...'}
            </span>
          </div>
        </div>
        {isMyTurn && (
          <div className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
            🎯 It's your turn!
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-center space-x-4">
          <Dice3D
            isRolling={isRolling}
            values={animatedDice}
            isMyTurn={isMyTurn}
          />
        </div>
        {legalMoves && legalMoves.length > 0 && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-2">
              {selectedTokenId
                ? `Token selected. Choose a die to use:`
                : 'Select a token to move.'}
            </p>
            <div className="flex justify-center space-x-2">
              {animatedDice.map((die, index) => {
                const isUsed = !legalMoves.some(
                  (move) => move.diceIndex === index
                );
                return (
                  <button
                    key={index}
                    onClick={() => onUseDie(selectedTokenId, index)}
                    disabled={isUsed || selectedTokenId === null || !isMyTurn}
                    className={`px-4 py-2 text-lg font-bold rounded-md transition-all ${
                      isUsed
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 line-through'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {die}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {!gameStarted && players?.length >= 2 && (
          <button
            onClick={startGame}
            className="w-full px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl shadow-md hover:bg-green-700 dark:hover:bg-green-600 font-semibold transition-all transform hover:scale-[1.02]"
          >
            🚀 Start Game
          </button>
        )}

        <button
          onClick={rollDice}
          disabled={
            isRolling ||
            !isMyTurn ||
            !gameStarted ||
            (legalMoves && legalMoves.length > 0)
          }
          className={`w-full px-6 py-3 rounded-xl shadow-md font-semibold transition-all transform ${
            isRolling ||
            !isMyTurn ||
            !gameStarted ||
            (legalMoves && legalMoves.length > 0)
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:scale-[1.02]'
          }`}
        >
          {isRolling
            ? '🎲 Rolling...'
            : !isMyTurn
            ? `⌛ ${currentPlayer?.id}'s Turn`
            : legalMoves && legalMoves.length > 0
            ? 'Use dice first'
            : '🎲 Roll Dice'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleDebug}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-xl shadow-md hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition-all"
          >
            {debug ? '🔍 Hide' : '🔍 Debug'}
          </button>
          <div className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-gray-400 dark:text-gray-500 rounded-xl text-sm font-medium text-center">
            Auto Turn
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Players in game:
          </span>
          <span className="font-semibold text-gray-800 dark:text-white">
            {players?.length || 0}/4
          </span>
        </div>
        {!imageLoaded && (
          <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            Loading avatar image...
          </p>
        )}
      </div>
    </div>
  );
}
