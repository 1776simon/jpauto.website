const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { isAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Run pending migrations
 * POST /api/migrations/run
 * ADMIN ONLY - One-time use endpoint
 */
router.post('/run', isAdmin, async (req, res) => {
  try {
    logger.info('Running database migration...');

    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/add-latest-photo-modified.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await sequelize.query(sql);

    logger.info('Migration completed successfully');

    res.json({
      success: true,
      message: 'Migration completed successfully',
      migration: 'add-latest-photo-modified',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Migration failed:', error);

    // Check if column already exists
    if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
      return res.json({
        success: true,
        message: 'Migration already applied (column exists)',
        migration: 'add-latest-photo-modified'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  }
});

/**
 * Check migration status
 * GET /api/migrations/status
 */
router.get('/status', isAdmin, async (req, res) => {
  try {
    // Check if latest_photo_modified column exists
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'inventory'
      AND column_name = 'latest_photo_modified'
    `);

    const columnExists = results.length > 0;

    res.json({
      success: true,
      migrations: {
        'add-latest-photo-modified': {
          applied: columnExists,
          description: 'Add latestPhotoModified timestamp field to inventory table'
        }
      }
    });
  } catch (error) {
    logger.error('Failed to check migration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check migration status',
      message: error.message
    });
  }
});

module.exports = router;
