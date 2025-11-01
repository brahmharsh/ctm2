// // /drawing.js
// import {
//   COLORS,
//   GRID_SIZE,
//   CORNER_SIZE,
//   HOME_SIZE,
//   START_CELLS,
//   SAFE_CELLS,
//   PLAYERS,
//   PLAYER_POSITIONS,
// } from "./constants";

// // Utility functions
// function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
//   let rot = (Math.PI / 2) * 3;
//   let x = cx;
//   let y = cy;
//   let step = Math.PI / spikes;

//   ctx.beginPath();
//   ctx.moveTo(cx, cy - outerRadius);
//   for (let i = 0; i < spikes; i++) {
//     x = cx + Math.cos(rot) * outerRadius;
//     y = cy + Math.sin(rot) * outerRadius;
//     ctx.lineTo(x, y);
//     rot += step;

//     x = cx + Math.cos(rot) * innerRadius;
//     y = cy + Math.sin(rot) * innerRadius;
//     ctx.lineTo(x, y);
//     rot += step;
//   }
//   ctx.lineTo(cx, cy - outerRadius);
//   ctx.closePath();
//   ctx.lineWidth = 1;
//   ctx.strokeStyle = "black";
//   ctx.stroke();
//   ctx.fillStyle = "gold";
//   ctx.fill();
// }

// // Drawing functions for board components
// const BoardComponents = {
//   drawAvatarBackgroundCircle(ctx, x, y, size, color, cellSize) {
//     ctx.fillStyle = color;
//     ctx.fillRect(x, y, size, size);

//     const circleRadius = 2 * cellSize;
//     ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
//     ctx.beginPath();
//     ctx.arc(x + size / 2, y + size / 2, circleRadius, 0, Math.PI * 2);
//     ctx.fill();

//     return { x: x + size / 2, y: y + size / 2, radius: circleRadius };
//   },

//   drawCornerCircles(ctx, centerX, centerY, color, circleRadius) {
//     const outerCircleRadius = circleRadius * 0.3;
//     const outerCircleDistance = circleRadius * 1;

//     // To rectangular positioning:
//     const positions = [
//       { x: centerX - outerCircleDistance, y: centerY - outerCircleDistance }, // Top-left
//       { x: centerX + outerCircleDistance, y: centerY - outerCircleDistance }, // Top-right
//       { x: centerX - outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-left
//       { x: centerX + outerCircleDistance, y: centerY + outerCircleDistance }, // Bottom-right
//     ];

//     ctx.fillStyle = color;
//     ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Border color
//     ctx.lineWidth = 2; // Border width

//     positions.forEach((pos) => {
//       ctx.beginPath();
//       ctx.arc(pos.x, pos.y, outerCircleRadius, 0, Math.PI * 2);
//       ctx.fill();
//       ctx.stroke(); // Draw the border
//     });
//   },

//   drawHomeArea(ctx, homeStartX, homeStartY, cellSize) {
//     ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
//     ctx.fillRect(
//       homeStartX * cellSize,
//       homeStartY * cellSize,
//       HOME_SIZE * cellSize,
//       HOME_SIZE * cellSize
//     );
//   },

//   drawColoredTail(ctx, homeStartX, homeStartY, cellSize, direction) {
//     const tailWidth = 2 * cellSize;
//     const tailLength = 7 * cellSize;

//     ctx.fillStyle = COLORS[direction];

//     switch (direction) {
//       case "red": // Upward
//         ctx.fillRect(
//           (homeStartX + 1) * cellSize,
//           (homeStartY - 7) * cellSize,
//           tailWidth,
//           tailLength
//         );
//         break;
//       case "blue": // Rightward
//         ctx.fillRect(
//           (homeStartX + HOME_SIZE) * cellSize,
//           (homeStartY + 1) * cellSize,
//           tailLength,
//           tailWidth
//         );
//         break;
//       case "yellow": // Downward
//         ctx.fillRect(
//           (homeStartX + 1) * cellSize,
//           (homeStartY + HOME_SIZE) * cellSize,
//           tailWidth,
//           tailLength
//         );
//         break;
//       case "green": // Leftward
//         ctx.fillRect(
//           (homeStartX - 7) * cellSize,
//           (homeStartY + 1) * cellSize,
//           tailLength,
//           tailWidth
//         );
//         break;
//     }
//   },

