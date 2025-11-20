/**
 * Authentication and Authorization Middleware
 */

/**
 * Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource'
  });
};

/**
 * Check if user has required role
 * @param {Array<string>} roles - Array of allowed roles
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User role not found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 */
const isAdmin = hasRole(['admin']);

/**
 * Manager or Admin middleware
 */
const isManagerOrAdmin = hasRole(['admin', 'manager']);

/**
 * Check if user is active
 */
const isActive = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your account has been deactivated. Please contact an administrator.'
    });
  }

  next();
};

/**
 * Optional authentication - allows both authenticated and unauthenticated access
 */
const optionalAuth = (req, res, next) => {
  // Just pass through, user might or might not be authenticated
  next();
};

module.exports = {
  isAuthenticated,
  hasRole,
  isAdmin,
  isManagerOrAdmin,
  isActive,
  optionalAuth
};
