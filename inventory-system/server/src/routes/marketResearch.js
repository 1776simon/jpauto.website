/**
 * Market Research Routes
 *
 * API endpoints for market research functionality
 */

const express = require('express');
const router = express.Router();
const marketAnalysisService = require('../services/marketAnalysisService');
const jobManager = require('../jobs/jobManager');
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../config/logger');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * GET /api/market-research/overview
 * Get market research overview for all vehicles
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await marketAnalysisService.getMarketOverview();

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Failed to get market overview', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/vehicle/:id
 * Get detailed market analysis for specific vehicle
 */
router.get('/vehicle/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id; // UUID string

    const detail = await marketAnalysisService.getVehicleDetail(vehicleId);

    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    logger.error('Failed to get vehicle detail', {
      vehicleId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/market-research/vehicle/:id/analyze
 * Trigger manual market analysis for a specific vehicle
 */
router.post('/vehicle/:id/analyze', async (req, res) => {
  try {
    const vehicleId = req.params.id; // UUID string
    const { yearRange } = req.body; // Optional: "±1", "±2", "±3"

    const result = await marketAnalysisService.analyzeVehicle(vehicleId, {
      manual: true,
      yearRange: yearRange || null
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to analyze vehicle', {
      vehicleId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/market-research/analyze-all
 * Trigger manual market analysis for all vehicles
 */
router.post('/analyze-all', async (req, res) => {
  try {
    // Run analysis in background and return immediately
    marketAnalysisService.analyzeAllVehicles()
      .then(results => {
        logger.info('Batch analysis completed', {
          total: results.length,
          success: results.filter(r => r.success).length
        });
      })
      .catch(error => {
        logger.error('Batch analysis failed', {
          error: error.message
        });
      });

    res.json({
      success: true,
      message: 'Analysis started for all vehicles'
    });
  } catch (error) {
    logger.error('Failed to start batch analysis', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/vehicle/:id/detail
 * Get detailed market analysis for a specific vehicle
 * Returns: price trends, platform distribution, DOM analysis, competitor listings
 */
router.get('/vehicle/:id/detail', async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const marketDb = require('../services/marketDatabaseService');
    const detail = await marketDb.getVehicleMarketDetail(vehicleId);

    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    logger.error('Failed to get vehicle market detail', {
      vehicleId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/dashboard-widget
 * Get data for dashboard widget
 */
router.get('/dashboard-widget', async (req, res) => {
  try {
    const overview = await marketAnalysisService.getMarketOverview();

    // Calculate trend (compare to average)
    const avgPosition = overview.summary.averagePosition;
    let trend = 'stable';

    if (avgPosition !== null) {
      if (avgPosition < 40) {
        trend = 'up'; // Good - below market average
      } else if (avgPosition > 60) {
        trend = 'down'; // Bad - above market average
      }
    }

    res.json({
      success: true,
      data: {
        summary: overview.summary,
        trend,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to get dashboard widget data', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/jobs/status
 * Get status of all scheduled jobs
 */
router.get('/jobs/status', async (req, res) => {
  try {
    const status = await jobManager.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get jobs status', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/market-research/jobs/:jobName/run
 * Trigger a job manually
 */
router.post('/jobs/:jobName/run', async (req, res) => {
  try {
    const { jobName } = req.params;

    // Run job in background and return immediately
    jobManager.runJob(jobName)
      .then(result => {
        logger.info(`Job ${jobName} completed manually`, result);
      })
      .catch(error => {
        logger.error(`Job ${jobName} failed`, {
          error: error.message
        });
      });

    res.json({
      success: true,
      message: `Job ${jobName} started`
    });
  } catch (error) {
    logger.error('Failed to run job', {
      jobName: req.params.jobName,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