//   drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize) {
//     const homeX = homeStartX * cellSize;
//     const homeY = homeStartY * cellSize;
//     const homeWidth = HOME_SIZE * cellSize;
//     const homeHeight = HOME_SIZE * cellSize;
//     const centerX = homeX + homeWidth / 2;
//     const centerY = homeY + homeHeight / 2;

//     // Top triangle (Red)
//     ctx.fillStyle = COLORS.red;
//     ctx.beginPath();
//     ctx.moveTo(centerX, homeY + homeHeight / 2);
//     ctx.lineTo(homeX, homeY);
//     ctx.lineTo(homeX + homeWidth, homeY);
//     ctx.closePath();
//     ctx.fill();

//     // Right triangle (Blue)
//     ctx.fillStyle = COLORS.blue;
//     ctx.beginPath();
//     ctx.moveTo(homeX + homeWidth / 2, centerY);
//     ctx.lineTo(homeX + homeWidth, homeY);
//     ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
//     ctx.closePath();
//     ctx.fill();

//     // Bottom triangle (Yellow)
//     ctx.fillStyle = COLORS.yellow;
//     ctx.beginPath();
//     ctx.moveTo(centerX, homeY + homeHeight / 2);
//     ctx.lineTo(homeX, homeY + homeHeight);
//     ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
//     ctx.closePath();
//     ctx.fill();

//     // Left triangle (Green)
//     ctx.fillStyle = COLORS.green;
//     ctx.beginPath();
//     ctx.moveTo(homeX + homeWidth / 2, centerY);
//     ctx.lineTo(homeX, homeY);
//     ctx.lineTo(homeX, homeY + homeHeight);
//     ctx.closePath();
//     ctx.fill();
//   },

//   drawGameCell(
//     ctx,
//     cellNumber,
//     firstCell,
//     secondCell,
//     cellSize,
//     startCellColors,
//     rotation
//   ) {
//     const isHorizontal = firstCell.y === secondCell.y;

//     let x, y, width, height;

//     if (isHorizontal) {
//       x = firstCell.x * cellSize;
//       y = firstCell.y * cellSize;
//       width = 2 * cellSize;
//       height = cellSize;
//     } else {
//       x = firstCell.x * cellSize;
//       y = firstCell.y * cellSize;
//       width = cellSize;
//       height = 2 * cellSize;
//     }

//     // Draw background
//     const cellNum = parseInt(cellNumber);
//     ctx.fillStyle = startCellColors[cellNum] || "rgba(255, 255, 255, 0)";
//     ctx.fillRect(x, y, width, height);

//     // Draw border
//     ctx.strokeStyle = "#333";
//     ctx.lineWidth = 0.5;
//     ctx.beginPath();

//     // Special border cases
//     switch (cellNum) {
//       case 8:
//         ctx.moveTo(x + width, y);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x, y);
//         ctx.lineTo(x + width / 2, y);
//         break;
//       case 9:
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + width, y);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.moveTo(x, y + height / 2);
//         ctx.lineTo(x, y);
//         break;
//       case 25:
//         ctx.moveTo(x + width, y);
//         ctx.lineTo(x, y);
//         ctx.moveTo(x, y + height / 2);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x + width, y);
//         break;
//       case 26:
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + width, y);
//         ctx.lineTo(x + width, y + height);
//         ctx.moveTo(x + width / 2, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x, y);
//         break;
//       case 42:
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + width, y);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x + width / 2, y + height);
//         ctx.moveTo(x, y + height);
//         ctx.lineTo(x, y);
//         break;
//       case 43:
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + width, y);
//         ctx.moveTo(x + width, y + height / 2);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x, y);
//         break;
//       case 59:
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + width, y);
//         ctx.lineTo(x + width, y + height / 2);
//         ctx.moveTo(x + width, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x, y);
//         break;
//       case 60:
//         ctx.moveTo(x + width / 2, y);
//         ctx.lineTo(x + width, y);
//         ctx.lineTo(x + width, y + height);
//         ctx.lineTo(x, y + height);
//         ctx.lineTo(x, y);
//         break;
//       default:
//         ctx.rect(x, y, width, height);
//         break;
//     }
//     ctx.stroke();

