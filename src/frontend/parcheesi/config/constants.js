// Parcheesi frontend constants (moved from features/parcheesi/config/constants.js)
export const COLORS = {
  red: 'rgba(223, 68, 68, 0.7)',
  blue: 'rgba(71, 138, 246, 0.7)',
  green: 'rgba(56, 200, 109, 0.7)',
  yellow: 'rgba(246, 215, 123, 0.7)',
  black: 'rgba(0, 0, 0, 1)',
};

// Darker colors for tokens (distinguish from board background)
export const TOKEN_COLORS = {
  red: 'rgba(126, 5, 5, 1)',
  blue: 'rgba(2, 30, 105, 1)',
  green: 'rgba(1, 79, 30, 1)', // DARK GREEN requested (distinct from board green)
  yellow: 'rgba(216, 128, 4, 1)',
};

export const GRID_SIZE = 20;
export const CORNER_SIZE = 7;
export const HOME_SIZE = 4;
export const TOKENS_PER_PLAYER = 4;

export const START_CELLS = {
  blue: 22,
  yellow: 5,
  red: 39,
  green: 56,
};

export const SAFE_CELLS = [12, 17, 29, 34, 46, 51, 63, 68];

// Player constants
export const PLAYERS = {
  player_1: { color: 'yellow', startCell: 5 },
  player_2: { color: 'blue', startCell: 22 },
  player_3: { color: 'red', startCell: 39 },
  player_4: { color: 'green', startCell: 56 },
};

// Player positions on the board corners
export const PLAYER_POSITIONS = {
  yellow: { x: GRID_SIZE - CORNER_SIZE, y: GRID_SIZE - CORNER_SIZE }, // Bottom-right
  blue: { x: GRID_SIZE - CORNER_SIZE, y: 0 }, // Top-right
  red: { x: 0, y: 0 }, // Top-left
  green: { x: 0, y: GRID_SIZE - CORNER_SIZE }, // Bottom-left
};

// Home positions for each player's 4 tokens (in grid coordinates)
// These positions are in the colored corner areas
export const HOME_POSITIONS = {
  yellow: [
    { x: 14.5, y: 14.5 },
    { x: 17.5, y: 14.5 },
    { x: 14.5, y: 17.5 },
    { x: 17.5, y: 17.5 },
  ],
  blue: [
    { x: 14.5, y: 1.5 },
    { x: 17.5, y: 1.5 },
    { x: 14.5, y: 4.5 },
    { x: 17.5, y: 4.5 },
  ],
  red: [
    { x: 1.5, y: 1.5 },
    { x: 4.5, y: 1.5 },
    { x: 1.5, y: 4.5 },
    { x: 4.5, y: 4.5 },
  ],
  green: [
    { x: 1.5, y: 14.5 },
    { x: 4.5, y: 14.5 },
    { x: 1.5, y: 17.5 },
    { x: 4.5, y: 17.5 },
  ],
};
