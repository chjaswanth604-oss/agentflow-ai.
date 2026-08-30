const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { getDBStatus } = require('./config/db');
const orchestrator = require('./agents/orchestrator');

const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Security and middleware composition
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Agentflow_AI Backend Engine',
    database: dbStatus,
    langGraph: orchestrator.getLangGraphStatus(),
    environment: env.NODE_ENV
  });
});

// Route mounts
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
