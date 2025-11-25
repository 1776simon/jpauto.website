const cron = require('node-cron');
const { Inventory } = require('../models');
const { exportToDealerCenter } = require('../exports/dealer-center/dealerCenterExporter');
const { uploadDealerCenterExport } = require('../services/ftpService');
const dealerCenterConfig = require('../config/dealerCenter');
const logger = require('../config/logger');

/**
 * Export and upload DealerCenter inventory
 * @returns {Promise<object>} - Export result
 */
const runDealerCenterExport = async () => {
  try {
    logger.info('Starting DealerCenter export job...');

    // Fetch all active inventory
    const vehicles = await Inventory.findAll({
      where: {
        status: ['available', 'pending']
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

    // Generate CSV export
    const exportResult = await exportToDealerCenter(vehicles);

    logger.info(`CSV export generated: ${exportResult.filePath}`);

    // Upload to FTP server
    const uploadResult = await uploadDealerCenterExport(exportResult.filePath);

    logger.info('DealerCenter export completed successfully');

    return {
      success: true,
      vehicleCount: vehicles.length,
      exportedAt: new Date().toISOString(),
      localPath: exportResult.filePath,
      remotePath: uploadResult.remotePath
    };
  } catch (error) {
    logger.error('DealerCenter export job failed:', error);
    throw error;
  }
};

/**
 * Schedule daily DealerCenter exports
 * Runs daily at 2:00 AM
 */
const scheduleDealerCenterExport = () => {
  // Use cron schedule from config
  const schedule = dealerCenterConfig.export.schedule;

  logger.info(`Scheduling DealerCenter export: ${schedule}`);

  cron.schedule(schedule, async () => {
    try {
      logger.info('Running scheduled DealerCenter export...');
      const result = await runDealerCenterExport();
      logger.info('Scheduled export completed:', result);
    } catch (error) {
      logger.error('Scheduled export failed:', error);
      // Could send alert/notification here
    }
  });

  logger.info('DealerCenter export scheduled successfully');
};

module.exports = {
  runDealerCenterExport,
  scheduleDealerCenterExport
};
