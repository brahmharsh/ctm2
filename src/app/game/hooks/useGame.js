// /hooks/useGame.js
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing";
import { GRID_SIZE, START_CELLS, PLAYERS } from "../constants";
import { api } from "../services/api";
import {
  initSocket,
  joinGame as wsJoinGame,
  rollDice as wsRollDice,
  onStateUpdate,
  onTurnEnd,
  onRoomUpdate,
} from "../../../client/socket/client";

export function useGame() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const [debug, setDebug] = useState(false);
  const [pieceColor, setPieceColor] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
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

  // Update the ref whenever pieces changes
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Initialize game and join as player_1 via WebSocket; still call REST reset for clean state
  useEffect(() => {
    let unsubscribeState = () => {};
    let unsubscribeTurn = () => {};
    let unsubscribeRoom = () => {};

    const initializeGame = async () => {
      try {
        console.log("[Init] Resetting game via REST before WebSocket join");
        await api.resetGame();

        console.log("[Socket] Initializing socket connection");
        initSocket();

        // Subscribe to room updates (players join/leave)
        unsubscribeRoom = onRoomUpdate((data) => {
          console.log("[Socket] Room update received", data);
          // Rebuild players list from room update if possible (we only get IDs, so keep existing color mapping)
          setPlayers((prev) => {
            // If we have detailed players from prior state use them; else map to placeholder
            if (prev.length && prev.every((p) => p.id)) {
              const idToPlayer = Object.fromEntries(prev.map((p) => [p.id, p]));
              return data.players.map(
                (pid) => idToPlayer[pid] || { id: pid, color: "unknown" }
              );
            }
            return data.players.map((pid) => ({ id: pid, color: "unknown" }));
          });
        });

        // Subscribe to state updates
        unsubscribeState = onStateUpdate((data) => {
          if (!data?.gameState) return;
          const gs = data.gameState;
          setPlayers(gs.players);
          if (
            gs.currentPlayerIndex != null &&
            gs.players[gs.currentPlayerIndex]
          ) {
            setCurrentPlayer(gs.players[gs.currentPlayerIndex]);
          }
          setGameStarted(gs.gameStarted);
        });

        // Subscribe to turn end updates
        unsubscribeTurn = onTurnEnd((data) => {
          console.log("[Socket] Turn end", data);
          if (data?.nextPlayer) {
            setCurrentPlayer((prev) => {
              return players.find((p) => p.id === data.nextPlayer) || prev;
            });
          }
        });

        // Join as player_1 via WebSocket
        wsJoinGame("test-room", "player_1", (err, data) => {
          if (err) {
            console.error("[Socket] Join error", err);
            return;
          }
          console.log("[Socket] Joined room", data);
          setPlayerId("player_1");
          // player color will come in first state update; for now placeholder
        });
      } catch (error) {
        console.error("Error initializing game (WebSocket):", error);
      }
    };

    initializeGame();
    return () => {
      unsubscribeState();
      unsubscribeTurn();
      unsubscribeRoom();
    };
  }, []);

  // Simulate other players joining
  useEffect(() => {
    if (!gameStarted || players.length >= 4) return;

    const simulatePlayersJoining = async () => {
      const playerIds = ["player_2", "player_3", "player_4"];

      for (const id of playerIds) {
        if (players.length >= 4) break;

        // Random delay before next player joins
        // await new Promise((resolve) =>
        //   setTimeout(resolve, Math.random() * 2000 + 1000),
        // );

        try {
          const response = await api.joinGame(id);
          if (response.success) {
            setPlayers((prev) => [...prev, response.data.player]);
          }
        } catch (error) {
          console.error(`Error adding ${id}:`, error);
        }
      }
    };

    simulatePlayersJoining();
  }, [gameStarted, players.length]);

  // Initialize pieces when players change
  useEffect(() => {
    if (!gameStarted || players.length === 0) return;

    const newPieces = players.map((player) => {
      const startCell = player.startCell;
      return {
        id: player.id,
        color: player.color,
        position: startCell,
        x: 0,
        y: 0,
        px: 0,
        py: 0,
      };
    });

    setPieces(newPieces);
    initializedRef.current = false; // Reset initialization flag when pieces change
  }, [players, gameStarted]);

  useEffect(() => {
    const img = new Image();
    img.src = "/avatar.png";
    img.onload = () => {
      avatarImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load avatar image");
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👤", 50, 50);

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
        animationFrame
      );
    };
  }, [pieceColor, debug, imageLoaded, players]);

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
      // Use the stored position from piecePositionsRef if available
      const currentCell = piecePositionsRef.current[piece.id] || piece.position;
      let targetIndices;

      // Check if the piece is in the home path
      if (typeof currentCell === "string") {
        targetIndices = gameCells[currentCell];
      } else {
        targetIndices = gameCells[currentCell];
      }

      if (!targetIndices) return piece;

      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

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

      return {
        ...piece,
        x: firstCell.x,
        y: firstCell.y,
        px,
        py,
        position: currentCell, // Ensure position is preserved
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
    const ctx = canvas.getContext("2d");
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
    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
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
      const startCell = piece.position;
      const firstCellIndices = gameCells[startCell];
      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

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
      if (isMovingRef.current && typeof onComplete === "undefined") return;

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
      if (isMovingRef.current && typeof onComplete === "undefined") return;

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

      // Check if the piece is already in the home path
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

          if (typeof nextCell === "string") {
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

  const rollDice = async () => {
    if (isRolling || !playerId) return;
    setIsRolling(true);
    try {
      console.log("[Socket] Emitting roll:dice");
      wsRollDice((err, data) => {
        if (err) {
          console.error("[Socket] Roll error", err);
          if (diceResultRef.current)
            diceResultRef.current.innerText = err.message || "Roll error";
          setIsRolling(false);
          return;
        }
        if (diceResultRef.current) {
          diceResultRef.current.innerText = `🎲 Dice: ${data.dice.join(", ")}`;
        }
        // Move piece locally for simple animation (combine dice values for now)
        if (moveToIndexRef.current) {
          // Example: use sum of dice for movement animation (adjust when legalMoves selection UI exists)
          const steps = data.dice.reduce((a, b) => a + b, 0);
          moveToIndexRef.current(playerId, steps);
        }
        setIsRolling(false);
      });
    } catch (e) {
      console.error("[Socket] Roll unexpected error", e);
      if (diceResultRef.current) diceResultRef.current.innerText = "Roll error";
      setIsRolling(false);
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
    rollDice,
    toggleDebug,
    changeColor,
  };
}
