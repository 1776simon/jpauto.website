const { Inventory } = require('../models');
const { exportToJekyll, exportToJekyllZip } = require('../exports/jekyll/jekyllExporter');
const { exportToDealerCenter } = require('../exports/dealer-center/dealerCenterExporter');
const { exportToAutoTrader } = require('../exports/autotrader/autotraderExporter');
const { exportToCarGurus } = require('../exports/cargurus/cargurusExporter');
const { exportToFacebook } = require('../exports/facebook/facebookExporter');
const logger = require('../config/logger');
const path = require('path');

/**
 * Generic export handler to reduce code duplication
 * Handles common export logic: fetch vehicles, call exporter, update tracking
 */
const handleExport = async (req, res, config) => {
  const { exportFunction, exportType, displayName, fieldPrefix, downloadable = false, downloadFilename } = config;

  try {
    const { status = 'available', includeAll = false } = req.query;

    // Get vehicles to export
    const where = includeAll !== undefined && includeAll !== 'false' ? (includeAll ? {} : { status }) : { status };
    const vehicles = await Inventory.findAll({
      where,
      order: [['id', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    // Convert to plain objects
    const vehiclesData = vehicles.map(v => v.toJSON());

    // Call the specific exporter function
    const results = await exportFunction(vehiclesData, config.exportOptions);

    // Update export tracking (bulk update)
    const vehicleIds = vehicles.map(v => v.id);
    const updateFields = {};
    updateFields[`exportedTo${fieldPrefix}`] = true;
    updateFields[`exportedTo${fieldPrefix}At`] = new Date();

    await Inventory.update(updateFields, { where: { id: vehicleIds } });

    // Handle response based on export type
    if (downloadable && results.filePath) {
      // Send file for download
      // Extract filename from path if no downloadFilename specified
      const filename = downloadFilename || path.basename(results.filePath);
      res.download(results.filePath, filename, (err) => {
        if (err) {
          logger.error(`Error sending ${displayName} file:`, err);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Failed to send file',
              message: err.message
            });
          }
        }
      });
    } else {
      // Send JSON response
      res.json({
        message: `${displayName} export completed successfully`,
        vehicleCount: vehiclesData.length,
        successCount: results.success?.length || vehiclesData.length,
        errorCount: results.errors?.length || 0,
        results
      });
    }
  } catch (error) {
    logger.error(`${displayName} export error:`, error);
    res.status(500).json({
      error: `${displayName} export failed`,
      message: error.message
    });
  }
};

/**
 * Export inventory to Jekyll
 * GET /api/exports/jekyll
 */
const exportJekyll = async (req, res) => {
  const { format = 'zip' } = req.query;

  if (format === 'zip') {
    // ZIP export for automated sync and manual download
    return handleExport(req, res, {
      exportFunction: exportToJekyllZip,
      exportType: 'jekyll',
      displayName: 'Jekyll',
      fieldPrefix: 'Jekyll',
      downloadable: true,
      downloadFilename: `inventory-${new Date().toISOString().split('T')[0]}.zip`
    });
  } else {
    // Direct file export (original functionality)
    const outputPath = process.env.JEKYLL_EXPORT_PATH || path.resolve(__dirname, '../../../_vehicles');
    return handleExport(req, res, {
      exportFunction: (vehiclesData) => exportToJekyll(vehiclesData, outputPath),
      exportType: 'jekyll',
      displayName: 'Jekyll',
      fieldPrefix: 'Jekyll',
      downloadable: false
    });
  }
};

/**
 * Export inventory to Dealer Center
 * POST /api/exports/dealer-center
 */
const exportDealerCenter = async (req, res) => {
  return handleExport(req, res, {
    exportFunction: exportToDealerCenter,
    exportType: 'dealer_center',
    displayName: 'Dealer Center',
    fieldPrefix: 'DealerCenter',
    downloadable: true,
    fileExtension: 'csv'
  });
};

/**
 * Export inventory to AutoTrader
 * POST /api/exports/autotrader
 */
const exportAutoTrader = async (req, res) => {
  const dealerInfo = {
    dealerId: process.env.AUTOTRADER_DEALER_ID,
    dealerName: process.env.DEALER_NAME || 'JP Auto',
    phone: process.env.DEALER_PHONE || '(916) 618-7197',
    email: process.env.DEALER_EMAIL || 'info@jpautomotivegroup.com',
    address: process.env.DEALER_ADDRESS || 'Sacramento, CA',
    websiteUrl: process.env.WEBSITE_URL || 'https://jpautomotivegroup.com'
  };

  return handleExport(req, res, {
    exportFunction: (vehiclesData) => exportToAutoTrader(vehiclesData, dealerInfo),
    exportType: 'autotrader',
    displayName: 'AutoTrader',
    fieldPrefix: 'Autotrader',
    downloadable: true,
    fileExtension: 'xml'
  });
};

/**
 * Export inventory to CarGurus
 * POST /api/exports/cargurus
 */
const exportCarGurus = async (req, res) => {
  const dealerInfo = {
    dealerId: process.env.CARGURUS_DEALER_ID,
    dealerName: process.env.DEALER_NAME || 'JP Auto',
    phone: process.env.DEALER_PHONE || '(916) 618-7197',
    email: process.env.DEALER_EMAIL || 'info@jpautomotivegroup.com',
    address: process.env.DEALER_ADDRESS || 'Sacramento',
    city: process.env.DEALER_CITY || 'Sacramento',
    state: process.env.DEALER_STATE || 'CA',
    zip: process.env.DEALER_ZIP || '',
    websiteUrl: process.env.WEBSITE_URL || 'https://jpautomotivegroup.com'
  };

  return handleExport(req, res, {
    exportFunction: (vehiclesData) => exportToCarGurus(vehiclesData, dealerInfo),
    exportType: 'cargurus',
    displayName: 'CarGurus',
    fieldPrefix: 'Cargurus',
    downloadable: true,
    fileExtension: 'xml'
  });
};

/**
 * Export inventory to Facebook Marketplace
 * POST /api/exports/facebook
 */
const exportFacebook = async (req, res) => {
  const dealerInfo = {
    dealerName: process.env.DEALER_NAME || 'JP Auto',
    address: process.env.DEALER_ADDRESS || 'Sacramento, CA',
    phone: process.env.DEALER_PHONE || '(916) 618-7197',
    websiteUrl: process.env.WEBSITE_URL || 'https://jpautomotivegroup.com'
  };

  return handleExport(req, res, {
    exportFunction: (vehiclesData) => exportToFacebook(vehiclesData, dealerInfo),
    exportType: 'facebook_marketplace',
    displayName: 'Facebook Marketplace',
    fieldPrefix: 'Facebook',
    downloadable: true,
    fileExtension: 'csv'
  });
};

/**
 * Get export history/statistics
 * GET /api/exports/history
 */
const getExportHistory = async (req, res) => {
  try {
    const stats = await Inventory.findOne({
      attributes: [
        [Inventory.sequelize.fn('COUNT', Inventory.sequelize.col('id')), 'total'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.literal('CASE WHEN exported_to_jekyll THEN 1 ELSE 0 END')), 'jekyllCount'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.literal('CASE WHEN exported_to_dealer_center THEN 1 ELSE 0 END')), 'dealerCenterCount'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.literal('CASE WHEN exported_to_autotrader THEN 1 ELSE 0 END')), 'autotraderCount'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.literal('CASE WHEN exported_to_cargurus THEN 1 ELSE 0 END')), 'cargurusCount'],
        [Inventory.sequelize.fn('SUM', Inventory.sequelize.literal('CASE WHEN exported_to_facebook THEN 1 ELSE 0 END')), 'facebookCount']
      ],
      raw: true
    });

    res.json({
      total: parseInt(stats.total || 0),
      exports: {
        jekyll: {
          count: parseInt(stats.jekyllCount || 0),
          percentage: ((parseInt(stats.jekyllCount || 0) / parseInt(stats.total || 1)) * 100).toFixed(1)
        },
        dealerCenter: {
          count: parseInt(stats.dealerCenterCount || 0),
          percentage: ((parseInt(stats.dealerCenterCount || 0) / parseInt(stats.total || 1)) * 100).toFixed(1)
        },
        autotrader: {
          count: parseInt(stats.autotraderCount || 0),
          percentage: ((parseInt(stats.autotraderCount || 0) / parseInt(stats.total || 1)) * 100).toFixed(1)
        },
        cargurus: {
          count: parseInt(stats.cargurusCount || 0),
          percentage: ((parseInt(stats.cargurusCount || 0) / parseInt(stats.total || 1)) * 100).toFixed(1)
        },
        facebook: {
          count: parseInt(stats.facebookCount || 0),
          percentage: ((parseInt(stats.facebookCount || 0) / parseInt(stats.total || 1)) * 100).toFixed(1)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({
      error: 'Failed to fetch export history',
      message: error.message
    });
  }
};

/**
 * Export to DealerCenter and upload to FTP
 * POST /api/exports/dealer-center/upload
 */
const exportAndUploadDealerCenter = async (req, res) => {
  try {
    const { runDealerCenterExport } = require('../jobs/dealerCenterExport');

    const result = await runDealerCenterExport();

    res.json({
      message: 'DealerCenter export uploaded successfully',
      ...result
    });
  } catch (error) {
    console.error('Export and upload failed:', error);
    res.status(500).json({
      error: 'Failed to export and upload to DealerCenter',
      message: error.message
    });
  }
};

module.exports = {
  exportJekyll,
  exportDealerCenter,
  exportAutoTrader,
  exportCarGurus,
  exportFacebook,
  exportAndUploadDealerCenter,
  getExportHistory
};
