/**
 * Market Research Scheduled Job
 *
 * Schedule: Every 3 days at midnight PST
 * Process: Analyze all vehicles → Detect alerts → Store in database
 * Alerts are viewable in the admin dashboard (no email notifications)
 * User specified: 20 vehicles × 1 token every 3 days = ~200 tokens/month
 */

const cron = require('node-cron');
const marketAnalysisService = require('../services/marketAnalysisService');
const marketAlertService = require('../services/marketAlertService');
const marketDb = require('../services/marketDatabaseService');
const logger = require('../config/logger');

class MarketResearchJob {
  constructor() {
    this.enabled = process.env.MARKET_RESEARCH_ENABLED === 'true';
    this.schedule = process.env.MARKET_RESEARCH_SCHEDULE || '0 0 */3 * *'; // Every 3 days at midnight
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
      logger.info('Market research job disabled (MARKET_RESEARCH_ENABLED=false)');
      return;
    }

    logger.info('Starting market research job', {
      schedule: this.schedule
    });

    this.task = cron.schedule(this.schedule, async () => {
      await this.run();
    }, {
      timezone: 'America/Los_Angeles' // PST/PDT
    });

    logger.info('Market research job scheduled successfully', {
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
      logger.info('Market research job stopped');
    }
  }

  /**
   * Run the job manually
   */
  async run(triggeredBy = 'scheduled') {
    if (this.isRunning) {
      logger.warn('Market research job already running, skipping...');
      return { success: false, message: 'Job already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const startedAt = new Date();

    logger.info('Market research job started');

    try {
      // Step 1: Analyze all vehicles
      logger.info('Analyzing all vehicles...');
      const analysisResults = await marketAnalysisService.analyzeAllVehicles();

      const successCount = analysisResults.filter(r => r.success).length;
      const failureCount = analysisResults.filter(r => !r.success).length;

      logger.info('Vehicle analysis complete', {
        total: analysisResults.length,
        success: successCount,
        failures: failureCount
      });

      // Step 2: Detect alerts for each analyzed vehicle
      logger.info('Detecting alerts...');
      const allAlerts = [];

      for (const result of analysisResults) {
        if (result.success) {
          const alerts = await marketAlertService.detectAlerts(result.vehicleId, result.result);
          allAlerts.push(...alerts);
        }
      }

      logger.info('Alert detection complete', {
        alertsDetected: allAlerts.length
      });

      // Alerts are now stored in database and viewable in admin dashboard
      logger.info('Market research analysis complete', {
        vehiclesAnalyzed: successCount,
        failures: failureCount,
        alertsDetected: allAlerts.length
      });

      const completedAt = new Date();
      const duration = Date.now() - startTime;

      this.lastRun = completedAt;
      this.lastResult = {
        success: true,
        vehiclesAnalyzed: successCount,
        failures: failureCount,
        alertsDetected: allAlerts.length,
        duration,
        timestamp: this.lastRun
      };

      // Save to database
      await marketDb.saveJobExecution({
        jobName: 'marketResearch',
        status: 'success',
        startedAt,
        completedAt,
        durationMs: duration,
        resultData: this.lastResult,
        errorMessage: null,
        triggeredBy
      });

      logger.info('Market research job completed successfully', this.lastResult);

      return this.lastResult;
    } catch (error) {
      const completedAt = new Date();
      const duration = Date.now() - startTime;

      logger.error('Market research job failed', {
        error: error.message,
        stack: error.stack,
        duration
      });

      this.lastRun = completedAt;
      this.lastResult = {
        success: false,
        error: error.message,
        duration,
        timestamp: this.lastRun
      };

      // Save to database
      await marketDb.saveJobExecution({
        jobName: 'marketResearch',
        status: 'failed',
        startedAt,
        completedAt,
        durationMs: duration,
        resultData: null,
        errorMessage: error.message,
        triggeredBy
      });

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

module.exports = new MarketResearchJob();
