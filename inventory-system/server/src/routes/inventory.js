const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  uploadInventoryImages,
  deleteInventory,
  markAsSold,
  toggleFeatured,
  getInventoryStats
} = require('../controllers/inventoryController');
const {
  isAuthenticated,
  isManagerOrAdmin,
  isAdmin,
  optionalAuth
} = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  validateInventory,
  validateInventoryUpdate,
  validateUUID,
  validatePagination
} = require('../middleware/validation');

/**
 * Public/Optional Auth Routes
 */

// Get all inventory (public can view, auth can see more details)
router.get('/',
  optionalAuth,
  validatePagination,
  getAllInventory
);

// Get inventory stats
router.get('/stats',
  optionalAuth,
  getInventoryStats
);

// Get single inventory item
router.get('/:id',
  optionalAuth,
  validateUUID,
  getInventoryById
);

/**
 * Protected Routes (Manager/Admin)
 */

// Create new inventory item
router.post('/',
  isManagerOrAdmin,
  validateInventory,
  createInventory
);

// Update inventory item
router.put('/:id',
  isManagerOrAdmin,
  validateUUID,
  validateInventoryUpdate,
  updateInventory
);

// Upload/update images
router.post('/:id/images',
  isManagerOrAdmin,
  validateUUID,
  uploadMultiple,
  uploadInventoryImages
);

// Mark as sold
router.post('/:id/mark-sold',
  isManagerOrAdmin,
  validateUUID,
  markAsSold
);

// Toggle featured status
router.post('/:id/toggle-featured',
  isManagerOrAdmin,
  validateUUID,
  toggleFeatured
);

/**
 * Admin Only Routes
 */

// Delete inventory item
router.delete('/:id',
  isAdmin,
  validateUUID,
  deleteInventory
);

module.exports = router;
