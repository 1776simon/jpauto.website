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
 * Run market research migrations
 * POST /api/migrations/run-market-research
 * ADMIN ONLY - Creates market research tables
 */
router.post('/run-market-research', isAdmin, async (req, res) => {
  try {
    logger.info('Running market research migrations...');

    // Get all migration files from src/migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      return res.status(404).json({
        success: false,
        error: 'Migrations directory not found'
      });
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      return res.json({
        success: true,
        message: 'No migration files found',
        migrations: []
      });
    }

    const results = [];

    // Run each migration
    for (const file of migrationFiles) {
      logger.info(`Running migration: ${file}`);

      const migrationPath = path.join(migrationsDir, file);

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(migrationPath)];
      const migration = require(migrationPath);

      if (typeof migration.up !== 'function') {
        results.push({
          file,
          status: 'skipped',
          message: 'No up() function found'
        });
        continue;
      }

      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

        results.push({
          file,
          status: 'success',
          message: 'Migration completed successfully'
        });

        logger.info(`Migration ${file} completed successfully`);
      } catch (error) {
        // Check if error is about table already existing
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
            status: 'error',
            message: error.message
          });
          logger.error(`Migration ${file} failed:`, error);
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    res.json({
      success: errorCount === 0,
      message: `Migrations complete: ${successCount} succeeded, ${skippedCount} skipped, ${errorCount} failed`,
      migrations: results
    });
  } catch (error) {
    logger.error('Migration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Migrate photo URLs from R2.dev to custom domain
 * POST /api/migrations/migrate-photo-urls
 * ADMIN ONLY - Updates all existing photo URLs to use custom domain
 */
router.post('/migrate-photo-urls', isAdmin, async (req, res) => {
  try {
    logger.info('Starting photo URL migration...');

    const Inventory = require('../models/Inventory');
    const PendingSubmission = require('../models/PendingSubmission');

    const OLD_URL = 'https://pub-1e321c8447c84ba3a8b4d85d8487d779.r2.dev';
    const NEW_URL = process.env.R2_PUBLIC_URL || 'https://cdn.jpautomotivegroup.com';

    logger.info(`Migrating from ${OLD_URL} to ${NEW_URL}`);

    let inventoryUpdated = 0;
    let submissionsUpdated = 0;

    // Migrate Inventory
    const inventoryRecords = await Inventory.findAll();
    for (const record of inventoryRecords) {
      let updated = false;

      // Update images array
      if (record.images && Array.isArray(record.images)) {
        const updatedImages = record.images.map(url => {
          if (url && url.startsWith(OLD_URL)) {
            updated = true;
            return url.replace(OLD_URL, NEW_URL);
          }
          return url;
        });
        record.images = updatedImages;
      }

      // Update primary image URL
      if (record.primaryImageUrl && record.primaryImageUrl.startsWith(OLD_URL)) {
        updated = true;
        record.primaryImageUrl = record.primaryImageUrl.replace(OLD_URL, NEW_URL);
      }

      if (updated) {
        await record.save();
        inventoryUpdated++;
        logger.info(`Updated inventory: ${record.year} ${record.make} ${record.model}`);
      }
    }

    // Migrate Pending Submissions
    const submissionRecords = await PendingSubmission.findAll();
    for (const record of submissionRecords) {
      let updated = false;

      // Update images array
      if (record.images && Array.isArray(record.images)) {
        const updatedImages = record.images.map(url => {
          if (url && url.startsWith(OLD_URL)) {
            updated = true;
            return url.replace(OLD_URL, NEW_URL);
          }
          return url;
        });
        record.images = updatedImages;
      }

      // Update primary image URL
      if (record.primaryImageUrl && record.primaryImageUrl.startsWith(OLD_URL)) {
        updated = true;
        record.primaryImageUrl = record.primaryImageUrl.replace(OLD_URL, NEW_URL);
      }

      if (updated) {
        await record.save();
        submissionsUpdated++;
        logger.info(`Updated submission: ${record.year} ${record.make} ${record.model}`);
      }
    }

    logger.info(`Photo URL migration complete: ${inventoryUpdated} inventory + ${submissionsUpdated} submissions updated`);

    res.json({
      success: true,
      message: `Photo URLs migrated successfully`,
      results: {
        oldUrl: OLD_URL,
        newUrl: NEW_URL,
        inventoryUpdated,
        submissionsUpdated,
        totalUpdated: inventoryUpdated + submissionsUpdated,
        totalRecords: inventoryRecords.length + submissionRecords.length
      }
    });
  } catch (error) {
    logger.error('Photo URL migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Photo URL migration failed',
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
