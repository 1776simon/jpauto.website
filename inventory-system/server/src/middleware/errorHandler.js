/**
 * Standardized error handling middleware
 * Provides consistent error responses across all controllers
 */

const logger = require('../config/logger');

/**
 * Custom API Error class for structured errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and returns standardized JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorType = err.name || 'Error';

  // Handle specific Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errorType = 'ValidationError';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
    errorType = 'DuplicateError';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
    errorType = 'ReferenceError';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error occurred';
    errorType = 'DatabaseError';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorType = 'AuthenticationError';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorType = 'AuthenticationError';
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
    errorType = 'UploadError';
  }

  // Build error response
  const errorResponse = {
    error: errorType,
    message: message,
    statusCode: statusCode,
    path: req.path,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Add validation details if available
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.details = err.errors.map(e => ({
      field: e.path || e.field,
      message: e.message
    }));
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Must be placed after all routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new APIError(`Route not found: ${req.method} ${req.path}`, 404);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
