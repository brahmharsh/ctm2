// Custom Next.js + Socket.IO single-port server (refactored path)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local from project root (if exists)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
dotenv.config({ path: resolve(projectRoot, '.env.local') });

import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import { Server } from 'socket.io';
import { registerSocketHandlers } from '#parcheesi/socket/index.js';
// Using relative path because Node (outside Next transpilation) doesn't resolve @ alias
import { logger } from '#shared/logging/logger.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

async function start() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    logger.info('Unified server started', { port: PORT });
    console.log(
      `🚀 Server (Next.js + Socket.IO) listening on http://localhost:${PORT}`
    );
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    io.close();
    httpServer.close(() => process.exit(0));
  });
}

start().catch((err) => {
  logger.error('Server startup failed', { error: err.message });
  console.error(err);
  process.exit(1);
});