//     // Draw cell number or star
//     const cellCenterX = x + width / 2;
//     const cellCenterY = y + height / 2;

//     ctx.save();
//     ctx.translate(cellCenterX, cellCenterY);
//     ctx.rotate(-rotation);

//     if (SAFE_CELLS.includes(cellNum)) {
//       drawStar(ctx, 0, 0, 5, cellSize / 4, cellSize / 8);
//     } else {
//       ctx.fillStyle = "#333";
//       ctx.font = `bold ${cellSize / 3}px Arial`;
//       ctx.textAlign = "center";
//       ctx.textBaseline = "middle";
//       ctx.fillText(cellNumber, 0, 0);
//     }
//     ctx.restore();
//   },

//   drawDiagonalLines(ctx, path, cellSize) {
//     const drawDiagonal = (cellIndex, start, end) => {
//       const cell = path[cellIndex];
//       const x = cell.x * cellSize;
//       const y = cell.y * cellSize;
//       ctx.beginPath();
//       ctx.moveTo(x + start.x * cellSize, y + start.y * cellSize);
//       ctx.lineTo(x + end.x * cellSize, y + end.y * cellSize);
//       ctx.stroke();
//     };

//     ctx.strokeStyle = "#333";
//     ctx.lineWidth = 0.5;

//     drawDiagonal(252, { x: 0, y: 0 }, { x: 1, y: 1 });
//     drawDiagonal(152, { x: 0, y: 1 }, { x: 1, y: 0 });
//     drawDiagonal(147, { x: 0, y: 0 }, { x: 1, y: 1 });
//     drawDiagonal(247, { x: 1, y: 0 }, { x: 0, y: 1 });
//   },

//   drawDebugGrid(ctx, cellSize) {
//     ctx.strokeStyle = "#aaa";
//     for (let i = 0; i < GRID_SIZE; i++) {
//       for (let j = 0; j < GRID_SIZE; j++) {
//         ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
//       }
//     }
//   },

//   drawDebugCellNumbers(ctx, path, cellSize, rotation) {
//     ctx.fillStyle = "#666";
//     ctx.font = `${cellSize / 5}px Arial`;
//     ctx.textAlign = "center";
//     ctx.textBaseline = "middle";

//     for (let i = 0; i < path.length; i++) {
//       const cell = path[i];
//       const x = cell.x * cellSize + cellSize / 2;
//       const y = cell.y * cellSize + cellSize / 2;

//       ctx.save();
//       ctx.translate(x, y);
//       ctx.rotate(-rotation);
//       ctx.fillText(cell.index, 0, 0);
//       ctx.restore();
//     }
//   },

//   drawPiece(
//     ctx,
//     piece,
//     cellSize,
//     pieceColor,
//     isCurrentPlayer = false,
//     animationFrame = 0
//   ) {
//     // Make the current player's piece slightly larger and with a different border
//     const baseRadius = cellSize / 3;
//     const borderWidth = isCurrentPlayer ? 2 : 2;
//     // const borderColor = isCurrentPlayer ? "black" : "black";
//     const borderColor = "rgba(0, 0, 0, 1)";

//     // Add breathing effect for current player
//     let radius = baseRadius;
//     if (isCurrentPlayer) {
//       // Create a breathing effect using sine wave
//       const breathScale = 1 + Math.sin(animationFrame * 0.05) * 0.15;
//       radius = baseRadius * breathScale;
//     }

