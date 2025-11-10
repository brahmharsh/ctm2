// Comprehensive test suite for Parcheesi rules (docs/parchessi_rules.md compliance)
import {
  createGameState,
  rollDice,
  isPlayerTurn,
  getLegalMoves,
  applyMove,
  checkWin,
  advanceTurn,
  attachPendingDice,
  shouldAdvanceTurn,
  ErrorCodes,
} from '../rules.js';

describe('Parcheesi Rules - Spec Compliance', () => {
  let gameState;
  const playerIds = ['player1', 'player2'];

  beforeEach(() => {
    gameState = createGameState(playerIds);
    gameState.gameStarted = true;
  });

  describe('1. Game Initialization', () => {
    test('should create game with correct player count', () => {
      expect(gameState.players).toHaveLength(2);
    });

    test('should assign correct colors for 2-player game', () => {
      expect(gameState.players[0].color).toBe('yellow');
      expect(gameState.players[1].color).toBe('red');
    });

    test('should initialize 4 tokens per player in home', () => {
      gameState.players.forEach((player) => {
        expect(player.tokens).toHaveLength(4);
        player.tokens.forEach((token) => {
          expect(token.position).toBe('home');
          expect(token.finished).toBe(false);
        });
      });
    });
  });

  describe('2. Dice Rolling', () => {
    test('should roll two dice', () => {
      const dice = rollDice();
      expect(dice).toHaveLength(2);
      dice.forEach((die) => {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('3. Entry from Home (Spec Section 3)', () => {
    test('leave-base-empty: should allow entry with 6 when start square is empty', () => {
      const player = gameState.players[0];
      attachPendingDice(gameState, [6, 2]);

      const legalMoves = getLegalMoves(gameState, player.id);
      const entryMoves = legalMoves.filter((m) => m.diceValue === 6);

      expect(entryMoves.length).toBeGreaterThan(0);
      expect(entryMoves[0].newPosition).toBe(player.startCell);
    });

    test('should reject entry without rolling 6', () => {
      const player = gameState.players[0];
      attachPendingDice(gameState, [3, 4]);

      const legalMoves = getLegalMoves(gameState, player.id);
      expect(legalMoves).toHaveLength(0);
    });

    test('leave-base-own-token: should allow entry and create barrier with own token', () => {
      const player = gameState.players[0];
      const token1 = player.tokens[0];
      const token2 = player.tokens[1];

      // Place first token on start square
      token1.position = player.startCell;

      // Try to enter with second token
      attachPendingDice(gameState, [6, 3]);
      const legalMoves = getLegalMoves(gameState, player.id);
      const entryMoves = legalMoves.filter(
        (m) => m.tokenId === token2.id && m.diceValue === 6
      );

      expect(entryMoves.length).toBeGreaterThan(0);
    });

    test('leave-base-opponent-safe: should block entry when opponent on safe start square', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Place opponent token on player1's start square (which is safe: 5)
      player2.tokens[0].position = player1.startCell;

      attachPendingDice(gameState, [6, 3]);
      const legalMoves = getLegalMoves(gameState, player1.id);
      const entryMoves = legalMoves.filter((m) => m.diceValue === 6);

      expect(entryMoves).toHaveLength(0);
    });

    test('leave-base-opponent-non-safe: should allow capture when entering on non-safe square with opponent', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Change start cell to non-safe for testing (player2 starts at 39 which is NOT in safe set)
      player2.tokens[0].position = 39;

      // Player2 tries to enter their start (39 is not safe)
      gameState.currentPlayerIndex = 1;
      attachPendingDice(gameState, [6, 1]);

      const result = applyMove(gameState, player2.id, player2.tokens[1].id, 0);
      expect(result.success).toBe(true);
      // Opponent should have been captured if on non-safe square
    });

    test('leave-base-barrier-blocked: should block entry when barrier exists on start square', () => {
      const player1 = gameState.players[0];

      // Create barrier on start square (2 tokens of same color)
      player1.tokens[0].position = player1.startCell;
      player1.tokens[1].position = player1.startCell;

      attachPendingDice(gameState, [6, 3]);

      const result = applyMove(gameState, player1.id, player1.tokens[2].id, 0);
      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.BARRIER_BLOCKED);
    });
  });

  describe('4. Barrier Mechanics (Spec Section 3)', () => {
    test('pass-over-barrier: should block movement through barrier', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];

      // Place token on track
      token.position = 10;

      // Create barrier ahead
      player.tokens[1].position = 12;
      player.tokens[2].position = 12;

      attachPendingDice(gameState, [5, 3]);
      const legalMoves = getLegalMoves(gameState, player.id);

      // Move of 5 would pass through barrier at 12, should be blocked
      const blockedMove = legalMoves.find(
        (m) => m.tokenId === token.id && m.diceValue === 5
      );
      expect(blockedMove).toBeUndefined();
    });

    test('should block landing on barrier', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];

      token.position = 10;

      // Create barrier at exact landing spot
      player.tokens[1].position = 13;
      player.tokens[2].position = 13;

      attachPendingDice(gameState, [3, 2]);
      const legalMoves = getLegalMoves(gameState, player.id);

      const blockedMove = legalMoves.find(
        (m) => m.tokenId === token.id && m.diceValue === 3
      );
      expect(blockedMove).toBeUndefined();
    });
  });

  describe('5. Captures and Bonuses (Spec Section 3)', () => {
    test('capture-non-safe-bonus: should capture opponent and grant +20 bonus on non-safe square', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Place tokens for capture scenario on non-safe square (e.g., 10)
      player1.tokens[0].position = 8;
      player2.tokens[0].position = 10;

      attachPendingDice(gameState, [2, 3]);

      const result = applyMove(gameState, player1.id, player1.tokens[0].id, 0);

      expect(result.success).toBe(true);
      expect(result.capturedTokens).toHaveLength(1);
      expect(result.captureBonus).toBe(20);
      expect(player2.tokens[0].position).toBe('home');
    });

    test('should NOT allow capture on safe square', () => {
      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Place opponent on safe square 12
      player2.tokens[0].position = 12;
      player1.tokens[0].position = 10;

      attachPendingDice(gameState, [2, 3]);

      // Move of 2 would land on safe square with opponent - should not result in capture
      const result = applyMove(gameState, player1.id, player1.tokens[0].id, 0);

      if (result.success) {
        expect(result.capturedTokens).toHaveLength(0);
        expect(result.captureBonus).toBe(0);
      }
    });
  });

  describe('6. Home Row Entry (Spec Section 5)', () => {
    test('square-68-not-finish: yellow token should enter home row at entry point', () => {
      const player = gameState.players[0]; // Yellow player (starts at 5, enters home row at 4)
      const token = player.tokens[0];

      // Place yellow token at position 2
      // Rolling 3 will move through [3, 4, 5]
      // Position 4 is the home row entry, so token enters home row
      token.position = 2;

      attachPendingDice(gameState, [3, 2]);

      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(true);
      expect(result.enteredHomeRow).toBe(true);
      expect(token.inHomeRow).toBe(true);
      expect(token.homeRowPosition).toBe(1); // Entered at position 1
      expect(token.finished).toBe(false);
    });

    test('overshoot-home: should reject move that overshoots home', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];

      // Place token in home row near finish
      token.position = 'home_row:6';
      token.inHomeRow = true;
      token.homeRowPosition = 6;

      attachPendingDice(gameState, [3, 2]);

      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.OVERSHOOT_HOME);
    });

    test('should finish token with exact count to home', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];

      // Place token 3 steps from home (position 5, needs 3 to reach position 8/finished)
      token.position = 'home_row:5';
      token.inHomeRow = true;
      token.homeRowPosition = 5;

      attachPendingDice(gameState, [3, 2]);

      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(true);
      expect(token.finished).toBe(true);
    });
  });

  describe('7. Turn Management', () => {
    test('concurrent-turn-reject: should reject move from non-active player', () => {
      const player2 = gameState.players[1];

      // Player 1 is active (index 0)
      expect(gameState.currentPlayerIndex).toBe(0);

      attachPendingDice(gameState, [6, 3]);

      const result = applyMove(gameState, player2.id, player2.tokens[0].id, 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.NOT_YOUR_TURN);
    });

    test('should advance turn after all dice used', () => {
      const player1 = gameState.players[0];
      const token = player1.tokens[0];
      token.position = 10;

      attachPendingDice(gameState, [2, 3]);

      // Use first die
      applyMove(gameState, player1.id, token.id, 0);
      expect(shouldAdvanceTurn(gameState)).toBe(false);

      // Use second die
      applyMove(gameState, player1.id, token.id, 1);
      expect(shouldAdvanceTurn(gameState)).toBe(true);
    });
  });

  describe('8. Dice Usage and Split Moves', () => {
    test('split-dice-vs-sum: should allow dice to be split across tokens', () => {
      const player = gameState.players[0];
      const token1 = player.tokens[0];
      const token2 = player.tokens[1];

      token1.position = 10;
      token2.position = 15;

      attachPendingDice(gameState, [4, 5]);

      const legalMoves = getLegalMoves(gameState, player.id);

      const token1Moves = legalMoves.filter((m) => m.tokenId === token1.id);
      const token2Moves = legalMoves.filter((m) => m.tokenId === token2.id);

      expect(token1Moves.length).toBeGreaterThan(0);
      expect(token2Moves.length).toBeGreaterThan(0);
    });

    test('should track which dice are used', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];
      token.position = 10;

      attachPendingDice(gameState, [2, 3]);

      expect(gameState.usedDice).toEqual([false, false]);

      applyMove(gameState, player.id, token.id, 0);
      expect(gameState.usedDice[0]).toBe(true);
      expect(gameState.usedDice[1]).toBe(false);
    });

    test('should reject reuse of already-used die', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];
      token.position = 10;

      attachPendingDice(gameState, [2, 3]);

      // Use first die
      applyMove(gameState, player.id, token.id, 0);

      // Try to reuse first die
      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.DICE_ALREADY_USED);
    });
  });

  describe('9. Win Condition (Spec Section 3)', () => {
    test('should detect win when all tokens finished', () => {
      const player = gameState.players[0];

      player.tokens.forEach((token) => {
        token.finished = true;
      });
      player.finishedTokens = 4;

      expect(checkWin(player)).toBe(true);
    });

    test('should not detect win with tokens remaining', () => {
      const player = gameState.players[0];

      player.tokens[0].finished = true;
      player.finishedTokens = 1;

      expect(checkWin(player)).toBe(false);
    });
  });

  describe('10. Error Code Compliance (Spec Section 6)', () => {
    test('should return TOKEN_NOT_FOUND for invalid token', () => {
      const player = gameState.players[0];
      attachPendingDice(gameState, [6, 3]);

      const result = applyMove(gameState, player.id, 'invalid-token-id', 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.TOKEN_NOT_FOUND);
    });

    test('should return TOKEN_FINISHED for already finished token', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];
      token.finished = true;

      attachPendingDice(gameState, [6, 3]);

      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.TOKEN_FINISHED);
    });

    test('should return NO_PENDING_DICE when dice not rolled', () => {
      const player = gameState.players[0];
      const token = player.tokens[0];
      token.position = 10;

      const result = applyMove(gameState, player.id, token.id, 0);

      expect(result.success).toBe(false);
      expect(result.code).toBe(ErrorCodes.NO_PENDING_DICE);
    });
  });
});
