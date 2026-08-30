const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const { startAutoTriggerPolling } = require('./services/autoTriggerService');

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect DB and start HTTP Server
const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`===================================================`);
    console.log(`[Agentflow_AI Backend Engine] Running on port ${env.PORT}`);
    console.log(`[Environment] ${env.NODE_ENV}`);
    console.log(`===================================================`);

    // Start Real-time Background Email Listener
    startAutoTriggerPolling(60000);
  });
};

startServer();
