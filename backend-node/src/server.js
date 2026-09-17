// Validate env FIRST
require('dotenv').config();
const { validateEnv } = require('./config/validateEnv');
validateEnv();

const http             = require('http');
const gracefulShutdown = require('http-graceful-shutdown');
const app              = require('./app');
const { initFirebase } = require('./config/firebase');
const socketService    = require('./config/socket');
const seeder           = require('./config/seeder');
const logger           = require('./config/logger');

const PORT = process.env.PORT || 8081;
const isProd = process.env.NODE_ENV === 'production';

const server = http.createServer(app);
socketService.init(server);

async function startServer() {
  try {
    // Initialize Firebase Firestore
    initFirebase();

    // Seed initial data
    await seeder.run();
    logger.info('✅ Firestore seeded.');

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 RideConnect API | port=${PORT} | env=${process.env.NODE_ENV}`);
    });

    gracefulShutdown(server, {
      signals: 'SIGINT SIGTERM',
      timeout: 10000,
      development: !isProd,
      preShutdown: async () => logger.info('⚠️  Shutting down...'),
      finally:     ()       => logger.info('👋 Server stopped cleanly.'),
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  if (isProd) process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

startServer();
