// /hooks/useBoard.js
import { useEffect, useRef, useCallback } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing/index";
import { GRID_SIZE } from "../constants";

export function useBoard(pieceColor, debug, imageLoaded, players, gameStarted, piecesRef, avatarImageRef, handlePieceClick) {
  const canvasRef = useRef(null);
  const canvasContextRef = useRef(null);
  const pathRef = useRef(null);
  const gameCellsRef = useRef(null);
  const drawBoardRef = useRef(null);
  const animationIdRef = useRef(null);
  const animationFrameRef = useRef(0);
  const resizeHandlerRef = useRef(null);
  const isResizingRef = useRef(false);

const createDrawBoardFunction = useCallback(() => {
  if (!canvasRef.current || !canvasContextRef.current || !pathRef.current || !gameCellsRef.current)
    return null;

  return (frame = 0) => {
    const pieces = piecesRef.current;
    if (!Array.isArray(pieces)) return; // ✅ prevent crash

    drawBoard(
      canvasContextRef.current,
      canvasRef.current,
      pieceColor,
      gameCellsRef.current,
      pathRef.current,
      debug,
      pieces,
      imageLoaded,
      avatarImageRef,
      players,
      frame
    );
  };
}, [pieceColor, debug, imageLoaded, players]);


useEffect(() => {
  if (!gameStarted || !pieceColor) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  canvasContextRef.current = ctx;

  const { path, gameCells } = buildPath();
  pathRef.current = path;
  gameCellsRef.current = gameCells;

  function resizeCanvas() {
    isResizingRef.current = true;
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    setTimeout(() => (isResizingRef.current = false), 100);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  console.log("[useBoard] Pieces sample:", piecesRef.current.slice(0, 2));
function handleCanvasClick(e) {
  const rect = canvasRef.current.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  console.log("[useBoard] Click coords:", clickX, clickY, piecesRef);

  // Highlight click
  const ctx = canvasContextRef.current;
  if (ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.arc(clickX, clickY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Continue checking pieces
  const size = canvasRef.current.width / window.devicePixelRatio;
  const cellSize = size / GRID_SIZE;

  const clickedPiece = piecesRef.current.find((piece) => {
    const dx = clickX - piece.px;
    const dy = clickY - piece.py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < cellSize * 0.6;
  });

  if (clickedPiece) {
    console.log("[useBoard] Clicked on piece:", clickedPiece.id);
    handlePieceClick(clickedPiece.id);
  } else {
    console.log("[useBoard] Click missed all pieces");
  }
}

  canvas.addEventListener("click", handleCanvasClick);

  // ✅ Always read refs dynamically
  drawBoardRef.current = (frame = 0) => {
    drawBoard(
      ctx,
      canvas,
      pieceColor,
      gameCellsRef.current,
      pathRef.current,
      debug,
      piecesRef?.current || [],
      imageLoaded,
      avatarImageRef,
      players,
      frame
    );
  };

  const animate = () => {
    animationFrameRef.current++;
    drawBoardRef.current?.(animationFrameRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  };
  animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("click", handleCanvasClick);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
}, [gameStarted, pieceColor, debug, imageLoaded, players, piecesRef, avatarImageRef, handlePieceClick]);


// /hooks/useBoard.js
useEffect(() => {
  // Redraw immediately when avatar loads
  if (imageLoaded && drawBoardRef.current) {
    drawBoardRef.current(animationFrameRef.current);
  }
}, [imageLoaded]);

  return { canvasRef, pathRef, gameCellsRef, isResizingRef };
}
