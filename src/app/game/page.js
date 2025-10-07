"use client";
// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const moveToIndexRef = useRef(null);
  const pieceIndexRef = useRef(0); // <-- persist piece position
  const currentGameCellRef = useRef(1); // Track current game cell number
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

    let gridSize = 20; // Changed from 10 to 18
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

      // Create game cells mapping (Path for piece movement)
      gameCells = {};
      let cellNumber = 1;

      // 1 to 8 - Vertical path going up (cells merged horizontally)
      gameCells[cellNumber++] = [391, 392]; // Cell 1
      gameCells[cellNumber++] = [371, 372]; // Cell 2
      gameCells[cellNumber++] = [351, 352]; // Cell 3
      gameCells[cellNumber++] = [331, 332]; // Cell 4
      gameCells[cellNumber++] = [311, 312]; // Cell 5
      gameCells[cellNumber++] = [291, 292]; // Cell 6
      gameCells[cellNumber++] = [271, 272]; // Cell 7
      gameCells[cellNumber++] = [251, 252]; // Cell 8

      // 9 to 16 - Horizontal path going right (cells merged vertically)
      gameCells[cellNumber++] = [232, 252]; // Cell 9
      gameCells[cellNumber++] = [233, 253]; // Cell 10
      gameCells[cellNumber++] = [234, 254]; // Cell 11
      gameCells[cellNumber++] = [235, 255]; // Cell 12
      gameCells[cellNumber++] = [236, 256]; // Cell 13
      gameCells[cellNumber++] = [237, 257]; // Cell 14
      gameCells[cellNumber++] = [238, 258]; // Cell 15
      gameCells[cellNumber++] = [239, 259]; // Cell 16

      // 17 to 18 - Vertical path going up (cells merged vertically)
      gameCells[cellNumber++] = [199, 219]; // Cell 17
      gameCells[cellNumber++] = [159, 179]; // Cell 18

      //19 to 25 - Horizontal path going left (cells merged vertically)
      gameCells[cellNumber++] = [158, 178]; // Cell 19
      gameCells[cellNumber++] = [157, 177]; // Cell 20
      gameCells[cellNumber++] = [156, 176]; // Cell 21
      gameCells[cellNumber++] = [155, 175]; // Cell 22
      gameCells[cellNumber++] = [154, 174]; // Cell 23
      gameCells[cellNumber++] = [153, 173]; // Cell 24
      gameCells[cellNumber++] = [152, 172]; // Cell 25

      // 26 to 33 - Vertical path going up (cells merged horizontally)
      gameCells[cellNumber++] = [151, 152]; // Cell 26
      gameCells[cellNumber++] = [131, 132]; // Cell 27
      gameCells[cellNumber++] = [111, 112]; // Cell 28
      gameCells[cellNumber++] = [91, 92]; // Cell 29
      gameCells[cellNumber++] = [71, 72]; // Cell 30
      gameCells[cellNumber++] = [51, 52]; // Cell 31
      gameCells[cellNumber++] = [31, 32]; // Cell 32
      gameCells[cellNumber++] = [11, 12]; // Cell 33

      //34 to 35 - Horizontal path going left (cells merged horizontally)
      gameCells[cellNumber++] = [9, 10]; // Cell 34
      gameCells[cellNumber++] = [7, 8]; // Cell 35

      //36 to 42 - Vertical path going down (cells merged horizontally)
      gameCells[cellNumber++] = [27, 28]; // Cell 36
      gameCells[cellNumber++] = [47, 48]; // Cell 37
      gameCells[cellNumber++] = [67, 68]; // Cell 38
      gameCells[cellNumber++] = [87, 88]; // Cell 39
      gameCells[cellNumber++] = [107, 108]; // Cell 40
      gameCells[cellNumber++] = [127, 128]; // Cell 41
      gameCells[cellNumber++] = [147, 148]; // Cell 42

      //43 to 50 - Horizontal path going left (cells merged vertically)
      gameCells[cellNumber++] = [147, 167]; // Cell 43
      gameCells[cellNumber++] = [146, 166]; // Cell 44
      gameCells[cellNumber++] = [145, 165]; // Cell 45
      gameCells[cellNumber++] = [144, 164]; // Cell 46
      gameCells[cellNumber++] = [143, 163]; // Cell 47
      gameCells[cellNumber++] = [142, 162]; // Cell 48
      gameCells[cellNumber++] = [141, 161]; // Cell 49
      gameCells[cellNumber++] = [140, 160]; // Cell 50

      // 51 to 52 - Vertical path going down (cells merged vertically)
      gameCells[cellNumber++] = [180, 200]; // Cell 51
      gameCells[cellNumber++] = [220, 240]; // Cell 52

      //53 to 59 - Horizontal path going right (cells merged vertically)
      gameCells[cellNumber++] = [221, 241]; // Cell 53
      gameCells[cellNumber++] = [222, 242]; // Cell 54
      gameCells[cellNumber++] = [223, 243]; // Cell 55
      gameCells[cellNumber++] = [224, 244]; // Cell 56
      gameCells[cellNumber++] = [225, 245]; // Cell 57
      gameCells[cellNumber++] = [226, 246]; // Cell 58
      gameCells[cellNumber++] = [227, 247]; // Cell 59

      //60 to 67 - Vertical path going down (cells merged horizontally)
      gameCells[cellNumber++] = [247, 248]; // Cell 60
      gameCells[cellNumber++] = [267, 268]; // Cell 61
      gameCells[cellNumber++] = [287, 288]; // Cell 62
      gameCells[cellNumber++] = [307, 308]; // Cell 63
      gameCells[cellNumber++] = [327, 328]; // Cell 64
      gameCells[cellNumber++] = [347, 348]; // Cell 65
      gameCells[cellNumber++] = [367, 368]; // Cell 66
      gameCells[cellNumber++] = [387, 388]; // Cell 67

      //68 - going right (cell merged horizontally)
      gameCells[cellNumber++] = [389, 390]; // Cell 68
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
      const cornerSize = 7;

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
        (homeStartY - 7) * cellSize,
        2 * cellSize,
        7 * cellSize,
      );

      // Blue tail (extending rightward from home)
      ctx.fillStyle = colors.blue;
      ctx.fillRect(
        (homeStartX + homeSize) * cellSize,
        (homeStartY + 1) * cellSize,
        7 * cellSize,
        2 * cellSize,
      );

      // Yellow tail (extending downward from home)
      ctx.fillStyle = colors.yellow;
      ctx.fillRect(
        (homeStartX + 1) * cellSize,
        (homeStartY + homeSize) * cellSize,
        2 * cellSize,
        7 * cellSize,
      );

      // Green tail (extending leftward from home)
      ctx.fillStyle = colors.green;
      ctx.fillRect(
        (homeStartX - 7) * cellSize,
        (homeStartY + 1) * cellSize,
        7 * cellSize,
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
        const firstCell = path[indices[0]];
        const secondCell = path[indices[1]];

        // Check if cells are horizontally or vertically aligned
        const isHorizontal = firstCell.y === secondCell.y;

        let x, y, width, height;

        if (isHorizontal) {
          // For horizontally merged cells (1-8, 26-33)
          x = firstCell.x * cellSize;
          y = firstCell.y * cellSize;
          width = 2 * cellSize;
          height = cellSize;
        } else {
          // For vertically merged cells (9-18, 19-25)
          x = firstCell.x * cellSize;
          y = firstCell.y * cellSize;
          width = cellSize;
          height = 2 * cellSize;
        }

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
          ctx.fillText(cell.index, x, y);
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
      // Calculate the center position of the combined cell
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

      // Check if cells are horizontally or vertically aligned
      const isHorizontal = firstCell.y === secondCell.y;

      const cellSize = canvas.width / window.devicePixelRatio / gridSize;
      let targetX, targetY;

      if (isHorizontal) {
        // For horizontally merged cells (1-8, 26-33)
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        // For vertically merged cells (9-18, 19-25)
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize;
      }

      // Animate the piece to the target position
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
          piece.px = targetX;
          piece.py = targetY;
          currentGameCellRef.current = targetCellNumber; // Update the ref
          drawBoard();
        }
      }
      animate();
    }

    moveToIndexRef.current = moveToGameCell;

    function init() {
      buildPath();
      resizeCanvas();
      const cellSize = canvas.width / window.devicePixelRatio / gridSize;

      // Position the piece at the center of the first game cell
      const firstCellIndices = gameCells[1];
      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

      // Check if cells are horizontally or vertically aligned
      const isHorizontal = firstCell.y === secondCell.y;

      pieceIndexRef.current = firstCellIndices[0];
      piece.x = firstCell.x;
      piece.y = firstCell.y;

      if (isHorizontal) {
        // For horizontally merged cells (1-8, 26-33)
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        // For vertically merged cells (9-18, 19-25)
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize;
      }

      currentGameCellRef.current = 1; // Initialize the ref
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
      // Calculate the target game cell number based on the current cell and dice roll
      const targetCellNumber = Math.min(
        33, // Updated to 33 for the new path
        currentGameCellRef.current +
          parseInt(diceResultRef.current.innerText.split(": ")[1]),
      );
      moveToIndexRef.current(targetCellNumber);
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
