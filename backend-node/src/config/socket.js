const { Server } = require("socket.io");
const { COLLECTIONS, create } = require("../models");
const logger = require("./logger");

let io;
function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/ws",
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    socket.on("join-trip", (tripId) => {
      socket.join(`trip-${tripId}`);
    });

    socket.on("join-user", (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        logger.info(`👤 User joined room: user-${userId}`);
      }
    });

    socket.on("join-driver", (driverId) => {
      if (driverId) {
        socket.join(`driver-${driverId}`);
        logger.info(`🚗 Driver joined room: driver-${driverId}`);
      }
    });

    socket.on("ride-booked", (data) => {
      logger.info(`🚨 Live ride-booked event received for driver: ${data?.driverId}`);
      if (data?.driverId) {
        io.to(`driver-${data.driverId}`).emit("incoming-ride-request", data);
        io.to(`user-${data.driverId}`).emit("incoming-ride-request", data);
      }
      // Broadcast to any active listening driver
      socket.broadcast.emit("incoming-ride-request", data);
    });

    socket.on("ride-published", (data) => {
      logger.info(`🚗 New ride published along route: ${data?.pickup} → ${data?.destination}`);
      socket.broadcast.emit("route-match-found", data);
    });

    socket.on("trip-status-changed", (data) => {
      if (data?.passengerId) {
        io.to(`user-${data.passengerId}`).emit("trip-updated", data);
      }
      if (data?.tripId) {
        io.to(`trip-${data.tripId}`).emit("trip-updated", data);
      }
      socket.broadcast.emit("trip-updated", data);
    });

    socket.on("send-message", async ({ tripId, message }) => {
      try {
        const saved = await create(COLLECTIONS.CHAT, {
          tripId: String(tripId),
          senderEmail: message.senderEmail,
          content: message.content,
          timestamp: new Date().toISOString(),
        });
        io.to(`trip-${tripId}`).emit("receive-message", {
          id: saved.id,
          senderEmail: saved.senderEmail,
          content: saved.content,
          timestamp: saved.timestamp,
        });
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on(
      "location-update",
      ({ tripId, latitude, longitude, driverEmail }) => {
        io.to(`trip-${tripId}`).emit("location-updated", {
          latitude,
          longitude,
          driverEmail,
        });
      },
    );

    socket.on("disconnect", () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { init, getIo };
