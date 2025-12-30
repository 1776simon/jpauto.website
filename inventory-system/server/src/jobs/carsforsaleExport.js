const cron = require('node-cron');
const { Inventory } = require('../models');
const { exportToCarsForSale } = require('../exports/carsforsale/carsforsaleExporter');
const { uploadCarsForSaleExport } = require('../services/ftpService');
const carsforsaleConfig = require('../config/carsforsale');
const logger = require('../config/logger');

/**
 * Export and upload CarsForSale inventory
 * @returns {Promise<object>} - Export result
 */
const runCarsForSaleExport = async () => {
  try {
    logger.info('Starting CarsForSale export job...');

    // Fetch only available inventory (exclude pending, sold, hold, etc.)
    const vehicles = await Inventory.findAll({
      where: {
        status: 'available'
      },
      order: [['id', 'DESC']]
    });

    logger.info(`Found ${vehicles.length} vehicles to export`);

    if (vehicles.length === 0) {
      logger.warn('No vehicles to export');
      return {
        success: true,
        vehicleCount: 0,
        message: 'No vehicles to export'
      };
    }

    // Generate TXT export
    const exportResult = await exportToCarsForSale(vehicles);

    logger.info(`TXT export generated: ${exportResult.filePath}`);

    // Upload to FTP server
    const uploadResult = await uploadCarsForSaleExport(exportResult.filePath);

    logger.info('CarsForSale export completed successfully');

    return {
      success: true,
      vehicleCount: vehicles.length,
      exportedAt: new Date().toISOString(),
      localPath: exportResult.filePath,
      remotePath: uploadResult.remotePath
    };
  } catch (error) {
    logger.error('CarsForSale export job failed:', error);
    throw error;
  }
};

/**
 * Schedule daily CarsForSale exports
 * Runs daily at 3:00 AM PST (after Jekyll and DealerCenter)
 */
const scheduleCarsForSaleExport = () => {
  // Use cron schedule from config
  const schedule = carsforsaleConfig.export.schedule;

  logger.info(`Scheduling CarsForSale export: ${schedule}`);

  cron.schedule(schedule, async () => {
    try {
      logger.info('Running scheduled CarsForSale export...');
      const result = await runCarsForSaleExport();
      logger.info('Scheduled export completed:', result);
    } catch (error) {
      logger.error('Scheduled export failed:', error);
      // Could send alert/notification here
    }
  }, {
    timezone: 'America/Los_Angeles' // PST/PDT
  });

  logger.info('CarsForSale export scheduled successfully', {
    schedule,
    timezone: 'America/Los_Angeles'
  });
};

module.exports = {
  runCarsForSaleExport,
  scheduleCarsForSaleExport
};
