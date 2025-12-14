/**
 * VIN Evaluation Service
 *
 * Purpose: Market research for vehicles we're considering buying (not in inventory yet)
 * Features:
 * - 1-week cache to save API costs on repeated lookups
 * - Uses same Auto.dev API + deduplication + own inventory exclusion
 * - Stores only summary data (median, min, max, count, position)
 */

const { sequelize } = require('../models');
const autodevService = require('./autodevMarketResearch');
const logger = require('../config/logger');

class VinEvaluationService {
  /**
   * Evaluate a vehicle by VIN with caching
   * @param {Object} vehicleData - { vin, year, make, model, trim, mileage, forceRefresh }
   * @returns {Object} - Market summary data
   */
  async evaluateVehicle(vehicleData) {
    const { vin, year, make, model, trim, mileage, forceRefresh } = vehicleData;

    // Validate required fields
    if (!vin || !year || !make || !model || !mileage) {
      throw new Error('Missing required fields: vin, year, make, model, mileage');
    }

    logger.info('VIN evaluation requested', {
      vin,
      year,
      make,
      model,
      trim,
      forceRefresh: forceRefresh || false
    });

    // Check cache first (entries less than 1 week old) unless force refresh
    const cachedData = !forceRefresh ? await this.getCachedEvaluation(vin) : null;
    if (cachedData) {
      logger.info('VIN evaluation loaded from cache', {
        vin,
        cacheAge: Math.floor((Date.now() - new Date(cachedData.created_at)) / (1000 * 60 * 60)) + ' hours'
      });

      return {
        fromCache: true,
        cacheAge: cachedData.created_at,
        vin: cachedData.vin,
        year: cachedData.year,
        make: cachedData.make,
        model: cachedData.model,
        trim: cachedData.trim,
        mileage: cachedData.mileage,
        marketData: {
          medianPrice: parseFloat(cachedData.median_price) || null,
          minPrice: parseFloat(cachedData.min_price) || null,
          maxPrice: parseFloat(cachedData.max_price) || null,
          averagePrice: parseFloat(cachedData.average_price) || null,
          totalListings: cachedData.total_listings,
          uniqueListings: cachedData.unique_listings,
          sampleListings: cachedData.sample_listings || []
        }
      };
    }

    // Not cached or force refresh - fetch from Auto.dev
    if (forceRefresh) {
      logger.info('VIN evaluation force refresh requested, bypassing cache', { vin });
      // Delete old cache entry
      await this.deleteCachedEvaluation(vin);
    } else {
      logger.info('VIN evaluation not cached, fetching from Auto.dev', { vin });
    }

    // Get all our inventory VINs to exclude from market data
    const ownVins = await this.getOwnInventoryVins();

    // Fetch market listings using Auto.dev API
    const { listings } = await autodevService.fetchListings({
      year,
      make,
      model,
      trim,
      mileage
    });

    logger.info('Auto.dev listings fetched', {
      vin,
      totalFetched: listings.length
    });

    // Deduplicate listings by VIN
    const { uniqueListings } = autodevService.deduplicateListings(listings);

    logger.info('Listings deduplicated', {
      vin,
      beforeDedup: listings.length,
      afterDedup: uniqueListings.length
    });

    // Exclude our own inventory from market data
    const marketListings = autodevService.excludeOwnInventory(uniqueListings, ownVins);

    logger.info('Own inventory excluded', {
      vin,
      afterExclusion: marketListings.length
    });

    // Calculate price statistics
    const priceStats = autodevService.calculatePriceStats(marketListings);

    logger.info('Price stats calculated', {
      vin,
      median: priceStats.median,
      count: priceStats.count
    });

    // Extract sample listings for display (top 50 for pagination)
    const sampleListings = this.extractSampleListings(marketListings, 50);

    // Save to cache
    await this.saveToCache({
      vin,
      year,
      make,
      model,
      trim,
      mileage,
      medianPrice: priceStats.median,
      minPrice: priceStats.min,
      maxPrice: priceStats.max,
      averagePrice: priceStats.average,
      totalListings: listings.length,
      uniqueListings: marketListings.length,
      searchParams: autodevService.buildSearchParams({ year, make, model, mileage }),
      sampleListings
    });

    logger.info('VIN evaluation saved to cache', { vin });

    return {
      fromCache: false,
      vin,
      year,
      make,
      model,
      trim,
      mileage,
      marketData: {
        medianPrice: priceStats.median,
        minPrice: priceStats.min,
        maxPrice: priceStats.max,
        averagePrice: priceStats.average,
        totalListings: listings.length,
        uniqueListings: marketListings.length,
        sampleListings
      }
    };
  }

