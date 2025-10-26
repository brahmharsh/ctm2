/components/Controls.js
```js
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
  // Get the index of the current player for display
  const currentPlayerIndex = players.findIndex((p) => p.id === playerId);
  const playerNumber = currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : 0;

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
          disabled={players.length <= 1}
          className={`px-6 py-2 rounded-lg shadow-md ${
            players.length <= 1
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          🎨 Next Player ({playerNumber}/{players.length})
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

```

/components/Game.js
```js
// /components/Game.js
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
    isRolling,
    players,
    currentPlayer,
    playerId,
    rollDice,
    toggleDebug,
    changeColor,
  } = useGame();

  return (
    <div className="flex sm:flex-row flex-col items-center justify-center h-screen bg-gray-100 gap-2">
      <canvas
        ref={canvasRef}
        className="bg-white w-[100vmin] h-[100vmin] border-t-2 border-l-2 border-b-2 border-r-2 border-neutral-500 shadow-inner rounded-2xl"
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
        rollDice={rollDice}
        toggleDebug={toggleDebug}
        changeColor={changeColor}
      />
    </div>
  );
}

```

/constants.js
```js
// /constants.js

export const COLORS = {
  red: "rgba(220, 38, 38, 0.7)",
  blue: "rgba(59, 130, 246, 0.7)",
  green: "rgba(34, 197, 94, 0.7)",
  yellow: "rgba(234, 179, 8, 0.7)",
  black: "rgba(0, 0, 0, 1)",
};

export const GRID_SIZE = 20;
export const CORNER_SIZE = 7;
export const HOME_SIZE = 4;

export const START_CELLS = {
  blue: 22,
  yellow: 5,
  red: 39,
  green: 56,
};

export const SAFE_CELLS = [12, 17, 29, 34, 46, 51, 63, 68];

// Player constants
export const PLAYERS = {
  player_1: { color: "yellow", startCell: 5 },
  player_2: { color: "blue", startCell: 22 },
  player_3: { color: "red", startCell: 39 },
  player_4: { color: "green", startCell: 56 },
};

// Player positions on the board corners
export const PLAYER_POSITIONS = {
  player_1: { x: GRID_SIZE - CORNER_SIZE, y: GRID_SIZE - CORNER_SIZE }, // Bottom-right
  player_2: { x: GRID_SIZE - CORNER_SIZE, y: 0 }, // Top-right
  player_3: { x: 0, y: 0 }, // Top-left
  player_4: { x: 0, y: GRID_SIZE - CORNER_SIZE }, // Bottom-left
};

```

/drawing.js
```js
// /drawing.js
import {
  COLORS,
  GRID_SIZE,
  CORNER_SIZE,
  HOME_SIZE,
  START_CELLS,
  SAFE_CELLS,
  PLAYERS,
  PLAYER_POSITIONS,
} from "./constants";

// Utility functions
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.fillStyle = "gold";
  ctx.fill();
}