//     ctx.fillStyle = COLORS[pieceColor];
//     ctx.strokeStyle = borderColor;
//     ctx.lineWidth = borderWidth;
//     ctx.beginPath();
//     ctx.arc(piece.px, piece.py, radius, 0, Math.PI * 2);
//     ctx.fill();
//     ctx.stroke();

//     // Add a subtle glow effect for current player
//     if (isCurrentPlayer) {
//       ctx.save();
//       // ctx.globalAlpha = 0.3;
//       // ctx.fillStyle = "#FFD700";
//       ctx.beginPath();
//       ctx.arc(piece.px, piece.py, radius * 1.3, 0, Math.PI * 2);
//       ctx.fill();
//       ctx.restore();
//     }
//   },

//   drawPlayerName(ctx, x, y, playerName, cellSize) {
//     ctx.fillStyle = "#000";
//     ctx.font = `bold ${cellSize / 4}px Arial`;
//     ctx.textAlign = "center";
//     ctx.textBaseline = "middle";
//     ctx.fillText(playerName, x, y);
//   },

//   drawAvatar(ctx, x, y, circleRadius, avatarImageRef) {
//     const avatarSize = circleRadius * 2;

//     ctx.save();
//     ctx.beginPath();
//     ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
//     ctx.clip();
//     ctx.drawImage(
//       avatarImageRef.current,
//       x - avatarSize / 2,
//       y - avatarSize / 2,
//       avatarSize,
//       avatarSize
//     );
//     ctx.restore();
//   },

//   drawInactivePlayerOverlay(ctx, x, y, size, cellSize) {
//     // Draw semi-transparent overlay over inactive player homes
//     ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
//     ctx.fillRect(x, y, size, size);

//     // Draw "Not Playing" text
//     ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
//     ctx.font = `bold ${cellSize * 0.8}px Arial`;
//     ctx.textAlign = "center";
//     ctx.textBaseline = "middle";
//     ctx.fillText("✕", x + size / 2, y + size / 2);
//   },
// };

// // Main drawing function
// export function drawBoard(
//   ctx,
//   canvas,
//   pieceColor,
//   gameCells,
//   path,
//   debug,
//   pieces,
//   imageLoaded,
//   avatarImageRef,
//   players = [],
//   animationFrame = 0
// ) {
//   const size = canvas.width / window.devicePixelRatio;
//   const cellSize = size / GRID_SIZE;
//   ctx.clearRect(0, 0, size, size);

//   ctx.save();

//   // Set up rotation based on player color
//   const boardCenterX = size / 2;
//   const boardCenterY = size / 2;
//   ctx.translate(boardCenterX, boardCenterY);

//   let rotation = 0;
//   switch (pieceColor) {
//     case "red":
//       rotation = Math.PI;
//       break;
//     case "blue":
//       rotation = Math.PI / 2;
//       break;
//     case "green":
//       rotation = -Math.PI / 2;
//       break;
//   }
//   ctx.rotate(rotation);
//   ctx.translate(-boardCenterX, -boardCenterY);

//   // Define start cell colors
//   const startCellColors = {
//     5: COLORS.yellow,
//     22: COLORS.blue,
//     39: COLORS.red,
//     56: COLORS.green,
//   };

//   const cornerPixelSize = CORNER_SIZE * cellSize;

//   // Draw corners and their circles using player constants
//   const corners = Object.keys(PLAYER_POSITIONS).map((playerId) => {
//     const position = PLAYER_POSITIONS[playerId];
//     return {
//       x: position.x * cellSize,
//       y: position.y * cellSize,
//       color: COLORS[PLAYERS[playerId].color],
//       playerId: playerId,
//     };
//   });

//   corners.forEach((corner) => {
//     const { x, y, radius } = BoardComponents.drawAvatarBackgroundCircle(
//       ctx,
//       corner.x,
//       corner.y,
//       cornerPixelSize,
//       corner.color,
//       cellSize
//     );

