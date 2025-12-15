/**
 * Competitor Tracking Controller
 * Handles all competitor tracking endpoints
 */

const {
  Competitor,
  CompetitorInventory,
  CompetitorPriceHistory,
  CompetitorMetrics
} = require('../models');
const { queueScrape, checkMemory } = require('../services/competitorScraper');
const logger = require('../config/logger');
const { Op } = require('sequelize');

/**
 * GET /api/competitors
 * Get all competitors with basic stats
 */
exports.getAllCompetitors = async (req, res) => {
  try {
    const competitors = await Competitor.findAll({
      order: [['created_at', 'DESC']]
    });

    // Get stats for each competitor
    const competitorsWithStats = await Promise.all(
      competitors.map(async (competitor) => {
        const totalInventory = await CompetitorInventory.count({
          where: { competitorId: competitor.id, status: 'active' }
        });

        // Get current month sales
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlySales = await CompetitorInventory.count({
          where: {
            competitorId: competitor.id,
            status: 'sold',
            soldAt: {
              [Op.gte]: startOfMonth
            }
          }
        });

        // Get average DOM for active inventory
        const activeVehicles = await CompetitorInventory.findAll({
          where: { competitorId: competitor.id, status: 'active' },
          attributes: ['firstSeenAt']
        });

        const avgDaysOnMarket = activeVehicles.length > 0
          ? Math.round(
              activeVehicles.reduce((sum, v) => {
                const days = Math.floor((new Date() - new Date(v.firstSeenAt)) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / activeVehicles.length
            )
          : 0;

        // Get average sale price this month
        const soldThisMonth = await CompetitorInventory.findAll({
          where: {
            competitorId: competitor.id,
            status: 'sold',
            soldAt: {
              [Op.gte]: startOfMonth
            }
          },
          attributes: ['currentPrice']
        });

        const avgSalePrice = soldThisMonth.length > 0
          ? soldThisMonth.reduce((sum, v) => sum + parseFloat(v.currentPrice || 0), 0) / soldThisMonth.length
          : null;

        return {
          ...competitor.toJSON(),
          stats: {
            totalInventory,
            monthlySales,
            avgDaysOnMarket,
            avgSalePrice: avgSalePrice ? Math.round(avgSalePrice) : null
          }
        };
      })
    );

    res.json(competitorsWithStats);
  } catch (error) {
    logger.error('Error fetching competitors:', error);
    res.status(500).json({ error: 'Failed to fetch competitors' });
  }
};

/**
 * GET /api/competitors/:id
 * Get single competitor with detailed stats
 */
exports.getCompetitorById = async (req, res) => {
  try {
    const { id } = req.params;

    const competitor = await Competitor.findByPk(id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // Get detailed stats
    const totalInventory = await CompetitorInventory.count({
      where: { competitorId: id, status: 'active' }
    });

    // Current month sales
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlySales = await CompetitorInventory.count({
      where: {
        competitorId: id,
        status: 'sold',
        soldAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Average DOM
    const activeVehicles = await CompetitorInventory.findAll({
      where: { competitorId: id, status: 'active' },
      attributes: ['firstSeenAt']
    });

    const avgDaysOnMarket = activeVehicles.length > 0
      ? Math.round(
          activeVehicles.reduce((sum, v) => {
            const days = Math.floor((new Date() - new Date(v.firstSeenAt)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / activeVehicles.length
        )
      : 0;

    // Average sale price
    const soldThisMonth = await CompetitorInventory.findAll({
      where: {
        competitorId: id,
        status: 'sold',
        soldAt: {
          [Op.gte]: startOfMonth
        }
      },
      attributes: ['currentPrice', 'initialPrice']
    });

    const avgSalePrice = soldThisMonth.length > 0
      ? soldThisMonth.reduce((sum, v) => sum + parseFloat(v.currentPrice || 0), 0) / soldThisMonth.length
      : null;

    // Average price drop
    const vehiclesWithDrop = soldThisMonth.filter(v => v.initialPrice && v.currentPrice);
    const avgPriceDrop = vehiclesWithDrop.length > 0
      ? vehiclesWithDrop.reduce((sum, v) => {
          return sum + (parseFloat(v.initialPrice) - parseFloat(v.currentPrice));
        }, 0) / vehiclesWithDrop.length
      : null;

    res.json({
      ...competitor.toJSON(),
      stats: {
        totalInventory,
        monthlySales,
        avgDaysOnMarket,
        avgSalePrice: avgSalePrice ? Math.round(avgSalePrice) : null,
        avgPriceDrop: avgPriceDrop ? Math.round(avgPriceDrop) : null
      }
    });
  } catch (error) {
    logger.error('Error fetching competitor:', error);
    res.status(500).json({ error: 'Failed to fetch competitor' });
  }
};

/**
 * POST /api/competitors
 * Create new competitor
 */
exports.createCompetitor = async (req, res) => {
  try {
    const { name, websiteUrl, inventoryUrl } = req.body;

    // Create competitor
    const competitor = await Competitor.create({
      name,
      websiteUrl,
      inventoryUrl,
      active: true
    });

    res.status(201).json(competitor);
  } catch (error) {
    logger.error('Error creating competitor:', error);
    res.status(500).json({ error: 'Failed to create competitor' });
  }
};

/**
 * PUT /api/competitors/:id
 * Update competitor
 */
exports.updateCompetitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, websiteUrl, inventoryUrl, active } = req.body;

    const competitor = await Competitor.findByPk(id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    await competitor.update({
      name: name || competitor.name,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : competitor.websiteUrl,
      inventoryUrl: inventoryUrl || competitor.inventoryUrl,
      active: active !== undefined ? active : competitor.active
    });

    res.json(competitor);
  } catch (error) {
    logger.error('Error updating competitor:', error);
    res.status(500).json({ error: 'Failed to update competitor' });
  }
};

/**
 * DELETE /api/competitors/:id
 * Delete competitor and all associated data
 */
exports.deleteCompetitor = async (req, res) => {
  try {
    const { id } = req.params;

    const competitor = await Competitor.findByPk(id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    await competitor.destroy();

    res.json({ message: 'Competitor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting competitor:', error);
    res.status(500).json({ error: 'Failed to delete competitor' });
  }
};

/**
 * POST /api/competitors/validate
 * Test scrape a URL before adding as competitor
 */
exports.validateCompetitorUrl = async (req, res) => {
  try {
    const { inventoryUrl } = req.body;

    if (!inventoryUrl) {
      return res.status(400).json({ error: 'Inventory URL is required' });
    }

    // Check memory before starting
    const memoryOk = checkMemory();
    if (!memoryOk) {
      return res.status(503).json({
        error: 'Server memory too high, please try again in a moment',
        errorType: 'HIGH_MEMORY'
      });
    }

    logger.info(`Validating URL: ${inventoryUrl}`);

    // Try scraping without saving
    const scraper = require('../services/competitorScraper');
    const lightScrape = require('../services/competitorScraper').lightScrape;

    // Use a test scrape function
    const axios = require('axios');
    const cheerio = require('cheerio');

    try {
      const response = await axios.get(inventoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      if (response.status === 403) {
        return res.json({
          success: false,
          errorType: 'BLOCKED_403',
          message: 'Website is blocking automated requests. Playwright scraper will be used (slower but more reliable).',
          requiresPlaywright: true,
          preview: []
        });
      }

      const $ = cheerio.load(response.data);

      // Detect platform
      const html = $('html').html();
      let platformType = 'custom';

      if ($('[class*="dws-"]').length > 0 || html.includes('dealercenter')) {
        platformType = 'dealercenter';
      } else if ($('[class*="ds-"]').length > 0 || html.includes('dealersync')) {
        platformType = 'dealersync';
      }

      // Parse vehicles
      const parsers = require('../services/scraperParsers');
      const vehicles = parsers[platformType].parse($);

      if (vehicles.length === 0) {
        return res.json({
          success: false,
          errorType: 'NO_VEHICLES_FOUND',
          message: 'No vehicles found on this page. The site may require JavaScript rendering or the URL may be incorrect.',
          requiresPlaywright: true,
          platformType,
          preview: []
        });
      }

      // Return preview (first 5 vehicles)
      const preview = vehicles.slice(0, 5);

      res.json({
        success: true,
        message: `Found ${vehicles.length} vehicles`,
        platformType,
        totalVehicles: vehicles.length,
        requiresPlaywright: false,
        preview
      });

    } catch (error) {
      // Extract safe error info for logging
      const errorInfo = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: inventoryUrl
      };
      logger.error('Validation error:', errorInfo);

      let errorType = 'UNKNOWN_ERROR';
      let message = error.message;

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        errorType = 'CONNECTION_ERROR';
        message = 'Could not connect to the website. Please check the URL.';
      } else if (error.response && error.response.status === 403) {
        errorType = 'BLOCKED_403';
        message = 'Website is blocking automated requests. Playwright scraper will be used.';
      }

      res.json({
        success: false,
        errorType,
        message,
        requiresPlaywright: errorType === 'BLOCKED_403',
        preview: []
      });
    }

  } catch (error) {
    logger.error('Error validating competitor URL:', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to validate URL' });
  }
};

/**
 * POST /api/competitors/:id/scrape
 * Manually trigger scrape for competitor
 */
exports.scrapeCompetitor = async (req, res) => {
  try {
    const { id } = req.params;

    const competitor = await Competitor.findByPk(id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    // Check memory
    const memoryOk = checkMemory();
    if (!memoryOk) {
      return res.status(503).json({
        error: 'Server memory too high, please try again in a moment'
      });
    }

    // Queue the scrape (non-blocking)
    queueScrape(id)
      .then(result => {
        logger.info(`Scrape completed for ${competitor.name}:`, result);
      })
      .catch(error => {
        logger.error(`Scrape failed for ${competitor.name}:`, error);
      });

    res.json({
      message: 'Scrape started',
      competitorId: id,
      competitorName: competitor.name
    });

  } catch (error) {
    logger.error('Error starting scrape:', error);
    res.status(500).json({ error: 'Failed to start scrape' });
  }
};

/**
 * GET /api/competitors/:id/inventory
 * Get current inventory for competitor
 */
exports.getCompetitorInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await CompetitorInventory.findAndCountAll({
      where: { competitorId: id, status: 'active' },
      order: [['lastUpdatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      vehicles: rows
    });
  } catch (error) {
    logger.error('Error fetching competitor inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

/**
 * GET /api/competitors/:id/sales
 * Get sold vehicles for competitor (current month)
 */
exports.getCompetitorSales = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    // Default to current month
    const targetDate = new Date();
    if (year) targetDate.setFullYear(parseInt(year));
    if (month) targetDate.setMonth(parseInt(month) - 1);

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const soldVehicles = await CompetitorInventory.findAll({
      where: {
        competitorId: id,
        status: 'sold',
        soldAt: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth
        }
      },
      order: [['soldAt', 'DESC']]
    });

    res.json({
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      total: soldVehicles.length,
      vehicles: soldVehicles
    });
  } catch (error) {
    logger.error('Error fetching competitor sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

/**
 * GET /api/competitors/:id/metrics
 * Get historical metrics for competitor
 */
exports.getCompetitorMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const metrics = await CompetitorMetrics.findAll({
      where: {
        competitorId: id,
        date: {
          [Op.gte]: startDate
        }
      },
      order: [['date', 'ASC']]
    });

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching competitor metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};
