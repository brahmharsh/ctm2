"use client";
// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);
  const diceResultRef = useRef(null);
  const moveToIndexRef = useRef(null);
  const pieceIndexRef = useRef(0); // <-- persist piece position
  const currentGameCellRef = useRef(1); // Track current game cell number
  const [debug, setDebug] = useState(false); // Debug state to show/hide cell numbers
  const [pieceColor, setPieceColor] = useState(""); // State to store piece color

  // Global color definitions
  const colors = {
    red: "rgba(220, 38, 38, 0.7)", // Consistent red
    blue: "rgba(59, 130, 246, 0.7)", // Consistent blue
    green: "rgba(34, 197, 94, 0.7)", // Consistent green
    yellow: "rgba(234, 179, 8, 0.7)", // Consistent yellow
    black: "rgba(0, 0, 0, 1)", // Black for pieces
  };

  // Initialize random piece color on component mount
  useEffect(() => {
    const colorOptions = ["red", "blue", "green", "yellow"];
    const randomColor =
      colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setPieceColor(randomColor);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let gridSize = 20; // Changed from 10 to 18
    let path = [];
    let gameCells = {}; // Map of game cell numbers to path indices
    let piece = { x: 0, y: 0, px: 0, py: 0 };
    let isMoving = false; // Track if piece is currently moving

    function buildPath() {
      path = [];
      // Create a linear path from left to right, top to bottom
      for (let i = 0; i < gridSize * gridSize; i++) {
        let row = Math.floor(i / gridSize);
        let col = i % gridSize;
        path.push({ x: col, y: row, index: i });
      }

      // Create game cells mapping (Path for piece movement)
      gameCells = {};
      let cellNumber = 1;

      // 1 to 8 - Vertical path going up (cells merged horizontally)
      gameCells[cellNumber++] = [391, 392]; // Cell 1
      gameCells[cellNumber++] = [371, 372]; // Cell 2
      gameCells[cellNumber++] = [351, 352]; // Cell 3
      gameCells[cellNumber++] = [331, 332]; // Cell 4
      gameCells[cellNumber++] = [311, 312]; // Cell 5
      gameCells[cellNumber++] = [291, 292]; // Cell 6
      gameCells[cellNumber++] = [271, 272]; // Cell 7
      gameCells[cellNumber++] = [251, 252]; // Cell 8

      // 9 to 16 - Horizontal path going right (cells merged vertically)
      gameCells[cellNumber++] = [232, 252]; // Cell 9
      gameCells[cellNumber++] = [233, 253]; // Cell 10
      gameCells[cellNumber++] = [234, 254]; // Cell 11
      gameCells[cellNumber++] = [235, 255]; // Cell 12
      gameCells[cellNumber++] = [236, 256]; // Cell 13
      gameCells[cellNumber++] = [237, 257]; // Cell 14
      gameCells[cellNumber++] = [238, 258]; // Cell 15
      gameCells[cellNumber++] = [239, 259]; // Cell 16

      // 17 to 18 - Vertical path going up (cells merged vertically)
      gameCells[cellNumber++] = [199, 219]; // Cell 17
      gameCells[cellNumber++] = [159, 179]; // Cell 18

      //19 to 25 - Horizontal path going left (cells merged vertically)
      gameCells[cellNumber++] = [158, 178]; // Cell 19
      gameCells[cellNumber++] = [157, 177]; // Cell 20
      gameCells[cellNumber++] = [156, 176]; // Cell 21
      gameCells[cellNumber++] = [155, 175]; // Cell 22
      gameCells[cellNumber++] = [154, 174]; // Cell 23
      gameCells[cellNumber++] = [153, 173]; // Cell 24
      gameCells[cellNumber++] = [152, 172]; // Cell 25

      // 26 to 33 - Vertical path going up (cells merged horizontally)
      gameCells[cellNumber++] = [151, 152]; // Cell 26
      gameCells[cellNumber++] = [131, 132]; // Cell 27
      gameCells[cellNumber++] = [111, 112]; // Cell 28
      gameCells[cellNumber++] = [91, 92]; // Cell 29
      gameCells[cellNumber++] = [71, 72]; // Cell 30
      gameCells[cellNumber++] = [51, 52]; // Cell 31
      gameCells[cellNumber++] = [31, 32]; // Cell 32
      gameCells[cellNumber++] = [11, 12]; // Cell 33

      //34 to 35 - Horizontal path going left (cells merged horizontally)
      gameCells[cellNumber++] = [9, 10]; // Cell 34
      gameCells[cellNumber++] = [7, 8]; // Cell 35

      //36 to 42 - Vertical path going down (cells merged horizontally)
      gameCells[cellNumber++] = [27, 28]; // Cell 36
      gameCells[cellNumber++] = [47, 48]; // Cell 37
      gameCells[cellNumber++] = [67, 68]; // Cell 38
      gameCells[cellNumber++] = [87, 88]; // Cell 39
      gameCells[cellNumber++] = [107, 108]; // Cell 40
      gameCells[cellNumber++] = [127, 128]; // Cell 41
      gameCells[cellNumber++] = [147, 148]; // Cell 42

      //43 to 50 - Horizontal path going left (cells merged vertically)
      gameCells[cellNumber++] = [147, 167]; // Cell 43
      gameCells[cellNumber++] = [146, 166]; // Cell 44
      gameCells[cellNumber++] = [145, 165]; // Cell 45
      gameCells[cellNumber++] = [144, 164]; // Cell 46
      gameCells[cellNumber++] = [143, 163]; // Cell 47
      gameCells[cellNumber++] = [142, 162]; // Cell 48
      gameCells[cellNumber++] = [141, 161]; // Cell 49
      gameCells[cellNumber++] = [140, 160]; // Cell 50

      // 51 to 52 - Vertical path going down (cells merged vertically)
      gameCells[cellNumber++] = [180, 200]; // Cell 51
      gameCells[cellNumber++] = [220, 240]; // Cell 52

      //53 to 59 - Horizontal path going right (cells merged vertically)
      gameCells[cellNumber++] = [221, 241]; // Cell 53
      gameCells[cellNumber++] = [222, 242]; // Cell 54
      gameCells[cellNumber++] = [223, 243]; // Cell 55
      gameCells[cellNumber++] = [224, 244]; // Cell 56
      gameCells[cellNumber++] = [225, 245]; // Cell 57
      gameCells[cellNumber++] = [226, 246]; // Cell 58
      gameCells[cellNumber++] = [227, 247]; // Cell 59

      //60 to 67 - Vertical path going down (cells merged horizontally)
      gameCells[cellNumber++] = [247, 248]; // Cell 60
      gameCells[cellNumber++] = [267, 268]; // Cell 61
      gameCells[cellNumber++] = [287, 288]; // Cell 62
      gameCells[cellNumber++] = [307, 308]; // Cell 63
      gameCells[cellNumber++] = [327, 328]; // Cell 64
      gameCells[cellNumber++] = [347, 348]; // Cell 65
      gameCells[cellNumber++] = [367, 368]; // Cell 66
      gameCells[cellNumber++] = [387, 388]; // Cell 67

      //68 - going right (cell merged horizontally)
      gameCells[cellNumber++] = [389, 390]; // Cell 68

      //Assign code number to tails
      //for yellow tail (cells merged horizontally)
      gameCells["Y1"] = [369, 370]; // Cell Y1
      gameCells["Y2"] = [349, 350]; // Cell Y2
      gameCells["Y3"] = [329, 330]; // Cell Y3
      gameCells["Y4"] = [309, 310]; // Cell Y4
      gameCells["Y5"] = [289, 290]; // Cell Y5
      gameCells["Y6"] = [269, 270]; // Cell Y6
      gameCells["Y7"] = [249, 250]; // Cell Y7

      //for blue tail (cells merged vertically)
      gameCells["B1"] = [198, 218]; // Cell B1
      gameCells["B2"] = [197, 217]; // Cell B2
      gameCells["B3"] = [196, 216]; // Cell B3
      gameCells["B4"] = [195, 215]; // Cell B4
      gameCells["B5"] = [194, 214]; // Cell B5
      gameCells["B6"] = [193, 213]; // Cell B6
      gameCells["B7"] = [192, 212]; // Cell B7

      //for red tail (cells merged horizontally)
      gameCells["R1"] = [29, 30]; // Cell R1
      gameCells["R2"] = [49, 50]; // Cell R2
      gameCells["R3"] = [69, 70]; // Cell R3
      gameCells["R4"] = [89, 90]; // Cell R4
      gameCells["R5"] = [109, 110]; // Cell R5
      gameCells["R6"] = [129, 130]; // Cell R6
      gameCells["R7"] = [149, 150]; // Cell R7

      //for green tail (cells merged vertically)
      gameCells["G1"] = [181, 201]; // Cell G1
      gameCells["G2"] = [182, 202]; // Cell G2
      gameCells["G3"] = [183, 203]; // Cell G3
      gameCells["G4"] = [184, 204]; // Cell G4
      gameCells["G5"] = [185, 205]; // Cell G5
      gameCells["G6"] = [186, 206]; // Cell G6
      gameCells["G7"] = [187, 207]; // Cell G7
    }

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

    function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      ctx.stroke();
      ctx.fillStyle = "gold";
      ctx.fill();
    }

    function drawBoard() {
      const size = canvas.width / window.devicePixelRatio;
      const cellSize = size / gridSize;
      ctx.clearRect(0, 0, size, size);

      ctx.save();

      // Rotate board based on player color
      const boardCenterX = size / 2;
      const boardCenterY = size / 2;
      ctx.translate(boardCenterX, boardCenterY);

      let rotation = 0;
      switch (pieceColor) {
        case "red":
          rotation = Math.PI; // 180 degrees
          break;
        case "blue":
          rotation = Math.PI / 2; // 90 degrees
          break;
        case "green":
          rotation = -Math.PI / 2; // -90 degrees
          break;
        // Yellow is default, no rotation
      }
      ctx.rotate(rotation);
      ctx.translate(-boardCenterX, -boardCenterY);

      // Define start cell colors
      const startCellColors = {
        5: colors.yellow,
        22: colors.blue,
        39: colors.red,
        56: colors.green,
      };
      const safeCells = [12, 17, 29, 34, 46, 51, 63, 68];

      // Draw colored corners (6x6 squares)
      const cornerSize = 7;

      // Top left - Red
      ctx.fillStyle = colors.red;
      ctx.fillRect(0, 0, cornerSize * cellSize, cornerSize * cellSize);

      // Top right - Blue
      ctx.fillStyle = colors.blue;
      ctx.fillRect(
        (gridSize - cornerSize) * cellSize,
        0,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Bottom left - Green
      ctx.fillStyle = colors.green;
      ctx.fillRect(
        0,
        (gridSize - cornerSize) * cellSize,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Bottom right - Yellow
      ctx.fillStyle = colors.yellow;
      ctx.fillRect(
        (gridSize - cornerSize) * cellSize,
        (gridSize - cornerSize) * cellSize,
        cornerSize * cellSize,
        cornerSize * cellSize,
      );

      // Draw home area (4x4 grey square in center)
      const homeSize = 4;
      const homeStartX = Math.floor((gridSize - homeSize) / 2);
      const homeStartY = Math.floor((gridSize - homeSize) / 2);
      ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
      ctx.fillRect(
        homeStartX * cellSize,
        homeStartY * cellSize,
        homeSize * cellSize,
        homeSize * cellSize,
      );

      // Draw colored tails extending from home area
      // Red tail (extending upward from home)
      ctx.fillStyle = colors.red;
      ctx.fillRect(
        (homeStartX + 1) * cellSize,
        (homeStartY - 7) * cellSize,
        2 * cellSize,
        7 * cellSize,
      );

      // Blue tail (extending rightward from home)
      ctx.fillStyle = colors.blue;
      ctx.fillRect(
        (homeStartX + homeSize) * cellSize,
        (homeStartY + 1) * cellSize,
        7 * cellSize,
        2 * cellSize,
      );

      // Yellow tail (extending downward from home)
      ctx.fillStyle = colors.yellow;
      ctx.fillRect(
        (homeStartX + 1) * cellSize,
        (homeStartY + homeSize) * cellSize,
        2 * cellSize,
        7 * cellSize,
      );

      // Green tail (extending leftward from home)
      ctx.fillStyle = colors.green;
      ctx.fillRect(
        (homeStartX - 7) * cellSize,
        (homeStartY + 1) * cellSize,
        7 * cellSize,
        2 * cellSize,
      );

      // Draw 4 colored triangles in the home area
      const homeX = homeStartX * cellSize;
      const homeY = homeStartY * cellSize;
      const homeWidth = homeSize * cellSize;
      const homeHeight = homeSize * cellSize;

      // Calculate center point
      const centerX = homeX + homeWidth / 2;
      const centerY = homeY + homeHeight / 2;

      // Top triangle (Red) - pointing up (toward top-left corner)
      ctx.fillStyle = colors.red;
      ctx.beginPath();
      ctx.moveTo(centerX, homeY + homeHeight / 2);
      ctx.lineTo(homeX, homeY);
      ctx.lineTo(homeX + homeWidth, homeY);
      ctx.closePath();
      ctx.fill();

      // Right triangle (Blue) - pointing right (toward top-right corner) -
      ctx.fillStyle = colors.blue;
      ctx.beginPath();
      ctx.moveTo(homeX + homeWidth / 2, centerY);
      ctx.lineTo(homeX + homeWidth, homeY);
      ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Bottom triangle (Yellow) - pointing down (toward bottom-right corner)
      ctx.fillStyle = colors.yellow;
      ctx.beginPath();
      ctx.moveTo(centerX, homeY + homeHeight / 2);
      ctx.lineTo(homeX, homeY + homeHeight);
      ctx.lineTo(homeX + homeWidth, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Left triangle (Green) - pointing left (toward bottom-left corner)
      ctx.fillStyle = colors.green;
      ctx.beginPath();
      ctx.moveTo(homeX + homeWidth / 2, centerY);
      ctx.lineTo(homeX, homeY);
      ctx.lineTo(homeX, homeY + homeHeight);
      ctx.closePath();
      ctx.fill();

      // Draw game cell numbers with borders
      ctx.font = `bold ${cellSize / 3}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw game cell numbers
      for (const [cellNumber, indices] of Object.entries(gameCells)) {
        // Get the two cells
        const firstCell = path[indices[0]];
        const secondCell = path[indices[1]];

        // Check if cells are horizontally or vertically aligned
        const isHorizontal = firstCell.y === secondCell.y;

        let x, y, width, height;

        if (isHorizontal) {
          // For horizontally merged cells (1-8, 26-33, 34-35, 36-42, 60-67, 68)
          x = firstCell.x * cellSize;
          y = firstCell.y * cellSize;
          width = 2 * cellSize;
          height = cellSize;
        } else {
          // For vertically merged cells (9-16, 17-18, 19-25, 43-50, 51-52, 53-59)
          x = firstCell.x * cellSize;
          y = firstCell.y * cellSize;
          width = cellSize;
          height = 2 * cellSize;
        }

        // Draw the background for the combined cell
        const cellNum = parseInt(cellNumber);
        if (startCellColors[cellNum]) {
          ctx.fillStyle = startCellColors[cellNum];
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0)";
        }
        ctx.fillRect(x, y, width, height);

        // Draw the border around the combined cell
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, width, height);

        // Draw the number or a star in the center of the combined cell
        const cellCenterX = x + width / 2;
        const cellCenterY = y + height / 2;

        ctx.save();
        ctx.translate(cellCenterX, cellCenterY);
        ctx.rotate(-rotation);

        if (safeCells.includes(cellNum)) {
          drawStar(0, 0, 5, cellSize / 4, cellSize / 8);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillText(cellNumber, 0, 0);
        }
        ctx.restore();
      }

      // Draw debug cell numbers if debug mode is on
      if (debug) {
        // Draw grid
        ctx.strokeStyle = "#aaa";
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        }

        ctx.fillStyle = "#666";
        ctx.font = `${cellSize / 5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i < path.length; i++) {
          const cell = path[i];
          const x = cell.x * cellSize + cellSize / 2;
          const y = cell.y * cellSize + cellSize / 2;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-rotation);
          ctx.fillText(cell.index, 0, 0);
          ctx.restore();
        }
      }

      // Draw piece with the assigned color
      ctx.fillStyle = colors[pieceColor];
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(piece.px, piece.py, cellSize / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function moveToGameCell(targetCellNumber, onComplete) {
      if (!gameCells[targetCellNumber]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;
      const currentCell = currentGameCellRef.current;

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

        // Get the indices for the next game cell
        const targetIndices = gameCells[nextCellNumber];
        // Calculate the center position of the combined cell
        const firstCell = path[targetIndices[0]];
        const secondCell = path[targetIndices[1]];

        // Check if cells are horizontally or vertically aligned
        const isHorizontal = firstCell.y === secondCell.y;

        const cellSize = canvas.width / window.devicePixelRatio / gridSize;
        let targetX, targetY;

        if (isHorizontal) {
          // For horizontally merged cells (1-8, 26-33, 34-35, 36-42, 60-67, 68)
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        } else {
          // For vertically merged cells (9-16, 17-18, 19-25, 43-50, 51-52, 53-59)
          targetX =
            (firstCell.x * cellSize + secondCell.x * cellSize) / 2 +
            cellSize / 2;
          targetY =
            (firstCell.y * cellSize + secondCell.y * cellSize) / 2 +
            cellSize / 2;
        }

        // Animate the piece to the target position
        function animate() {
          let dx = targetX - piece.px;
          let dy = targetY - piece.py;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 2) {
            piece.px += dx * 0.3; // Increased speed for faster animation
            piece.py += dy * 0.3;
            drawBoard();
            requestAnimationFrame(animate);
          } else {
            piece.px = targetX;
            piece.py = targetY;
            currentGameCellRef.current = nextCellNumber; // Update the ref
            drawBoard();

            // Move to the next step after a short delay
            setTimeout(moveStep, 10); // Short delay between steps
          }
        }
        animate();
      }

      moveStep();
    }

    // Function to move to home path cells step by step
    function moveToHomePath(targetHomeCell, stepsRemaining, onComplete) {
      if (!gameCells[targetHomeCell]) {
        if (onComplete) onComplete();
        return;
      }
      if (isMoving && typeof onComplete === "undefined") return;

      isMoving = true;

      // Get the indices for the home cell
      const targetIndices = gameCells[targetHomeCell];
      // Calculate the center position of the combined cell
      const firstCell = path[targetIndices[0]];
      const secondCell = path[targetIndices[1]];

      // Check if cells are horizontally or vertically aligned
      const isHorizontal = firstCell.y === secondCell.y;

      const cellSize = canvas.width / window.devicePixelRatio / gridSize;
      let targetX, targetY;

      if (isHorizontal) {
        // For horizontally merged cells
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        // For vertically merged cells
        targetX =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        targetY =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      // Animate the piece to the target position
      function animate() {
        let dx = targetX - piece.px;
        let dy = targetY - piece.py;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          piece.px += dx * 0.3; // Increased speed for faster animation
          piece.py += dy * 0.3;
          drawBoard();
          requestAnimationFrame(animate);
        } else {
          piece.px = targetX;
          piece.py = targetY;
          currentGameCellRef.current = targetHomeCell; // Update the ref with home cell code
          isMoving = false;
          drawBoard();

          if (onComplete) {
            onComplete();
          }
        }
      }
      animate();
    }

    // Modified function to handle both regular cells and home path
    function movePiece(steps) {
      if (isMoving) return;

      const currentCell = currentGameCellRef.current;
      let entryCell;
      let homePathPrefix;

      // Determine entry cell and home path prefix based on piece color
      switch (pieceColor) {
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

      // Check if piece is already on home path
      if (
        typeof currentCell === "string" &&
        currentCell[0] === homePathPrefix
      ) {
        // Move further along home path
        const currentHomeNum = parseInt(currentCell.substring(1));
        const targetHomeNum = Math.min(7, currentHomeNum + steps);
        const stepsToMove = targetHomeNum - currentHomeNum;
        let currentStep = 0;

        function moveHomeStep() {
          if (currentStep >= stepsToMove) return;

          currentStep++;
          const nextHomeCell = homePathPrefix + (currentHomeNum + currentStep);
          moveToHomePath(nextHomeCell, 1);

          // Continue to next step after a delay
          if (currentStep < stepsToMove) {
            setTimeout(moveHomeStep, 300);
          }
        }

        moveHomeStep();
        return;
      }

      // Check if the move crosses the entry point
      const distToEntry = (entryCell - currentCell + 68) % 68;

      if (distToEntry < steps) {
        // Enter home path
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
            moveToHomePath(nextCell, 1, executeMove);
          } else {
            moveToGameCell(nextCell, executeMove);
          }
        }
        executeMove();
      } else {
        // Move on regular path
        const targetCellNumber = ((currentCell + steps - 1) % 68) + 1;
        moveToGameCell(targetCellNumber);
      }
    }

    moveToIndexRef.current = movePiece;

    const startCells = {
      blue: 22,
      yellow: 5,
      red: 39,
      green: 56,
    };

    function init() {
      buildPath();
      resizeCanvas();
      const cellSize = canvas.width / window.devicePixelRatio / gridSize;

      // Get the starting cell based on the piece color
      const startCell = startCells[pieceColor] || 1;

      // Position the piece at the center of the starting game cell
      const firstCellIndices = gameCells[startCell];
      const firstCell = path[firstCellIndices[0]];
      const secondCell = path[firstCellIndices[1]];

      // Check if cells are horizontally or vertically aligned
      const isHorizontal = firstCell.y === secondCell.y;

      pieceIndexRef.current = firstCellIndices[0];
      piece.x = firstCell.x;
      piece.y = firstCell.y;

      if (isHorizontal) {
        // For horizontally merged cells
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      } else {
        // For vertically merged cells
        piece.px =
          (firstCell.x * cellSize + secondCell.x * cellSize) / 2 + cellSize / 2;
        piece.py =
          (firstCell.y * cellSize + secondCell.y * cellSize) / 2 + cellSize / 2;
      }

      currentGameCellRef.current = startCell; // Initialize the ref
      drawBoard();
    }

    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [debug, pieceColor]); // Add pieceColor as a dependency

  const rollDice = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    diceResultRef.current.innerText = `🎲 Dice: ${dice}`;

    if (moveToIndexRef.current) {
      // Pass the dice value directly to the movePiece function
      moveToIndexRef.current(
        parseInt(diceResultRef.current.innerText.split(": ")[1]),
      );
    }
  };

  const toggleDebug = () => {
    setDebug(!debug);
  };

  const changeColor = () => {
    const colorOptions = ["red", "blue", "green", "yellow"];
    const randomColor =
      colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setPieceColor(randomColor);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-200 bg-white w-[90vmin] h-[90vmin]"
      />
      <div className="mt-4 flex gap-2">
        <button
          onClick={rollDice}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
        >
          🎲 Roll Dice
        </button>
        <button
          onClick={toggleDebug}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
        >
          {debug ? "Hide" : "Show"} Debug
        </button>
        <button
          onClick={changeColor}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700"
        >
          🎨 Change Color
        </button>
      </div>
      <p ref={diceResultRef} className="mt-2 text-lg font-semibold"></p>
      <p className="mt-1 text-sm text-gray-600">Piece Color: {pieceColor}</p>
    </div>
  );
}
