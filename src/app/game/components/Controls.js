
"use client";

export default function Controls({
  diceResultRef,
  debug,
  pieceColor,
  imageLoaded,
  rollDice,
  toggleDebug,
  changeColor,
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button
          onClick={rollDice}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
        >
          🎲 Roll Dice
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
          🎨 Change Color
        </button>
      </div>
      <p ref={diceResultRef} className="mt-2 text-lg font-semibold"></p>
      <p className="mt-1 text-sm text-gray-600">Piece Color: {pieceColor}</p>
      {!imageLoaded && (
        <p className="mt-1 text-sm text-orange-600">Loading avatar image...</p>
      )}
    </div>
  );
}