// Drawing functions for board components
const BoardComponents = {
  drawAvatarBackgroundCircle(ctx, x, y, size, color, cellSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    const circleRadius = 2 * cellSize;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    return { x: x + size / 2, y: y + size / 2, radius: circleRadius };
  },

  drawCornerCircles(ctx, centerX, centerY, color, circleRadius) {
    const outerCircleRadius = circleRadius * 0.3;
    const outerCircleDistance = circleRadius * 1;

    // To rectangular positioning:
    const positions = [
      { x: centerX - outerCircleDistance, y: centerY - outerCircleDistance }, // Top-left
      { x: centerX + outerCircleDistance, y: centerY - outerCircleDistance }, // Top-right
      { x: centerX - outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-left
      { x: centerX + outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-right
    ];

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Border color
    ctx.lineWidth = 2; // Border width

    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, outerCircleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Draw the border
    });
  },

  drawHomeArea(ctx, homeStartX, homeStartY, cellSize) {
    ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
    ctx.fillRect(
      homeStartX * cellSize,
      homeStartY * cellSize,
      HOME_SIZE * cellSize,
      HOME_SIZE * cellSize,
    );
  },

  drawColoredTail(ctx, homeStartX, homeStartY, cellSize, direction) {
    const tailWidth = 2 * cellSize;
    const tailLength = 7 * cellSize;

    ctx.fillStyle = COLORS[direction];

    switch (direction) {
      case "red": // Upward
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY - 7) * cellSize,
          tailWidth,
          tailLength,
        );
        break;
      case "blue": // Rightward
        ctx.fillRect(
          (homeStartX + HOME_SIZE) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth,
        );
        break;
      case "yellow": // Downward
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY + HOME_SIZE) * cellSize,
          tailWidth,
          tailLength,
        );
        break;
      case "green": // Leftward
        ctx.fillRect(
          (homeStartX - 7) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth,
        );
        break;
    }
  },

  drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize) {
    const homeX = homeStartX * cellSize;
    const homeY = homeStartY * cellSize;
    const homeWidth = HOME_SIZE * cellSize;
    const homeHeight = HOME_SIZE * cellSize;
    const centerX = homeX + homeWidth / 2;
    const centerY = homeY + homeHeight / 2;

    // Top triangle (Red)
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.moveTo(centerX, homeY + homeHeight / 2);
    ctx.lineTo(homeX, homeY);
    ctx.lineTo(homeX + homeWidth, homeY);
    ctx.closePath();
    ctx.fill();

    // Right triangle (Blue)
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(homeX + homeWidth / 2, centerY);
    ctx.lineTo(homeX + homeWidth, homeY);
    ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();

    // Bottom triangle (Yellow)
    ctx.fillStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.moveTo(centerX, homeY + homeHeight / 2);
    ctx.lineTo(homeX, homeY + homeHeight);
    ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();

    // Left triangle (Green)
    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.moveTo(homeX + homeWidth / 2, centerY);
    ctx.lineTo(homeX, homeY);
    ctx.lineTo(homeX, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();
  },

  drawGameCell(
    ctx,
    cellNumber,
    firstCell,
    secondCell,
    cellSize,
    startCellColors,
    rotation,
  ) {
    const isHorizontal = firstCell.y === secondCell.y;

    let x, y, width, height;

    if (isHorizontal) {
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = 2 * cellSize;
      height = cellSize;
    } else {
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = cellSize;
      height = 2 * cellSize;
    }

    // Draw background
    const cellNum = parseInt(cellNumber);
    ctx.fillStyle = startCellColors[cellNum] || "rgba(255, 255, 255, 0)";
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Special border cases
    switch (cellNum) {
      case 8:
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        ctx.lineTo(x + width / 2, y);
        break;
      case 9:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x, y);
        break;
      case 25:
        ctx.moveTo(x + width, y);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y);
        break;
      case 26:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.moveTo(x + width / 2, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 42:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width / 2, y + height);
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 43:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.moveTo(x + width, y + height / 2);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 59:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height / 2);
        ctx.moveTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 60:
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      default:
        ctx.rect(x, y, width, height);
        break;
    }
    ctx.stroke();

    // Draw cell number or star
    const cellCenterX = x + width / 2;
    const cellCenterY = y + height / 2;

    ctx.save();
    ctx.translate(cellCenterX, cellCenterY);
    ctx.rotate(-rotation);

    if (SAFE_CELLS.includes(cellNum)) {
      drawStar(ctx, 0, 0, 5, cellSize / 4, cellSize / 8);
    } else {
      ctx.fillStyle = "#333";
      ctx.font = `bold ${cellSize / 3}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cellNumber, 0, 0);
    }
    ctx.restore();
  },

  drawDiagonalLines(ctx, path, cellSize) {
    const drawDiagonal = (cellIndex, start, end) => {
      const cell = path[cellIndex];
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      ctx.beginPath();
      ctx.moveTo(x + start.x * cellSize, y + start.y * cellSize);
      ctx.lineTo(x + end.x * cellSize, y + end.y * cellSize);
      ctx.stroke();
    };

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;

    drawDiagonal(252, { x: 0, y: 0 }, { x: 1, y: 1 });
    drawDiagonal(152, { x: 0, y: 1 }, { x: 1, y: 0 });
    drawDiagonal(147, { x: 0, y: 0 }, { x: 1, y: 1 });
    drawDiagonal(247, { x: 1, y: 0 }, { x: 0, y: 1 });
  },

  drawDebugGrid(ctx, cellSize) {
    ctx.strokeStyle = "#aaa";
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  },

  drawDebugCellNumbers(ctx, path, cellSize, rotation) {
    ctx.fillStyle = "#666";
    ctx.font = `${cellSize / 5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      const x = cell.x * cellSize + cellSize / 2;
      const y = cell.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-rotation);
      ctx.fillText(cell.index, 0, 0);
      ctx.restore();
    }
  },

  drawPiece(
    ctx,
    piece,
    cellSize,
    pieceColor,
    isCurrentPlayer = false,
    animationFrame = 0,
  ) {
    // Make the current player's piece slightly larger and with a different border
    const baseRadius = cellSize / 3;
    const borderWidth = isCurrentPlayer ? 2 : 2;
    // const borderColor = isCurrentPlayer ? "black" : "black";
    const borderColor = "rgba(0, 0, 0, 1)";

    // Add breathing effect for current player
    let radius = baseRadius;
    if (isCurrentPlayer) {
      // Create a breathing effect using sine wave
      const breathScale = 1 + Math.sin(animationFrame * 0.05) * 0.15;
      radius = baseRadius * breathScale;
    }

    ctx.fillStyle = COLORS[pieceColor];
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    ctx.arc(piece.px, piece.py, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add a subtle glow effect for current player
    if (isCurrentPlayer) {
      ctx.save();
      // ctx.globalAlpha = 0.3;
      // ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(piece.px, piece.py, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  drawPlayerName(ctx, x, y, playerName, cellSize) {
    ctx.fillStyle = "#000";
    ctx.font = `bold ${cellSize / 4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(playerName, x, y);
  },

  drawAvatar(ctx, x, y, circleRadius, avatarImageRef) {
    const avatarSize = circleRadius * 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      avatarImageRef.current,
      x - avatarSize / 2,
      y - avatarSize / 2,
      avatarSize,
      avatarSize,
    );
    ctx.restore();
  },
};

// Main drawing function
export function drawBoard(
  ctx,
  canvas,
  pieceColor,
  gameCells,
  path,
  debug,
  pieces,
  imageLoaded,
  avatarImageRef,
  players = [],
  animationFrame = 0,
) {
  const size = canvas.width / window.devicePixelRatio;
  const cellSize = size / GRID_SIZE;
  ctx.clearRect(0, 0, size, size);

  ctx.save();

  // Set up rotation based on player color
  const boardCenterX = size / 2;
  const boardCenterY = size / 2;
  ctx.translate(boardCenterX, boardCenterY);

  let rotation = 0;
  switch (pieceColor) {
    case "red":
      rotation = Math.PI;
      break;
    case "blue":
      rotation = Math.PI / 2;
      break;
    case "green":
      rotation = -Math.PI / 2;
      break;
  }
  ctx.rotate(rotation);
  ctx.translate(-boardCenterX, -boardCenterY);

  // Define start cell colors
  const startCellColors = {
    5: COLORS.yellow,
    22: COLORS.blue,
    39: COLORS.red,
    56: COLORS.green,
  };

  const cornerPixelSize = CORNER_SIZE * cellSize;

  // Draw corners and their circles using player constants
  const corners = Object.keys(PLAYER_POSITIONS).map((playerId) => {
    const position = PLAYER_POSITIONS[playerId];
    return {
      x: position.x * cellSize,
      y: position.y * cellSize,
      color: COLORS[PLAYERS[playerId].color],
      playerId: playerId,
    };
  });

  corners.forEach((corner) => {
    const { x, y, radius } = BoardComponents.drawAvatarBackgroundCircle(
      ctx,
      corner.x,
      corner.y,
      cornerPixelSize,
      corner.color,
      cellSize,
    );

    BoardComponents.drawCornerCircles(ctx, x, y, corner.color, radius);

    // Draw player name in debug mode
    if (debug) {
      const player = players.find((p) => p.id === corner.playerId);
      if (player) {
        BoardComponents.drawPlayerName(
          ctx,
          x,
          y - radius - cellSize / 2,
          player.id,
          cellSize,
        );
      }
    }
  });

  // Draw home area
  const homeStartX = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  const homeStartY = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  BoardComponents.drawHomeArea(ctx, homeStartX, homeStartY, cellSize);

  // Draw colored tails
  ["red", "blue", "yellow", "green"].forEach((color) => {
    BoardComponents.drawColoredTail(
      ctx,
      homeStartX,
      homeStartY,
      cellSize,
      color,
    );
  });

  // Draw home triangles
  BoardComponents.drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize);

  // Draw game cells
  for (const [cellNumber, indices] of Object.entries(gameCells)) {
    const firstCell = path[indices[0]];
    const secondCell = path[indices[1]];
    BoardComponents.drawGameCell(
      ctx,
      cellNumber,
      firstCell,
      secondCell,
      cellSize,
      startCellColors,
      rotation,
    );
  }

  // Draw diagonal lines
  BoardComponents.drawDiagonalLines(ctx, path, cellSize);

  // Draw debug elements if needed
  if (debug) {
    BoardComponents.drawDebugGrid(ctx, cellSize);
    BoardComponents.drawDebugCellNumbers(ctx, path, cellSize, rotation);
  }

  // Draw all pieces
  if (pieces && Array.isArray(pieces)) {
    pieces.forEach((piece) => {
      const isCurrentPlayer = piece.color === pieceColor;
      BoardComponents.drawPiece(
        ctx,
        piece,
        cellSize,
        piece.color,
        isCurrentPlayer,
        animationFrame,
      );
    });
  }

  ctx.restore();

  // Draw avatars (outside the rotated context)
  if (imageLoaded && avatarImageRef.current) {
    const circleRadius = 2 * cellSize;

    corners.forEach((corner) => {
      const x = corner.x + cornerPixelSize / 2;
      const y = corner.y + cornerPixelSize / 2;
      BoardComponents.drawAvatar(ctx, x, y, circleRadius, avatarImageRef);

      // Draw player name in debug mode
      if (debug) {
        const player = players.find((p) => p.id === corner.playerId);
        if (player) {
          BoardComponents.drawPlayerName(
            ctx,
            x,
            y - circleRadius - cellSize / 2,
            player.id,
            cellSize,
          );
        }
      }
    });
  }
}

```

/game-logic.js
```js
// /game-logic.js
import { GRID_SIZE, PLAYERS } from "./constants";

export function buildPath() {
  const path = [];
  // Create a linear path from left to right, top to bottom
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    let row = Math.floor(i / GRID_SIZE);
    let col = i % GRID_SIZE;
    path.push({ x: col, y: row, index: i });
  }

  // Create game cells mapping (Path for piece movement)
  const gameCells = {};
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

  //Assign code number to tails
  //for yellow tail (cells merged horizontally)
  gameCells["Y1"] = [369, 370]; // Cell Y1
  gameCells["Y2"] = [349, 350]; // Cell Y2
  gameCells["Y3"] = [329, 330]; // Cell Y3
  gameCells["Y4"] = [309, 310]; // Cell Y4
  gameCells["Y5"] = [289, 290]; // Cell Y5
  gameCells["Y6"] = [269, 270]; // Cell Y6
  gameCells["Y7"] = [249, 250]; // Cell Y7

  //for blue tail (cells merged vertically)
  gameCells["B1"] = [198, 218]; // Cell B1
  gameCells["B2"] = [197, 217]; // Cell B2
  gameCells["B3"] = [196, 216]; // Cell B3
  gameCells["B4"] = [195, 215]; // Cell B4
  gameCells["B5"] = [194, 214]; // Cell B5
  gameCells["B6"] = [193, 213]; // Cell B6
  gameCells["B7"] = [192, 212]; // Cell B7

  //for red tail (cells merged horizontally)
  gameCells["R1"] = [29, 30]; // Cell R1
  gameCells["R2"] = [49, 50]; // Cell R2
  gameCells["R3"] = [69, 70]; // Cell R3
  gameCells["R4"] = [89, 90]; // Cell R4
  gameCells["R5"] = [109, 110]; // Cell R5
  gameCells["R6"] = [129, 130]; // Cell R6
  gameCells["R7"] = [149, 150]; // Cell R7

  //for green tail (cells merged vertically)
  gameCells["G1"] = [181, 201]; // Cell G1
  gameCells["G2"] = [182, 202]; // Cell G2
  gameCells["G3"] = [183, 203]; // Cell G3
  gameCells["G4"] = [184, 204]; // Cell G4
  gameCells["G5"] = [185, 205]; // Cell G5
  gameCells["G6"] = [186, 206]; // Cell G6
  gameCells["G7"] = [187, 207]; // Cell G7

  return { path, gameCells };
}

```

/hooks/useGame.js
```js
// /hooks/useGame.js
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing";
import { GRID_SIZE, START_CELLS, PLAYERS } from "../constants";
import { api } from "../services/api";

export function useGame() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const [debug, setDebug] = useState(false);
  const [pieceColor, setPieceColor] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
  const avatarImageRef = useRef(null);
  const moveToIndexRef = useRef(null);
  const piecesRef = useRef(pieces);
  const initializedRef = useRef(false);
  const pathRef = useRef(null);
  const gameCellsRef = useRef(null);
  const canvasContextRef = useRef(null);
  const drawBoardRef = useRef(null);
  const boardInitializedRef = useRef(false);
  const animationFrameRef = useRef(0);
  const animationIdRef = useRef(null);

  // Update the ref whenever pieces changes
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Initialize game and join as player_1
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Reset game first
        await api.resetGame();

        // Join as player_1
        const response = await api.joinGame("player_1");
        if (response.success) {
          setPlayerId("player_1");
          setPieceColor(response.data.player.color);
          setPlayers(response.data.gameState.players);
          setCurrentPlayer(response.data.gameState.players[0]);
          setGameStarted(true);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };

    initializeGame();
  }, []);

  // Simulate other players joining
  useEffect(() => {
    if (!gameStarted || players.length >= 4) return;

    const simulatePlayersJoining = async () => {
      const playerIds = ["player_2", "player_3", "player_4"];

      for (const id of playerIds) {
        if (players.length >= 4) break;

        // Random delay before next player joins
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 2000 + 1000),
        );

        try {
          const response = await api.joinGame(id);
          if (response.success) {
            setPlayers((prev) => [...prev, response.data.player]);
          }
        } catch (error) {
          console.error(`Error adding ${id}:`, error);
        }
      }
    };

    simulatePlayersJoining();
  }, [gameStarted, players.length]);

  // Initialize pieces when players change
  useEffect(() => {
    if (!gameStarted || players.length === 0) return;

    const newPieces = players.map((player) => {
      const startCell = PLAYERS[player.id].startCell;
      return {
        id: player.id,
        color: player.color,
        position: startCell,
        x: 0,
        y: 0,
        px: 0,
        py: 0,
      };
    });

    setPieces(newPieces);
    initializedRef.current = false; // Reset initialization flag when pieces change
  }, [players, gameStarted]);

  useEffect(() => {
    const img = new Image();
    img.src = "/avatar.png";
    img.onload = () => {
      avatarImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load avatar image");
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", 50, 50);

      const placeholderImg = new Image();
      placeholderImg.src = canvas.toDataURL();
      placeholderImg.onload = () => {
        avatarImageRef.current = placeholderImg;
        setImageLoaded(true);
      };
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!gameStarted || !pieceColor) return;

    const animate = () => {
      animationFrameRef.current += 1;

      // Draw the board with the current animation frame
      if (drawBoardRef.current) {
        drawBoardRef.current(animationFrameRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationIdRef.current = requestAnimationFrame(animate);

    // Clean up the animation loop
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameStarted, pieceColor]);

  // Create a function to draw the board
  const createDrawBoardFunction = useCallback(() => {
    if (
      !canvasRef.current ||
      !canvasContextRef.current ||
      !pathRef.current ||
      !gameCellsRef.current
    )
      return null;

    return (animationFrame = 0) => {
      drawBoard(
        canvasContextRef.current,
        canvasRef.current,
        pieceColor,
        gameCellsRef.current,
        pathRef.current,
        debug,
        piecesRef.current,
        imageLoaded,
        avatarImageRef,
        players,
        animationFrame,
      );
    };
  }, [pieceColor, debug, imageLoaded, players]);

  // Separate effect for canvas setup
  useEffect(() => {
    if (!gameStarted || !pieceColor) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvasContextRef.current = ctx;
    const { path, gameCells } = buildPath();

    // Store path and gameCells in refs for use in other functions
    pathRef.current = path;
    gameCellsRef.current = gameCells;

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

    // Create the drawBoard function
    drawBoardRef.current = createDrawBoardFunction();

    resizeCanvas();
    boardInitializedRef.current = true;

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [gameStarted, pieceColor, createDrawBoardFunction]);

  // Update drawBoard function when dependencies change
  useEffect(() => {
    drawBoardRef.current = createDrawBoardFunction();
  }, [createDrawBoardFunction]);

  // Effect for initializing piece positions
  useEffect(() => {
    if (
      !gameStarted ||
      !pieceColor ||
      pieces.length === 0 ||
      initializedRef.current
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvasContextRef.current;
    const path = pathRef.current;
    const gameCells = gameCellsRef.current;

    if (!path || !gameCells) return;

    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    // Update positions for all pieces
    const updatedPieces = pieces.map((piece) => {
      const startCell = PLAYERS[piece.id].startCell;
      const firstCellIndices = gameCells[startCell];
      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

      const isHorizontal = firstCell.y === secondCell.y;

      let px, py;

      if (isHorizontal) {
        px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      return {
        ...piece,
        x: firstCell.x,
        y: firstCell.y,
        px,
        py,
      };
    });

    setPieces(updatedPieces);
    initializedRef.current = true;
  }, [gameStarted, pieceColor, pieces.length]); // Only depend on pieces length, not the array itself

  // Effect for setting up move functions
  useEffect(() => {
    if (!gameStarted || !pieceColor || pieces.length === 0) return;

    const path = pathRef.current;
    const gameCells = gameCellsRef.current;

    if (!path || !gameCells) return;

    let isMoving = false;
    const currentGameCellRef = { current: {} };

    // Initialize current positions for all players
    pieces.forEach((piece) => {
      currentGameCellRef.current[piece.id] = piece.position;
    });

    function moveToGameCell(playerId, targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;
      const currentCell = currentGameCellRef.current[playerId];

      const stepsToMove = (targetCellNumber - currentCell + 68) % 68;

      let currentStepInMove = 0;

      function moveStep() {
        if (currentStepInMove >= stepsToMove) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        currentStepInMove++;
        const nextCellNumber = ((currentCell + currentStepInMove - 1) % 68) + 1;

        if (!gameCells[nextCellNumber]) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        const targetIndices = gameCells[nextCellNumber];
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];

        const isHorizontal = firstCell.y === secondCell.y;

        const canvas = canvasRef.current;
        const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
        let targetX, targetY;

        if (isHorizontal) {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        } else {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        }

        function animate() {
          // Find the piece for this player
          const currentPieces = piecesRef.current;
          const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
          if (pieceIndex === -1) {
            isMoving = false;
            if (onComplete) onComplete();
            return;
          }

          const piece = currentPieces[pieceIndex];
          let dx = targetX - piece.px;
          let dy = targetY - piece.py;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            // Update the piece position
            const updatedPieces = [...currentPieces];
            updatedPieces[pieceIndex] = {
              ...piece,
              px: piece.px + dx * 0.3,
              py: piece.py + dy * 0.3,
            };
            piecesRef.current = updatedPieces;
            setPieces(updatedPieces);

            requestAnimationFrame(animate);
          } else {
            // Final position update
            const updatedPieces = [...currentPieces];
            updatedPieces[pieceIndex] = {
              ...piece,
              x: firstCell.x,
              y: firstCell.y,
              px: targetX,
              py: targetY,
              position: nextCellNumber,
            };
            piecesRef.current = updatedPieces;
            setPieces(updatedPieces);

            currentGameCellRef.current[playerId] = nextCellNumber;

            setTimeout(moveStep, 10);
          }
        }
        animate();
      }

      moveStep();
    }

    function moveToHomePath(playerId, targetHomeCell, onComplete) {
      if (!gameCells[targetHomeCell]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;

      const targetIndices = gameCells[targetHomeCell];
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

      const isHorizontal = firstCell.y === secondCell.y;

      const canvas = canvasRef.current;
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
      let targetX, targetY;

      if (isHorizontal) {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      function animate() {
        // Find the piece for this player
        const currentPieces = piecesRef.current;
        const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
        if (pieceIndex === -1) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        const piece = currentPieces[pieceIndex];
        let dx = targetX - piece.px;
        let dy = targetY - piece.py;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          // Update the piece position
          const updatedPieces = [...currentPieces];
          updatedPieces[pieceIndex] = {
            ...piece,
            px: piece.px + dx * 0.3,
            py: piece.py + dy * 0.3,
          };
          piecesRef.current = updatedPieces;
          setPieces(updatedPieces);

          requestAnimationFrame(animate);
        } else {
          // Final position update
          const updatedPieces = [...currentPieces];
          updatedPieces[pieceIndex] = {
            ...piece,
            x: firstCell.x,
            y: firstCell.y,
            px: targetX,
            py: targetY,
            position: targetHomeCell,
          };
          piecesRef.current = updatedPieces;
          setPieces(updatedPieces);

          currentGameCellRef.current[playerId] = targetHomeCell;

          if (onComplete) {
            onComplete();
          }
        }
      }
      animate();
    }

    function movePiece(playerId, steps) {
      if (isMoving) return;

      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      const currentCell = currentGameCellRef.current[playerId];
      let entryCell;
      let homePathPrefix;

      switch (player.color) {
        case "yellow":
          entryCell = 68;
          homePathPrefix = "Y";
          break;
        case "blue":
          entryCell = 17;
          homePathPrefix = "B";
          break;
        case "red":
          entryCell = 34;
          homePathPrefix = "R";
          break;
        case "green":
          entryCell = 51;
          homePathPrefix = "G";
          break;
        default:
          return;
      }

      // Check if the piece is already in the home path
      if (
        typeof currentCell === "string" &&
        currentCell[0] === homePathPrefix
      ) {
        const currentHomeNum = parseInt(currentCell.substring(1));
        const targetHomeNum = Math.min(7, currentHomeNum + steps);
        const stepsToMove = targetHomeNum - currentHomeNum;
        let currentStep = 0;

        function moveHomeStep() {
          if (currentStep >= stepsToMove) {
            isMoving = false;
            return;
          }

          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          moveToHomePath(
            nextHomeCell,
            1,
            currentStep < stepsToMove ? moveHomeStep : null,
          );
        }

        moveHomeStep();
        return;
      }

      // Check if the piece needs to enter the home path
      const distToEntry = (entryCell - currentCell + 68) % 68;

      if (distToEntry < steps) {
        const stepsToEntry = distToEntry;
        const stepsIntoHome = steps - stepsToEntry;
        const targetHomeNum = Math.min(7, stepsIntoHome);

        const moveSequence = [];
        for (let i = 1; i <= stepsToEntry; i++) {
          moveSequence.push(((currentCell + i - 1) % 68) + 1);
        }
        for (let i = 1; i <= targetHomeNum; i++) {
          moveSequence.push(homePathPrefix + i);
        }

        let currentMove = 0;
        function executeMove() {
          if (currentMove >= moveSequence.length) {
            isMoving = false;
            return;
          }
          const nextCell = moveSequence[currentMove];
          currentMove++;

          if (typeof nextCell === "string") {
            moveToHomePath(
              nextCell,
              1,
              currentMove < moveSequence.length ? executeMove : null,
            );
          } else {
            moveToGameCell(
              playerId,
              nextCell,
              currentMove < moveSequence.length ? executeMove : null,
            );
          }
        }
        executeMove();
      } else {
        const targetCellNumber = ((currentCell + steps - 1) % 68) + 1;
        moveToGameCell(playerId, targetCellNumber);
      }
    }

    // Store the movePiece function in a ref to access it in rollDice
    moveToIndexRef.current = movePiece;
  }, [gameStarted, pieceColor, players]); // Removed pieces from dependencies

  const rollDice = async () => {
    if (isRolling || !playerId) return;

    setIsRolling(true);

    try {
      // Call the mock API
      const response = await api.rollDice(playerId);

      if (response.success && diceResultRef.current) {
        diceResultRef.current.innerText = `🎲 Dice: ${response.data.dice}`;

        // Update current player
        const nextPlayer = players.find(
          (p) => p.id === response.data.nextPlayer,
        );
        setCurrentPlayer(nextPlayer);

        // Move the piece with the result from the server
        if (moveToIndexRef.current) {
          moveToIndexRef.current(playerId, response.data.dice);
        }
      } else if (!response.success && diceResultRef.current) {
        diceResultRef.current.innerText = response.error;
      }
    } catch (error) {
      console.error("Error rolling dice:", error);
      if (diceResultRef.current) {
        diceResultRef.current.innerText = "Error rolling dice";
      }
    } finally {
      setIsRolling(false);
    }
  };

  const toggleDebug = () => {
    setDebug(!debug);
  };

  const changeColor = () => {
    // In multiplayer mode, color is determined by player ID
    // This function now switches to the next player in sequence
    if (players.length <= 1) return;

    // Find current player index
    const currentPlayerIndex = players.findIndex((p) => p.id === playerId);

    // Calculate next player index (wrap around if at the end)
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    // Switch to the next player
    setPlayerId(nextPlayer.id);
    setPieceColor(nextPlayer.color);
  };

  return {
    canvasRef,
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
  };
}

```

/page.js
```js
import Game from "./components/Game";

export default function Page() {
  return <Game />;
}

```

/project-export.md
```md
/components/Controls.js
```js
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
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 sm:flex-col">
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

```

/components/Game.js
```js
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
    <div className="flex sm:flex-row flex-col items-center justify-center h-screen bg-gray-100 gap-2">
      <canvas
        ref={canvasRef}
        className="bg-white w-[100vmin] h-[100vmin] border-t-2 border-l-2 border-b-2 border-r-2 border-neutral-500 shadow-inner rounded-2xl"
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

```

/constants.js
```js

export const COLORS = {
  red: "rgba(220, 38, 38, 0.7)",
  blue: "rgba(59, 130, 246, 0.7)",
  green: "rgba(34, 197, 94, 0.7)",
  yellow: "rgba(234, 179, 8, 0.7)",
  black: "rgba(0, 0, 0, 1)",
};

export const GRID_SIZE = 20;
export const CORNER_SIZE = 7;
export const HOME_SIZE = 4;

export const START_CELLS = {
  blue: 22,
  yellow: 5,
  red: 39,
  green: 56,
};

export const SAFE_CELLS = [12, 17, 29, 34, 46, 51, 63, 68];

```

/drawing.js
```js
import {
  COLORS,
  GRID_SIZE,
  CORNER_SIZE,
  HOME_SIZE,
  START_CELLS,
  SAFE_CELLS,
} from "./constants";

// Utility functions
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.fillStyle = "gold";
  ctx.fill();
}

// Drawing functions for board components
const BoardComponents = {
  drawAvatarBackgroundCircle(ctx, x, y, size, color, cellSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    const circleRadius = 2 * cellSize;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    return { x: x + size / 2, y: y + size / 2, radius: circleRadius };
  },

  drawCornerCircles(ctx, centerX, centerY, color, circleRadius) {
    const outerCircleRadius = circleRadius * 0.3;
    const outerCircleDistance = circleRadius * 1;

    // To rectangular positioning:
    const positions = [
      { x: centerX - outerCircleDistance, y: centerY - outerCircleDistance }, // Top-left
      { x: centerX + outerCircleDistance, y: centerY - outerCircleDistance }, // Top-right
      { x: centerX - outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-left
      { x: centerX + outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-right
    ];

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Border color
    ctx.lineWidth = 2; // Border width

    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, outerCircleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke(); // Draw the border
    });
  },

  drawHomeArea(ctx, homeStartX, homeStartY, cellSize) {
    ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
    ctx.fillRect(
      homeStartX * cellSize,
      homeStartY * cellSize,
      HOME_SIZE * cellSize,
      HOME_SIZE * cellSize,
    );
  },

  drawColoredTail(ctx, homeStartX, homeStartY, cellSize, direction) {
    const tailWidth = 2 * cellSize;
    const tailLength = 7 * cellSize;

    ctx.fillStyle = COLORS[direction];

    switch (direction) {
      case "red": // Upward
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY - 7) * cellSize,
          tailWidth,
          tailLength,
        );
        break;
      case "blue": // Rightward
        ctx.fillRect(
          (homeStartX + HOME_SIZE) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth,
        );
        break;
      case "yellow": // Downward
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY + HOME_SIZE) * cellSize,
          tailWidth,
          tailLength,
        );
        break;
      case "green": // Leftward
        ctx.fillRect(
          (homeStartX - 7) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth,
        );
        break;
    }
  },

  drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize) {
    const homeX = homeStartX * cellSize;
    const homeY = homeStartY * cellSize;
    const homeWidth = HOME_SIZE * cellSize;
    const homeHeight = HOME_SIZE * cellSize;
    const centerX = homeX + homeWidth / 2;
    const centerY = homeY + homeHeight / 2;

    // Top triangle (Red)
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.moveTo(centerX, homeY + homeHeight / 2);
    ctx.lineTo(homeX, homeY);
    ctx.lineTo(homeX + homeWidth, homeY);
    ctx.closePath();
    ctx.fill();

    // Right triangle (Blue)
    ctx.fillStyle = COLORS.blue;
    ctx.beginPath();
    ctx.moveTo(homeX + homeWidth / 2, centerY);
    ctx.lineTo(homeX + homeWidth, homeY);
    ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();

    // Bottom triangle (Yellow)
    ctx.fillStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.moveTo(centerX, homeY + homeHeight / 2);
    ctx.lineTo(homeX, homeY + homeHeight);
    ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();

    // Left triangle (Green)
    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.moveTo(homeX + homeWidth / 2, centerY);
    ctx.lineTo(homeX, homeY);
    ctx.lineTo(homeX, homeY + homeHeight);
    ctx.closePath();
    ctx.fill();
  },

  drawGameCell(
    ctx,
    cellNumber,
    firstCell,
    secondCell,
    cellSize,
    startCellColors,
    rotation,
  ) {
    const isHorizontal = firstCell.y === secondCell.y;

    let x, y, width, height;

    if (isHorizontal) {
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = 2 * cellSize;
      height = cellSize;
    } else {
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = cellSize;
      height = 2 * cellSize;
    }

    // Draw background
    const cellNum = parseInt(cellNumber);
    ctx.fillStyle = startCellColors[cellNum] || "rgba(255, 255, 255, 0)";
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Special border cases
    switch (cellNum) {
      case 8:
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        ctx.lineTo(x + width / 2, y);
        break;
      case 9:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x, y);
        break;
      case 25:
        ctx.moveTo(x + width, y);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y);
        break;
      case 26:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.moveTo(x + width / 2, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 42:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width / 2, y + height);
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 43:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.moveTo(x + width, y + height / 2);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 59:
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height / 2);
        ctx.moveTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      case 60:
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y);
        break;
      default:
        ctx.rect(x, y, width, height);
        break;
    }
    ctx.stroke();

    // Draw cell number or star
    const cellCenterX = x + width / 2;
    const cellCenterY = y + height / 2;

    ctx.save();
    ctx.translate(cellCenterX, cellCenterY);
    ctx.rotate(-rotation);

    if (SAFE_CELLS.includes(cellNum)) {
      drawStar(ctx, 0, 0, 5, cellSize / 4, cellSize / 8);
    } else {
      ctx.fillStyle = "#333";
      ctx.font = `bold ${cellSize / 3}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cellNumber, 0, 0);
    }
    ctx.restore();
  },

  drawDiagonalLines(ctx, path, cellSize) {
    const drawDiagonal = (cellIndex, start, end) => {
      const cell = path[cellIndex];
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      ctx.beginPath();
      ctx.moveTo(x + start.x * cellSize, y + start.y * cellSize);
      ctx.lineTo(x + end.x * cellSize, y + end.y * cellSize);
      ctx.stroke();
    };

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;

    drawDiagonal(252, { x: 0, y: 0 }, { x: 1, y: 1 });
    drawDiagonal(152, { x: 0, y: 1 }, { x: 1, y: 0 });
    drawDiagonal(147, { x: 0, y: 0 }, { x: 1, y: 1 });
    drawDiagonal(247, { x: 1, y: 0 }, { x: 0, y: 1 });
  },

  drawDebugGrid(ctx, cellSize) {
    ctx.strokeStyle = "#aaa";
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  },

  drawDebugCellNumbers(ctx, path, cellSize, rotation) {
    ctx.fillStyle = "#666";
    ctx.font = `${cellSize / 5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      const x = cell.x * cellSize + cellSize / 2;
      const y = cell.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-rotation);
      ctx.fillText(cell.index, 0, 0);
      ctx.restore();
    }
  },

  drawPiece(ctx, piece, cellSize, pieceColor) {
    ctx.fillStyle = COLORS[pieceColor];
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(piece.px, piece.py, cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  drawAvatar(ctx, x, y, circleRadius, avatarImageRef) {
    const avatarSize = circleRadius * 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      avatarImageRef.current,
      x - avatarSize / 2,
      y - avatarSize / 2,
      avatarSize,
      avatarSize,
    );
    ctx.restore();
  },
};

