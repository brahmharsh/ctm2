// /drawing/drawBoard.js
import { COLORS, GRID_SIZE, HOME_SIZE, CORNER_SIZE, PLAYERS, PLAYER_POSITIONS } from "../constants";
import { BoardComponents } from "./boardComponents";
import { drawPiece, drawAvatar, drawPlayerName } from "./pieces";

/**
 * Main board drawing function with safe fallbacks and debug logs
 */
export function drawBoard(
  ctx,
  canvas,
  pieceColor,
  gameCells = {},
  path = [],
  debug = false,
  pieces = [],
  imageLoaded = false,
  avatarImageRef = null,
  players = [],
  animationFrame = 0
) {
  if (!ctx || !canvas) {
    console.warn("Canvas or context not available");
    return;
  }

  // Canvas size check
  const size = canvas.width / window.devicePixelRatio;
  if (size <= 0) {
    console.warn("Canvas size is zero, nothing will be drawn");
    return;
  }

  const cellSize = size / GRID_SIZE;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  ctx.save();

  // Rotate board based on current player's color
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

  const startCellColors = { 5: COLORS.yellow, 22: COLORS.blue, 39: COLORS.red, 56: COLORS.green };
  const cornerPixelSize = CORNER_SIZE * cellSize;

  // Draw corners
// Draw corners + starting pieces
Object.keys(PLAYER_POSITIONS).forEach((playerId) => {
  const position = PLAYER_POSITIONS[playerId];
  const color = COLORS[PLAYERS[playerId]?.color] || "gray";
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Draw the big avatar background circle
  const { x: centerX, y: centerY, radius } = BoardComponents.drawAvatarBackgroundCircle(
    ctx,
    x,
    y,
    cornerPixelSize,
    color,
    cellSize
  );

const cornerPositions = BoardComponents.drawCornerCircles(ctx, centerX, centerY, color, radius);

cornerPositions.forEach((pos, index) => {
  // const piece = {
  //   px: pos.x,
  //   py: pos.y,
  //   color: color,
  //   id: `${playerId}_piece_${index}`,
  // };
  // drawPiece(ctx, piece, cellSize, piece.color, piece.color === pieceColor, animationFrame);
});


  // Draw player name if debug
  if (debug) {
    const player = players.find((p) => p.id === playerId);
    if (player) drawPlayerName(ctx, centerX, centerY - radius - cellSize / 2, player.id, cellSize);
  }
});


  // Draw home area
  const homeStartX = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  const homeStartY = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
  BoardComponents.drawHomeArea(ctx, homeStartX, homeStartY, cellSize);
  ["red", "blue", "yellow", "green"].forEach((color) =>
    BoardComponents.drawColoredTail(ctx, homeStartX, homeStartY, cellSize, color)
  );
  BoardComponents.drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize);

  // Draw game cells safely
  if (path.length === 0 || Object.keys(gameCells).length === 0) {
    if (debug) console.warn("Path or gameCells is empty");
  } else {
    Object.entries(gameCells).forEach(([cellNumber, indices]) => {
      const firstCell = path[indices[0]];
      const secondCell = path[indices[1]];
      if (firstCell && secondCell) {
        BoardComponents.drawGameCell(ctx, cellNumber, firstCell, secondCell, cellSize, startCellColors, rotation);
      }
    });
  }

  // Draw diagonal lines
  if (path.length > 0) BoardComponents.drawDiagonalLines(ctx, path, cellSize);

  // Debug overlay
  if (debug) {
    BoardComponents.drawDebugGrid(ctx, cellSize);
    if (path.length > 0) BoardComponents.drawDebugCellNumbers(ctx, path, cellSize, rotation);
  }

  // Draw all pieces safely
  if (!Array.isArray(pieces)) pieces = [];
  pieces.forEach((piece) => {
    if (piece) drawPiece(ctx, piece, cellSize, piece.color, piece.color === pieceColor, animationFrame);
  });

  ctx.restore();

  // Draw inactive player overlays
  if (players.length === 2 || players.length === 3) {
    const inactivePlayers = [];
    if (players.length === 2) inactivePlayers.push("red", "green");
    if (players.length === 3) inactivePlayers.push("green");

    inactivePlayers.forEach((color) => {
      let x = 0, y = 0;
      switch (color) {
        case "red": x = 0; y = 0; break;
        case "green": x = 0; y = (GRID_SIZE - CORNER_SIZE) * cellSize; break;
      }
      BoardComponents.drawInactivePlayerOverlay(ctx, x, y, cornerPixelSize, cellSize);
    });
  }

  // Draw avatars
  if (imageLoaded && avatarImageRef?.current) {
    Object.keys(PLAYER_POSITIONS).forEach((playerId) => {
      const position = PLAYER_POSITIONS[playerId];
      const x = position.x * cellSize + cornerPixelSize / 2;
      const y = position.y * cellSize + cornerPixelSize / 2;

      drawAvatar(ctx, x, y, 2 * cellSize, avatarImageRef);

      if (debug) {
        const player = players.find((p) => p.id === playerId);
        if (player) drawPlayerName(ctx, x, y - 2 * cellSize - cellSize / 2, player.id, cellSize);
      }
    });
  }

  if (debug) console.log("Board drawn, pieces:", pieces.length, "players:", players.length);
}
