"use client";
// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const moveToIndexRef = useRef(null);
  const pieceIndexRef = useRef(0); // <-- persist piece position
  const [debug, setDebug] = useState(true); // Debug state to show/hide cell numbers

  // Global color definitions
  const colors = {
    red: "rgba(220, 38, 38, 0.7)", // Consistent red
    blue: "rgba(59, 130, 246, 0.7)", // Consistent blue
    green: "rgba(34, 197, 94, 0.7)", // Consistent green
    yellow: "rgba(234, 179, 8, 0.7)", // Consistent yellow
    black: "rgba(0, 0, 0, 1)", // Black for pieces
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let gridSize = 18; // Changed from 10 to 18
    let path = [];
    let gameCells = {}; // Map of game cell numbers to path indices
    let piece = { x: 0, y: 0, px: 0, py: 0 };

    function buildPath() {
      path = [];
      // Create a linear path from left to right, top to bottom
      for (let i = 0; i < gridSize * gridSize; i++) {
        let row = Math.floor(i / gridSize);
        let col = i % gridSize;
        path.push({ x: col, y: row, index: i });
      }

      // Create game cells mapping
      gameCells = {};
      let cellNumber = 1;

      // Start from bottom (cells 317 and 318 which are indices 316 and 317) and go upward
      // Row 17 (bottom row) - cells 317 and 318 (indices 316 and 317)
      gameCells[cellNumber++] = [316, 317];

      // Row 16 - cells 299 and 300 (indices 298 and 299)
      gameCells[cellNumber++] = [298, 299];

      // Row 15 - cells 281 and 282 (indices 280 and 281)
      gameCells[cellNumber++] = [280, 281];

      // Row 14 - cells 263 and 264 (indices 262 and 263)
      gameCells[cellNumber++] = [262, 263];

      // Row 13 - cells 245 and 246 (indices 244 and 245)
      gameCells[cellNumber++] = [244, 245];

      // Row 12 - cells 227 and 228 (indices 226 and 227)
      gameCells[cellNumber++] = [226, 227];

      // Row 11 - cells 209 and 210 (indices 208 and 209)
      gameCells[cellNumber++] = [208, 209];
    }

    function resizeCanvas() {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0,
      );
    }

    function drawBoard() {
      const size = canvas.width / window.devicePixelRatio;
      const cellSize = size / gridSize;
      ctx.clearRect(0, 0, size, size);

      // Draw colored corners (6x6 squares)
      const cornerSize = 6;

      // Top left - Red
      ctx.fillStyle = colors.red;
      ctx.fillRect(0, 0, cornerSize * cellSize, cornerSize * cellSize);

      // Top right - Blue
      ctx.fillStyle = colors.blue;
      ctx.fillRect(
        (gridSize - cornerSize) * cellSize,
        0,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Bottom left - Green
      ctx.fillStyle = colors.green;
      ctx.fillRect(
        0,
        (gridSize - cornerSize) * cellSize,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Bottom right - Yellow
      ctx.fillStyle = colors.yellow;
      ctx.fillRect(
        (gridSize - cornerSize) * cellSize,
        (gridSize - cornerSize) * cellSize,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Draw home area (4x4 grey square in center)
      const homeSize = 4;
      const homeStartX = Math.floor((gridSize - homeSize) / 2);
      const homeStartY = Math.floor((gridSize - homeSize) / 2);
      ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
      ctx.fillRect(
        homeStartX * cellSize,
        homeStartY * cellSize,
        homeSize * cellSize,
        homeSize * cellSize,
      );

      // Draw colored tails extending from home area
      // Red tail (extending upward from home)
      ctx.fillStyle = colors.red;
      ctx.fillRect(
        (homeStartX + 1) * cellSize,
        (homeStartY - 6) * cellSize,
        2 * cellSize,
        6 * cellSize,
      );

      // Blue tail (extending rightward from home)
      ctx.fillStyle = colors.blue;
      ctx.fillRect(
        (homeStartX + homeSize) * cellSize,
        (homeStartY + 1) * cellSize,
        6 * cellSize,
        2 * cellSize,
      );

      // Yellow tail (extending downward from home)
      ctx.fillStyle = colors.yellow;
      ctx.fillRect(
        (homeStartX + 1) * cellSize,
        (homeStartY + homeSize) * cellSize,
        2 * cellSize,
        6 * cellSize,
      );

      // Green tail (extending leftward from home)
      ctx.fillStyle = colors.green;
      ctx.fillRect(
        (homeStartX - 6) * cellSize,
        (homeStartY + 1) * cellSize,
        6 * cellSize,
        2 * cellSize,
      );

      // Draw 4 colored triangles in the home area
      const homeX = homeStartX * cellSize;
      const homeY = homeStartY * cellSize;
      const homeWidth = homeSize * cellSize;
      const homeHeight = homeSize * cellSize;

      // Calculate center point
      const centerX = homeX + homeWidth / 2;
      const centerY = homeY + homeHeight / 2;

      // Top triangle (Red) - pointing up (toward top-left corner)
      ctx.fillStyle = colors.red;
      ctx.beginPath();
      ctx.moveTo(centerX, homeY + homeHeight / 2);
      ctx.lineTo(homeX, homeY);
      ctx.lineTo(homeX + homeWidth, homeY);
      ctx.closePath();
      ctx.fill();

      // Right triangle (Blue) - pointing right (toward top-right corner)
      ctx.fillStyle = colors.blue;
      ctx.beginPath();
      ctx.moveTo(homeX + homeWidth / 2, centerY);
      ctx.lineTo(homeX + homeWidth, homeY);
      ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Bottom triangle (Yellow) - pointing down (toward bottom-right corner)
      ctx.fillStyle = colors.yellow;
      ctx.beginPath();
      ctx.moveTo(centerX, homeY + homeHeight / 2);
      ctx.lineTo(homeX, homeY + homeHeight);
      ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Left triangle (Green) - pointing left (toward bottom-left corner)
      ctx.fillStyle = colors.green;
      ctx.beginPath();
      ctx.moveTo(homeX + homeWidth / 2, centerY);
      ctx.lineTo(homeX, homeY);
      ctx.lineTo(homeX, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Draw game cell numbers with borders
      ctx.font = `bold ${cellSize / 3}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw game cell numbers
      for (const [cellNumber, indices] of Object.entries(gameCells)) {
        // Get the two cells
        const leftCell = path[indices[0]];
        const rightCell = path[indices[1]];

        // Calculate the position and size of the combined cell
        const x = leftCell.x * cellSize;
        const y = leftCell.y * cellSize;
        const width = 2 * cellSize;
        const height = cellSize;

        // Draw the background for the combined cell
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillRect(x, y, width, height);

        // Draw the border around the combined cell
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw the number in the center of the combined cell
        ctx.fillStyle = "#333";
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.fillText(cellNumber, centerX, centerY);
      }

      // Draw debug cell numbers if debug mode is on
      if (debug) {
        // Draw grid
        ctx.strokeStyle = "#aaa";
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        }

        ctx.fillStyle = "#666";
        ctx.font = `${cellSize / 5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i < path.length; i++) {
          const cell = path[i];
          const x = cell.x * cellSize + cellSize / 2;
          const y = cell.y * cellSize + cellSize / 2;
          ctx.fillText(cell.index + 1, x, y);
        }
      }

      // Draw piece
      ctx.fillStyle = colors.black;
      ctx.beginPath();
      ctx.arc(piece.px, piece.py, cellSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function moveToGameCell(targetCellNumber) {
      if (!gameCells[targetCellNumber]) return;

      // Get the indices for the target game cell
      const targetIndices = gameCells[targetCellNumber];
      // Use the first index for the piece position
      const targetIndex = targetIndices[0];

      let nextStep = pieceIndexRef.current + 1;

      function step() {
        if (pieceIndexRef.current >= targetIndex) return;
        let cellSize = canvas.width / window.devicePixelRatio / gridSize;
        let target = path[nextStep];
        let targetX = target.x * cellSize + cellSize / 2;
        let targetY = target.y * cellSize + cellSize / 2;

        function animate() {
          let dx = targetX - piece.px;
          let dy = targetY - piece.py;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            piece.px += dx * 0.15;
            piece.py += dy * 0.15;
            drawBoard();
            requestAnimationFrame(animate);
          } else {
            pieceIndexRef.current = nextStep; // ✅ persist new index
            piece.px = targetX;
            piece.py = targetY;
            drawBoard();
            nextStep++;
            if (pieceIndexRef.current < targetIndex) setTimeout(step, 1);
          }
        }
        animate();
      }
      step();
    }

    moveToIndexRef.current = moveToGameCell;

    function init() {
      buildPath();
      resizeCanvas();
      const cellSize = canvas.width / window.devicePixelRatio / gridSize;
      pieceIndexRef.current = 316; // Start at the first game cell (index 316)
      piece.x = path[316].x;
      piece.y = path[316].y;
      piece.px = path[316].x * cellSize + cellSize / 2;
      piece.py = path[316].y * cellSize + cellSize / 2;
      drawBoard();
    }

    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [debug]); // Add debug as a dependency to redraw when it changes

  const rollDice = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    diceResultRef.current.innerText = `🎲 Dice: ${dice}`;

    if (moveToIndexRef.current) {
      // Find the current game cell number based on the piece position
      let currentCellNumber = 1;
      for (const [cellNum, indices] of Object.entries({
        1: [316, 317],
        2: [298, 299],
        3: [280, 281],
        4: [262, 263],
        5: [244, 245],
        6: [226, 227],
        7: [208, 209],
      })) {
        if (indices.includes(pieceIndexRef.current)) {
          currentCellNumber = parseInt(cellNum);
          break;
        }
      }

      const targetCellNumber = currentCellNumber + dice;
      moveToIndexRef.current(targetCellNumber); // ✅ move to game cell
    }
  };

  const toggleDebug = () => {
    setDebug(!debug);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-200 bg-white w-[90vmin] h-[90vmin]"
      />
      <div className="mt-4 flex gap-2">
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
      </div>
      <p ref={diceResultRef} className="mt-2 text-lg font-semibold"></p>
    </div>
  );
}
