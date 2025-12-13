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
  async updatePriceHistory(vehicleId, medianPrice) {
    try {
      // Get historical data for cumulative calculations
      const [history] = await sequelize.query(`
        SELECT date, median_price
        FROM market_price_history
        WHERE vehicle_id = $1
        ORDER BY date DESC
        LIMIT 30
      `, {
        bind: [vehicleId]
      });

      const today = new Date().toISOString().split('T')[0];

      // Calculate cumulative changes
      const changes = this.calculateCumulativeChanges(history, medianPrice);

      // Insert or update today's record
      await sequelize.query(`
        INSERT INTO market_price_history (
          vehicle_id,
          date,
          median_price,
          change_1week,
          change_2week,
          change_1month,
          alert_sent_1week,
          alert_sent_2week,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, false, NOW())
        ON CONFLICT (vehicle_id, date)
        DO UPDATE SET
          median_price = $3,
          change_1week = $4,
          change_2week = $5,
          change_1month = $6,
          created_at = NOW()
      `, {
        bind: [
          vehicleId,
          today,
          medianPrice,
          changes.change1Week,
          changes.change2Week,
          changes.change1Month
        ]
      });

      logger.info('Price history updated', {
        vehicleId,
        medianPrice,
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
   * Get pending alerts (not emailed)
   */
  async getPendingAlerts() {
    try {
      const [alerts] = await sequelize.query(`
        SELECT
          a.*,
          i.year,
          i.make,
          i.model,
          i.trim,
          i.vin,
          i.price
        FROM market_alerts a
        JOIN inventory i ON i.id = a.vehicle_id
        WHERE a.emailed = false
        ORDER BY a.severity DESC, a.created_at DESC
      `);

      return alerts;
    } catch (error) {
      logger.error('Failed to get pending alerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Mark alerts as emailed
   */
  async markAlertsAsEmailed(alertIds) {
    if (!alertIds || alertIds.length === 0) return;

    try {
      await sequelize.query(`
        UPDATE market_alerts
        SET emailed = true, emailed_at = NOW()
        WHERE id = ANY($1::int[])
      `, {
        bind: [alertIds]
      });

      logger.info('Alerts marked as emailed', {
        count: alertIds.length
      });
    } catch (error) {
      logger.error('Failed to mark alerts as emailed', {
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
}

module.exports = new MarketDatabaseService();
