const { Inventory } = require('../models');
const { exportToJekyll } = require('../exports/jekyll/jekyllExporter');
const { exportToDealerCenter } = require('../exports/dealer-center/dealerCenterExporter');
const { exportToAutoTrader } = require('../exports/autotrader/autotraderExporter');
const { exportToCarGurus } = require('../exports/cargurus/cargurusExporter');
const { exportToFacebook } = require('../exports/facebook/facebookExporter');
const path = require('path');

/**
 * Export inventory to Jekyll
 * POST /api/exports/jekyll
 */
const exportJekyll = async (req, res) => {
  try {
    const { status = 'available', includeAll = false } = req.query;

    // Get vehicles to export
    const where = includeAll ? {} : { status };
    const vehicles = await Inventory.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    // Convert Sequelize instances to plain objects
    const vehiclesData = vehicles.map(v => v.toJSON());

    // Export to Jekyll
    const outputPath = process.env.JEKYLL_EXPORT_PATH || path.resolve(__dirname, '../../../_vehicles');
    const results = await exportToJekyll(vehiclesData, outputPath);

    // Update export tracking (bulk update - much faster than individual updates)
    const vehicleIds = vehicles.map(v => v.id);
    await Inventory.update(
      {
        exportedToJekyll: true,
        exportedToJekyllAt: new Date()
      },
      {
        where: { id: vehicleIds }
      }
    );

    res.json({
      message: 'Jekyll export completed successfully',
      vehicleCount: vehiclesData.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      results
    });
  } catch (error) {
    console.error('Jekyll export error:', error);
    res.status(500).json({
      error: 'Jekyll export failed',
      message: error.message
    });
  }
};

/**
 * Export inventory to Dealer Center
 * POST /api/exports/dealer-center
 */
const exportDealerCenter = async (req, res) => {
  try {
    const { status = 'available', includeAll = false } = req.query;

    // Get vehicles to export
    const where = includeAll ? {} : { status };
    const vehicles = await Inventory.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    const vehiclesData = vehicles.map(v => v.toJSON());

    // Export to Dealer Center
    const results = await exportToDealerCenter(vehiclesData);

    // Update export tracking (bulk update - much faster than individual updates)
    const vehicleIds = vehicles.map(v => v.id);
    await Inventory.update(
      {
        exportedToDealerCenter: true,
        exportedToDealerCenterAt: new Date()
      },
      {
        where: { id: vehicleIds }
      }
    );

    // Send file for download
    res.download(results.filePath, `dealer_center_${Date.now()}.csv`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({
          error: 'Failed to send file',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('Dealer Center export error:', error);
    res.status(500).json({
      error: 'Dealer Center export failed',
      message: error.message
    });
  }
};

/**
 * Export inventory to AutoTrader
 * POST /api/exports/autotrader
 */
const exportAutoTrader = async (req, res) => {
  try {
    const { status = 'available' } = req.query;

    // Get vehicles to export
    const vehicles = await Inventory.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    const vehiclesData = vehicles.map(v => v.toJSON());

    // Dealer info from env or defaults
    const dealerInfo = {
      dealerId: process.env.AUTOTRADER_DEALER_ID,
      dealerName: process.env.DEALER_NAME || 'JP Auto',
      phone: process.env.DEALER_PHONE || '(916) 618-7197',
      email: process.env.DEALER_EMAIL || 'info@jpautomotivegroup.com',
      address: process.env.DEALER_ADDRESS || 'Sacramento, CA',
      websiteUrl: process.env.WEBSITE_URL || 'https://jpautomotivegroup.com'
    };

    // Export to AutoTrader
    const results = await exportToAutoTrader(vehiclesData, dealerInfo);

    // Update export tracking (bulk update - much faster than individual updates)
    const vehicleIds = vehicles.map(v => v.id);
    await Inventory.update(
      {
        exportedToAutotrader: true,
        exportedToAutotraderAt: new Date()
      },
      {
        where: { id: vehicleIds }
      }
    );

    // Send file for download
    res.download(results.filePath, `autotrader_${Date.now()}.xml`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({
          error: 'Failed to send file',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('AutoTrader export error:', error);
    res.status(500).json({
      error: 'AutoTrader export failed',
      message: error.message
    });
  }
};

/**
 * Export inventory to CarGurus
 * POST /api/exports/cargurus
 */
const exportCarGurus = async (req, res) => {
  try {
    const { status = 'available' } = req.query;

    // Get vehicles to export
    const vehicles = await Inventory.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    const vehiclesData = vehicles.map(v => v.toJSON());

    // Dealer info
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

    // Export to CarGurus
    const results = await exportToCarGurus(vehiclesData, dealerInfo);

    // Update export tracking (bulk update - much faster than individual updates)
    const vehicleIds = vehicles.map(v => v.id);
    await Inventory.update(
      {
        exportedToCargurus: true,
        exportedToCargurusAt: new Date()
      },
      {
        where: { id: vehicleIds }
      }
    );

    // Send file for download
    res.download(results.filePath, `cargurus_${Date.now()}.xml`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({
          error: 'Failed to send file',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('CarGurus export error:', error);
    res.status(500).json({
      error: 'CarGurus export failed',
      message: error.message
    });
  }
};

/**
 * Export inventory to Facebook Marketplace
 * POST /api/exports/facebook
 */
const exportFacebook = async (req, res) => {
  try {
    const { status = 'available' } = req.query;

    // Get vehicles to export
    const vehicles = await Inventory.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({
        error: 'No vehicles found',
        message: 'No vehicles available for export'
      });
    }

    const vehiclesData = vehicles.map(v => v.toJSON());

    // Dealer info
    const dealerInfo = {
      dealerName: process.env.DEALER_NAME || 'JP Auto',
      address: process.env.DEALER_ADDRESS || 'Sacramento, CA',
      phone: process.env.DEALER_PHONE || '(916) 618-7197',
      websiteUrl: process.env.WEBSITE_URL || 'https://jpautomotivegroup.com'
    };

    // Export to Facebook
    const results = await exportToFacebook(vehiclesData, dealerInfo);

    // Update export tracking (bulk update - much faster than individual updates)
    const vehicleIds = vehicles.map(v => v.id);
    await Inventory.update(
      {
        exportedToFacebook: true,
        exportedToFacebookAt: new Date()
      },
      {
        where: { id: vehicleIds }
      }
    );

    // Send file for download
    res.download(results.filePath, `facebook_marketplace_${Date.now()}.csv`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({
          error: 'Failed to send file',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('Facebook export error:', error);
    res.status(500).json({
      error: 'Facebook export failed',
      message: error.message
    });
  }
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

module.exports = {
  exportJekyll,
  exportDealerCenter,
  exportAutoTrader,
  exportCarGurus,
  exportFacebook,
  getExportHistory
};
