/**
 * Storage Monitoring Job
 *
 * Schedule: Daily at midnight PST
 * Process: Check database size, alert if exceeding thresholds
 * Thresholds (user specified):
 * - Warning: 800MB
 * - Critical: 950MB
 * - Railway limit: 1GB
 */

const cron = require('node-cron');
const marketDb = require('../services/marketDatabaseService');
const logger = require('../config/logger');

class StorageMonitoringJob {
  constructor() {
    this.enabled = process.env.MARKET_RESEARCH_ENABLED === 'true';
    this.schedule = '0 0 * * *'; // Daily at midnight
    this.task = null;
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;

    // Thresholds in MB
    this.warningThreshold = 800;
    this.criticalThreshold = 950;
    this.maxLimit = 1024; // 1GB Railway limit
  }

  /**
   * Start the scheduled job
   */
  start() {
    if (!this.enabled) {
      logger.info('Storage monitoring job disabled (MARKET_RESEARCH_ENABLED=false)');
      return;
    }

    logger.info('Starting storage monitoring job', {
      schedule: this.schedule
    });

    this.task = cron.schedule(this.schedule, async () => {
      await this.run();
    }, {
      timezone: 'America/Los_Angeles' // PST/PDT
    });

    logger.info('Storage monitoring job scheduled successfully', {
      schedule: this.schedule,
      timezone: 'America/Los_Angeles'
    });
  }

  /**
   * Stop the scheduled job
   */
  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('Storage monitoring job stopped');
    }
  }

  /**
   * Run the job manually
   */
  async run() {
    if (this.isRunning) {
      logger.warn('Storage monitoring job already running, skipping...');
      return { success: false, message: 'Job already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Storage monitoring job started');

    try {
      // Get storage usage
      const storage = await marketDb.getStorageUsage();

      const totalSizeMB = storage.totalSizeMB;
      const percentUsed = (totalSizeMB / this.maxLimit) * 100;

      // Determine status
      let status = 'healthy';
      let alertLevel = 'info';

      if (totalSizeMB >= this.criticalThreshold) {
        status = 'critical';
        alertLevel = 'critical';
      } else if (totalSizeMB >= this.warningThreshold) {
        status = 'warning';
        alertLevel = 'warning';
      }

      // Log status
      logger.info('Storage status', {
        totalSizeMB,
        percentUsed: percentUsed.toFixed(2),
        status,
        warningThreshold: this.warningThreshold,
        criticalThreshold: this.criticalThreshold,
        maxLimit: this.maxLimit
      });

      // Save metric
      await marketDb.saveSystemMetric(
        'storage_usage',
        'database_size',
        totalSizeMB,
        'MB',
        {
          status,
          percentUsed: parseFloat(percentUsed.toFixed(2)),
          topTables: storage.tables.slice(0, 5)
        }
      );

      // Log warning/critical alerts
      if (status === 'critical') {
        logger.error('CRITICAL: Database storage exceeds critical threshold', {
          totalSizeMB,
          threshold: this.criticalThreshold,
          remaining: this.maxLimit - totalSizeMB
        });
      } else if (status === 'warning') {
        logger.warn('WARNING: Database storage approaching limit', {
          totalSizeMB,
          threshold: this.warningThreshold,
          remaining: this.maxLimit - totalSizeMB
        });
      }

      const duration = Date.now() - startTime;

      this.lastRun = new Date();
      this.lastResult = {
        success: true,
        totalSizeMB,
        percentUsed: parseFloat(percentUsed.toFixed(2)),
        status,
        topTables: storage.tables.slice(0, 5),
        duration,
        timestamp: this.lastRun
      };

      logger.info('Storage monitoring job completed successfully', this.lastResult);

      return this.lastResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Storage monitoring job failed', {
        error: error.message,
        stack: error.stack,
        duration
      });

      this.lastRun = new Date();
      this.lastResult = {
        success: false,
        error: error.message,
        duration,
        timestamp: this.lastRun
      };

      return this.lastResult;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      schedule: this.schedule,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastResult: this.lastResult,
      thresholds: {
        warning: this.warningThreshold,
        critical: this.criticalThreshold,
        max: this.maxLimit
      }
    };
  }
}

module.exports = new StorageMonitoringJob();
