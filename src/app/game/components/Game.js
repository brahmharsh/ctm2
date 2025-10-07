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
        className="bg-white w-[99vmin] h-[99vmin] border-t-2 border-l-2 border-neutral-200 border-b-2 border-r-2 border-neutral-500 shadow-inner rounded-2xl"
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
