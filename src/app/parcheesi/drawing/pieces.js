// /drawing/pieces.js
import { COLORS } from "../constants";

/**
 * Draw a player's piece on the board
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} piece - Piece data { px, py, color }
 * @param {number} cellSize 
 * @param {string} pieceColor 
 * @param {boolean} isCurrentPlayer 
 * @param {number} animationFrame 
 */
export function drawPiece(ctx, piece, cellSize, pieceColor, isCurrentPlayer = false, animationFrame = 0) {
  const baseRadius = cellSize / 3;
  const borderWidth = 2;
  const borderColor = "rgba(0,0,0,1)";
  
  // Breathing effect for current player's piece
  let radius = baseRadius;
  if (isCurrentPlayer) {
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

  // Subtle glow for current player
  if (isCurrentPlayer) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(piece.px, piece.py, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draw a player's avatar image
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} circleRadius 
 * @param {React.RefObject} avatarImageRef 
 */
export function drawAvatar(ctx, x, y, circleRadius, avatarImageRef) {
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
    avatarSize
  );
  ctx.restore();
}

/**
 * Draw player name above their piece/avatar
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {string} playerName 
 * @param {number} cellSize 
 */
export function drawPlayerName(ctx, x, y, playerName, cellSize) {
  ctx.fillStyle = "#000";
  ctx.font = `bold ${cellSize / 4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(playerName, x, y);
}