// Main drawing function
export function drawBoard(
  ctx,
  canvas,
  pieceColor,
  gameCells,
  path,
  debug,
  piece,
  imageLoaded,
  avatarImageRef,
) {
  const size = canvas.width / window.devicePixelRatio;
  const cellSize = size / GRID_SIZE;
  ctx.clearRect(0, 0, size, size);

  ctx.save();

  // Set up rotation based on player color
  const boardCenterX = size / 2;
  const boardCenterY = size / 2;
  ctx.translate(boardCenterX, boardCenterY);

  let rotation = 0;
  switch (pieceColor) {
    case "red":
      rotation = Math.PI;
      break;
    case "blue":
      rotation = Math.PI / 2;
      break;
    case "green":
      rotation = -Math.PI / 2;
      break;
  }
  ctx.rotate(rotation);
  ctx.translate(-boardCenterX, -boardCenterY);

  // Define start cell colors
  const startCellColors = {
    5: COLORS.yellow,
    22: COLORS.blue,
    39: COLORS.red,
    56: COLORS.green,
  };

  const cornerPixelSize = CORNER_SIZE * cellSize;

  // Draw corners and their circles
  const corners = [
    { x: 0, y: 0, color: COLORS.red },
    { x: (GRID_SIZE - CORNER_SIZE) * cellSize, y: 0, color: COLORS.blue },
    { x: 0, y: (GRID_SIZE - CORNER_SIZE) * cellSize, color: COLORS.green },
    {
      x: (GRID_SIZE - CORNER_SIZE) * cellSize,
      y: (GRID_SIZE - CORNER_SIZE) * cellSize,
      color: COLORS.yellow,
    },
  ];

  corners.forEach((corner) => {
    const { x, y, radius } = BoardComponents.drawAvatarBackgroundCircle(
      ctx,
      corner.x,
      corner.y,
      cornerPixelSize,
      corner.color,
      cellSize,
    );

    BoardComponents.drawCornerCircles(ctx, x, y, corner.color, radius);
  });

  // Draw home area
  const homeStartX = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  const homeStartY = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  BoardComponents.drawHomeArea(ctx, homeStartX, homeStartY, cellSize);

  // Draw colored tails
  ["red", "blue", "yellow", "green"].forEach((color) => {
    BoardComponents.drawColoredTail(
      ctx,
      homeStartX,
      homeStartY,
      cellSize,
      color,
    );
  });

  // Draw home triangles
  BoardComponents.drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize);

  // Draw game cells
  for (const [cellNumber, indices] of Object.entries(gameCells)) {
    const firstCell = path[indices[0]];
    const secondCell = path[indices[1]];
    BoardComponents.drawGameCell(
      ctx,
      cellNumber,
      firstCell,
      secondCell,
      cellSize,
      startCellColors,
      rotation,
    );
  }

  // Draw diagonal lines
  BoardComponents.drawDiagonalLines(ctx, path, cellSize);

  // Draw debug elements if needed
  if (debug) {
    BoardComponents.drawDebugGrid(ctx, cellSize);
    BoardComponents.drawDebugCellNumbers(ctx, path, cellSize, rotation);
  }

  // Draw piece
  BoardComponents.drawPiece(ctx, piece, cellSize, pieceColor);

  ctx.restore();

  // Draw avatars (outside the rotated context)
  if (imageLoaded && avatarImageRef.current) {
    const circleRadius = 2 * cellSize;

    corners.forEach((corner) => {
      const x = corner.x + cornerPixelSize / 2;
      const y = corner.y + cornerPixelSize / 2;
      BoardComponents.drawAvatar(ctx, x, y, circleRadius, avatarImageRef);
    });
  }
}

