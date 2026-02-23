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

        // Price distribution buckets for active inventory
        const inventoryPrices = await CompetitorInventory.findAll({
          where: { competitorId: competitor.id, status: 'active' },
          attributes: ['currentPrice']
        });

        const priceDistribution = {
          under10k: 0,
          from10to20k: 0,
          from20to30k: 0,
          over30k: 0
        };

        inventoryPrices.forEach(v => {
          const price = parseFloat(v.currentPrice || 0);
          if (price <= 10000) priceDistribution.under10k++;
          else if (price <= 20000) priceDistribution.from10to20k++;
          else if (price <= 30000) priceDistribution.from20to30k++;
          else priceDistribution.over30k++;
        });

        return {
          ...competitor.toJSON(),
          stats: {
            totalInventory,
            monthlySales,
            avgDaysOnMarket,
            avgSalePrice: avgSalePrice ? Math.round(avgSalePrice) : null,
            priceDistribution
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
    const { name, websiteUrl, inventoryUrl, usePlaywright } = req.body;

    // Create competitor
    const competitor = await Competitor.create({
      name,
      websiteUrl,
      inventoryUrl,
      usePlaywright: usePlaywright || false,
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
    const { name, websiteUrl, inventoryUrl, active, usePlaywright } = req.body;

    const competitor = await Competitor.findByPk(id);

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    await competitor.update({
      name: name || competitor.name,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : competitor.websiteUrl,
      inventoryUrl: inventoryUrl || competitor.inventoryUrl,
      active: active !== undefined ? active : competitor.active,
      usePlaywright: usePlaywright !== undefined ? usePlaywright : competitor.usePlaywright
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

      return res.json({
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

      // For 403 (blocked), return success:true so user can proceed with Playwright
      // For other errors, return success:false
      const isBlocked = errorType === 'BLOCKED_403';

      return res.json({
        success: isBlocked, // true for 403, false for other errors
        errorType,
        message,
        requiresPlaywright: isBlocked,
        totalVehicles: 0,
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
 * Get current inventory for competitor with server-side filtering
 */
exports.getCompetitorInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, year, make, model, sortBy = 'days-newest' } = req.query;

    const safeLimit = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * safeLimit;

    const where = { competitorId: id, status: 'active' };
    if (year) where.year = parseInt(year);
    if (make) where.make = make;
    if (model) where.model = model;

    const orderMap = {
      'price-asc': [['currentPrice', 'ASC']],
      'price-desc': [['currentPrice', 'DESC']],
      'days-oldest': [['firstSeenAt', 'ASC']],
      'days-newest': [['firstSeenAt', 'DESC']],
      'mileage-asc': [['mileage', 'ASC']],
      'mileage-desc': [['mileage', 'DESC']],
    };
    const order = orderMap[sortBy] || [['firstSeenAt', 'DESC']];

    const { count, rows } = await CompetitorInventory.findAndCountAll({
      where,
      order,
      limit: safeLimit,
      offset
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: safeLimit,
      vehicles: rows
    });
  } catch (error) {
    logger.error('Error fetching competitor inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

/**
 * GET /api/competitors/:id/inventory/filters
 * Get unique filter options for a competitor's active inventory
 */
exports.getCompetitorInventoryFilters = async (req, res) => {
  try {
    const { id } = req.params;
    const { sequelize: db } = require('../config/database');

    const [years, makes, models] = await Promise.all([
      CompetitorInventory.findAll({
        where: { competitorId: id, status: 'active', year: { [Op.not]: null } },
        attributes: ['year', [db.fn('COUNT', db.col('id')), 'count']],
        group: ['year'],
        order: [['year', 'DESC']],
        raw: true
      }),
      CompetitorInventory.findAll({
        where: { competitorId: id, status: 'active', make: { [Op.not]: null } },
        attributes: ['make', [db.fn('COUNT', db.col('id')), 'count']],
        group: ['make'],
        order: [['make', 'ASC']],
        raw: true
      }),
      CompetitorInventory.findAll({
        where: { competitorId: id, status: 'active', model: { [Op.not]: null } },
        attributes: ['model', [db.fn('COUNT', db.col('id')), 'count']],
        group: ['model'],
        order: [['model', 'ASC']],
        raw: true
      })
    ]);

    res.json({ years, makes, models });
  } catch (error) {
    logger.error('Error fetching inventory filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
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
 * GET /api/competitors/:id/sales/summary
 * Get monthly sales aggregates with price buckets for chart
 */
exports.getCompetitorSalesSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 12, make, model } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const where = {
      competitorId: id,
      status: 'sold',
      soldAt: { [Op.gte]: startDate }
    };
    if (make) where.make = make;
    if (model) where.model = model;

    const soldVehicles = await CompetitorInventory.findAll({
      where,
      attributes: ['soldAt', 'currentPrice', 'daysOnMarket'],
      raw: true
    });

    const monthMap = new Map();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    soldVehicles.forEach(v => {
      if (!v.soldAt) return;
      const d = new Date(v.soldAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          count: 0,
          totalPrice: 0,
          priceCount: 0,
          totalDom: 0,
          domCount: 0,
          buckets: { under10k: 0, from10to20k: 0, from20to30k: 0, over30k: 0 }
        });
      }

      const entry = monthMap.get(key);
      entry.count++;

      const price = parseFloat(v.currentPrice || 0);
      if (price > 0) {
        entry.totalPrice += price;
        entry.priceCount++;
        if (price <= 10000) entry.buckets.under10k++;
        else if (price <= 20000) entry.buckets.from10to20k++;
        else if (price <= 30000) entry.buckets.from20to30k++;
        else entry.buckets.over30k++;
      }

      if (v.daysOnMarket) {
        entry.totalDom += v.daysOnMarket;
        entry.domCount++;
      }
    });

    const result = Array.from(monthMap.values())
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(entry => ({
        month: entry.month,
        year: entry.year,
        label: `${monthNames[entry.month - 1]} ${entry.year}`,
        count: entry.count,
        avgSalePrice: entry.priceCount > 0 ? Math.round(entry.totalPrice / entry.priceCount) : null,
        avgDaysOnMarket: entry.domCount > 0 ? Math.round(entry.totalDom / entry.domCount) : null,
        buckets: entry.buckets
      }));

    // Available makes/models for chart filter dropdowns
    const [availableMakes, availableModels] = await Promise.all([
      CompetitorInventory.findAll({
        where: { competitorId: id, status: 'sold', make: { [Op.not]: null } },
        attributes: ['make'],
        group: ['make'],
        order: [['make', 'ASC']],
        raw: true
      }),
      CompetitorInventory.findAll({
        where: { competitorId: id, status: 'sold', model: { [Op.not]: null }, ...(make ? { make } : {}) },
        attributes: ['model'],
        group: ['model'],
        order: [['model', 'ASC']],
        raw: true
      })
    ]);

    res.json({
      months: result,
      filters: {
        makes: availableMakes.map(m => m.make),
        models: availableModels.map(m => m.model)
      }
    });
  } catch (error) {
    logger.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
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
