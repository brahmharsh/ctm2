// /drawing/boardComponents.js
import { COLORS, GRID_SIZE, HOME_SIZE, CORNER_SIZE, SAFE_CELLS } from "../constants";
import { drawStar } from "./utils";

export const BoardComponents = {
  drawHomeArea(ctx, homeStartX, homeStartY, cellSize) {
    ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
    ctx.fillRect(
      homeStartX * cellSize,
      homeStartY * cellSize,
      HOME_SIZE * cellSize,
      HOME_SIZE * cellSize
    );
  },

  drawColoredTail(ctx, homeStartX, homeStartY, cellSize, direction) {
    const tailWidth = 2 * cellSize;
    const tailLength = 7 * cellSize;

    ctx.fillStyle = COLORS[direction];

    switch (direction) {
      case "red": // Up
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY - 7) * cellSize,
          tailWidth,
          tailLength
        );
        break;
      case "blue": // Right
        ctx.fillRect(
          (homeStartX + HOME_SIZE) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth
        );
        break;
      case "yellow": // Down
        ctx.fillRect(
          (homeStartX + 1) * cellSize,
          (homeStartY + HOME_SIZE) * cellSize,
          tailWidth,
          tailLength
        );
        break;
      case "green": // Left
        ctx.fillRect(
          (homeStartX - 7) * cellSize,
          (homeStartY + 1) * cellSize,
          tailLength,
          tailWidth
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

  drawCornerCircles(ctx, centerX, centerY, color, circleRadius) {
    const outerCircleRadius = circleRadius * 0.3;
    const outerCircleDistance = circleRadius;

    const positions = [
      { x: centerX - outerCircleDistance, y: centerY - outerCircleDistance },
      { x: centerX + outerCircleDistance, y: centerY - outerCircleDistance },
      { x: centerX - outerCircleDistance, y: centerY + outerCircleDistance },
      { x: centerX + outerCircleDistance, y: centerY + outerCircleDistance },
    ];

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;

    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, outerCircleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    return positions;
  },

  drawGameCell(ctx, cellNumber, firstCell, secondCell, cellSize, startCellColors, rotation) {
    const isHorizontal = firstCell.y === secondCell.y;
    let x = firstCell.x * cellSize;
    let y = firstCell.y * cellSize;
    let width = isHorizontal ? 2 * cellSize : cellSize;
    let height = isHorizontal ? cellSize : 2 * cellSize;

    const cellNum = parseInt(cellNumber);
    ctx.fillStyle = startCellColors[cellNum] || "rgba(255,255,255,0)";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, width, height);

    // Draw number or star
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
      ctx.beginPath();
      ctx.moveTo(cell.x * cellSize + start.x * cellSize, cell.y * cellSize + start.y * cellSize);
      ctx.lineTo(cell.x * cellSize + end.x * cellSize, cell.y * cellSize + end.y * cellSize);
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
    path.forEach((cell) => {
      const x = cell.x * cellSize + cellSize / 2;
      const y = cell.y * cellSize + cellSize / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-rotation);
      ctx.fillText(cell.index, 0, 0);
      ctx.restore();
    });
  },

  drawAvatarBackgroundCircle(ctx, x, y, size, color, cellSize) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    const circleRadius = 2 * cellSize;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    return { x: x + size / 2, y: y + size / 2, radius: circleRadius };
  },

  drawInactivePlayerOverlay(ctx, x, y, size, cellSize) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `bold ${cellSize * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✕", x + size / 2, y + size / 2);
  },
};
