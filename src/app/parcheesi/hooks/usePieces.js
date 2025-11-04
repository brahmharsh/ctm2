// /hooks/usePieces.js
import { useEffect, useState, useRef, useCallback } from "react";
import {
  GRID_SIZE,
  CORNER_SIZE,
  PLAYERS,
  PLAYER_POSITIONS,
} from "../constants";

/**
 * Handles Ludo piece state, positions, and animation logic.
 *
 * @param {Array} players - Array of player objects { id, color, startCell }
 * @param {boolean} gameStarted
 * @param {object} pathRef - Ref containing path coordinates
 * @param {object} gameCellsRef - Ref containing cell mapping
 * @param {object} isResizingRef - Ref tracking if board is being resized
 */
export function usePieces(
  players,
  gameStarted,
  pathRef,
  gameCellsRef,
  isResizingRef,
  initialLegalMoves = []
) {
  const [pieces, setPieces] = useState([]);
  const piecesRef = useRef([]);
  const piecePositionsRef = useRef({}); // stores logical positions (numbers or home identifiers)
  const initializedRef = useRef(false);
  const moveToIndexRef = useRef(null);
  const moveTokenToRef = useRef(null);
  const onLocalMoveRef = useRef(null);
  const isMovingRef = useRef(false);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [clickEnabled, setClickEnabled] = useState(false);
  const [legalMoves, setLegalMoves] = useState(initialLegalMoves);
  const pendingServerToRef = useRef(null);


useEffect(() => {
  if (!legalMoves || legalMoves.length === 0) {
    setClickEnabled(false);
    setSelectedPieceId(null);
    return;
  }
  setClickEnabled(true);
  if (!legalMoves.find((m) => m.tokenId === selectedPieceId)) {
    setSelectedPieceId(legalMoves[0].tokenId);
  }
}, [legalMoves]);

  const setPiecesLegalMoves = (moves) => setLegalMoves(moves);

const handlePieceClick = useCallback(
  (pieceId) => {
    console.log("[usePieces] Piece clicked:", pieceId);

    if (!clickEnabled) {
      console.log("[usePieces] ❌ Click ignored — not your turn or dice not rolled yet");
      return;
    }

    if (!legalMoves || legalMoves.length === 0) {
      console.log("[usePieces] ⚠️ No legal moves available yet");
      return;
    }

    console.log("LEGACY MOVES: ", legalMoves);

    const pieceIndex = parseInt(pieceId.split("-").pop(), 10);
    const tokenId = pieceId.replace(/-\d$/, `-t${pieceIndex + 1}`);


    // Find legal moves for this piece (multiple when two dice)
    const pieceMoves = legalMoves.filter((m) => m.tokenId === tokenId);
    if (pieceMoves.length === 0) {
      console.log("[usePieces] 🚫 Clicked piece has no legal moves");
      return;
    }

    // Choose which die to use for this move
    const options = Array.from(new Set(pieceMoves.map((m) => m.moveBy)));
    let chosenSteps = options[0];
    if (options.length > 1) {
      const input = window.prompt(
        `Choose die for ${tokenId}: ${options.join(" or ")}`,
        String(options[0])
      );
      const parsed = parseInt(input, 10);
      if (options.includes(parsed)) {
        chosenSteps = parsed;
      }
    }

    const chosen = pieceMoves.find((m) => m.moveBy === chosenSteps) || pieceMoves[0];
    const steps = chosen.moveBy;
    // Store the server-expected absolute destination for this move (linear track newPosition)
    pendingServerToRef.current = chosen.newPosition;

    console.log(`[usePieces] ✅ Moving piece ${pieceId} by ${steps} steps (tokenId ${tokenId})`);

    // Trigger movement using only one die
    moveToIndexRef.current?.(pieceId, steps);
    console.log("MOVING PIECE: ", moveToIndexRef.current);
    // Disable click until next turn / next roll
    setClickEnabled(false);
  },
  [clickEnabled, legalMoves, moveToIndexRef]
);


  // Keep ref updated
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  /**
   * Helper: compute four visual positions inside a corner box
   * x0,y0 are top-left pixel of the corner box; cornerPixelSize is its size in px.
   * returns array of 4 { px, py } values
   */
  // function computeCornerPiecePositions(x0, y0, cornerPixelSize, cellSize) {
  //   // padding from edge
  //   const pad = Math.max(cellSize * 0.5, cornerPixelSize * 0.12);
  //   // four positions: top-left, top-right, bottom-left, bottom-right
  //   return [
  //     { px: x0 + pad, py: y0 + pad },
  //     { px: x0 + cornerPixelSize - pad, py: y0 + pad },
  //     { px: x0 + pad, py: y0 + cornerPixelSize - pad },
  //     { px: x0 + cornerPixelSize - pad, py: y0 + cornerPixelSize - pad },
  //   ];
  // }

  /**
 * Compute four corner piece positions around the avatar circle
 */
function computeCornerPiecePositions(x0, y0, cornerPixelSize, cellSize) {
  // Compute center of the avatar circle
  const centerX = x0 + cornerPixelSize / 2;
  const centerY = y0 + cornerPixelSize / 2;

  // Radius used for offsetting pieces from center
  const circleRadius = 2 * cellSize;

  // Four piece positions: top-left, top-right, bottom-left, bottom-right
  return [
    { px: centerX - circleRadius, py: centerY - circleRadius },
    { px: centerX + circleRadius, py: centerY - circleRadius },
    { px: centerX - circleRadius, py: centerY + circleRadius },
    { px: centerX + circleRadius, py: centerY + circleRadius },
  ];
}

  // Initialize base pieces (4 per player) and place them visually inside corner home
  useEffect(() => {
    if (!gameStarted || !players || players.length === 0) return;
    // Prevent re-initializing pieces on rerolls or players identity changes
    if (piecesRef.current && piecesRef.current.length > 0) return;

    // get canvas to compute pixel sizes; if not available we bail (positions will be set when canvas exists)
    const canvas = document.querySelector("canvas");
    // if canvas not mounted yet, create placeholder pieces with px/py = 0; recalcPositions or the initial placement effect will fix them later
    const canvasAvailable = !!canvas;
    const size = canvasAvailable
      ? canvas.width / window.devicePixelRatio
      : null;
    const cellSize = canvasAvailable ? size / GRID_SIZE : 10;
    const cornerPixelSize = CORNER_SIZE * cellSize;

    const newPieces = players.flatMap((p) => {
      // Determine top-left of corner box from PLAYER_POSITIONS
      const playerPosition = Object.values(PLAYER_POSITIONS).find(
        (pos) => pos && pos.x === pos.x && pos.y === pos.y
      ); // irrelevant; we'll use player id mapping below

      // Use PLAYER_POSITIONS keyed by player id (your BOARD uses same keys)
      const cornerGridPos = PLAYER_POSITIONS[p.id];
      let cornerX = 0,
        cornerY = 0;
      if (cornerGridPos) {
        cornerX = cornerGridPos.x * cellSize;
        cornerY = cornerGridPos.y * cellSize;
      } else {
        // fallback: map by color
        switch (p.color) {
          case "yellow":
            cornerX = (GRID_SIZE - CORNER_SIZE) * cellSize;
            cornerY = (GRID_SIZE - CORNER_SIZE) * cellSize;
            break;
          case "blue":
            cornerX = (GRID_SIZE - CORNER_SIZE) * cellSize;
            cornerY = 0;
            break;
          case "red":
            cornerX = 0;
            cornerY = 0;
            break;
          case "green":
            cornerX = 0;
            cornerY = (GRID_SIZE - CORNER_SIZE) * cellSize;
            break;
          default:
            cornerX = 0;
            cornerY = 0;
        }
      }

      const visualPositions = canvasAvailable
        ? computeCornerPiecePositions(
            cornerX,
            cornerY,
            cornerPixelSize,
            cellSize
          )
        : [
            { px: 0, py: 0 },
            { px: 0, py: 0 },
            { px: 0, py: 0 },
            { px: 0, py: 0 },
          ];

      // create 4 pieces for this player
      return visualPositions.map((pos, idx) => {
        const pid = `${p.id}-${idx}`; // unique id per piece
        // Keep logical position as player's startCell so existing move logic keeps working.
        return {
          id: pid,
          playerId: p.id,
          color: p.color,
          // logical board position (number) - piece is currently "at home visually" but logically maps to startCell
          position: p.startCell,
          // visual coordinates
          px: pos.px,
          py: pos.py,
          x: 0,
          y: 0,
          offsetIndex: idx,
        };
      });
    });

    setPieces(newPieces);
    piecesRef.current = newPieces;
    // store logical positions for each piece
    newPieces.forEach((pc) => {
      piecePositionsRef.current[pc.id] = pc.position;
    });
    initializedRef.current = false;
  }, [players, gameStarted]);

  // Recalculate piece positions from gameCells/path (used on resize or when board path becomes available)
  const recalcPositions = useCallback(() => {
    if (
      !gameStarted ||
      !pieces.length ||
      !pathRef?.current ||
      !gameCellsRef?.current
    )
      return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const path = pathRef.current;
    const gameCells = gameCellsRef.current;
    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    const updated = pieces.map((piece) => {
      const currentCell = piecePositionsRef.current[piece.id] ?? piece.position;
      const target = gameCells[currentCell];
      if (!target) {
        // if there is no mapping (likely home), keep existing px/py
        return piece;
      }
      const first = path[target[0]],
        second = path[target[1]];
      const px = ((first.x + second.x) / 2) * cellSize + cellSize / 2;
      const py = ((first.y + second.y) / 2) * cellSize + cellSize / 2;
      return { ...piece, px, py };
    });

    piecesRef.current = updated;
    setPieces(updated);
  }, [gameStarted, pieces, pathRef, gameCellsRef]);

  // Initial path-based placement (when path & gameCells become available)
  useEffect(() => {
    if (!gameStarted || !pieces.length || initializedRef.current) return;
    if (!pathRef?.current || !gameCellsRef?.current) return;

    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const path = pathRef.current;
    const gameCells = gameCellsRef.current;
    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    const updated = pieces.map((piece) => {
      // If the piece has a logical board cell (number or home path) and mapping exists, compute pixel pos
      const startCell = piece.position;
      const map = gameCells[startCell];
      if (!map) {
        // keep previously set px/py (home visual)
        return piece;
      }
      const first = path[map[0]],
        second = path[map[1]];
      const px = ((first.x + second.x) / 2) * cellSize + cellSize / 2;
      const py = ((first.y + second.y) / 2) * cellSize + cellSize / 2;

      piecePositionsRef.current[piece.id] = startCell;
      return { ...piece, px, py };
    });

    piecesRef.current = updated;
    setPieces(updated);
    initializedRef.current = true;
  }, [gameStarted, pieces.length, pathRef, gameCellsRef]);

  // --- Movement System (animation + rules) ---
  useEffect(() => {
    if (!gameStarted || !players?.length) return;
    if (!pathRef?.current || !gameCellsRef?.current) return;

    const path = pathRef.current;
    const gameCells = gameCellsRef.current;
    const currentGameCellRef = { current: {} };

    // initialize current positions
    pieces.forEach((piece) => {
      currentGameCellRef.current[piece.id] =
        piecePositionsRef.current[piece.id] ?? piece.position;
    });

    function moveToGameCell(playerId, targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        onComplete?.();
        return;
      }
      if (isMovingRef.current && !onComplete) return;
      isMovingRef.current = true;

      const currentCell = currentGameCellRef.current[playerId];
      const stepsToMove = (targetCellNumber - currentCell + 68) % 68;
      let currentStepInMove = 0;

      function moveStep() {
        if (currentStepInMove >= stepsToMove) {
          isMovingRef.current = false;
          onComplete?.();
          return;
        }

        currentStepInMove++;
        const nextCellNumber = ((currentCell + currentStepInMove - 1) % 68) + 1;
        if (!gameCells[nextCellNumber]) {
          isMovingRef.current = false;
          onComplete?.();
          return;
        }

        const targetIndices = gameCells[nextCellNumber];
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];
        const canvas = document.querySelector("canvas");
        const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
        const targetX =
          ((firstCell.x + secondCell.x) / 2) * cellSize + cellSize / 2;
        const targetY =
          ((firstCell.y + secondCell.y) / 2) * cellSize + cellSize / 2;

        function animate() {
          if (isResizingRef?.current) {
            requestAnimationFrame(animate);
            return;
          }

          const currentPieces = piecesRef.current;
          const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
          if (pieceIndex === -1) {
            isMovingRef.current = false;
            onComplete?.();
            return;
          }

          const piece = currentPieces[pieceIndex];
          const dx = targetX - piece.px;
          const dy = targetY - piece.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
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
            piecePositionsRef.current[playerId] = nextCellNumber;
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
        onComplete?.();
        return;
      }
      if (isMovingRef.current && !onComplete) return;
      isMovingRef.current = true;

      const targetIndices = gameCells[targetHomeCell];
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];
      const canvas = document.querySelector("canvas");
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
      const targetX =
        ((firstCell.x + secondCell.x) / 2) * cellSize + cellSize / 2;
      const targetY =
        ((firstCell.y + secondCell.y) / 2) * cellSize + cellSize / 2;

      function animate() {
        if (isResizingRef?.current) {
          requestAnimationFrame(animate);
          return;
        }

        const currentPieces = piecesRef.current;
        const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
        if (pieceIndex === -1) {
          isMovingRef.current = false;
          onComplete?.();
          return;
        }

        const piece = currentPieces[pieceIndex];
        const dx = targetX - piece.px;
        const dy = targetY - piece.py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
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
          piecePositionsRef.current[playerId] = targetHomeCell;
          currentGameCellRef.current[playerId] = targetHomeCell;
          onComplete?.();
        }
      }
      animate();
    }

    function movePiece(playerId, steps) {
      // The first argument is actually the piece id (e.g., "playerA-0").
      // We derive base player id for color logic, but move using the piece id.
      console.log("STARTING MOVE", playerId, steps, isMovingRef, players, currentGameCellRef);
      if (isMovingRef.current) return;
      const pieceId = playerId;
      const basePlayerId = pieceId.includes("-")
        ? pieceId.replace(/-\d$/, ``)
        : pieceId;
      const pieceIdxMatch = pieceId.match(/-(\d)$/);
      const tokenId = pieceIdxMatch
        ? `${basePlayerId}-t${Number(pieceIdxMatch[1]) + 1}`
        : `${basePlayerId}-t1`;
      console.log("After basePlayerId", basePlayerId);
      const player = players.find((p) => p.id === basePlayerId);
      if (!player) return;

      let currentCell = currentGameCellRef.current[pieceId];
      if (currentCell == null) {
        currentCell =
          piecePositionsRef.current[pieceId] ??
          piecesRef.current.find((p) => p.id === pieceId)?.position;
        currentGameCellRef.current[pieceId] = currentCell;
      }
      console.log("MOVING PIECE: ", currentCell);
      let entryCell, homePathPrefix;
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
            isMovingRef.current = false;
            // Local move complete: notify server with linear destination from legal move
            onLocalMoveRef.current?.({ tokenId, to: pendingServerToRef.current });
            return;
          }
          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          moveToHomePath(
            pieceId,
            nextHomeCell,
            currentStep < stepsToMove ? moveHomeStep : null
          );
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
        let finalTo = null;
        function executeMove() {
          if (currentMove >= moveSequence.length) {
            isMovingRef.current = false;
            if (finalTo != null) onLocalMoveRef.current?.({ tokenId, to: pendingServerToRef.current });
            return;
          }
          const nextCell = moveSequence[currentMove];
          currentMove++;
          finalTo = nextCell;
          if (typeof nextCell === "string") {
            moveToHomePath(
              pieceId,
              nextCell,
              currentMove < moveSequence.length ? executeMove : null
            );
          } else {
            moveToGameCell(
              pieceId,
              nextCell,
              currentMove < moveSequence.length ? executeMove : null
            );
          }
        }
        executeMove();
      } else {
        const targetCellNumber = ((currentCell + steps - 1) % 68) + 1;
        moveToGameCell(pieceId, targetCellNumber, () => {
          isMovingRef.current = false;
          onLocalMoveRef.current?.({ tokenId, to: pendingServerToRef.current });
        });
      }
    }

    // Expose to parent
    moveToIndexRef.current = movePiece;
    // Also expose direct token move for syncing opponent moves
    moveTokenToRef.current = (tokenId, to) => {
      // Convert server tokenId (e.g., "playerA-t1") to local pieceId (e.g., "playerA-0")
      let pieceId = tokenId;
      const match = /^(.+)-t(\d)$/.exec(tokenId || "");
      if (match) {
        const base = match[1];
        const n = parseInt(match[2], 10);
        const idx = Number.isFinite(n) ? Math.max(0, n - 1) : 0;
        pieceId = `${base}-${idx}`;
      }

      if (typeof to === "string") {
        moveToHomePath(pieceId, to);
      } else {
        moveToGameCell(pieceId, to);
      }
    };
  }, [
    gameStarted,
    players.length,
    pathRef,
    gameCellsRef,
    isResizingRef,
    pieces.length,
  ]);

  return {
    pieces,
    setPieces,
    piecesRef,
    moveToIndexRef,
    moveTokenToRef,
    onLocalMoveRef,
    piecePositionsRef,
    recalcPositions,
    selectedPieceId,
    setSelectedPieceId,
    clickEnabled,
    setClickEnabled,
    legalMoves,
    setPiecesLegalMoves,
    handlePieceClick,
  };
}
