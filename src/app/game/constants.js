// /constants.js

export const COLORS = {
  red: "rgba(220, 38, 38, 0.7)",
  blue: "rgba(59, 130, 246, 0.7)",
  green: "rgba(34, 197, 94, 0.7)",
  yellow: "rgba(234, 179, 8, 0.7)",
  black: "rgba(0, 0, 0, 1)",
};

export const GRID_SIZE = 20;
export const CORNER_SIZE = 7;
export const HOME_SIZE = 4;

export const START_CELLS = {
  blue: 22,
  yellow: 5,
  red: 39,
  green: 56,
};

export const SAFE_CELLS = [12, 17, 29, 34, 46, 51, 63, 68];

// Player constants
export const PLAYERS = {
  player_1: { color: "yellow", startCell: 5 },
  player_2: { color: "blue", startCell: 22 },
  player_3: { color: "red", startCell: 39 },
  player_4: { color: "green", startCell: 56 },
};

// Player positions on the board corners
export const PLAYER_POSITIONS = {
  player_1: { x: GRID_SIZE - CORNER_SIZE, y: GRID_SIZE - CORNER_SIZE }, // Bottom-right
  player_2: { x: GRID_SIZE - CORNER_SIZE, y: 0 }, // Top-right
  player_3: { x: 0, y: 0 }, // Top-left
  player_4: { x: 0, y: GRID_SIZE - CORNER_SIZE }, // Bottom-left
};
