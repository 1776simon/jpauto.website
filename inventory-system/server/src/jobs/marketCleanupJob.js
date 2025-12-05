/**
 * Market Data Cleanup Job
 *
 * Schedule: Every Sunday at 3 AM PST
 * Process: Delete snapshots older than 6 months (180 days)
 * User specified: 6-month retention
 */

const cron = require('node-cron');
const marketDb = require('../services/marketDatabaseService');
const logger = require('../config/logger');

class MarketCleanupJob {
  constructor() {
    this.enabled = process.env.MARKET_RESEARCH_ENABLED === 'true';
    this.schedule = '0 3 * * 0'; // Every Sunday at 3 AM
    this.task = null;
    this.isRunning = false;
    this.lastRun = null;
    this.lastResult = null;
  }

  /**
   * Start the scheduled job
   */
  start() {
    if (!this.enabled) {
      logger.info('Market cleanup job disabled (MARKET_RESEARCH_ENABLED=false)');
      return;
    }

    logger.info('Starting market cleanup job', {
      schedule: this.schedule
    });

    this.task = cron.schedule(this.schedule, async () => {
      await this.run();
    }, {
      timezone: 'America/Los_Angeles' // PST/PDT
    });

    logger.info('Market cleanup job scheduled successfully', {
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
      logger.info('Market cleanup job stopped');
    }
  }

  /**
   * Run the job manually
   */
  async run() {
    if (this.isRunning) {
      logger.warn('Market cleanup job already running, skipping...');
      return { success: false, message: 'Job already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('Market cleanup job started');

    try {
      // Clean up old snapshots
      const deletedCount = await marketDb.cleanupOldSnapshots();

      const duration = Date.now() - startTime;

      this.lastRun = new Date();
      this.lastResult = {
        success: true,
        deletedSnapshots: deletedCount,
        duration,
        timestamp: this.lastRun
      };

      logger.info('Market cleanup job completed successfully', this.lastResult);

      return this.lastResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Market cleanup job failed', {
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
      lastResult: this.lastResult
    };
  }
}

module.exports = new MarketCleanupJob();
