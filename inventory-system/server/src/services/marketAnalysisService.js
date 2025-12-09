/**
 * Market Analysis Service
 *
 * High-level orchestration for market research analysis
 * Coordinates: API calls, deduplication, database operations, alert detection
 */

const autodevService = require('./autodevMarketResearch');
const marketDb = require('./marketDatabaseService');
const { Inventory, sequelize } = require('../models');
const logger = require('../config/logger');

class MarketAnalysisService {
  /**
   * Analyze a single vehicle against market
   */
  async analyzeVehicle(vehicleId, options = {}) {
    const { expansion = 0, manual = false, yearRange = null } = options;

    try {
      // Fetch vehicle
      const vehicle = await Inventory.findByPk(vehicleId);
      if (!vehicle) {
        throw new Error(`Vehicle ${vehicleId} not found`);
      }

      logger.info('Starting market analysis', {
        vehicleId,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        expansion,
        manual
      });

      // Build search params
      const searchParams = autodevService.buildSearchParams(vehicle, expansion, yearRange);

      // Fetch listings from Auto.dev
      const { listings: rawListings } = await autodevService.fetchListings(vehicle, { expansion, yearRange });

      if (rawListings.length === 0) {
        logger.warn('No market listings found', {
          vehicleId,
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        });

        return {
          success: true,
          vehicle: vehicle.toJSON(),
          noResults: true,
          message: 'No comparable market listings found'
        };
      }

      // Deduplicate by VIN
      const { uniqueListings, duplicates } = autodevService.deduplicateListings(rawListings);

      // Exclude own inventory
      const ownVins = await this.getOwnInventoryVINs();
      const marketListings = autodevService.excludeOwnInventory(uniqueListings, ownVins);

      // Check if we need expansion (only for automatic analysis)
      if (marketListings.length < 10 && expansion < 50000 && !manual) {
        logger.info('Insufficient results, expansion needed', {
          vehicleId,
          resultsCount: marketListings.length,
          currentExpansion: expansion
        });

        return {
          success: false,
          needsExpansion: true,
          resultsCount: marketListings.length,
          nextExpansion: expansion + 10000
        };
      }

      // Calculate price statistics
      const priceStats = autodevService.calculatePriceStats(marketListings);

      // Calculate metrics
      const ourPrice = parseFloat(vehicle.price);
      const priceDelta = priceStats.median ? ourPrice - priceStats.median : null;
      const priceDeltaPercent = priceStats.median
        ? parseFloat(((priceDelta / priceStats.median) * 100).toFixed(2))
        : null;

      const marketPrices = marketListings
        .map(l => l.retailListing?.price)
        .filter(p => p && p > 0);

      const percentileRank = autodevService.calculatePercentileRank(ourPrice, marketPrices);
      const competitivePosition = autodevService.determineCompetitivePosition(priceDeltaPercent);

      const cheaperCount = marketPrices.filter(p => p < ourPrice).length;
      const moreExpensiveCount = marketPrices.filter(p => p > ourPrice).length;

      // Calculate days in market
      const daysInMarket = vehicle.date_added
        ? Math.floor((new Date() - new Date(vehicle.date_added)) / (1000 * 60 * 60 * 24))
        : null;

      // Extract platform data
      const platformData = autodevService.extractPlatformData(marketListings, ownVins);

      // Save to database
      const snapshot = await marketDb.saveMarketSnapshot({
        vehicleId: vehicle.id,
        searchParams,
        listingsData: marketListings,
        totalListings: rawListings.length,
        uniqueListings: uniqueListings.length,
        medianPrice: priceStats.median,
        averagePrice: priceStats.average,
        minPrice: priceStats.min,
        maxPrice: priceStats.max
      });

      const metrics = await marketDb.saveMarketMetrics({
        snapshotId: snapshot.id,
        vehicleId: vehicle.id,
        ourPrice,
        priceDelta,
        priceDeltaPercent,
        percentileRank,
        cheaperCount,
        moreExpensiveCount,
        competitivePosition,
        daysInMarket
      });

      // Save platform tracking
      if (platformData.length > 0) {
        await marketDb.saveMarketPlatformTracking(platformData);
      }

      // Update price history
      if (priceStats.median) {
        await marketDb.updatePriceHistory(vehicle.id, priceStats.median);
      }

      logger.info('Market analysis complete', {
        vehicleId,
        snapshot: snapshot.id,
        metrics: metrics.id,
        marketListings: marketListings.length,
        position: competitivePosition
      });

      return {
        success: true,
        vehicle: vehicle.toJSON(),
        snapshot: snapshot,
        metrics: metrics,
        priceStats,
        marketListings: marketListings.length,
        duplicates: duplicates.length,
        platformData: platformData.length
      };
    } catch (error) {
      logger.error('Market analysis failed', {
        vehicleId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Analyze all vehicles in inventory
   */
  async analyzeAllVehicles() {
    logger.info('Starting batch market analysis for all vehicles');

    const vehicles = await Inventory.findAll({
      where: {
        status: 'available'
      }
    });

    logger.info(`Found ${vehicles.length} vehicles to analyze`);

    const results = [];

    for (const vehicle of vehicles) {
      try {
        let result = await this.analyzeVehicle(vehicle.id);

        // Handle expansion (up to 5 attempts, max +50k)
        let attempts = 0;
        while (result.needsExpansion && attempts < 5) {
          const nextExpansion = result.nextExpansion || 10000;
          logger.info(`Retrying with expansion +${nextExpansion} miles`, {
            vehicleId: vehicle.id
          });

          result = await this.analyzeVehicle(vehicle.id, {
            expansion: nextExpansion,
            manual: false
          });

          attempts++;
        }

        results.push({
          vehicleId: vehicle.id,
          success: result.success,
          result
        });

        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        logger.error('Failed to analyze vehicle', {
          vehicleId: vehicle.id,
          error: error.message
        });

        results.push({
          vehicleId: vehicle.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Batch market analysis complete', {
      total: vehicles.length,
      success: successCount,
      failures: failureCount
    });

    return results;
  }

  /**
   * Get all VINs from own inventory
   */
  async getOwnInventoryVINs() {
    const vehicles = await Inventory.findAll({
      attributes: ['vin'],
      where: {
        vin: { [sequelize.Sequelize.Op.ne]: null }
      }
    });

    return vehicles.map(v => v.vin).filter(Boolean);
  }

  /**
   * Get market research overview for all vehicles
   */
  async getMarketOverview() {
    try {
      const query = `
        SELECT
          i.id,
          i.year,
          i.make,
          i.model,
          i.trim,
          i.vin,
          i.price as our_price,
          i.mileage,
          i.status,
          i.date_added,
          ms.snapshot_date as last_analyzed,
          ms.median_price as market_median,
          ms.total_listings,
          ms.unique_listings,
          mm.price_delta,
          mm.price_delta_percent,
          mm.percentile_rank,
          mm.competitive_position,
          mm.cheaper_count,
          mm.more_expensive_count,
          mm.days_in_market
        FROM inventory i
        LEFT JOIN LATERAL (
          SELECT * FROM market_snapshots
          WHERE vehicle_id = i.id
          ORDER BY snapshot_date DESC
          LIMIT 1
        ) ms ON true
        LEFT JOIN LATERAL (
          SELECT * FROM market_metrics
          WHERE vehicle_id = i.id
          ORDER BY created_at DESC
          LIMIT 1
        ) mm ON true
        WHERE i.status = 'available'
        ORDER BY i.id DESC
      `;

      const [results] = await sequelize.query(query);

      // Transform results to camelCase for frontend
      const vehicles = results.map(v => ({
        id: v.id,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim || null,
        vin: v.vin,
        ourPrice: parseFloat(v.our_price),
        medianMarketPrice: v.market_median ? parseFloat(v.market_median) : null,
        priceDelta: v.price_delta ? parseFloat(v.price_delta) : null,
        priceDeltaPercent: v.price_delta_percent ? parseFloat(v.price_delta_percent) : null,
        position: v.competitive_position || null,
        percentileRank: v.percentile_rank ? parseFloat(v.percentile_rank) : null,
        listingsFound: v.total_listings || 0,
        lastAnalyzed: v.last_analyzed || null,
        daysInMarket: v.days_in_market || 0
      }));

      // Calculate summary statistics
      const analyzedVehicles = results.filter(r => r.last_analyzed);
      const latestAnalysis = analyzedVehicles.length > 0
        ? analyzedVehicles.reduce((latest, v) =>
            new Date(v.last_analyzed) > new Date(latest.last_analyzed) ? v : latest
          ).last_analyzed
        : null;

      const summary = {
        totalVehicles: results.length,
        analyzedVehicles: analyzedVehicles.length,
        competitive: results.filter(r => r.competitive_position === 'competitive').length,
        aboveMarket: results.filter(r => r.competitive_position === 'above_market').length,
        belowMarket: results.filter(r => r.competitive_position === 'below_market').length,
        averagePosition: this.calculateAveragePosition(results),
        lastUpdated: latestAnalysis
      };

      return {
        vehicles,
        summary
      };
    } catch (error) {
      logger.error('Failed to get market overview', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate average percentile position
   */
  calculateAveragePosition(results) {
    const positions = results
      .map(r => r.percentile_rank)
      .filter(p => p !== null);

    if (positions.length === 0) return null;

    const avg = positions.reduce((sum, p) => sum + p, 0) / positions.length;
    return parseFloat(avg.toFixed(2));
  }

  /**
   * Get detailed analysis for specific vehicle
   */
  async getVehicleDetail(vehicleId) {
    try {
      const vehicle = await Inventory.findByPk(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get latest snapshot with metrics
      const query = `
        SELECT
          ms.*,
          mm.our_price,
          mm.price_delta,
          mm.price_delta_percent,
          mm.percentile_rank,
          mm.competitive_position,
          mm.cheaper_count,
          mm.more_expensive_count,
          mm.days_in_market
        FROM market_snapshots ms
        LEFT JOIN market_metrics mm ON mm.snapshot_id = ms.id
        WHERE ms.vehicle_id = $1
        ORDER BY ms.snapshot_date DESC
        LIMIT 1
      `;

      const [snapshots] = await sequelize.query(query, {
        bind: [vehicleId]
      });

      const latestSnapshot = snapshots[0] || null;

      // Get price history
      const priceHistory = await marketDb.getPriceHistory(vehicleId, 30);

      // Get platform tracking
      const platformTracking = await marketDb.getVehiclePlatformTracking(vehicle.vin);

      // Get recent alerts
      const alerts = await marketDb.getVehicleAlerts(vehicleId, 10);

      return {
        vehicle: vehicle.toJSON(),
        latestSnapshot,
        priceHistory,
        platformTracking,
        alerts
      };
    } catch (error) {
      logger.error('Failed to get vehicle detail', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new MarketAnalysisService();
