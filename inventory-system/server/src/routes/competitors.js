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
  getCompetitorInventoryFilters,
  getCompetitorSales,
  getCompetitorSalesSummary,
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
  body('usePlaywright').optional().isBoolean().withMessage('usePlaywright must be boolean'),
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

// Get competitor inventory filter options (must be before /:id/inventory)
router.get('/:id/inventory/filters',
  isManagerOrAdmin,
  param('id').isUUID(),
  handleValidationErrors,
  getCompetitorInventoryFilters
);

// Get competitor inventory (server-side filtering)
router.get('/:id/inventory',
  isManagerOrAdmin,
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('year').optional().isInt({ min: 1900, max: 2100 }),
  query('make').optional().isString(),
  query('model').optional().isString(),
  query('sortBy').optional().isIn(['price-asc', 'price-desc', 'days-oldest', 'days-newest', 'mileage-asc', 'mileage-desc']),
  handleValidationErrors,
  getCompetitorInventory
);

// Get monthly sales summary for chart (must be before /:id/sales)
router.get('/:id/sales/summary',
  isManagerOrAdmin,
  param('id').isUUID(),
  query('months').optional().isInt({ min: 1, max: 36 }),
  query('make').optional().isString(),
  query('model').optional().isString(),
  handleValidationErrors,
  getCompetitorSalesSummary
);

// Get competitor sales for a specific month
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
