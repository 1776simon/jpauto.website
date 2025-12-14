/**
 * Market Database Service
 *
 * Database operations for market research data
 * Handles: Snapshots, metrics, alerts, platform tracking, price history, cleanup, storage monitoring
 */

const { sequelize } = require('../models');
const logger = require('../config/logger');

class MarketDatabaseService {
  /**
   * Save market snapshot
   */
  async saveMarketSnapshot(data) {
    const {
      vehicleId,
      searchParams,
      listingsData,
      totalListings,
      uniqueListings,
      medianPrice,
      averagePrice,
      minPrice,
      maxPrice
    } = data;

    try {
      const [snapshot] = await sequelize.query(`
        INSERT INTO market_snapshots (
          vehicle_id,
          search_params,
          listings_data,
          total_listings,
          unique_listings,
          median_price,
          average_price,
          min_price,
          max_price,
          snapshot_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, {
        bind: [
          vehicleId,
          JSON.stringify(searchParams),
          JSON.stringify(listingsData),
          totalListings,
          uniqueListings,
          medianPrice,
          averagePrice,
          minPrice,
          maxPrice
        ]
      });

      logger.info('Market snapshot saved', {
        snapshotId: snapshot[0].id,
        vehicleId,
        listings: uniqueListings
      });

      return snapshot[0];
    } catch (error) {
      logger.error('Failed to save market snapshot', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save market metrics
   */
  async saveMarketMetrics(data) {
    const {
      snapshotId,
      vehicleId,
      ourPrice,
      priceDelta,
      priceDeltaPercent,
      percentileRank,
      cheaperCount,
      moreExpensiveCount,
      competitivePosition,
      daysInMarket
    } = data;

    try {
      const [metrics] = await sequelize.query(`
        INSERT INTO market_metrics (
          snapshot_id,
          vehicle_id,
          our_price,
          price_delta,
          price_delta_percent,
          percentile_rank,
          cheaper_count,
          more_expensive_count,
          competitive_position,
          days_in_market,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `, {
        bind: [
          snapshotId,
          vehicleId,
          ourPrice,
          priceDelta,
          priceDeltaPercent,
          percentileRank,
          cheaperCount,
          moreExpensiveCount,
          competitivePosition,
          daysInMarket
        ]
      });

      logger.info('Market metrics saved', {
        metricsId: metrics[0].id,
        vehicleId,
        position: competitivePosition
      });

      return metrics[0];
    } catch (error) {
      logger.error('Failed to save market metrics', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save or update platform tracking
   */
  async saveMarketPlatformTracking(platformDataArray) {
    if (!platformDataArray || platformDataArray.length === 0) {
      return;
    }

    try {
      for (const data of platformDataArray) {
        const { vin, platform, isOwnVehicle, price, dealerName, listingUrl } = data;

        await sequelize.query(`
          INSERT INTO market_platform_tracking (
            vin,
            platform,
            is_own_vehicle,
            price,
            dealer_name,
            listing_url,
            first_seen,
            last_seen,
            times_seen,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), 1, NOW(), NOW())
          ON CONFLICT (vin, platform)
          DO UPDATE SET
            price = $4,
            dealer_name = $5,
            listing_url = $6,
            last_seen = NOW(),
            times_seen = market_platform_tracking.times_seen + 1,
            updated_at = NOW()
        `, {
          bind: [vin, platform, isOwnVehicle, price, dealerName, listingUrl]
        });
      }

      logger.info('Platform tracking updated', {
        count: platformDataArray.length,
        ownVehicles: platformDataArray.filter(d => d.isOwnVehicle).length
      });
    } catch (error) {
      logger.error('Failed to save platform tracking', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update price history with cumulative changes
   */
  async updatePriceHistory(vehicleId, priceStats) {
    try {
      const { median, min, max } = priceStats;

      // Ensure we have valid values
      if (!median || !min || !max) {
        logger.warn('Skipping price history update - missing price data', {
          vehicleId,
          median,
          min,
          max
        });
        return;
      }

      // Get historical data for cumulative calculations
      const [history] = await sequelize.query(`
        SELECT date, median_price, min_price
        FROM market_price_history
        WHERE vehicle_id = $1
        ORDER BY date DESC
        LIMIT 30
      `, {
        bind: [vehicleId]
      });

      const today = new Date().toISOString().split('T')[0];

      // Calculate cumulative changes
      const changes = this.calculateCumulativeChanges(history, median);

      // Insert or update today's record
      await sequelize.query(`
        INSERT INTO market_price_history (
          vehicle_id,
          date,
          median_price,
          min_price,
          max_price,
          change_1week,
          change_2week,
          change_1month,
          alert_sent_1week,
          alert_sent_2week,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, NOW())
        ON CONFLICT (vehicle_id, date)
        DO UPDATE SET
          median_price = $3,
          min_price = $4,
          max_price = $5,
          change_1week = $6,
          change_2week = $7,
          change_1month = $8,
          created_at = NOW()
      `, {
        bind: [
          vehicleId,
          today,
          median,
          min,
          max,
          changes.change1Week,
          changes.change2Week,
          changes.change1Month
        ]
      });

      logger.info('Price history updated', {
        vehicleId,
        median,
        min,
        max,
        changes
      });
    } catch (error) {
      logger.error('Failed to update price history', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate cumulative price changes
   */
  calculateCumulativeChanges(history, currentPrice) {
    const today = new Date();

    const findPriceAtDate = (daysAgo) => {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysAgo);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const record = history.find(h => h.date === targetDateStr);
      return record ? parseFloat(record.median_price) : null;
    };

    const price1WeekAgo = findPriceAtDate(7);
    const price2WeekAgo = findPriceAtDate(14);
    const price1MonthAgo = findPriceAtDate(30);

    return {
      change1Week: price1WeekAgo ? parseFloat((currentPrice - price1WeekAgo).toFixed(2)) : null,
      change2Week: price2WeekAgo ? parseFloat((currentPrice - price2WeekAgo).toFixed(2)) : null,
      change1Month: price1MonthAgo ? parseFloat((currentPrice - price1MonthAgo).toFixed(2)) : null
    };
  }

  /**
   * Get price history for a vehicle
   */
  async getPriceHistory(vehicleId, days = 30) {
    try {
      const [history] = await sequelize.query(`
        SELECT
          date,
          median_price,
          min_price,
          max_price,
          change_1week,
          change_2week,
          change_1month
        FROM market_price_history
        WHERE vehicle_id = $1
        ORDER BY date DESC
        LIMIT $2
      `, {
        bind: [vehicleId, days]
      });

      return history;
    } catch (error) {
      logger.error('Failed to get price history', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get platform tracking for a VIN
   */
  async getVehiclePlatformTracking(vin) {
    if (!vin) return [];

    try {
      const [tracking] = await sequelize.query(`
        SELECT *
        FROM market_platform_tracking
        WHERE vin = $1
        ORDER BY last_seen DESC
      `, {
        bind: [vin]
      });

      return tracking;
    } catch (error) {
      logger.error('Failed to get platform tracking', {
        vin,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save alert
   */
  async saveAlert(data) {
    const {
      vehicleId,
      snapshotId,
      alertType,
      severity,
      title,
      message,
      alertData
    } = data;

    try {
      const [alert] = await sequelize.query(`
        INSERT INTO market_alerts (
          vehicle_id,
          snapshot_id,
          alert_type,
          severity,
          title,
          message,
          alert_data,
          emailed,
          resolved,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, NOW())
        RETURNING *
      `, {
        bind: [
          vehicleId,
          snapshotId,
          alertType,
          severity,
          title,
          message,
          JSON.stringify(alertData || {})
        ]
      });

      logger.info('Alert saved', {
        alertId: alert[0].id,
        vehicleId,
        type: alertType,
        severity
      });

      return alert[0];
    } catch (error) {
      logger.error('Failed to save alert', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get vehicle alerts
   */
  async getVehicleAlerts(vehicleId, limit = 10) {
    try {
      const [alerts] = await sequelize.query(`
        SELECT *
        FROM market_alerts
        WHERE vehicle_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, {
        bind: [vehicleId, limit]
      });

      return alerts;
    } catch (error) {
      logger.error('Failed to get vehicle alerts', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }


  /**
   * Clean up old snapshots (6 months retention)
   */
  async cleanupOldSnapshots() {
    const retentionDays = parseInt(process.env.MARKET_SNAPSHOT_RETENTION_DAYS) || 180;

    try {
      const [result] = await sequelize.query(`
        DELETE FROM market_snapshots
        WHERE snapshot_date < NOW() - INTERVAL '${retentionDays} days'
      `);

      const deletedCount = result.rowCount || 0;

      logger.info('Cleanup complete', {
        deletedSnapshots: deletedCount,
        retentionDays
      });

      return deletedCount;
    } catch (error) {
      logger.error('Cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up old alerts (6 months retention)
   */
  async cleanupOldAlerts() {
    const retentionDays = parseInt(process.env.MARKET_SNAPSHOT_RETENTION_DAYS) || 180;

    try {
      const [result] = await sequelize.query(`
        DELETE FROM market_alerts
        WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
      `);

      const deletedCount = result.rowCount || 0;

      logger.info('Alert cleanup complete', {
        deletedAlerts: deletedCount,
        retentionDays
      });

      return deletedCount;
    } catch (error) {
      logger.error('Alert cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up old VIN evaluation cache entries
   * Retention: 1 week (7 days)
   */
  async cleanupOldVinEvaluations() {
    const retentionDays = 7; // 1 week retention for VIN evaluation cache

    try {
      const [result] = await sequelize.query(`
        DELETE FROM vin_evaluation_cache
        WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
      `);

      const deletedCount = result.rowCount || 0;

      logger.info('VIN evaluation cache cleanup complete', {
        deletedEntries: deletedCount,
        retentionDays
      });

      return deletedCount;
    } catch (error) {
      logger.error('VIN evaluation cache cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage() {
    try {
      const [dbSize] = await sequelize.query(`
        SELECT pg_database_size(current_database()) as total_size
      `);

      const [tableSizes] = await sequelize.query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `);

      const totalSizeBytes = parseInt(dbSize[0].total_size);
      const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

      return {
        totalSizeBytes,
        totalSizeMB: parseFloat(totalSizeMB),
        tables: tableSizes
      };
    } catch (error) {
      logger.error('Failed to get storage usage', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save system metric
   */
  async saveSystemMetric(metricType, metricName, metricValue, metricUnit, metricData = null) {
    try {
      await sequelize.query(`
        INSERT INTO system_metrics (
          metric_type,
          metric_name,
          metric_value,
          metric_unit,
          metric_data,
          recorded_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, {
        bind: [
          metricType,
          metricName,
          metricValue,
          metricUnit,
          metricData ? JSON.stringify(metricData) : null
        ]
      });
    } catch (error) {
      logger.error('Failed to save system metric', {
        metricType,
        metricName,
        error: error.message
      });
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId) {
    try {
      await sequelize.query(`
        UPDATE market_alerts
        SET dismissed = true, dismissed_at = NOW()
        WHERE id = $1
      `, {
        bind: [alertId]
      });

      logger.info('Alert dismissed', { alertId });
    } catch (error) {
      logger.error('Failed to dismiss alert', {
        alertId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Dismiss multiple alerts
   */
  async dismissAlerts(alertIds) {
    if (!alertIds || alertIds.length === 0) return;

    try {
      await sequelize.query(`
        UPDATE market_alerts
        SET dismissed = true, dismissed_at = NOW()
        WHERE id = ANY($1::int[])
      `, {
        bind: [alertIds]
      });

      logger.info('Alerts dismissed', { count: alertIds.length });
    } catch (error) {
      logger.error('Failed to dismiss alerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save job execution history
   */
  async saveJobExecution(data) {
    const {
      jobName,
      status,
      startedAt,
      completedAt,
      durationMs,
      resultData,
      errorMessage,
      triggeredBy
    } = data;

    try {
      const [execution] = await sequelize.query(`
        INSERT INTO job_execution_history (
          job_name,
          status,
          started_at,
          completed_at,
          duration_ms,
          result_data,
          error_message,
          triggered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, {
        bind: [
          jobName,
          status,
          startedAt,
          completedAt,
          durationMs,
          resultData ? JSON.stringify(resultData) : null,
          errorMessage,
          triggeredBy || 'scheduled'
        ]
      });

      logger.info('Job execution saved', {
        executionId: execution[0].id,
        jobName,
        status
      });

      return execution[0];
    } catch (error) {
      logger.error('Failed to save job execution', {
        jobName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get latest job execution for a specific job
   */
  async getLatestJobExecution(jobName) {
    try {
      const [executions] = await sequelize.query(`
        SELECT *
        FROM job_execution_history
        WHERE job_name = $1 AND status != 'running'
        ORDER BY started_at DESC
        LIMIT 1
      `, {
        bind: [jobName]
      });

      return executions.length > 0 ? executions[0] : null;
    } catch (error) {
      logger.error('Failed to get latest job execution', {
        jobName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get job execution history
   */
  async getJobExecutionHistory(jobName, limit = 10) {
    try {
      const [executions] = await sequelize.query(`
        SELECT *
        FROM job_execution_history
        WHERE job_name = $1
        ORDER BY started_at DESC
        LIMIT $2
      `, {
        bind: [jobName, limit]
      });

      return executions;
    } catch (error) {
      logger.error('Failed to get job execution history', {
        jobName,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get detailed market analysis for a vehicle
   * Returns: price trends, platform distribution, DOM analysis, listings
   */
  async getVehicleMarketDetail(vehicleId) {
    try {
      // Get latest snapshot with full listings data
      const [latestSnapshot] = await sequelize.query(`
        SELECT
          id,
          listings_data,
          unique_listings,
          median_price,
          min_price,
          max_price,
          snapshot_date
        FROM market_snapshots
        WHERE vehicle_id = $1
        ORDER BY snapshot_date DESC
        LIMIT 1
      `, {
        bind: [vehicleId]
      });

      if (!latestSnapshot || latestSnapshot.length === 0) {
        return {
          hasMarketData: false,
          message: 'No market data available for this vehicle'
        };
      }

      const snapshot = latestSnapshot[0];

      // Parse listings_data if it's a string
      let listings = [];
      if (snapshot.listings_data) {
        listings = typeof snapshot.listings_data === 'string'
          ? JSON.parse(snapshot.listings_data)
          : snapshot.listings_data;
      }

      // Get all VINs from listings
      const vins = listings
        .map(l => l.vehicle?.vin || l.vin)
        .filter(v => v);

      logger.info('Querying platform tracking for VINs', {
        vehicleId,
        vinCount: vins.length,
        sampleVins: vins.slice(0, 3)
      });

      // Get platform tracking data for these VINs
      const [platformTracking] = vins.length > 0 ? await sequelize.query(`
        SELECT vin, platform, listing_url, price, dealer_name
        FROM market_platform_tracking
        WHERE vin = ANY($1::text[])
        ORDER BY vin, platform
      `, {
        bind: [vins]
      }) : [[]];

      logger.info('Platform tracking results', {
        vehicleId,
        platformCount: platformTracking.length,
        samplePlatform: platformTracking[0] || null
      });

      // Group platforms by VIN
      const platformsByVin = {};
      platformTracking.forEach(track => {
        if (!platformsByVin[track.vin]) {
          platformsByVin[track.vin] = [];
        }
        platformsByVin[track.vin].push({
          name: track.platform,
          url: track.listing_url,
          price: parseFloat(track.price || 0),
          dealer: track.dealer_name
        });
      });

      // Merge platform data into listings
      listings = listings.map(listing => {
        const vin = listing.vehicle?.vin || listing.vin;
        return {
          ...listing,
          sources: platformsByVin[vin] || []
        };
      });

      // Get price history (30 days)
      const priceHistory = await this.getPriceHistory(vehicleId, 30);

      // Calculate platform distribution
      const platformDistribution = this.calculatePlatformDistribution(listings);

      // Calculate days on market
      const domAnalysis = this.calculateDaysOnMarket(listings);

      // Prepare individual listings with enhanced data
      const competitorListings = this.prepareCompetitorListings(listings);

      // Calculate market velocity indicators
      const marketVelocity = this.calculateMarketVelocity(priceHistory, domAnalysis);

      return {
        hasMarketData: true,
        snapshot: {
          date: snapshot.snapshot_date,
          uniqueListings: snapshot.unique_listings,
          medianPrice: parseFloat(snapshot.median_price || 0),
          minPrice: parseFloat(snapshot.min_price || 0),
          maxPrice: parseFloat(snapshot.max_price || 0)
        },
        priceHistory: priceHistory.reverse(), // Oldest first for charts
        platformDistribution,
        domAnalysis,
        competitorListings,
        marketVelocity
      };
    } catch (error) {
      logger.error('Failed to get vehicle market detail', {
        vehicleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate platform distribution from listings
   */
  calculatePlatformDistribution(listings) {
    const platformCounts = {};
    const vinsByPlatform = {};
    const crossPostingMatrix = {};

    listings.forEach(listing => {
      const vin = listing.vehicle?.vin || listing.vin;
      const price = listing.retailListing?.price || listing.price || 0;
      const platforms = listing.sources || [];

      if (!vin) return; // Skip if no VIN

      // Track VIN's platforms
      if (!crossPostingMatrix[vin]) {
        crossPostingMatrix[vin] = {
          vin: vin.slice(-4),
          platforms: [],
          price
        };
      }

      platforms.forEach(source => {
        const platform = source.name || source || 'Unknown';

        // Count platforms
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;

        // Track VINs per platform
        if (!vinsByPlatform[platform]) {
          vinsByPlatform[platform] = new Set();
        }
        vinsByPlatform[platform].add(vin);

        // Add to cross-posting matrix
        if (!crossPostingMatrix[vin].platforms.includes(platform)) {
          crossPostingMatrix[vin].platforms.push(platform);
        }
      });
    });

    // Convert to arrays
    const distribution = Object.entries(platformCounts).map(([name, count]) => ({
      platform: name,
      listingCount: count,
      uniqueVINs: vinsByPlatform[name].size
    })).sort((a, b) => b.listingCount - a.listingCount);

    const matrix = Object.values(crossPostingMatrix);

    return {
      distribution,
      crossPostingMatrix: matrix,
      totalPlatforms: Object.keys(platformCounts).length
    };
  }

  /**
   * Calculate days on market statistics
   */
  calculateDaysOnMarket(listings) {
    const domValues = [];
    const today = new Date();

    listings.forEach(listing => {
      const listedDate = listing.retailListing?.listedDate || listing.listedDate;
      const vin = listing.vehicle?.vin || listing.vin;
      const price = listing.retailListing?.price || listing.price || 0;

      if (listedDate && vin) {
        const listedDateObj = new Date(listedDate);
        const days = Math.floor((today - listedDateObj) / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          domValues.push({
            vin: vin.slice(-4),
            days,
            price
          });
        }
      }
    });

    if (domValues.length === 0) {
      return {
        average: null,
        min: null,
        max: null,
        histogram: [],
        listings: []
      };
    }

    const days = domValues.map(v => v.days);
    const average = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    const min = Math.min(...days);
    const max = Math.max(...days);

    // Create histogram buckets
    const histogram = [
      { range: '0-30 days', count: days.filter(d => d <= 30).length },
      { range: '31-60 days', count: days.filter(d => d > 30 && d <= 60).length },
      { range: '61-90 days', count: days.filter(d => d > 60 && d <= 90).length },
      { range: '90+ days', count: days.filter(d => d > 90).length }
    ];

    return {
      average,
      min,
      max,
      histogram,
      listings: domValues.sort((a, b) => a.days - b.days)
    };
  }

  /**
   * Prepare competitor listings with enhanced data
   */
  prepareCompetitorListings(listings) {
    return listings.map(listing => {
      const vin = listing.vehicle?.vin || listing.vin;

      // Extract price with multiple fallbacks
      let price = 0;
      if (listing.retailListing?.price && listing.retailListing.price > 0) {
        price = listing.retailListing.price;
      } else if (listing.price && listing.price > 0) {
        price = listing.price;
      } else if (listing.sources && listing.sources.length > 0) {
        // Try to get price from sources
        const sourcePrices = listing.sources
          .map(s => s.price)
          .filter(p => p && p > 0);
        if (sourcePrices.length > 0) {
          price = Math.min(...sourcePrices); // Use lowest price
        }
      }

      const mileage = listing.retailListing?.miles || listing.mileage;
      const trim = listing.vehicle?.trim || listing.trim || 'Base';
      const city = listing.retailListing?.city || listing.location?.city || 'Unknown';
      const dealer = listing.retailListing?.dealer || listing.retailListing?.dealerName || listing.dealerName || 'Private';
      const sources = listing.sources || [];

      return {
        vinLast4: vin ? vin.slice(-4) : 'N/A',
        vin,
        price,
        mileage,
        trim,
        location: city,
        dealer,
        platforms: sources.map(s => s.name || s).join(', '),
        platformCount: sources.length,
        url: listing.retailListing?.vdp || listing.retailListing?.vdpUrl || listing.url || null
      };
    }).sort((a, b) => a.price - b.price);
  }

  /**
   * Calculate market velocity indicators
   */
  calculateMarketVelocity(priceHistory, domAnalysis) {
    if (!priceHistory || priceHistory.length < 2) {
      return {
        trend: 'unknown',
        message: 'Insufficient data to determine market velocity'
      };
    }

    // Get recent price changes (last 2 weeks)
    const recentHistory = priceHistory.slice(-14);
    const twoWeeksAgo = recentHistory[0];
    const latest = recentHistory[recentHistory.length - 1];

    if (!twoWeeksAgo || !latest) {
      return {
        trend: 'unknown',
        message: 'Insufficient price history'
      };
    }

    const minPriceChange = twoWeeksAgo.min_price && latest.min_price
      ? ((latest.min_price - twoWeeksAgo.min_price) / twoWeeksAgo.min_price) * 100
      : 0;

    const medianPriceChange = twoWeeksAgo.median_price && latest.median_price
      ? ((latest.median_price - twoWeeksAgo.median_price) / twoWeeksAgo.median_price) * 100
      : 0;

    // Determine market type
    let trend = 'stable';
    let message = '';

    if (minPriceChange < -5 || medianPriceChange < -5) {
      trend = 'buyers_market';
      message = `⚠️ BUYER'S MARKET - Min price dropping ${Math.abs(minPriceChange).toFixed(1)}% over 2 weeks`;

      if (domAnalysis.average > 40) {
        message += `. Average DOM: ${domAnalysis.average} days (slow market). Recommendation: Price competitively at or below $${latest.min_price?.toLocaleString()} for quick sale.`;
      }
    } else if (minPriceChange > 5 || medianPriceChange > 5) {
      trend = 'sellers_market';
      message = `✅ SELLER'S MARKET - Prices rising ${minPriceChange.toFixed(1)}% over 2 weeks`;

      if (domAnalysis.average < 25) {
        message += `. Average DOM: ${domAnalysis.average} days (fast market). Recommendation: Hold current pricing or increase.`;
      }
    } else {
      trend = 'stable';
      message = `📊 STABLE MARKET - Prices holding steady. Average DOM: ${domAnalysis.average || 'N/A'} days.`;
    }

    return {
      trend,
      message,
      minPriceChange: minPriceChange.toFixed(2),
      medianPriceChange: medianPriceChange.toFixed(2),
      averageDom: domAnalysis.average
    };
  }
}

module.exports = new MarketDatabaseService();
