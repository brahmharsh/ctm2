// /hooks/useGame.js
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildPath } from "../game-logic";
import { drawBoard } from "../drawing";
import { GRID_SIZE, START_CELLS, PLAYERS } from "../constants";
import { api } from "../services/api";

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

  // Update the ref whenever pieces changes
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Initialize game and join as player_1
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Reset game first
        await api.resetGame();

        // Join as player_1
        const response = await api.joinGame("player_1");
        if (response.success) {
          setPlayerId("player_1");
          setPieceColor(response.data.player.color);
          setPlayers(response.data.gameState.players);
          setCurrentPlayer(response.data.gameState.players[0]);
          setGameStarted(true);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };

    initializeGame();
  }, []);

  // Simulate other players joining
  useEffect(() => {
    if (!gameStarted || players.length >= 4) return;

    const simulatePlayersJoining = async () => {
      const playerIds = ["player_2", "player_3", "player_4"];

      for (const id of playerIds) {
        if (players.length >= 4) break;

        // Random delay before next player joins
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 2000 + 1000),
        );

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
      const startCell = PLAYERS[player.id].startCell;
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

  useEffect(() => {
    if (!gameStarted || !pieceColor || pieces.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { path, gameCells } = buildPath();

    let isMoving = false;
    const currentGameCellRef = { current: {} };

    // Initialize current positions for all players
    pieces.forEach((piece) => {
      currentGameCellRef.current[piece.id] = piece.position;
    });

    function resizeCanvas() {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0,
      );
    }

    function callDrawBoard() {
      drawBoard(
        ctx,
        canvas,
        pieceColor,
        gameCells,
        path,
        debug,
        piecesRef.current,
        imageLoaded,
        avatarImageRef,
        players,
      );
    }

    function initializePiecePositions() {
      const cellSize = canvas.width / window.devicePixelRatio / GRID_SIZE;

      // Update positions for all pieces
      const updatedPieces = pieces.map((piece) => {
        const startCell = PLAYERS[piece.id].startCell;
        const firstCellIndices = gameCells[startCell];
        const firstCell = path[firstCellIndices[0]];
        const secondCell = path[firstCellIndices[1]];

        const isHorizontal = firstCell.y === secondCell.y;

        let px, py;

        if (isHorizontal) {
          px =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          py =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        } else {
          px =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          py =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        }

        return {
          ...piece,
          x: firstCell.x,
          y: firstCell.y,
          px,
          py,
        };
      });

      setPieces(updatedPieces);
    }

    function moveToGameCell(playerId, targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;
      const currentCell = currentGameCellRef.current[playerId];

      const stepsToMove = (targetCellNumber - currentCell + 68) % 68;

      let currentStepInMove = 0;

      function moveStep() {
        if (currentStepInMove >= stepsToMove) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        currentStepInMove++;
        const nextCellNumber = ((currentCell + currentStepInMove - 1) % 68) + 1;

        if (!gameCells[nextCellNumber]) {
          isMoving = false;
          if (onComplete) onComplete();
          return;
        }

        const targetIndices = gameCells[nextCellNumber];
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];

        const isHorizontal = firstCell.y === secondCell.y;

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
          // Find the piece for this player
          const currentPieces = piecesRef.current;
          const pieceIndex = currentPieces.findIndex((p) => p.id === playerId);
          if (pieceIndex === -1) {
            isMoving = false;
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

            callDrawBoard();
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

            currentGameCellRef.current[playerId] = nextCellNumber;
            callDrawBoard();

            setTimeout(moveStep, 10);
          }
        }
        animate();
      }

      moveStep();
    }

    function movePiece(playerId, steps) {
      if (isMoving) return;

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

      if (
        typeof currentCell === "string" &&
        currentCell[0] === homePathPrefix
      ) {
        const currentHomeNum = parseInt(currentCell.substring(1));
        const targetHomeNum = Math.min(7, currentHomeNum + steps);
        const stepsToMove = targetHomeNum - currentHomeNum;
        let currentStep = 0;

        function moveHomeStep() {
          if (currentStep >= stepsToMove) return;

          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          // For simplicity, we'll skip home path movement for now
          // In a full implementation, you would add a moveToHomePath function

          if (currentStep < stepsToMove) {
            setTimeout(moveHomeStep, 300);
          }
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
        function executeMove() {
          if (currentMove >= moveSequence.length) {
            isMoving = false;
            return;
          }
          const nextCell = moveSequence[currentMove];
          currentMove++;

          if (typeof nextCell === "string") {
            // For simplicity, we'll skip home path movement for now
            // In a full implementation, you would add a moveToHomePath function
            executeMove();
          } else {
            moveToGameCell(playerId, nextCell, executeMove);
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

    function init() {
      resizeCanvas();
      initializePiecePositions();
      callDrawBoard();
    }

    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [debug, pieceColor, imageLoaded, players, gameStarted]); // Removed pieces from dependencies

  const rollDice = async () => {
    if (isRolling || !playerId) return;

    setIsRolling(true);

    try {
      // Call the mock API
      const response = await api.rollDice(playerId);

      if (response.success && diceResultRef.current) {
        diceResultRef.current.innerText = `🎲 Dice: ${response.data.dice}`;

        // Update current player
        const nextPlayer = players.find(
          (p) => p.id === response.data.nextPlayer,
        );
        setCurrentPlayer(nextPlayer);

        // Move the piece with the result from the server
        if (moveToIndexRef.current) {
          moveToIndexRef.current(playerId, response.data.dice);
        }
      } else if (!response.success && diceResultRef.current) {
        diceResultRef.current.innerText = response.error;
      }
    } catch (error) {
      console.error("Error rolling dice:", error);
      if (diceResultRef.current) {
        diceResultRef.current.innerText = "Error rolling dice";
      }
    } finally {
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
