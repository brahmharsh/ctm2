// Custom Next.js Server with Socket.IO Integration
// This runs both Next.js and Socket.IO on the same port (3000)

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
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

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO on the same server
  const io = new Server(httpServer, {
    path: '/socket.io/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  logger.info('Socket.IO initialized on Next.js server', { port });

  // ============================================================================
  // SOCKET.IO EVENT HANDLERS (Same as before)
  // ============================================================================

  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // game:join
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

        const result = joinRoom(roomId, socket.id, playerId);

        if (!result.success) {
          socket.emit('error', {
            message: result.error,
            event: 'game:join',
          });
          logger.warn('Join failed', { socketId: socket.id, error: result.error });
          return;
        }

        socket.join(roomId);

        socket.emit('game:joined', {
          roomId,
          playerId,
          playerCount: result.playerCount,
          players: result.players,
        });

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

    // game:start
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

        const result = startGame(roomId);

        if (!result.success) {
          socket.emit('error', {
            message: result.error,
            event: 'game:start',
          });
          logger.warn('Game start failed', { roomId, error: result.error });
          return;
        }

        io.to(roomId).emit('game:started', {
          gameState: result.gameState,
          currentPlayer: result.gameState.players[0].id,
        });

        io.to(roomId).emit('update:state', {
          gameState: result.gameState,
        });

        logger.info('Game started successfully', { roomId });
      } catch (error) {
        logger.error('game:start handler error', { error: error.message });
        socket.emit('error', { message: 'Internal server error', event: 'game:start' });
      }
    });

    // roll:dice
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

        if (!isPlayerTurn(gameState, playerId)) {
          socket.emit('error', {
            message: 'Not your turn',
            event: 'roll:dice',
          });
          logger.warn('Invalid turn attempt', { roomId, playerId });
          return;
        }

        const dice = rollDice();
        const legalMoves = getLegalMoves(gameState, playerId, dice);

        logger.info('Dice rolled', {
          roomId,
          playerId,
          dice,
          legalMovesCount: legalMoves.length,
        });

        io.to(roomId).emit('roll:result', {
          playerId,
          dice,
          legalMoves,
        });

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

    // move:token
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

        if (!isPlayerTurn(gameState, playerId)) {
          socket.emit('error', {
            message: 'Not your turn',
            event: 'move:token',
          });
          return;
        }

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

        io.to(roomId).emit('move:result', {
          playerId,
          tokenId,
          from: moveResult.from,
          to: moveResult.to,
          captured: moveResult.captured,
          bonusMove: moveResult.bonusMove,
        });

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

        if (!moveResult.bonusMove) {
          advanceTurn(gameState);
        }

        updateGameState(roomId, gameState);

        io.to(roomId).emit('update:state', { gameState });

        io.to(roomId).emit('turn:end', {
          nextPlayer: gameState.players[gameState.currentPlayerIndex].id,
        });
      } catch (error) {
        logger.error('move:token handler error', { error: error.message });
        socket.emit('error', { message: 'Internal server error', event: 'move:token' });
      }
    });

    // get:state
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

    // disconnect
    socket.on('disconnect', () => {
      try {
        const roomId = getRoomIdBySocket(socket.id);
        const playerId = getPlayerIdBySocket(socket.id);

        if (roomId) {
          const result = leaveRoom(socket.id);

          if (result.success) {
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

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`🎮 Socket.IO running on same server (port ${port})`);
      logger.info('Server started', { port, dev });
    });
});
