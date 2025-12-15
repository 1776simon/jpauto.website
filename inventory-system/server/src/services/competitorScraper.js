/**
 * Competitor Scraper Service
 *
 * Handles scraping competitor inventory pages with:
 * - Memory monitoring (critical for 512MB RAM limit)
 * - Queue system (1 scrape at a time)
 * - Hybrid approach (axios+cheerio with Playwright fallback)
 * - Platform-specific parsers
 */

const axios = require('axios');
const cheerio = require('cheerio');
const playwright = require('playwright');
const logger = require('../config/logger');
const {
  Competitor,
  CompetitorInventory,
  CompetitorPriceHistory
} = require('../models');
const { Op } = require('sequelize');

// MEMORY SAFEGUARDS (Critical for 512MB RAM)
const MAX_MEMORY_MB = 400; // Warn if above 400MB (leave buffer for other processes)
const scrapeQueue = [];
let isScrapingInProgress = false;
let currentBrowser = null;

/**
 * Check current memory usage
 */
function checkMemory() {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const rssMB = Math.round(used.rss / 1024 / 1024);

  logger.info(`Memory usage: Heap ${heapUsedMB}MB, RSS ${rssMB}MB`);

  if (rssMB > MAX_MEMORY_MB) {
    logger.warn(`⚠️ High memory usage detected: ${rssMB}MB (limit: ${MAX_MEMORY_MB}MB)`);
    return false;
  }

  return true;
}

/**
 * Force garbage collection if available
 */
function forceGC() {
  if (global.gc) {
    global.gc();
    logger.info('Forced garbage collection');
  }
}

/**
 * Add scrape job to queue
 */
async function queueScrape(competitorId) {
  return new Promise((resolve, reject) => {
    scrapeQueue.push({ competitorId, resolve, reject });
    processScrapeQueue();
  });
}

/**
 * Process scrape queue (1 at a time)
 */
async function processScrapeQueue() {
  if (isScrapingInProgress || scrapeQueue.length === 0) {
    return;
  }

  isScrapingInProgress = true;
  const { competitorId, resolve, reject } = scrapeQueue.shift();

  try {
    // Check memory before starting
    if (!checkMemory()) {
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for GC
    }

    const result = await scrapeCompetitor(competitorId);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isScrapingInProgress = false;

    // Force cleanup
    forceGC();

    // Process next in queue after small delay
    setTimeout(() => processScrapeQueue(), 1000);
  }
}

/**
 * Main scrape function
 */
async function scrapeCompetitor(competitorId) {
  const competitor = await Competitor.findByPk(competitorId);

  if (!competitor) {
    throw new Error('Competitor not found');
  }

  logger.info(`Starting scrape for: ${competitor.name}`);

  try {
    await competitor.update({ lastScrapedAt: new Date() });

    let scrapedVehicles;

    // Try light scraping first (unless configured to use Playwright)
    if (!competitor.usePlaywright) {
      try {
        logger.info('Attempting light scrape (axios + cheerio)');
        scrapedVehicles = await lightScrape(competitor.inventoryUrl, competitor.platformType);
        logger.info(`Light scrape successful: ${scrapedVehicles.length} vehicles found`);
      } catch (lightError) {
        logger.warn(`Light scrape failed: ${lightError.message}. Falling back to Playwright.`);

        // Update competitor to use Playwright for future scrapes
        await competitor.update({
          usePlaywright: true,
          scrapeError: `Switched to Playwright: ${lightError.message}`,
          scrapeErrorType: lightError.type || 'LIGHT_SCRAPE_FAILED'
        });

        scrapedVehicles = await heavyScrape(competitor.inventoryUrl, competitor.platformType);
      }
    } else {
      logger.info('Using Playwright (heavy scrape)');
      scrapedVehicles = await heavyScrape(competitor.inventoryUrl, competitor.platformType);
    }

    // Validate scraped data
    const validation = validateScrapedData(scrapedVehicles);

    if (!validation.isValid) {
      throw new Error(`Scrape validation failed: ${validation.errors.join(', ')}`);
    }

    // Process scraped vehicles
    const result = await processScrapeResults(competitor.id, scrapedVehicles);

    // Update competitor
    await competitor.update({
      lastSuccessfulScrapeAt: new Date(),
      scrapeError: null,
      scrapeErrorType: null
    });

    logger.info(`Scrape completed successfully for ${competitor.name}: ${result.added} added, ${result.updated} updated, ${result.sold} sold`);

    return result;

  } catch (error) {
    logger.error(`Scrape failed for ${competitor.name}:`, error);

    await competitor.update({
      scrapeError: error.message,
      scrapeErrorType: error.type || 'UNKNOWN_ERROR'
    });

    throw error;
  }
}

