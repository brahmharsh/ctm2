// /components/Controls.js
"use client";

export default function Controls({
  diceResultRef,
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
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 sm:flex-col">
        <button
          onClick={rollDice}
          disabled={
            isRolling || (currentPlayer && currentPlayer.id !== playerId)
          }
          className={`px-6 py-2 rounded-lg shadow-md ${
            isRolling || (currentPlayer && currentPlayer.id !== playerId)
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isRolling
            ? "🎲 Rolling..."
            : currentPlayer && currentPlayer.id !== playerId
              ? `🎲 ${currentPlayer?.id}'s Turn`
              : "🎲 Roll Dice"}
        </button>
        <button
          onClick={toggleDebug}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
        >
          {debug ? "Hide" : "Show"} Debug
        </button>
        <button
          onClick={changeColor}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700"
        >
          🎨 Switch Player
        </button>
      </div>
      <p ref={diceResultRef} className="mt-2 text-lg font-semibold"></p>
      <p className="mt-1 text-sm text-gray-600">
        You are: {playerId} ({pieceColor})
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Current Turn: {currentPlayer?.id} ({currentPlayer?.color})
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Players in Game: {players.length}/4
      </p>
      {!imageLoaded && (
        <p className="mt-1 text-sm text-orange-600">Loading avatar image...</p>
      )}
    </div>
  );
}
