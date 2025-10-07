
"use client";

import { useGame } from "../hooks/useGame";
import Controls from "./Controls";

export default function Game() {
  const {
    canvasRef,
    diceResultRef,
    debug,
    pieceColor,
    imageLoaded,
    rollDice,
    toggleDebug,
    changeColor,
  } = useGame();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-200 bg-white w-[90vmin] h-[90vmin]"
      />
      <Controls
        diceResultRef={diceResultRef}
        debug={debug}
        pieceColor={pieceColor}
        imageLoaded={imageLoaded}
        rollDice={rollDice}
        toggleDebug={toggleDebug}
        changeColor={changeColor}
      />
    </div>
  );
}