```

/game-logic.js
```js

import { GRID_SIZE } from "./constants";

export function buildPath() {
  const path = [];
  // Create a linear path from left to right, top to bottom
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    let row = Math.floor(i / GRID_SIZE);
    let col = i % GRID_SIZE;
    path.push({ x: col, y: row, index: i });
  }

  // Create game cells mapping (Path for piece movement)
  const gameCells = {};
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

  //Assign code number to tails
  //for yellow tail (cells merged horizontally)
  gameCells["Y1"] = [369, 370]; // Cell Y1
  gameCells["Y2"] = [349, 350]; // Cell Y2
  gameCells["Y3"] = [329, 330]; // Cell Y3
  gameCells["Y4"] = [309, 310]; // Cell Y4
  gameCells["Y5"] = [289, 290]; // Cell Y5
  gameCells["Y6"] = [269, 270]; // Cell Y6
  gameCells["Y7"] = [249, 250]; // Cell Y7

  //for blue tail (cells merged vertically)
  gameCells["B1"] = [198, 218]; // Cell B1
  gameCells["B2"] = [197, 217]; // Cell B2
  gameCells["B3"] = [196, 216]; // Cell B3
  gameCells["B4"] = [195, 215]; // Cell B4
  gameCells["B5"] = [194, 214]; // Cell B5
  gameCells["B6"] = [193, 213]; // Cell B6
  gameCells["B7"] = [192, 212]; // Cell B7

  //for red tail (cells merged horizontally)
  gameCells["R1"] = [29, 30]; // Cell R1
  gameCells["R2"] = [49, 50]; // Cell R2
  gameCells["R3"] = [69, 70]; // Cell R3
  gameCells["R4"] = [89, 90]; // Cell R4
  gameCells["R5"] = [109, 110]; // Cell R5
  gameCells["R6"] = [129, 130]; // Cell R6
  gameCells["R7"] = [149, 150]; // Cell R7

  //for green tail (cells merged vertically)
  gameCells["G1"] = [181, 201]; // Cell G1
  gameCells["G2"] = [182, 202]; // Cell G2
  gameCells["G3"] = [183, 203]; // Cell G3
  gameCells["G4"] = [184, 204]; // Cell G4
  gameCells["G5"] = [185, 205]; // Cell G5
  gameCells["G6"] = [186, 206]; // Cell G6
  gameCells["G7"] = [187, 207]; // Cell G7

  return { path, gameCells };
}

