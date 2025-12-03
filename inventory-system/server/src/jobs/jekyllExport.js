const cron = require('node-cron');
const { Inventory } = require('../models');
const { exportToJekyll } = require('../exports/jekyll/jekyllExporter');
const logger = require('../config/logger');

/**
 * Export inventory to Jekyll markdown files
 * @returns {Promise<object>} - Export result
 */
const runJekyllExport = async () => {
  try {
    logger.info('Starting Jekyll export job...');

    // Fetch all active inventory
    const vehicles = await Inventory.findAll({
      where: {
        status: ['available', 'pending']
      },
      order: [['id', 'DESC']]
    });

    logger.info(`Found ${vehicles.length} vehicles to export to Jekyll`);

    if (vehicles.length === 0) {
      logger.warn('No vehicles to export to Jekyll');
      return {
        success: true,
        vehicleCount: 0,
        message: 'No vehicles to export'
      };
    }

    // Convert to plain objects
    const vehiclesData = vehicles.map(v => v.toJSON());

    // Export to Jekyll markdown files
    const result = await exportToJekyll(vehiclesData);

    logger.info(`Jekyll export completed: ${result.success.length} successful, ${result.errors.length} errors`);

    // Update export tracking
    const successVehicleVINs = result.success.map(s => s.vin);
    await Inventory.update(
      {
        exportedToJekyll: true,
        exportedToJekyllAt: new Date()
      },
      {
        where: {
          vin: successVehicleVINs
        }
      }
    );

    return {
      success: true,
      vehicleCount: vehicles.length,
      successCount: result.success.length,
      errorCount: result.errors.length,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Jekyll export job failed:', error);
    throw error;
  }
};

/**
 * Schedule daily Jekyll exports
 * Runs daily at 1:55 AM (5 minutes before Dealer Center export)
 */
const scheduleJekyllExport = () => {
  // Daily at 1:55 AM
  const schedule = '55 1 * * *';

  logger.info(`Scheduling Jekyll export: ${schedule}`);

  cron.schedule(schedule, async () => {
    try {
      logger.info('Running scheduled Jekyll export...');
      const result = await runJekyllExport();
      logger.info('Scheduled Jekyll export completed:', result);
    } catch (error) {
      logger.error('Scheduled Jekyll export failed:', error);
      // Could send alert/notification here
    }
  });

  logger.info('Jekyll export scheduled successfully');
};

module.exports = {
  runJekyllExport,
  scheduleJekyllExport
};
