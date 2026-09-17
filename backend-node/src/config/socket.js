const { Server } = require('socket.io');
const { COLLECTIONS, create } = require('../models');
const logger = require('./logger');

let io;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    socket.on('join-trip', (tripId) => {
      socket.join(`trip-${tripId}`);
    });

    socket.on('send-message', async ({ tripId, message }) => {
      try {
        const saved = await create(COLLECTIONS.CHAT, {
          tripId: String(tripId),
          senderEmail: message.senderEmail,
          content: message.content,
          timestamp: new Date().toISOString(),
        });
        io.to(`trip-${tripId}`).emit('receive-message', {
          id: saved.id,
          senderEmail: saved.senderEmail,
          content: saved.content,
          timestamp: saved.timestamp,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('location-update', ({ tripId, latitude, longitude, driverEmail }) => {
      io.to(`trip-${tripId}`).emit('location-updated', { latitude, longitude, driverEmail });
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { init, getIo };
