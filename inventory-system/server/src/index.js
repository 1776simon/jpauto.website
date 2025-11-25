const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();

const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models');
const passport = require('./config/passport');
const logger = require('./config/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Railway/Heroku/etc to properly handle HTTPS
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - allow requests from multiple origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://consign.jpautomotivegroup.com',
      'https://jp-auto-consignment.pages.dev',
      'https://admin.jpautomotivegroup.com',
      'https://api.jpautomotivegroup.com'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: process.env.MAX_UPLOAD_SIZE_MB + 'mb' || '200mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_UPLOAD_SIZE_MB + 'mb' || '200mb' }));

// Session configuration
const sessionStore = new pgSession({
  conObject: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  },
  tableName: 'session',
  createTableIfMissing: true
});

// Add error logging for session store
sessionStore.on('error', (err) => {
  logger.error('Session store error:', err);
});

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'ADMIN_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('FATAL: The following required environment variables are not set:');
  missingVars.forEach(varName => logger.error(`  - ${varName}`));
  logger.error('\nPlease set these variables in Railway dashboard or .env file');
  process.exit(1);
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh session on each request to keep active sessions alive
  name: 'connect.sid', // Explicit cookie name
  cookie: {
    maxAge: process.env.NODE_ENV === 'production'
      ? 7 * 24 * 60 * 60 * 1000  // 7 days in production
      : 30 * 24 * 60 * 60 * 1000, // 30 days in development
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-domain in prod, 'lax' for local
    domain: process.env.NODE_ENV === 'production'
      ? (process.env.COOKIE_DOMAIN || '.jpautomotivegroup.com')
      : undefined, // No domain restriction in development
    path: '/'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'JP Auto Inventory Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/auth',
      submissions: '/api/submissions',
      inventory: '/api/inventory',
      exports: '/api/exports',
      users: '/api/users'
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/migrations', require('./routes/migrations'));

// Standardized error handling
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase({ alter: true });
    }

    // Schedule DealerCenter exports (daily at 2:00 AM)
    if (process.env.ENABLE_DEALER_CENTER_EXPORT !== 'false') {
      const { scheduleDealerCenterExport } = require('./jobs/dealerCenterExport');
      scheduleDealerCenterExport();
    }

    // Start listening
    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`JP Auto Inventory System Server`);
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API URL: http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
