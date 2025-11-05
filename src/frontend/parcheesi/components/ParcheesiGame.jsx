// Main game component integrating canvas, dice, and game state
'use client';
import { useParcheesiGame } from '../hooks/useParcheesiGame.js';
import { useBoardCanvas } from '../hooks/useBoardCanvas.js';
import Dice from './Dice.jsx';
import Lobby from './Lobby.jsx';
import WaitingRoom from './WaitingRoom.jsx';

export default function ParcheesiGame() {
  const {
    phase,
    roomId,
    playerId,
    requiredPlayers,
    players,
    currentPlayer,
    pieceColor,
    isRolling,
    diceValues,
    usedDice,
    gameState,
    selectedToken,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    rollDice,
    handleTokenClick,
    handleDiceSelect,
    setRequiredPlayers,
  } = useParcheesiGame();

  const { canvasRef } = useBoardCanvas({
    players,
    pieceColor,
    phase,
    gameState,
    onTokenClick: handleTokenClick,
  });

  const isMyTurn = currentPlayer?.id === playerId;

  if (phase === 'lobby') {
    return (
      <Lobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        requiredPlayers={requiredPlayers}
        setRequiredPlayers={setRequiredPlayers}
      />
    );
  }

  if (phase === 'waiting') {
    return (
      <WaitingRoom
        roomId={roomId}
        playerId={playerId}
        players={players}
        requiredPlayers={requiredPlayers}
        onStartGame={startGame}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 gap-6 p-4">
      {/* Board Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-white dark:bg-gray-800 w-[90vmin] h-[90vmin] max-w-[600px] max-h-[600px] border-2 border-gray-300 dark:border-gray-600 shadow-2xl rounded-2xl cursor-pointer"
        />
        {selectedToken && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Token selected: {selectedToken.id}
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Player Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Game Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Room:</span>
              <span className="font-mono font-semibold text-gray-800 dark:text-white">
                {roomId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">You are:</span>
              <span
                className="font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: pieceColor ? `${pieceColor}` : 'transparent',
                  color: 'white',
                }}
              >
                {pieceColor || 'Waiting...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Current Turn:
              </span>
              <span
                className={`font-semibold ${
                  isMyTurn ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {isMyTurn ? 'YOUR TURN' : currentPlayer?.color || '...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Players:</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {players.length}/{requiredPlayers}
              </span>
            </div>
          </div>
        </div>

        {/* Dice Component */}
        <Dice
          onRoll={rollDice}
          isMyTurn={isMyTurn}
          isRolling={isRolling}
          diceValues={diceValues}
          onDiceSelect={handleDiceSelect}
          usedDice={usedDice}
        />

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            How to Play:
          </h3>
          <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Wait for your turn</li>
            <li>Click "Roll Dice" button</li>
            <li>Click on your token (darker colored ones)</li>
            <li>Click on a die to move by that amount</li>
            <li>Use remaining die or click another token</li>
            <li>Need 6 to enter from home</li>
          </ol>
        </div>

        {/* Leave Button */}
        <button
          onClick={leaveRoom}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
}
