// Minimal drawBoard (moved from features/parcheesi/lib/drawing/drawBoard.js)
import {
  COLORS,
  GRID_SIZE,
  TOKEN_COLORS,
  HOME_POSITIONS,
} from '../config/constants.js';

export function drawBoard(
  ctx,
  canvas,
  pieceColor,
  gameCells,
  path,
  debug,
  tokens,
  imageLoaded,
  avatarImageRef,
  players,
  selectedTokenId,
  frame
) {
  if (!ctx || !canvas) return;
  const size = canvas.width / window.devicePixelRatio;
  const cellSize = size / GRID_SIZE;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw game cells (the track)
  Object.entries(gameCells).forEach(([key, indices]) => {
    if (!Array.isArray(indices)) return;
    const first = path[indices[0]];
    const second = path[indices[1]];
    if (!first || !second) return;
    const horizontal = first.y === second.y;
    const x = first.x * cellSize;
    const y = first.y * cellSize;
    const w = horizontal ? 2 * cellSize : cellSize;
    const h = horizontal ? cellSize : 2 * cellSize;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x, y, w, h);

    if (debug) {
      ctx.fillStyle = '#334155';
      ctx.font = `${Math.max(10, cellSize * 0.4)}px sans-serif`;
      ctx.fillText(String(key), x + 4, y + 12);
    }
  });

  // Draw tokens
  if (tokens && Array.isArray(tokens)) {
    tokens.forEach((token) => {
      const isSelected = token.tokenId === selectedTokenId;
      drawToken(ctx, token, cellSize, frame, isSelected);
    });
  }

  // Draw four black home markers (one per corner) so homes are visible like classic Ludo
  try {
    const markerOffset = Math.max(2, Math.floor(cellSize * 2));
    const r = Math.max(6, Math.floor(cellSize * 0.6));
    const positions = [
      { x: markerOffset, y: markerOffset }, // top-left
      { x: size - markerOffset, y: markerOffset }, // top-right
      { x: markerOffset, y: size - markerOffset }, // bottom-left
      { x: size - markerOffset, y: size - markerOffset }, // bottom-right
    ];

    ctx.save();
    ctx.fillStyle = '#000';
    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } catch (e) {
    // Non-fatal: drawing marker failed
    console.warn('drawBoard: failed to draw home markers', e);
  }
}

function drawToken(ctx, token, cellSize, frame, isSelected) {
  if (!token || !token.color) return;

  const pulse = 0.5 + 0.5 * Math.sin(frame / 20);
  const radius = cellSize * 0.35;

  // Darker token color for visibility
  const tokenColor = TOKEN_COLORS[token.color] || COLORS[token.color] || '#000';

  ctx.save();

  // Draw token shadow
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.arc(token.px + 2, token.py + 2, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw token body
  ctx.beginPath();
  ctx.fillStyle = tokenColor;
  ctx.arc(token.px, token.py, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw token highlight (if selectable/selected)
  if (token.selectable || isSelected) {
    ctx.beginPath();
    ctx.strokeStyle = isSelected ? '#f59e0b' : '#fff'; // Amber for selected, white for selectable
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    ctx.arc(token.px, token.py, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Draw token border
  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.arc(token.px, token.py, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
