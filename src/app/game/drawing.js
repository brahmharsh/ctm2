
import {
  COLORS,
  GRID_SIZE,
  CORNER_SIZE,
  HOME_SIZE,
  START_CELLS,
  SAFE_CELLS,
} from "./constants";

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

  // Rotate board based on player color
  const boardCenterX = size / 2;
  const boardCenterY = size / 2;
  ctx.translate(boardCenterX, boardCenterY);

  let rotation = 0;
  switch (pieceColor) {
    case "red":
      rotation = Math.PI; // 180 degrees
      break;
    case "blue":
      rotation = Math.PI / 2; // 90 degrees
      break;
    case "green":
      rotation = -Math.PI / 2; // -90 degrees
      break;
    // Yellow is default, no rotation
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

  // Draw colored corners (7x7 squares) with circles
  const cornerPixelSize = CORNER_SIZE * cellSize;
  const circleRadius = 2 * cellSize;

  // Top left - Red
  let x = 0;
  let y = 0;
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x, y, cornerPixelSize, cornerPixelSize);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(
    x + cornerPixelSize / 2,
    y + cornerPixelSize / 2,
    circleRadius,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Top right - Blue
  x = (GRID_SIZE - CORNER_SIZE) * cellSize;
  y = 0;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(x, y, cornerPixelSize, cornerPixelSize);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(
    x + cornerPixelSize / 2,
    y + cornerPixelSize / 2,
    circleRadius,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Bottom left - Green
  x = 0;
  y = (GRID_SIZE - CORNER_SIZE) * cellSize;
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x, y, cornerPixelSize, cornerPixelSize);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(
    x + cornerPixelSize / 2,
    y + cornerPixelSize / 2,
    circleRadius,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Bottom right - Yellow
  x = (GRID_SIZE - CORNER_SIZE) * cellSize;
  y = (GRID_SIZE - CORNER_SIZE) * cellSize;
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(x, y, cornerPixelSize, cornerPixelSize);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(
    x + cornerPixelSize / 2,
    y + cornerPixelSize / 2,
    circleRadius,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Draw home area (4x4 grey square in center)
  const homeStartX = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  const homeStartY = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
  ctx.fillRect(
    homeStartX * cellSize,
    homeStartY * cellSize,
    HOME_SIZE * cellSize,
    HOME_SIZE * cellSize,
  );

  // Draw colored tails extending from home area
  // Red tail (extending upward from home)
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(
    (homeStartX + 1) * cellSize,
    (homeStartY - 7) * cellSize,
    2 * cellSize,
    7 * cellSize,
  );

  // Blue tail (extending rightward from home)
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(
    (homeStartX + HOME_SIZE) * cellSize,
    (homeStartY + 1) * cellSize,
    7 * cellSize,
    2 * cellSize,
  );

  // Yellow tail (extending downward from home)
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(
    (homeStartX + 1) * cellSize,
    (homeStartY + HOME_SIZE) * cellSize,
    2 * cellSize,
    7 * cellSize,
  );

  // Green tail (extending leftward from home)
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(
    (homeStartX - 7) * cellSize,
    (homeStartY + 1) * cellSize,
    7 * cellSize,
    2 * cellSize,
  );

  // Draw 4 colored triangles in the home area
  const homeX = homeStartX * cellSize;
  const homeY = homeStartY * cellSize;
  const homeWidth = HOME_SIZE * cellSize;
  const homeHeight = HOME_SIZE * cellSize;

  // Calculate center point
  const centerX = homeX + homeWidth / 2;
  const centerY = homeY + homeHeight / 2;

  // Top triangle (Red) - pointing up (toward top-left corner)
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.moveTo(centerX, homeY + homeHeight / 2);
  ctx.lineTo(homeX, homeY);
  ctx.lineTo(homeX + homeWidth, homeY);
  ctx.closePath();
  ctx.fill();

  // Right triangle (Blue) - pointing right (toward top-right corner) -
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(homeX + homeWidth / 2, centerY);
  ctx.lineTo(homeX + homeWidth, homeY);
  ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
  ctx.closePath();
  ctx.fill();

  // Bottom triangle (Yellow) - pointing down (toward bottom-right corner)
  ctx.fillStyle = COLORS.yellow;
  ctx.beginPath();
  ctx.moveTo(centerX, homeY + homeHeight / 2);
  ctx.lineTo(homeX, homeY + homeHeight);
  ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
  ctx.closePath();
  ctx.fill();

  // Left triangle (Green) - pointing left (toward bottom-left corner)
  ctx.fillStyle = COLORS.green;
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
      // For horizontally merged cells (1-8, 26-33, 34-35, 36-42, 60-67, 68)
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = 2 * cellSize;
      height = cellSize;
    } else {
      // For vertically merged cells (9-16, 17-18, 19-25, 43-50, 51-52, 53-59)
      x = firstCell.x * cellSize;
      y = firstCell.y * cellSize;
      width = cellSize;
      height = 2 * cellSize;
    }

    // Draw the background for the combined cell
    const cellNum = parseInt(cellNumber);
    if (startCellColors[cellNum]) {
      ctx.fillStyle = startCellColors[cellNum];
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
    }
    ctx.fillRect(x, y, width, height);

    // Draw the border around the combined cell
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, width, height);

    // Draw the number or a star in the center of the combined cell
    const cellCenterX = x + width / 2;
    const cellCenterY = y + height / 2;

    ctx.save();
    ctx.translate(cellCenterX, cellCenterY);
    ctx.rotate(-rotation);

    if (SAFE_CELLS.includes(cellNum)) {
      drawStar(ctx, 0, 0, 5, cellSize / 4, cellSize / 8);
    } else {
      ctx.fillStyle = "#333";
      ctx.fillText(cellNumber, 0, 0);
    }
    ctx.restore();
  }

  // Draw debug cell numbers if debug mode is on
  if (debug) {
    // Draw grid
    ctx.strokeStyle = "#aaa";
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
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

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-rotation);
      ctx.fillText(cell.index, 0, 0);
      ctx.restore();
    }
  }

  // Draw piece with the assigned color
  ctx.fillStyle = COLORS[pieceColor];
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(piece.px, piece.py, cellSize / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // Draw avatars in corner circles (outside the rotated context)
  if (imageLoaded && avatarImageRef.current) {
    const avatarSize = circleRadius * 1.6; // Make avatar slightly smaller than circle

    // Top left - Red corner
    let x = 0 + cornerPixelSize / 2;
    let y = 0 + cornerPixelSize / 2;
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

    // Top right - Blue corner
    x = (GRID_SIZE - CORNER_SIZE) * cellSize + cornerPixelSize / 2;
    y = 0 + cornerPixelSize / 2;
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

    // Bottom left - Green corner
    x = 0 + cornerPixelSize / 2;
    y = (GRID_SIZE - CORNER_SIZE) * cellSize + cornerPixelSize / 2;
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

    // Bottom right - Yellow corner
    x = (GRID_SIZE - CORNER_SIZE) * cellSize + cornerPixelSize / 2;
    y = (GRID_SIZE - CORNER_SIZE) * cellSize + cornerPixelSize / 2;
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
  }
}
