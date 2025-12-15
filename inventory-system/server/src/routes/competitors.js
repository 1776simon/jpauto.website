const express = require('express');
const router = express.Router();
const {
  getAllCompetitors,
  getCompetitorById,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  validateCompetitorUrl,
  scrapeCompetitor,
  getCompetitorInventory,
  getCompetitorSales,
  getCompetitorMetrics
} = require('../controllers/competitorController');
const {
  isAuthenticated,
  isManagerOrAdmin
} = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Protected Routes (Manager/Admin only)
 */

// Get all competitors
router.get('/',
  isManagerOrAdmin,
  getAllCompetitors
);

// Get competitor by ID
router.get('/:id',
  isManagerOrAdmin,
  param('id').isUUID(),
  handleValidationErrors,
  getCompetitorById
);

// Validate competitor URL (test scrape)
router.post('/validate',
  isManagerOrAdmin,
  body('inventoryUrl').isURL().withMessage('Valid inventory URL is required'),
  handleValidationErrors,
  validateCompetitorUrl
);

// Create new competitor
router.post('/',
  isManagerOrAdmin,
  body('name').notEmpty().withMessage('Name is required'),
  body('inventoryUrl').isURL().withMessage('Valid inventory URL is required'),
  body('websiteUrl').optional().isURL().withMessage('Website URL must be valid'),
  handleValidationErrors,
  createCompetitor
);

// Update competitor
router.put('/:id',
  isManagerOrAdmin,
  param('id').isUUID(),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('inventoryUrl').optional().isURL().withMessage('Inventory URL must be valid'),
  body('websiteUrl').optional().isURL().withMessage('Website URL must be valid'),
  body('active').optional().isBoolean().withMessage('Active must be boolean'),
  handleValidationErrors,
  updateCompetitor
);

// Delete competitor
router.delete('/:id',
  isManagerOrAdmin,
  param('id').isUUID(),
  handleValidationErrors,
  deleteCompetitor
);

// Manually trigger scrape
router.post('/:id/scrape',
  isManagerOrAdmin,
  param('id').isUUID(),
  handleValidationErrors,
  scrapeCompetitor
);

// Get competitor inventory (current)
router.get('/:id/inventory',
  isManagerOrAdmin,
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  getCompetitorInventory
);

// Get competitor sales
router.get('/:id/sales',
  isManagerOrAdmin,
  param('id').isUUID(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  handleValidationErrors,
  getCompetitorSales
);

// Get competitor metrics
router.get('/:id/metrics',
  isManagerOrAdmin,
  param('id').isUUID(),
  query('days').optional().isInt({ min: 1, max: 365 }),
  handleValidationErrors,
  getCompetitorMetrics
);

module.exports = router;
