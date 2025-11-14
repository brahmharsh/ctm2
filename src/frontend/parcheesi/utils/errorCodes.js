// Error code constants and user-friendly messages for frontend
// Source: docs/parchessi_rules.md Section 6

export const ErrorCodes = {
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  TOKEN_FINISHED: 'TOKEN_FINISHED',
  NO_PENDING_DICE: 'NO_PENDING_DICE',
  DICE_ALREADY_USED: 'DICE_ALREADY_USED',
  NEED_SIX_TO_ENTER: 'NEED_SIX_TO_ENTER',
  BARRIER_BLOCKED: 'BARRIER_BLOCKED',
  CAPTURE_ON_SAFE: 'CAPTURE_ON_SAFE',
  OVERSHOOT_HOME: 'OVERSHOOT_HOME',
  INVALID_HOME_ROW_ENTRY: 'INVALID_HOME_ROW_ENTRY',
  MOVE_NOT_LEGAL: 'MOVE_NOT_LEGAL',
};

export const ErrorMessages = {
  [ErrorCodes.NOT_YOUR_TURN]:
    "It's not your turn yet. Please wait for the other player.",
  [ErrorCodes.PLAYER_NOT_FOUND]: 'Player not found in this game.',
  [ErrorCodes.TOKEN_NOT_FOUND]: 'Selected token not found.',
  [ErrorCodes.TOKEN_FINISHED]: 'This token has already reached home.',
  [ErrorCodes.NO_PENDING_DICE]: 'Please roll the dice first.',
  [ErrorCodes.DICE_ALREADY_USED]: 'This die has already been used for a move.',
  [ErrorCodes.NEED_SIX_TO_ENTER]:
    'You need to roll a 6 to bring a token out of the base.',
  [ErrorCodes.BARRIER_BLOCKED]:
    'Your path is blocked by a barrier (two tokens of the same color).',
  [ErrorCodes.CAPTURE_ON_SAFE]: 'Cannot capture opponents on safe squares.',
  [ErrorCodes.OVERSHOOT_HOME]:
    'You need an exact count to reach home. This move overshoots.',
  [ErrorCodes.INVALID_HOME_ROW_ENTRY]: 'Invalid entry into home row.',
  [ErrorCodes.MOVE_NOT_LEGAL]:
    'This move is not allowed. Please try a different move.',
};

/**
 * Get user-friendly error message from error code
 * @param {string} code - Error code from backend
 * @param {string} fallback - Optional fallback message
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(
  code,
  fallback = 'An error occurred. Please try again.'
) {
  return ErrorMessages[code] || fallback;
}

/**
 * Check if error is recoverable (player can take different action)
 * @param {string} code - Error code from backend
 * @returns {boolean} True if player can retry with different move
 */
export function isRecoverableError(code) {
  const recoverable = [
    ErrorCodes.TOKEN_FINISHED,
    ErrorCodes.DICE_ALREADY_USED,
    ErrorCodes.NEED_SIX_TO_ENTER,
    ErrorCodes.BARRIER_BLOCKED,
    ErrorCodes.OVERSHOOT_HOME,
    ErrorCodes.MOVE_NOT_LEGAL,
  ];
  return recoverable.includes(code);
}

/**
 * Check if error requires waiting (not player's action)
 * @param {string} code - Error code from backend
 * @returns {boolean} True if player must wait
 */
export function isWaitingError(code) {
  return code === ErrorCodes.NOT_YOUR_TURN;
}

/**
 * Check if error is system/fatal (game state issue)
 * @param {string} code - Error code from backend
 * @returns {boolean} True if error indicates system problem
 */
export function isSystemError(code) {
  const systemErrors = [
    ErrorCodes.PLAYER_NOT_FOUND,
    ErrorCodes.TOKEN_NOT_FOUND,
    ErrorCodes.INVALID_HOME_ROW_ENTRY,
  ];
  return systemErrors.includes(code);
}