```

/hooks/useGame.js
```js

"use client";
import { useEffect, useRef, useState } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing";
import { GRID_SIZE, START_CELLS } from "../constants";

export function useGame() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const [debug, setDebug] = useState(false);
  const [pieceColor, setPieceColor] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const avatarImageRef = useRef(null);
  const moveToIndexRef = useRef(null);

  useEffect(() => {
    const colorOptions = ["red", "blue", "green", "yellow"];
    const randomColor =
      colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setPieceColor(randomColor);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/avatar.png";
    img.onload = () => {
      avatarImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load avatar image");
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", 50, 50);

      const placeholderImg = new Image();
      placeholderImg.src = canvas.toDataURL();
      placeholderImg.onload = () => {
        avatarImageRef.current = placeholderImg;
        setImageLoaded(true);
      };
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { path, gameCells } = buildPath();

    let piece = { x: 0, y: 0, px: 0, py: 0 };
    let isMoving = false;
    const currentGameCellRef = { current: 1 };

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

    function callDrawBoard() {
      drawBoard(
        ctx,
        canvas,
        pieceColor,
        gameCells,
        path,
        debug,
        piece,
        imageLoaded,
        avatarImageRef,
      );
    }

    function moveToGameCell(targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;
      const currentCell = currentGameCellRef.current;

      const stepsToMove = (targetCellNumber - currentCell + 68) % 68;

      let currentStepInMove = 0;

      function moveStep() {
        if (currentStepInMove >= stepsToMove) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        currentStepInMove++;
        const nextCellNumber = ((currentCell + currentStepInMove - 1) % 68) + 1;

        if (!gameCells[nextCellNumber]) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        const targetIndices = gameCells[nextCellNumber];
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];

        const isHorizontal = firstCell.y === secondCell.y;

        const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
        let targetX, targetY;

        if (isHorizontal) {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        } else {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        }

        function animate() {
          let dx = targetX - piece.px;
          let dy = targetY - piece.py;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            piece.px += dx * 0.3;
            piece.py += dy * 0.3;
            callDrawBoard();
            requestAnimationFrame(animate);
          } else {
            piece.px = targetX;
            piece.py = targetY;
            currentGameCellRef.current = nextCellNumber;
            callDrawBoard();

            setTimeout(moveStep, 10);
          }
        }
        animate();
      }

      moveStep();
    }

    function moveToHomePath(targetHomeCell, stepsRemaining, onComplete) {
      if (!gameCells[targetHomeCell]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;

      const targetIndices = gameCells[targetHomeCell];
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

      const isHorizontal = firstCell.y === secondCell.y;

      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
      let targetX, targetY;

      if (isHorizontal) {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      function animate() {
        let dx = targetX - piece.px;
        let dy = targetY - piece.py;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          piece.px += dx * 0.3;
          piece.py += dy * 0.3;
          callDrawBoard();
          requestAnimationFrame(animate);
        } else {
          piece.px = targetX;
          piece.py = targetY;
          currentGameCellRef.current = targetHomeCell;
          isMoving = false;
          callDrawBoard();

          if (onComplete) {
            onComplete();
          }
        }
      }
      animate();
    }

    function movePiece(steps) {
      if (isMoving) return;

      const currentCell = currentGameCellRef.current;
      let entryCell;
      let homePathPrefix;

      switch (pieceColor) {
        case "yellow":
          entryCell = 68;
          homePathPrefix = "Y";
          break;
        case "blue":
          entryCell = 17;
          homePathPrefix = "B";
          break;
        case "red":
          entryCell = 34;
          homePathPrefix = "R";
          break;
        case "green":
          entryCell = 51;
          homePathPrefix = "G";
          break;
        default:
          return;
      }

      if (
        typeof currentCell === "string" &&
        currentCell[0] === homePathPrefix
      ) {
        const currentHomeNum = parseInt(currentCell.substring(1));
        const targetHomeNum = Math.min(7, currentHomeNum + steps);
        const stepsToMove = targetHomeNum - currentHomeNum;
        let currentStep = 0;

        function moveHomeStep() {
          if (currentStep >= stepsToMove) return;

          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          moveToHomePath(nextHomeCell, 1);

          if (currentStep < stepsToMove) {
            setTimeout(moveHomeStep, 300);
          }
        }

        moveHomeStep();
        return;
      }

      const distToEntry = (entryCell - currentCell + 68) % 68;

      if (distToEntry < steps) {
        const stepsToEntry = distToEntry;
        const stepsIntoHome = steps - stepsToEntry;
        const targetHomeNum = Math.min(7, stepsIntoHome);

        const moveSequence = [];
        for (let i = 1; i <= stepsToEntry; i++) {
          moveSequence.push(((currentCell + i - 1) % 68) + 1);
        }
        for (let i = 1; i <= targetHomeNum; i++) {
          moveSequence.push(homePathPrefix + i);
        }

        let currentMove = 0;
        function executeMove() {
          if (currentMove >= moveSequence.length) {
            isMoving = false;
            return;
          }
          const nextCell = moveSequence[currentMove];
          currentMove++;

          if (typeof nextCell === "string") {
            moveToHomePath(nextCell, 1, executeMove);
          } else {
            moveToGameCell(nextCell, executeMove);
          }
        }
        executeMove();
      } else {
        const targetCellNumber = ((currentCell + steps - 1) % 68) + 1;
        moveToGameCell(targetCellNumber);
      }
    }

    moveToIndexRef.current = movePiece;

    function init() {
      resizeCanvas();
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

      const startCell = START_CELLS[pieceColor] || 1;

      const firstCellIndices = gameCells[startCell];
      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

      const isHorizontal = firstCell.y === secondCell.y;

      piece.x = firstCell.x;
      piece.y = firstCell.y;

      if (isHorizontal) {
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      currentGameCellRef.current = startCell;
      callDrawBoard();
    }

    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [debug, pieceColor, imageLoaded]);

  const rollDice = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    if (diceResultRef.current) {
      diceResultRef.current.innerText = `🎲 Dice: ${dice}`;
    }

    if (moveToIndexRef.current) {
      moveToIndexRef.current(dice);
    }
  };

  const toggleDebug = () => {
    setDebug(!debug);
  };

  const changeColor = () => {
    const colorOptions = ["red", "blue", "green", "yellow"];
    const randomColor =
      colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setPieceColor(randomColor);
  };

  return {
    canvasRef,
    diceResultRef,
    debug,
    pieceColor,
    imageLoaded,
    rollDice,
    toggleDebug,
    changeColor,
  };
}

