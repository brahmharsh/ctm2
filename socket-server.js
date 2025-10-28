// WebSocket Server for Real-time Multiplayer Parchís Game
// KISS: Standalone Socket.IO server that runs alongside Next.js
// Run with: node socket-server.js

import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  joinRoom,
  leaveRoom,
  startGame,
  getGameState,
  updateGameState,
  getRoomIdBySocket,
  getPlayerIdBySocket,
  getSocketsInRoom,
  getRoomInfo,
} from './src/lib/game/rooms.js';
import {
  rollDice,
  getLegalMoves,
  applyMove,
  checkWin,
  advanceTurn,
  isPlayerTurn,
} from './src/lib/game/rules.js';
import { logger } from './src/lib/api/logger.js';

const PORT = process.env.SOCKET_PORT || 3001;

// Create HTTP server for Socket.IO
const httpServer = createServer();

// Initialize Socket.IO with CORS for Next.js client
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

logger.info('Socket.IO server initializing', { port: PORT });

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // ------------------------------------------------------------------------
  // EVENT: game:join
  // Client joins a game room
  // ------------------------------------------------------------------------
  socket.on('game:join', (payload) => {
    try {
      const { roomId, playerId } = payload || {};

      if (!roomId || !playerId) {
        socket.emit('error', {
          message: 'Missing roomId or playerId',
          event: 'game:join',
        });
        logger.warn('Invalid join payload', { socketId: socket.id, payload });
        return;
      }

      // Join room (auto-creates if doesn't exist)
      const result = joinRoom(roomId, socket.id, playerId);

      if (!result.success) {
        socket.emit('error', {
          message: result.error,
          event: 'game:join',
        });
        logger.warn('Join failed', { socketId: socket.id, error: result.error });
        return;
      }

      // Join Socket.IO room for broadcasting
      socket.join(roomId);

      // Notify player of successful join
      socket.emit('game:joined', {
        roomId,
        playerId,
        playerCount: result.playerCount,
        players: result.players,
      });

      // Notify all players in room
      io.to(roomId).emit('room:update', {
        roomId,
        playerCount: result.playerCount,
        players: result.players,
      });

      logger.info('Player joined successfully', {
        socketId: socket.id,
        roomId,
        playerId,
      });
    } catch (error) {
      logger.error('game:join handler error', { error: error.message });
      socket.emit('error', { message: 'Internal server error', event: 'game:join' });
    }
  });

  // ------------------------------------------------------------------------
  // EVENT: game:start
  // Start the game in a room (when all players ready)
  // ------------------------------------------------------------------------
  socket.on('game:start', (payload) => {
    try {
      const roomId = getRoomIdBySocket(socket.id);

      if (!roomId) {
        socket.emit('error', {
          message: 'Not in a room',
          event: 'game:start',
        });
        return;
      }

      // Start game
      const result = startGame(roomId);

      if (!result.success) {
        socket.emit('error', {
          message: result.error,
          event: 'game:start',
        });
        logger.warn('Game start failed', { roomId, error: result.error });
        return;
      }

      // Broadcast game started to all players
      io.to(roomId).emit('game:started', {
        gameState: result.gameState,
        currentPlayer: result.gameState.players[0].id,
      });

      // Emit initial state
      io.to(roomId).emit('update:state', {
        gameState: result.gameState,
      });

      logger.info('Game started successfully', { roomId });
    } catch (error) {
      logger.error('game:start handler error', { error: error.message });
      socket.emit('error', { message: 'Internal server error', event: 'game:start' });
    }
  });

  // ------------------------------------------------------------------------
  // EVENT: roll:dice
  // Player rolls dice (server generates random values)
  // ------------------------------------------------------------------------
  socket.on('roll:dice', (payload) => {
    try {
      const roomId = getRoomIdBySocket(socket.id);
      const playerId = getPlayerIdBySocket(socket.id);

      if (!roomId || !playerId) {
        socket.emit('error', {
          message: 'Not in a game',
          event: 'roll:dice',
        });
        return;
      }

      const gameState = getGameState(roomId);

      if (!gameState || !gameState.gameStarted) {
        socket.emit('error', {
          message: 'Game not started',
          event: 'roll:dice',
        });
        return;
      }

      if (gameState.gameOver) {
        socket.emit('error', {
          message: 'Game is over',
          event: 'roll:dice',
        });
        return;
      }

      // Validate it's player's turn
      if (!isPlayerTurn(gameState, playerId)) {
        socket.emit('error', {
          message: 'Not your turn',
          event: 'roll:dice',
        });
        logger.warn('Invalid turn attempt', { roomId, playerId });
        return;
      }

      // Server-side dice roll (authoritative)
      const dice = rollDice();

      // Calculate legal moves
      const legalMoves = getLegalMoves(gameState, playerId, dice);

      logger.info('Dice rolled', {
        roomId,
        playerId,
        dice,
        legalMovesCount: legalMoves.length,
      });

      // Emit roll result to all players
      io.to(roomId).emit('roll:result', {
        playerId,
        dice,
        legalMoves,
      });

      // If no legal moves, auto-advance turn
      if (legalMoves.length === 0) {
        advanceTurn(gameState);
        updateGameState(roomId, gameState);

        io.to(roomId).emit('turn:end', {
          nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
          reason: 'no_legal_moves',
        });

        io.to(roomId).emit('update:state', { gameState });
      }
    } catch (error) {
      logger.error('roll:dice handler error', { error: error.message });
      socket.emit('error', { message: 'Internal server error', event: 'roll:dice' });
    }
  });

  // ------------------------------------------------------------------------
  // EVENT: move:token
  // Player requests to move a token
  // ------------------------------------------------------------------------
  socket.on('move:token', (payload) => {
    try {
      const { tokenId, newPosition } = payload || {};
      const roomId = getRoomIdBySocket(socket.id);
      const playerId = getPlayerIdBySocket(socket.id);

      if (!roomId || !playerId) {
        socket.emit('error', {
          message: 'Not in a game',
          event: 'move:token',
        });
        return;
      }

      if (tokenId === undefined || newPosition === undefined) {
        socket.emit('error', {
          message: 'Missing tokenId or newPosition',
          event: 'move:token',
        });
        return;
      }

      const gameState = getGameState(roomId);

      if (!gameState || !gameState.gameStarted || gameState.gameOver) {
        socket.emit('error', {
          message: 'Invalid game state',
          event: 'move:token',
        });
        return;
      }

      // Validate turn
      if (!isPlayerTurn(gameState, playerId)) {
        socket.emit('error', {
          message: 'Not your turn',
          event: 'move:token',
        });
        return;
      }

      // Apply move (validates and mutates gameState)
      const moveResult = applyMove(gameState, playerId, tokenId, newPosition);

      if (!moveResult.success) {
        socket.emit('error', {
          message: moveResult.error,
          event: 'move:token',
        });
        logger.warn('Move failed', { roomId, playerId, error: moveResult.error });
        return;
      }

      logger.info('Token moved', {
        roomId,
        playerId,
        tokenId,
        from: moveResult.from,
        to: moveResult.to,
        captured: !!moveResult.captured,
      });

      // Emit move result to all players
      io.to(roomId).emit('move:result', {
        playerId,
        tokenId,
        from: moveResult.from,
        to: moveResult.to,
        captured: moveResult.captured,
        bonusMove: moveResult.bonusMove,
      });

      // Check for win
      const player = gameState.players.find(p => p.id === playerId);
      if (checkWin(player)) {
        gameState.gameOver = true;
        gameState.winner = playerId;
        updateGameState(roomId, gameState);

        io.to(roomId).emit('game:win', {
          winner: playerId,
          gameState,
        });

        logger.info('Game won', { roomId, winner: playerId });
        return;
      }

      // Advance turn (unless bonus move granted)
      if (!moveResult.bonusMove) {
        advanceTurn(gameState);
      }

      updateGameState(roomId, gameState);

      // Emit updated state
      io.to(roomId).emit('update:state', { gameState });

      // Emit turn end
      io.to(roomId).emit('turn:end', {
        nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
      });
    } catch (error) {
      logger.error('move:token handler error', { error: error.message });
      socket.emit('error', { message: 'Internal server error', event: 'move:token' });
    }
  });

  // ------------------------------------------------------------------------
  // EVENT: get:state
  // Client requests current game state
  // ------------------------------------------------------------------------
  socket.on('get:state', () => {
    try {
      const roomId = getRoomIdBySocket(socket.id);

      if (!roomId) {
        socket.emit('error', {
          message: 'Not in a room',
          event: 'get:state',
        });
        return;
      }

      const gameState = getGameState(roomId);
      socket.emit('update:state', { gameState });
    } catch (error) {
      logger.error('get:state handler error', { error: error.message });
      socket.emit('error', { message: 'Internal server error', event: 'get:state' });
    }
  });

  // ------------------------------------------------------------------------
  // EVENT: disconnect
  // Client disconnects
  // ------------------------------------------------------------------------
  socket.on('disconnect', () => {
    try {
      const roomId = getRoomIdBySocket(socket.id);
      const playerId = getPlayerIdBySocket(socket.id);

      if (roomId) {
        const result = leaveRoom(socket.id);

        if (result.success) {
          // Notify remaining players
          io.to(roomId).emit('player:left', {
            playerId,
            remainingPlayers: result.remainingPlayers,
          });

          logger.info('Player disconnected', {
            socketId: socket.id,
            roomId,
            playerId,
          });
        }
      } else {
        logger.info('Client disconnected (not in room)', {
          socketId: socket.id,
        });
      }
    } catch (error) {
      logger.error('disconnect handler error', { error: error.message });
    }
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

httpServer.listen(PORT, () => {
  logger.info('Socket.IO server running', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log(`🎮 Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// REDIS INTEGRATION NOTES:
// - Replace in-memory rooms with Redis HSET operations
// - Add Redis pub/sub for multi-server deployments:
//   * PUBLISH game:${roomId}:move {moveData}
//   * SUBSCRIBE game:* to listen across instances
// - Use Redis streams for event sourcing (optional)
// - Add reconnection logic with Redis-persisted state
