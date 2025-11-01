// /hooks/useBoard.js
import { useEffect, useRef, useCallback } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing/index";
import { GRID_SIZE } from "../constants";

export function useBoard(pieceColor, debug, imageLoaded, players, gameStarted, piecesRef, avatarImageRef) {
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
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
  };
}, [gameStarted, pieceColor, debug, imageLoaded, players, piecesRef, avatarImageRef]);


// /hooks/useBoard.js
useEffect(() => {
  // Redraw immediately when avatar loads
  if (imageLoaded && drawBoardRef.current) {
    drawBoardRef.current(animationFrameRef.current);
  }
}, [imageLoaded]);

  return { canvasRef, pathRef, gameCellsRef, isResizingRef };
}