```

/page.js
```js
import Game from "./components/Game";

export default function Page() {
  return <Game />;
}

```

```

/services/api.js
```js
// /services/api.js
import { PLAYERS } from "../constants";

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock game state
let gameState = {
  players: [],
  currentPlayerIndex: 0,
};

// Mock API endpoints
export const api = {
  // Get current game state
  getGameState: async () => {
    await delay(300);
    return {
      success: true,
      data: {
        ...gameState,
        players: gameState.players.map((player) => ({
          ...player,
          color: PLAYERS[player.id].color,
        })),
      },
    };
  },

  // Join game as a player
  joinGame: async (playerId) => {
    await delay(500);

    // Check if player already exists
    if (gameState.players.find((p) => p.id === playerId)) {
      return {
        success: false,
        error: "Player already in game",
      };
    }

    // Check if game is full
    if (gameState.players.length >= 4) {
      return {
        success: false,
        error: "Game is full",
      };
    }

    // Add player to game
    gameState.players.push({
      id: playerId,
      color: PLAYERS[playerId].color,
      position: 0,
      startCell: PLAYERS[playerId].startCell,
    });

    return {
      success: true,
      data: {
        player: {
          id: playerId,
          color: PLAYERS[playerId].color,
          startCell: PLAYERS[playerId].startCell,
        },
        gameState: {
          ...gameState,
          players: gameState.players.map((player) => ({
            ...player,
            color: PLAYERS[player.id].color,
          })),
        },
      },
    };
  },

  // Leave game
  leaveGame: async (playerId) => {
    await delay(300);

    gameState.players = gameState.players.filter((p) => p.id !== playerId);

    // Adjust current player index if needed
    if (
      gameState.currentPlayerIndex >= gameState.players.length &&
      gameState.players.length > 0
    ) {
      gameState.currentPlayerIndex = 0;
    }

    return {
      success: true,
      data: {
        gameState: {
          ...gameState,
          players: gameState.players.map((player) => ({
            ...player,
            color: PLAYERS[player.id].color,
          })),
        },
      },
    };
  },

  // Simulate rolling dice on the server
  rollDice: async (playerId) => {
    // await delay(500);

    // Check if it's this player's turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return {
        success: false,
        error: "Not your turn",
      };
    }

    // Generate random dice result
    // const result = Math.floor(Math.random() * 6) + 1;
    const result = 6;

    // Update player position (simplified for this example)
    currentPlayer.position = (currentPlayer.position + result) % 68;

    // Move to next player
    gameState.currentPlayerIndex =
      (gameState.currentPlayerIndex + 1) % gameState.players.length;

    // Return response in the format a real API might use
    return {
      success: true,
      data: {
        dice: result,
        timestamp: new Date().toISOString(),
        player: playerId,
        newPosition: currentPlayer.position,
        nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
      },
    };
  },

  // Reset game
  resetGame: async () => {
    await delay(300);

    gameState = {
      players: [],
      currentPlayerIndex: 0,
    };

    return {
      success: true,
      data: gameState,
    };
  },
};

```
