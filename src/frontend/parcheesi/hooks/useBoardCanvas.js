// Canvas + drawing isolated (moved, lib->utils rename placeholder)
'use client';
import { useEffect, useRef } from 'react';
import {
  GRID_SIZE,
  HOME_POSITIONS,
  TOKENS_PER_PLAYER,
} from '../config/constants.js';
import { buildPath } from '../utils/buildPath.js';
import { drawBoard } from '../utils/drawBoard.js';

export function useBoardCanvas({
  players,
  pieceColor,
  phase,
  gameState,
  onTokenClick,
}) {
  const canvasRef = useRef(null);
  const pathRef = useRef(null);
  const gameCellsRef = useRef(null);
  const animationIdRef = useRef(null);
  const tokensRef = useRef([]);
  const frameRef = useRef(0);

  // Initialize tokens for all players
  useEffect(() => {
    if (phase !== 'playing' || !players || players.length === 0) return;

    const tokens = [];
    players.forEach((player) => {
      if (!player.color || !player.tokens) return;

      player.tokens.forEach((token, index) => {
        tokens.push({
          id: token.id,
          color: player.color,
          position: token.position,
          finished: token.finished,
          px: 0,
          py: 0,
          selectable: false,
        });
      });
    });

    tokensRef.current = tokens;
  }, [players, phase]);

  // Update token positions based on game state
  useEffect(() => {
    if (phase !== 'playing' || !gameState || !pathRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    tokensRef.current.forEach((token) => {
      const gameToken = players
        .flatMap((p) => p.tokens || [])
        .find((t) => t.id === token.id);

      if (!gameToken) return;

      token.position = gameToken.position;
      token.finished = gameToken.finished;

      // Calculate pixel position
      if (token.position === 'home') {
        // Position in home area
        const homePos = getHomePosition(token.color, token.id);
        if (homePos) {
          token.px = (homePos.x + 0.5) * cellSize;
          token.py = (homePos.y + 0.5) * cellSize;
        }
      } else if (typeof token.position === 'number') {
        // Position on track - find the cell in gameCellsRef
        const cellEntry = Object.entries(gameCellsRef.current).find(
          ([key]) => parseInt(key) === token.position
        );

        if (cellEntry) {
          const indices = cellEntry[1];
          const gridIndex = indices[0];
          const pathCell = pathRef.current[gridIndex];
          if (pathCell) {
            token.px = (pathCell.x + 0.5) * cellSize;
            token.py = (pathCell.y + 0.5) * cellSize;
          }
        }
      }
    });
  }, [gameState, phase, players]);

  useEffect(() => {
    if (phase !== 'playing' || !pieceColor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    ctx.setTransform(
      window.devicePixelRatio,
      0,
      0,
      window.devicePixelRatio,
      0,
      0
    );

    const { path, gameCells } = buildPath(GRID_SIZE);
    pathRef.current = path;
    gameCellsRef.current = gameCells;

    // Handle canvas clicks
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) * (canvas.width / rect.width)) /
        window.devicePixelRatio;
      const y =
        ((e.clientY - rect.top) * (canvas.height / rect.height)) /
        window.devicePixelRatio;

      // Find clicked token
      const cellSize = size / GRID_SIZE;
      const clickedToken = tokensRef.current.find((token) => {
        const dx = x - token.px;
        const dy = y - token.py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= cellSize * 0.4;
      });

      if (clickedToken && onTokenClick) {
        onTokenClick(clickedToken);
      }
    };

    canvas.addEventListener('click', handleClick);

    function loop() {
      frameRef.current += 1;
      drawBoard(
        ctx,
        canvas,
        pieceColor,
        gameCellsRef.current,
        pathRef.current,
        false,
        tokensRef.current,
        true,
        null,
        players,
        frameRef.current
      );
      animationIdRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      canvas.removeEventListener('click', handleClick);
    };
  }, [phase, pieceColor, players, onTokenClick]);

  return { canvasRef };
}

// Get home position for a token based on color and token ID
function getHomePosition(color, tokenId) {
  const homePositions = HOME_POSITIONS[color];
  if (!homePositions) return null;

  // Extract token index from ID (e.g., "player_123-t0" -> 0)
  const match = tokenId.match(/-t(\d+)$/);
  if (!match) return null;

  const tokenIndex = parseInt(match[1]);
  return homePositions[tokenIndex] || homePositions[0];
}
