// /hooks/useGame.js
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { buildPath } from '../utils/gameLogic';
import { drawBoard } from '../utils/drawing';
import {
  GRID_SIZE,
  START_CELLS,
  PLAYERS,
  CORNER_SIZE,
  PLAYER_POSITIONS,
} from '../config/constants';
import { useDice } from './useDice';
import {
  onStateUpdate,
  onTurnEnd,
  onRoomUpdate,
  requestGameState,
  moveToken as wsMoveToken,
  onMoveResult,
  onGameStarted,
} from '../services/websocketClient';

export function useGame(initialRoomId, initialPlayerId) {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const [debug, setDebug] = useState(false);
  const [pieceColor, setPieceColor] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  // Track the current player's id; we need both value and setter (was missing causing runtime error)
  const [playerId, setPlayerId] = useState(initialPlayerId || null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const avatarImageRef = useRef(null);
  const moveToIndexRef = useRef(null);
  const piecesRef = useRef(pieces);
  const initializedRef = useRef(false);
  const pathRef = useRef(null);
  const gameCellsRef = useRef(null);
  const canvasContextRef = useRef(null);
  const drawBoardRef = useRef(null);
  const boardInitializedRef = useRef(false);
  const animationFrameRef = useRef(0);
  const animationIdRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const isMovingRef = useRef(false);
  const isResizingRef = useRef(false);
  const piecePositionsRef = useRef({}); // Store actual cell positions for each piece

  const { isRolling, rollDice, startGame, animatedDice, legalMoves } = useDice(
    playerId,
    currentPlayer
  );

  // When legal moves are available, mark the corresponding tokens as selectable
  useEffect(() => {
    if (legalMoves && legalMoves.length > 0) {
      const selectableTokenIds = new Set(
        legalMoves.map((move) => move.tokenId)
      );
      setPieces((prevPieces) =>
        prevPieces.map((p) => ({
          ...p,
          selectable: selectableTokenIds.has(p.tokenId),
        }))
      );
    } else {
      // If there are no legal moves, no tokens should be selectable.
      setPieces((prevPieces) =>
        prevPieces.map((p) => ({
          ...p,
          selectable: false,
        }))
      );
    }
  }, [legalMoves]);

  // Update the ref whenever pieces changes
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Initialize game state subscribers
  useEffect(() => {
    let unsubscribeState = () => {};
    let unsubscribeTurn = () => {};
    let unsubscribeRoom = () => {};
    let unsubscribeStarted = () => {};

    const initializeGame = async () => {
      try {
        // console.log('[useGame] Initializing with:', {
        //   initialRoomId,
        //   initialPlayerId,
        //   playerId,
        // });

        // Subscribe to room updates (players join/leave)
        unsubscribeRoom = onRoomUpdate((data) => {
          // console.log('[useGame] Room update received:', data);
          setPlayers((prev) => {
            if (prev.length && prev.every((p) => p.id)) {
              const idToPlayer = Object.fromEntries(prev.map((p) => [p.id, p]));
              return data.players.map(
                (pid) => idToPlayer[pid] || { id: pid, color: 'unknown' }
              );
            }
            return data.players.map((pid) => ({ id: pid, color: 'unknown' }));
          });
        });

        // Subscribe to game started event
        unsubscribeStarted = onGameStarted((data) => {
          console.log('[useGame] 🎮 Game started!');
          if (data?.gameState) {
            const gs = data.gameState;
            setPlayers(gs.players);
            setGameStarted(true);
            setPendingDice(gs.pendingDice || []);
            setUsedDice(gs.usedDice || []);

            if (
              gs.currentPlayerIndex != null &&
              gs.players[gs.currentPlayerIndex]
            ) {
              setCurrentPlayer(gs.players[gs.currentPlayerIndex]);
            }

            const player = gs.players.find((p) => p.id === playerId);
            if (player?.color) {
              console.log('[useGame] ✓ My color:', player.color);
              setPieceColor(player.color);
            }
          }
        });

        // Subscribe to state updates
        unsubscribeState = onStateUpdate((data) => {
          // console.log(
          //   '[useGame] ★★★ State update received:',
          //   JSON.stringify(data, null, 2)
          // );
          if (!data?.gameState) {
            // console.warn('[useGame] ⚠️ No gameState in update (game not started yet)');
            return;
          }
          const gs = data.gameState;
          // console.log('[useGame] Processing game state:', {
          //   playersCount: gs.players?.length,
          //   players: gs.players,
          //   currentPlayerIndex: gs.currentPlayerIndex,
          //   gameStarted: gs.gameStarted,
          //   myPlayerId: playerId,
          // });

          setPlayers(gs.players);
          if (
            gs.currentPlayerIndex != null &&
            gs.players[gs.currentPlayerIndex]
          ) {
            setCurrentPlayer(gs.players[gs.currentPlayerIndex]);
            // console.log(
            //   '[useGame] ✓ Set current player:',
            //   gs.players[gs.currentPlayerIndex]
            // );
          }
          setGameStarted(gs.gameStarted);

          // DEBUG: Check if dice are being set
          if (gs.pendingDice && gs.pendingDice.length > 0) {
            console.log(
              '[useGame] 🎲 DICE SET:',
              gs.pendingDice,
              'Used:',
              gs.usedDice
            );
          }
          // console.log('[useGame] ✓ Set gameStarted:', gs.gameStarted);

          // Set player color based on playerId
          const player = gs.players.find((p) => p.id === playerId);
          // console.log('[useGame] Looking for playerId:', playerId);
          // console.log(
          //   '[useGame] Available players:',
          //   JSON.stringify(gs.players, null, 2)
          // );
          // console.log('[useGame] Found player:', player);

          if (player && player.color) {
            // console.log(
            //   '[useGame] ✓ Setting piece color:',
            //   player.color,
            //   'for player:',
            //   playerId
            // );
            setPieceColor(player.color);
          } else {
            console.error(
              '[useGame] ❌ Could not find player color for:',
              playerId
            );
          }
        });

        // Subscribe to turn end updates
        unsubscribeTurn = onTurnEnd((data) => {
          // console.log('[useGame] Turn end:', data);
          if (data?.nextPlayer) {
            setCurrentPlayer((prev) => {
              return players.find((p) => p.id === data.nextPlayer) || prev;
            });
          }
          setSelectedTokenId(null);
        });

        // Request current game state immediately after subscribing
        // This ensures we get the state even if we missed the initial update:state emission
        // console.log('[useGame] 🔄 Requesting current game state...');
        requestGameState();
      } catch (error) {
        console.error(
          '[useGame] ❌ Error initializing game (WebSocket):',
          error
        );
      }
    };

    initializeGame();
    return () => {
      unsubscribeState();
      unsubscribeTurn();
      unsubscribeRoom();
      unsubscribeStarted();
    };
  }, [playerId]);

  // Map of home path indices for each color (first player request focuses on yellow)
  // Corner-local slot layout (2x2) not relying on path indices
  // Each color gets four relative slot offsets inside its corner square.
  const HOME_SLOTS = {
    yellow: [
      // bottom-right corner
      { ox: 0.2, oy: 0.2 },
      { ox: 0.7, oy: 0.2 },
      { ox: 0.2, oy: 0.7 },
      { ox: 0.7, oy: 0.7 },
    ],
    blue: [
      // top-right
      { ox: 0.2, oy: 0.2 },
      { ox: 0.7, oy: 0.2 },
      { ox: 0.2, oy: 0.7 },
      { ox: 0.7, oy: 0.7 },
    ],
    red: [
      // top-left
      { ox: 0.2, oy: 0.2 },
      { ox: 0.7, oy: 0.2 },
      { ox: 0.2, oy: 0.7 },
      { ox: 0.7, oy: 0.7 },
    ],
    green: [
      // bottom-left
      { ox: 0.2, oy: 0.2 },
      { ox: 0.7, oy: 0.2 },
      { ox: 0.2, oy: 0.7 },
      { ox: 0.7, oy: 0.7 },
    ],
  };

  // Initialize token pieces from backend player tokens
  useEffect(() => {
    if (!gameStarted || players.length === 0) return;

    // console.log('[useGame] 🎮 Initializing pieces from players:', players);

    const allPieces = [];
    players.forEach((player) => {
      const color = player.color;
      if (Array.isArray(player.tokens)) {
        // First pass: identify tokens still in home for this player
        const homeTokens = player.tokens.filter((t) => t.position === 'home');

        // console.log(`[useGame] Player ${player.id} (${color}):`, {
        //   totalTokens: player.tokens.length,
        //   homeTokens: homeTokens.length,
        //   tokens: player.tokens,
        // });

        player.tokens.forEach((token, idx) => {
          const inHome = token.position === 'home';

          // For home tokens, reassign slot based on remaining home tokens
          // This creates the 4→3→2→1 visual effect as tokens leave
          let displaySlotIndex = idx;
          if (inHome) {
            displaySlotIndex = homeTokens.findIndex((t) => t.id === token.id);
          }

          allPieces.push({
            id: token.id,
            tokenId: token.id,
            playerId: player.id,
            color,
            position: inHome ? null : token.position,
            inHome,
            slotIndex: displaySlotIndex,
            finished: token.finished,
            x: 0,
            y: 0,
            px: 0,
            py: 0,
          });
        });
      }
    });

    // console.log('[useGame] ✓ Initialized pieces:', allPieces);
    setPieces(allPieces);
    initializedRef.current = false;
  }, [players, gameStarted]);

  useEffect(() => {
    const img = new Image();
    img.src = '/avatar.png';
    img.onload = () => {
      avatarImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load avatar image');
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#888';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', 50, 50);

      const placeholderImg = new Image();
      placeholderImg.src = canvas.toDataURL();
      placeholderImg.onload = () => {
        avatarImageRef.current = placeholderImg;
        setImageLoaded(true);
      };
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!gameStarted || !pieceColor) return;

    const animate = () => {
      animationFrameRef.current += 1;

      // Draw the board with the current animation frame
      if (drawBoardRef.current) {
        drawBoardRef.current(animationFrameRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationIdRef.current = requestAnimationFrame(animate);

    // Clean up the animation loop
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameStarted, pieceColor]);

  // Create a function to draw the board
  const createDrawBoardFunction = useCallback(() => {
    if (
      !canvasRef.current ||
      !canvasContextRef.current ||
      !pathRef.current ||
      !gameCellsRef.current
    )
      return null;

    return (animationFrame = 0) => {
      drawBoard(
        canvasContextRef.current,
        canvasRef.current,
        pieceColor,
        gameCellsRef.current,
        pathRef.current,
        debug,
        piecesRef.current,
        imageLoaded,
        avatarImageRef,
        players,
        selectedTokenId,
        animationFrame
      );
    };
  }, [pieceColor, debug, imageLoaded, players, selectedTokenId]);

  // Function to recalculate piece positions after resize
  const recalculatePiecePositions = useCallback(() => {
    if (!gameStarted || !pieceColor || pieces.length === 0) return;

    const canvas = canvasRef.current;
    const path = pathRef.current;
    const gameCells = gameCellsRef.current;

    if (!path || !gameCells) return;

    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    // Update positions for all pieces
    const updatedPieces = pieces.map((piece) => {
      // Corner-local placement for home tokens
      if (piece.inHome) {
        const pos = PLAYER_POSITIONS[piece.color];
        if (pos) {
          const slots = HOME_SLOTS[piece.color] || [];
          const slot = slots[piece.slotIndex] || slots[0];
          const cornerPixelSize = CORNER_SIZE * cellSize;
          const baseX = pos.x * cellSize;
          const baseY = pos.y * cellSize;
          const px = baseX + cornerPixelSize * slot.ox;
          const py = baseY + cornerPixelSize * slot.oy;
          return { ...piece, px, py };
        }
        return piece;
      }

      // Piece out of home: use board cell mapping (existing logic)
      const currentCell = piecePositionsRef.current[piece.id] || piece.position;
      const targetIndices = gameCells[currentCell];
      if (!targetIndices) return piece;
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];
      if (!firstCell || !secondCell) return piece;
      let px =
        (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
      let py =
        (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      return {
        ...piece,
        x: firstCell.x,
        y: firstCell.y,
        px,
        py,
        position: currentCell,
      };
    });

    // Update both the ref and state
    piecesRef.current = updatedPieces;
    setPieces(updatedPieces);
  }, [gameStarted, pieceColor]); // Removed pieces from dependencies

  // Separate effect for canvas setup
  useEffect(() => {
    if (!gameStarted || !pieceColor) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvasContextRef.current = ctx;
    const { path, gameCells } = buildPath();

    // Store path and gameCells in refs for use in other functions
    pathRef.current = path;
    gameCellsRef.current = gameCells;

    function resizeCanvas() {
      isResizingRef.current = true;

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

      // Recalculate piece positions after resize
      recalculatePiecePositions();

      // Reset the resize flag after a short delay
      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);
    }

    // Create the drawBoard function
    drawBoardRef.current = createDrawBoardFunction();

    resizeCanvas();
    boardInitializedRef.current = true;

    // Store the resize handler in a ref so we can remove it later
    resizeHandlerRef.current = resizeCanvas;
    window.addEventListener('resize', resizeHandlerRef.current);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }
    };
  }, [
    gameStarted,
    pieceColor,
    createDrawBoardFunction,
    recalculatePiecePositions,
  ]);

  // Update drawBoard function when dependencies change
  useEffect(() => {
    drawBoardRef.current = createDrawBoardFunction();
  }, [createDrawBoardFunction]);

  // Effect for initializing piece positions
  useEffect(() => {
    if (
      !gameStarted ||
      !pieceColor ||
      pieces.length === 0 ||
      initializedRef.current
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvasContextRef.current;
    const path = pathRef.current;
    const gameCells = gameCellsRef.current;

    if (!path || !gameCells) return;

    const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

    // Update positions for all pieces
    const updatedPieces = pieces.map((piece) => {
      // Handle tokens in home base
      if (piece.inHome) {
        const pos = PLAYER_POSITIONS[piece.color];
        if (pos) {
          const slots = HOME_SLOTS[piece.color] || [];
          const slot = slots[piece.slotIndex] || slots[0];
          const cornerPixelSize = CORNER_SIZE * cellSize;
          const baseX = pos.x * cellSize;
          const baseY = pos.y * cellSize;
          const px = baseX + cornerPixelSize * slot.ox;
          const py = baseY + cornerPixelSize * slot.oy;
          return { ...piece, px, py };
        }
        return piece; // fallback if corner not found
      }

      // Handle tokens on the board
      const startCell = piece.position;
      if (startCell == null) return piece; // skip if no position set

      const firstCellIndices = gameCells[startCell];
      if (!firstCellIndices) return piece; // skip if cell not found

      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

      if (!firstCell || !secondCell) return piece; // skip if path cells not found

      const isHorizontal = firstCell.y === secondCell.y;

      let px, py;

      if (isHorizontal) {
        px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      // Store the initial position in piecePositionsRef
      piecePositionsRef.current[piece.id] = startCell;

      return {
        ...piece,
        x: firstCell.x,
        y: firstCell.y,
        px,
        py,
      };
    });

    setPieces(updatedPieces);
    initializedRef.current = true;
  }, [gameStarted, pieceColor, pieces.length]); // Only depend on pieces length, not the array itself

  // Effect for setting up move functions
  useEffect(() => {
    if (!gameStarted || !pieceColor || pieces.length === 0) return;

    const path = pathRef.current;
    const gameCells = gameCellsRef.current;

    if (!path || !gameCells) return;

    const currentGameCellRef = { current: {} };

    // Initialize current positions for all players
    pieces.forEach((piece) => {
      currentGameCellRef.current[piece.id] =
        piecePositionsRef.current[piece.id] || piece.position;
    });

    function moveToGameCell(playerId, targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMovingRef.current && typeof onComplete === 'undefined') return;

      isMovingRef.current = true;
      const currentCell = currentGameCellRef.current[playerId];

      const stepsToMove = (targetCellNumber - currentCell + 68) % 68;

      let currentStepInMove = 0;

      function moveStep() {
        if (currentStepInMove >= stepsToMove) {
          isMovingRef.current = false;
          if (onComplete) onComplete();
          return;
        }

        currentStepInMove++;
        const nextCellNumber = ((currentCell + currentStepInMove - 1) % 68) + 1;

        if (!gameCells[nextCellNumber]) {
          isMovingRef.current = false;
          if (onComplete) onComplete();
          return;
        }

        const targetIndices = gameCells[nextCellNumber];
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];

        const isHorizontal = firstCell.y === secondCell.y;

        const canvas = canvasRef.current;
        const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
        let targetX, targetY;

        if (isHorizontal) {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        } else {
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        }

        function animate() {
          // Skip animation if resizing
          if (isResizingRef.current) {
            requestAnimationFrame(animate);
            return;
          }

          // Find the piece for this player
          const currentPieces = piecesRef.current;
          const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
          if (pieceIndex === -1) {
            isMovingRef.current = false;
            if (onComplete) onComplete();
            return;
          }

          const piece = currentPieces[pieceIndex];
          let dx = targetX - piece.px;
          let dy = targetY - piece.py;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            // Update the piece position
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
            // Final position update
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

            // Update the stored position
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
        if (onComplete) onComplete();
        return;
      }
      if (isMovingRef.current && typeof onComplete === 'undefined') return;

      isMovingRef.current = true;

      const targetIndices = gameCells[targetHomeCell];
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

      const isHorizontal = firstCell.y === secondCell.y;

      const canvas = canvasRef.current;
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
      let targetX, targetY;

      if (isHorizontal) {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      function animate() {
        // Skip animation if resizing
        if (isResizingRef.current) {
          requestAnimationFrame(animate);
          return;
        }

        // Find the piece for this player
        const currentPieces = piecesRef.current;
        const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
        if (pieceIndex === -1) {
          isMovingRef.current = false;
          if (onComplete) onComplete();
          return;
        }

        const piece = currentPieces[pieceIndex];
        let dx = targetX - piece.px;
        let dy = targetY - piece.py;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          // Update the piece position
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
          // Final position update
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

          // Update the stored position
          piecePositionsRef.current[playerId] = targetHomeCell;
          currentGameCellRef.current[playerId] = targetHomeCell;

          if (onComplete) {
            onComplete();
          }
        }
      }
      animate();
    }

    function movePiece(playerId, steps) {
      if (isMovingRef.current) return;

      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      const currentCell = currentGameCellRef.current[playerId];
      let entryCell;
      let homePathPrefix;

      switch (player.color) {
        case 'yellow':
          entryCell = 68;
          homePathPrefix = 'Y';
          break;
        case 'blue':
          entryCell = 17;
          homePathPrefix = 'B';
          break;
        case 'red':
          entryCell = 34;
          homePathPrefix = 'R';
          break;
        case 'green':
          entryCell = 51;
          homePathPrefix = 'G';
          break;
        default:
          return;
      }

      // Check if the piece is already in the home path
      if (
        typeof currentCell === 'string' &&
        currentCell[0] === homePathPrefix
      ) {
        const currentHomeNum = parseInt(currentCell.substring(1));
        const targetHomeNum = Math.min(7, currentHomeNum + steps);
        const stepsToMove = targetHomeNum - currentHomeNum;
        let currentStep = 0;

        function moveHomeStep() {
          if (currentStep >= stepsToMove) {
            isMovingRef.current = false;
            return;
          }

          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          moveToHomePath(
            nextHomeCell,
            1,
            currentStep < stepsToMove ? moveHomeStep : null
          );
        }

        moveHomeStep();
        return;
      }

      // Check if the piece needs to enter the home path
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
        function executeMove() {
          if (currentMove >= moveSequence.length) {
            isMovingRef.current = false;
            return;
          }
          const nextCell = moveSequence[currentMove];
          currentMove++;

          if (typeof nextCell === 'string') {
            moveToHomePath(
              nextCell,
              1,
              currentMove < moveSequence.length ? executeMove : null
            );
          } else {
            moveToGameCell(
              playerId,
              nextCell,
              currentMove < moveSequence.length ? executeMove : null
            );
          }
        }
        executeMove();
      } else {
        const targetCellNumber = ((currentCell + steps - 1) % 68) + 1;
        moveToGameCell(playerId, targetCellNumber);
      }
    }

    // Store the movePiece function in a ref to access it in rollDice
    moveToIndexRef.current = movePiece;
  }, [gameStarted, pieceColor, players]); // Removed pieces from dependencies

  // Canvas click to select token
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e) => {
      if (!gameStarted || !currentPlayer || currentPlayer.id !== playerId)
        return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / window.devicePixelRatio / rect.width;
      const scaleY = canvas.height / window.devicePixelRatio / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;
      const pickRadius = cellSize / 2;
      let found = null;
      piecesRef.current.forEach((p) => {
        if (p.playerId !== playerId) return;
        const dx = p.px - x;
        const dy = p.py - y;
        if (Math.sqrt(dx * dx + dy * dy) <= pickRadius) {
          found = p;
        }
      });
      if (found) {
        setSelectedTokenId(found.tokenId);
        console.log('[useGame] Selected token', found.tokenId);
      } else {
        setSelectedTokenId(null);
      }
    };
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameStarted, currentPlayer, playerId]);

  // Apply a specific die to selected token
  const useDieForSelectedToken = (tokenId, diceIndex) => {
    if (tokenId == null) {
      console.log('[useGame] No token selected, cannot use die.');
      return;
    }

    const move = legalMoves.find(
      (m) => m.tokenId === tokenId && m.diceIndex === diceIndex
    );

    if (move) {
      console.log('[useGame] Executing move:', move);
      wsMoveToken(move.tokenId, move.diceIndex, (err, data) => {
        if (err) {
          console.error('[useGame] Move error', err);
          return;
        }
        // server will emit updated state, and we clear selection
        setSelectedTokenId(null);
      });
    } else {
      console.warn(
        '[useGame] No legal move found for token',
        tokenId,
        'with dice index',
        diceIndex
      );
    }
  };

  const toggleDebug = () => {
    setDebug(!debug);
  };

  const changeColor = () => {
    // In multiplayer mode, color is determined by player ID
    // This function now switches to the next player in sequence
    if (players.length <= 1) return;

    // Find current player index
    const currentPlayerIndex = players.findIndex((p) => p.id === playerId);

    // Calculate next player index (wrap around if at the end)
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    // Switch to the next player
    setPlayerId(nextPlayer.id);
    setPieceColor(nextPlayer.color);
  };

  return {
    canvasRef,
    diceResultRef,
    debug,
    pieceColor,
    imageLoaded,
    isRolling,
    players,
    currentPlayer,
    playerId,
    gameStarted,
    rollDice,
    toggleDebug,
    changeColor,
    startGame,
    onUseDie: useDieForSelectedToken,
    selectedTokenId,
  };
}
