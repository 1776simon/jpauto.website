/**
 * VIN Evaluation Routes
 *
 * API endpoints for evaluating vehicles we're considering buying
 */

const express = require('express');
const router = express.Router();
const vinEvaluationService = require('../services/vinEvaluationService');
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../config/logger');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * POST /api/vin-evaluation/evaluate
 * Evaluate a vehicle's market position
 *
 * Body: { vin, year, make, model, trim?, mileage }
 * Returns: Market summary data (median, min, max, count, sample listings)
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { vin, year, make, model, trim, mileage, forceRefresh } = req.body;

    // Validate required fields
    if (!vin || !year || !make || !model || !mileage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vin, year, make, model, mileage'
      });
    }

    // Validate data types
    if (isNaN(year) || isNaN(mileage)) {
      return res.status(400).json({
        success: false,
        error: 'Year and mileage must be numbers'
      });
    }

    // Validate VIN format (17 characters)
    if (vin.length !== 17) {
      return res.status(400).json({
        success: false,
        error: 'VIN must be 17 characters'
      });
    }

    logger.info('VIN evaluation request received', {
      vin,
      year,
      make,
      model,
      forceRefresh: forceRefresh || false,
      user: req.user?.email
    });

    // Evaluate vehicle
    const result = await vinEvaluationService.evaluateVehicle({
      vin,
      year: parseInt(year),
      make,
      model,
      trim: trim || null,
      mileage: parseInt(mileage),
      forceRefresh: forceRefresh || false
    });

    logger.info('VIN evaluation completed', {
      vin,
      fromCache: result.fromCache,
      listingsFound: result.marketData.uniqueListings
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('VIN evaluation failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate vehicle'
    });
  }
});

/**
 * GET /api/vin-evaluation/cache/:vin
 * Check if a VIN has cached evaluation data
 */
router.get('/cache/:vin', async (req, res) => {
  try {
    const { vin } = req.params;

    if (!vin || vin.length !== 17) {
      return res.status(400).json({
        success: false,
        error: 'Invalid VIN'
      });
    }

    const cachedData = await vinEvaluationService.getCachedEvaluation(vin);

    res.json({
      success: true,
      data: {
        cached: !!cachedData,
        cacheAge: cachedData ? cachedData.created_at : null
      }
    });
  } catch (error) {
    logger.error('Failed to check VIN cache', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