//     BoardComponents.drawCornerCircles(ctx, x, y, corner.color, radius);

//     // Draw player name in debug mode
//     if (debug) {
//       const player = players.find((p) => p.id === corner.playerId);
//       if (player) {
//         BoardComponents.drawPlayerName(
//           ctx,
//           x,
//           y - radius - cellSize / 2,
//           player.id,
//           cellSize
//         );
//       }
//     }
//   });

//   // Draw home area
//   const homeStartX = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
//   const homeStartY = Math.floor((GRID_SIZE - HOME_SIZE) / 2);
//   BoardComponents.drawHomeArea(ctx, homeStartX, homeStartY, cellSize);

//   // Draw colored tails
//   ["red", "blue", "yellow", "green"].forEach((color) => {
//     BoardComponents.drawColoredTail(
//       ctx,
//       homeStartX,
//       homeStartY,
//       cellSize,
//       color
//     );
//   });

//   // Draw home triangles
//   BoardComponents.drawHomeTriangles(ctx, homeStartX, homeStartY, cellSize);

//   // Draw game cells
//   for (const [cellNumber, indices] of Object.entries(gameCells)) {
//     const firstCell = path[indices[0]];
//     const secondCell = path[indices[1]];
//     BoardComponents.drawGameCell(
//       ctx,
//       cellNumber,
//       firstCell,
//       secondCell,
//       cellSize,
//       startCellColors,
//       rotation
//     );
//   }

//   // Draw diagonal lines
//   BoardComponents.drawDiagonalLines(ctx, path, cellSize);

//   // Draw debug elements if needed
//   if (debug) {
//     BoardComponents.drawDebugGrid(ctx, cellSize);
//     BoardComponents.drawDebugCellNumbers(ctx, path, cellSize, rotation);
//   }

//   // Draw all pieces
//   if (pieces && Array.isArray(pieces)) {
//     pieces.forEach((piece) => {
//       const isCurrentPlayer = piece.color === pieceColor;
//       BoardComponents.drawPiece(
//         ctx,
//         piece,
//         cellSize,
//         piece.color,
//         isCurrentPlayer,
//         animationFrame
//       );
//     });
//   }

//   ctx.restore();

//   // Hide inactive player homes (for 2-player games, hide red and green)
//   if (players.length === 2) {
//     const cornerPixelSize = CORNER_SIZE * cellSize;
//     // Hide red (top-left) and green (bottom-left) homes
//     BoardComponents.drawInactivePlayerOverlay(
//       ctx,
//       0,
//       0,
//       cornerPixelSize,
//       cellSize
//     ); // Red
//     BoardComponents.drawInactivePlayerOverlay(
//       ctx,
//       0,
//       (GRID_SIZE - CORNER_SIZE) * cellSize,
//       cornerPixelSize,
//       cellSize
//     ); // Green
//   } else if (players.length === 3) {
//     const cornerPixelSize = CORNER_SIZE * cellSize;
//     // Hide green (bottom-left) home
//     BoardComponents.drawInactivePlayerOverlay(
//       ctx,
//       0,
//       (GRID_SIZE - CORNER_SIZE) * cellSize,
//       cornerPixelSize,
//       cellSize
//     ); // Green
//   }

//   // Draw avatars (outside the rotated context)
//   if (imageLoaded && avatarImageRef.current) {
//     const circleRadius = 2 * cellSize;

//     corners.forEach((corner) => {
//       const x = corner.x + cornerPixelSize / 2;
//       const y = corner.y + cornerPixelSize / 2;
//       BoardComponents.drawAvatar(ctx, x, y, circleRadius, avatarImageRef);

//       // Draw player name in debug mode
//       if (debug) {
//         const player = players.find((p) => p.id === corner.playerId);
//         if (player) {
//           BoardComponents.drawPlayerName(
//             ctx,
//             x,
//             y - circleRadius - cellSize / 2,
//             player.id,
//             cellSize
//           );
//         }
//       }
//     });
//   }
// }