  /**
   * Check cache for existing evaluation
   */
  async getCachedEvaluation(vin) {
    try {
      const [results] = await sequelize.query(`
        SELECT *
        FROM vin_evaluation_cache
        WHERE vin = $1
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 1
      `, {
        bind: [vin]
      });

      return results[0] || null;
    } catch (error) {
      logger.error('Failed to check VIN evaluation cache', {
        vin,
        error: error.message
      });
      return null; // On error, proceed with fresh lookup
    }
  }

  /**
   * Delete cached evaluation for a VIN
   */
  async deleteCachedEvaluation(vin) {
    try {
      await sequelize.query(`
        DELETE FROM vin_evaluation_cache
        WHERE vin = $1
      `, {
        bind: [vin]
      });

      logger.info('VIN evaluation cache deleted', { vin });
    } catch (error) {
      logger.error('Failed to delete VIN evaluation cache', {
        vin,
        error: error.message
      });
      // Don't throw - cache deletion is optional
    }
  }

  /**
   * Save evaluation to cache
   */
  async saveToCache(data) {
    const {
      vin,
      year,
      make,
      model,
      trim,
      mileage,
      medianPrice,
      minPrice,
      maxPrice,
      averagePrice,
      totalListings,
      uniqueListings,
      searchParams,
      sampleListings
    } = data;

    try {
      await sequelize.query(`
        INSERT INTO vin_evaluation_cache (
          vin,
          year,
          make,
          model,
          trim,
          mileage,
          median_price,
          min_price,
          max_price,
          average_price,
          total_listings,
          unique_listings,
          search_params,
          sample_listings,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `, {
        bind: [
          vin,
          year,
          make,
          model,
          trim || null,
          mileage,
          medianPrice,
          minPrice,
          maxPrice,
          averagePrice,
          totalListings,
          uniqueListings,
          JSON.stringify(searchParams),
          JSON.stringify(sampleListings)
        ]
      });

      logger.info('VIN evaluation cached', { vin });
    } catch (error) {
      logger.error('Failed to cache VIN evaluation', {
        vin,
        error: error.message
      });
      // Don't throw - caching is optional optimization
    }
  }

  /**
   * Get all VINs from our current inventory (to exclude from market data)
   */
  async getOwnInventoryVins() {
    try {
      const [results] = await sequelize.query(`
        SELECT vin
        FROM inventory
        WHERE vin IS NOT NULL
      `);

      return results.map(r => r.vin);
    } catch (error) {
      logger.error('Failed to fetch own inventory VINs', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Extract sample listings for display
   */
  extractSampleListings(listings, limit = 50) {
    return listings.slice(0, limit).map(listing => {
      const vin = listing.vehicle?.vin || null;
      const vinLast4 = vin ? vin.slice(-4) : null;

      return {
        vinLast4,
        price: listing.retailListing?.price || null,
        mileage: listing.retailListing?.miles || listing.vehicle?.mileage || null,
        trim: listing.vehicle?.trim || null,
        location: listing.retailListing?.city && listing.retailListing?.state
          ? `${listing.retailListing.city}, ${listing.retailListing.state}`
          : null,
        url: listing.retailListing?.vdp || listing.retailListing?.vdpUrl || null
      };
    });
  }
}

module.exports = new VinEvaluationService();
