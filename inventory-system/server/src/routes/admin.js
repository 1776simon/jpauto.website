/**
 * Admin Routes
 *
 * Temporary endpoints for administrative tasks
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

/**
 * POST /api/admin/run-migration
 * Run database migrations manually (one-time use)
 * IMPORTANT: This endpoint should be removed after migration is complete
 */
router.post('/run-migration', isAuthenticated, async (req, res) => {
  try {
    logger.info('Manual migration triggered by admin', {
      user: req.user?.email
    });

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      return res.status(404).json({
        success: false,
        error: 'No migrations directory found'
      });
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      return res.json({
        success: true,
        message: 'No migration files found'
      });
    }

    const results = [];

    // Run each migration
    for (const file of migrationFiles) {
      logger.info(`Running migration: ${file}`);

      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);

      if (typeof migration.up !== 'function') {
        results.push({
          file,
          status: 'skipped',
          message: 'No up function found'
        });
        continue;
      }

      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        results.push({
          file,
          status: 'success',
          message: 'Completed successfully'
        });
        logger.info(`Migration ${file} completed successfully`);
      } catch (error) {
        // Check if error is about table/column already existing
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
          results.push({
            file,
            status: 'skipped',
            message: 'Objects already exist'
          });
          logger.info(`Migration ${file} skipped - objects already exist`);
        } else {
          results.push({
            file,
            status: 'failed',
            message: error.message
          });
          logger.error(`Migration ${file} failed`, {
            error: error.message
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Migrations completed',
      results
    });

  } catch (error) {
    logger.error('Migration endpoint failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