/**
 * Light scraping with axios + cheerio
 */
async function lightScrape(url, platformType) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });

    if (response.status === 403) {
      const error = new Error('Website blocking automated requests (403 Forbidden)');
      error.type = 'BLOCKED_403';
      throw error;
    }

    const $ = cheerio.load(response.data);

    // Detect platform if not set
    const detectedPlatform = platformType || detectPlatform($);

    // Use platform-specific parser
    const vehicles = await parsePlatform($, detectedPlatform);

    if (vehicles.length === 0) {
      const error = new Error('No vehicles found - may require JavaScript rendering');
      error.type = 'NO_VEHICLES_FOUND';
      throw error;
    }

    return vehicles;

  } catch (error) {
    if (error.type) throw error;

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const customError = new Error(`Connection failed: ${error.message}`);
      customError.type = 'CONNECTION_ERROR';
      throw customError;
    }

    throw error;
  }
}

/**
 * Heavy scraping with Playwright
 */
async function heavyScrape(url, platformType) {
  let browser = null;
  let page = null;

  try {
    logger.info('Launching Playwright browser...');
    checkMemory(); // Check before launch

    browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Critical for low memory
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    currentBrowser = browser;
    page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    logger.info(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Detect platform
    const detectedPlatform = platformType || await detectPlatformPlaywright(page);
    logger.info(`Detected platform: ${detectedPlatform}`);

    // Load all vehicles (handle pagination)
    const vehicleCount = await loadAllVehicles(page, detectedPlatform);
    logger.info(`Loaded ${vehicleCount} vehicles`);

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse vehicles
    const vehicles = await parsePlatform($, detectedPlatform);

    logger.info(`Parsed ${vehicles.length} vehicles`);

    return vehicles;

  } finally {
    // CRITICAL: Always close browser to free memory
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    currentBrowser = null;

    checkMemory(); // Check after cleanup
  }
}

/**
 * Load all vehicles (handle "Load More" buttons, pagination)
 */
async function loadAllVehicles(page, platformType) {
  // Platform-specific loading strategies
  const loaders = require('./scraperParsers');

  if (loaders[platformType] && loaders[platformType].loadAll) {
    return await loaders[platformType].loadAll(page);
  }

  // Generic loader
  let previousCount = 0;
  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  while (attempts < MAX_ATTEMPTS) {
    const currentCount = await page.$$eval('[class*="vehicle"], [class*="listing"], [class*="car"]', els => els.length);

    if (currentCount === previousCount) break;
    previousCount = currentCount;

    // Try to find and click "Load More"
    const loadMoreBtn = await page.$('button:has-text("Load More"), a:has-text("Load More"), button.load-more, a.load-more');

    if (!loadMoreBtn) break;

    await loadMoreBtn.click();
    await page.waitForTimeout(2000);
    attempts++;
  }

  return previousCount;
}

/**
 * Detect platform from HTML
 */
function detectPlatform($) {
  const html = $('html').html();

  if ($('[class*="dws-"]').length > 0 || html.includes('dealercenter')) {
    return 'dealercenter';
  }

  if ($('[class*="ds-"]').length > 0 || html.includes('dealersync')) {
    return 'dealersync';
  }

  return 'custom';
}

/**
 * Detect platform from Playwright page
 */
async function detectPlatformPlaywright(page) {
  const hasDws = await page.$('[class*="dws-"]');
  if (hasDws) return 'dealercenter';

  const hasDs = await page.$('[class*="ds-"]');
  if (hasDs) return 'dealersync';

  return 'custom';
}

/**
 * Parse vehicles based on platform
 */
async function parsePlatform($, platformType) {
  const parsers = require('./scraperParsers');

  if (parsers[platformType]) {
    return parsers[platformType].parse($);
  }

  throw new Error(`No parser available for platform: ${platformType}`);
}

/**
 * Validate scraped data
 */
function validateScrapedData(vehicles) {
  const errors = [];
  const warnings = [];

  if (!vehicles || vehicles.length === 0) {
    errors.push('No vehicles found');
    return { isValid: false, errors, warnings };
  }

  const withIdentifier = vehicles.filter(v => v.vin || v.stock_number);
  const withPrice = vehicles.filter(v => v.price);

  if (withIdentifier.length === 0) {
    errors.push('No vehicles have VIN or Stock Number');
  } else if (withIdentifier.length < vehicles.length * 0.5) {
    warnings.push(`Only ${withIdentifier.length}/${vehicles.length} vehicles have identifiers`);
  }

  if (withPrice.length === 0) {
    errors.push('No vehicles have prices');
  } else if (withPrice.length < vehicles.length * 0.8) {
    warnings.push(`Only ${withPrice.length}/${vehicles.length} vehicles have prices`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness: Math.round((withIdentifier.length / vehicles.length) * 100)
  };
}

/**
 * Process scraped results (compare with existing inventory)
 */
async function processScrapeResults(competitorId, scrapedVehicles) {
  const stats = { added: 0, updated: 0, sold: 0, errors: 0 };

  // Get current active inventory
  const currentInventory = await CompetitorInventory.findAll({
    where: { competitor_id: competitorId, status: 'active' }
  });

  const scrapedIdentifiers = scrapedVehicles
    .map(v => v.vin || v.stock_number)
    .filter(Boolean);

  // Mark vehicles as sold if they disappeared
  for (const vehicle of currentInventory) {
    const identifier = vehicle.vin || vehicle.stockNumber;

    if (!scrapedIdentifiers.includes(identifier)) {
      const daysOnMarket = Math.floor(
        (new Date() - new Date(vehicle.firstSeenAt)) / (1000 * 60 * 60 * 24)
      );

      await vehicle.update({
        status: 'sold',
        soldAt: new Date(),
        daysOnMarket
      });

      // Record final price
      await CompetitorPriceHistory.create({
        competitorInventoryId: vehicle.id,
        price: vehicle.currentPrice,
        mileage: vehicle.mileage,
        recordedAt: new Date()
      });

      stats.sold++;
    }
  }

  // Process scraped vehicles
  for (const scraped of scrapedVehicles) {
    try {
      const existing = await CompetitorInventory.findOne({
        where: {
          competitorId,
          [Op.or]: [
            { vin: scraped.vin },
            { stockNumber: scraped.stock_number }
          ]
        }
      });

      if (existing) {
        // Update existing
        const priceChanged = existing.currentPrice &&
                           parseFloat(existing.currentPrice) !== parseFloat(scraped.price);

        await existing.update({
          currentPrice: scraped.price,
          mileage: scraped.mileage,
          lastSeenAt: new Date(),
          lastUpdatedAt: new Date(),
          status: 'active' // Reactivate if was marked sold/removed
        });

        // Record price change
        if (priceChanged) {
          await CompetitorPriceHistory.create({
            competitorInventoryId: existing.id,
            price: scraped.price,
            mileage: scraped.mileage
          });
        }

        stats.updated++;
      } else {
        // Add new vehicle
        const completeness = calculateCompleteness(scraped);
        const warnings = [];

        if (!scraped.mileage) warnings.push('Mileage missing');
        if (!scraped.year) warnings.push('Year missing');
        if (!scraped.make) warnings.push('Make missing');

        await CompetitorInventory.create({
          competitorId,
          vin: scraped.vin,
          stockNumber: scraped.stock_number,
          hasVin: !!scraped.vin,
          year: scraped.year,
          make: scraped.make,
          model: scraped.model,
          trim: scraped.trim,
          mileage: scraped.mileage,
          exteriorColor: scraped.exterior_color,
          currentPrice: scraped.price,
          initialPrice: scraped.price,
          status: 'active',
          completeness,
          dataWarnings: warnings.length > 0 ? warnings : null,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          lastUpdatedAt: new Date()
        });

        stats.added++;
      }
    } catch (error) {
      logger.error('Error processing vehicle:', error);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Calculate data completeness percentage
 */
function calculateCompleteness(vehicle) {
  const fields = ['vin', 'stock_number', 'year', 'make', 'model', 'price', 'mileage', 'trim'];
  const filledFields = fields.filter(f => vehicle[f] != null && vehicle[f] !== '');
  return Math.round((filledFields.length / fields.length) * 100);
}

/**
 * Emergency cleanup (if scrape crashes)
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing browser...');
  if (currentBrowser) {
    await currentBrowser.close().catch(() => {});
  }
});

module.exports = {
  queueScrape,
  scrapeCompetitor,
  checkMemory
};
