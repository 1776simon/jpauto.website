const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser
} = require('../controllers/usersController');
const {
  isAuthenticated,
  isAdmin
} = require('../middleware/auth');
const {
  validateUUID,
  validateUserRole,
  validatePagination
} = require('../middleware/validation');

/**
 * Authenticated User Routes
 */

// Get current user profile
router.get('/me',
  isAuthenticated,
  getCurrentUser
);

/**
 * Admin Only Routes
 */

// Get all users
router.get('/',
  isAdmin,
  validatePagination,
  getAllUsers
);

// Get user by ID
router.get('/:id',
  isAdmin,
  validateUUID,
  getUserById
);

// Update user role
router.put('/:id/role',
  isAdmin,
  validateUUID,
  validateUserRole,
  updateUserRole
);

// Deactivate user
router.post('/:id/deactivate',
  isAdmin,
  validateUUID,
  deactivateUser
);

// Activate user
router.post('/:id/activate',
  isAdmin,
  validateUUID,
  activateUser
);

// Delete user
router.delete('/:id',
  isAdmin,
  validateUUID,
  deleteUser
);

module.exports = router;
