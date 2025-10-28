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
  gameStarted,
  startGame,
}) {
  // Get the index of the current player for display
  const currentPlayerIndex = players.findIndex((p) => p.id === playerId);
  const playerNumber = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 sm:flex-col">
        {!gameStarted && players.length >= 2 && (
          <button
            onClick={startGame}
            className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700"
          >
            🚀 Start Game
          </button>
        )}
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
          disabled={players.length <= 1}
          className={`px-6 py-2 rounded-lg shadow-md ${
            players.length <= 1
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          🎨 Next Player ({playerNumber}/{players.length})
        </button>
        {/* Demo REST counter button */}
        <button
          onClick={async () => {
            try {
              const inc = await import("../services/api").then((m) =>
                m.api.incrementCounter()
              );
              console.log("[REST] Counter increment response", inc);
              const current = await import("../services/api").then((m) =>
                m.api.getCounter()
              );
              console.log("[REST] Counter current value", current);
              alert(`Counter value: ${current.data?.value}`);
            } catch (e) {
              console.error("[REST] Counter error", e);
            }
          }}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700"
        >
          🧪 Demo REST (Counter)
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
