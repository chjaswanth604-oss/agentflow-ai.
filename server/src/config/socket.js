const { Server } = require('socket.io');
const env = require('./env');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific execution timeline
    socket.on('join_execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined execution:${executionId}`);
    });

    socket.on('leave_execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const emitAgentEvent = (executionId, data) => {
  if (!io) return;
  io.to(`execution:${executionId}`).emit('agent_event', data);
  io.emit('global_agent_event', data); // Broadcast globally for dashboard monitoring
};

const emitNotification = (userId, notification) => {
  if (!io) return;
  io.emit(`notification:${userId}`, notification);
};

module.exports = { initSocket, getIO, emitAgentEvent, emitNotification };
