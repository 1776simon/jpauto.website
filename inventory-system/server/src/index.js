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
      console.error('CORS blocked origin:', origin);
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
  console.error('Session store error:', err);
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
  console.error('FATAL: The following required environment variables are not set:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease set these variables in Railway dashboard or .env file');
  process.exit(1);
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid', // Explicit cookie name
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: true, // Required for HTTPS
    httpOnly: true,
    sameSite: 'none', // Must be 'none' for cross-subdomain cookies to work
    domain: process.env.COOKIE_DOMAIN || '.jpautomotivegroup.com', // Share cookie across all subdomains
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase({ alter: true });
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`JP Auto Inventory System Server`);
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
