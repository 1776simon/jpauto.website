/**
 * Market System Routes
 *
 * API endpoints for system health and storage monitoring
 */

const express = require('express');
const router = express.Router();
const marketDb = require('../services/marketDatabaseService');
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../config/logger');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * GET /api/market-research/system/storage
 * Get database storage usage statistics
 */
router.get('/storage', async (req, res) => {
  try {
    const storage = await marketDb.getStorageUsage();

    const maxLimitMB = 1024; // Railway 1GB limit
    const percentUsed = (storage.totalSizeMB / maxLimitMB) * 100;

    // Determine status
    let status = 'healthy';
    if (storage.totalSizeMB >= 950) {
      status = 'critical';
    } else if (storage.totalSizeMB >= 800) {
      status = 'warning';
    }

    res.json({
      success: true,
      data: {
        totalSizeMB: storage.totalSizeMB,
        totalSizeBytes: storage.totalSizeBytes,
        percentUsed: parseFloat(percentUsed.toFixed(2)),
        maxLimitMB,
        remainingMB: parseFloat((maxLimitMB - storage.totalSizeMB).toFixed(2)),
        status,
        thresholds: {
          warning: 800,
          critical: 950
        },
        topTables: storage.tables
      }
    });
  } catch (error) {
    logger.error('Failed to get storage usage', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/system/health
 * Get overall system health check
 */
router.get('/health', async (req, res) => {
  try {
    const checks = {
      database: false,
      autodevApi: false,
      email: false,
      storage: false
    };

    // Check database
    try {
      await marketDb.getStorageUsage();
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
    }

    // Check Auto.dev API key
    if (process.env.AUTODEV_API_KEY) {
      checks.autodevApi = true;
    }

    // Check email configuration
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      checks.email = true;
    }

    // Check storage status
    try {
      const storage = await marketDb.getStorageUsage();
      checks.storage = storage.totalSizeMB < 950; // Not critical
    } catch (error) {
      logger.error('Storage health check failed', { error: error.message });
    }

    const allHealthy = Object.values(checks).every(v => v === true);

    res.json({
      success: true,
      data: {
        healthy: allHealthy,
        checks,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
