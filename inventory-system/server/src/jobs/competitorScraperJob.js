/**
 * Competitor Scraper Scheduled Job
 *
 * Schedule: Daily at 2 AM PST
 * Process: Scrape all active competitors → Track inventory changes → Update database
 * Results are viewable in the admin dashboard
 */

const cron = require('node-cron');
const { Competitor } = require('../models');
const { queueScrape } = require('../services/competitorScraper');
const marketDb = require('../services/marketDatabaseService');
const logger = require('../config/logger');

class CompetitorScraperJob {
  constructor() {
    this.enabled = process.env.COMPETITOR_SCRAPER_ENABLED !== 'false'; // Enabled by default
    this.schedule = process.env.COMPETITOR_SCRAPER_SCHEDULE || '0 2 * * *'; // Daily at 2 AM PST
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
      logger.info('Competitor scraper job disabled (COMPETITOR_SCRAPER_ENABLED=false)');
      return;
    }

    logger.info('Starting competitor scraper job', {
      schedule: this.schedule
    });

    this.task = cron.schedule(this.schedule, async () => {
      await this.run();
    }, {
      timezone: 'America/Los_Angeles' // PST/PDT
    });

    logger.info('Competitor scraper job scheduled successfully', {
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
      logger.info('Competitor scraper job stopped');
    }
  }

  /**
   * Run the job manually
   */
  async run(triggeredBy = 'scheduled') {
    if (this.isRunning) {
      logger.warn('Competitor scraper job already running, skipping...');
      return { success: false, message: 'Job already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const startedAt = new Date();

    logger.info('Competitor scraper job started');

    try {
      // Get all active competitors
      const competitors = await Competitor.findAll({
        where: { active: true },
        order: [['name', 'ASC']]
      });

      if (competitors.length === 0) {
        logger.info('No active competitors to scrape');

        const completedAt = new Date();
        const duration = Date.now() - startTime;

        this.lastRun = completedAt;
        this.lastResult = {
          success: true,
          message: 'No active competitors',
          competitorsScraped: 0,
          totalAdded: 0,
          totalUpdated: 0,
          totalSold: 0,
          failures: 0,
          duration,
          timestamp: this.lastRun
        };

        await marketDb.saveJobExecution({
          jobName: 'competitorScraper',
          status: 'success',
          startedAt,
          completedAt,
          durationMs: duration,
          resultData: this.lastResult,
          errorMessage: null,
          triggeredBy
        });

        return this.lastResult;
      }

      logger.info(`Found ${competitors.length} active competitor(s) to scrape`);

      // Scrape each competitor sequentially (queue handles memory management)
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      let totalAdded = 0;
      let totalUpdated = 0;
      let totalSold = 0;

      for (const competitor of competitors) {
        try {
          logger.info(`Queueing scrape for: ${competitor.name}`);
          const result = await queueScrape(competitor.id);

          results.push({
            competitorId: competitor.id,
            competitorName: competitor.name,
            success: true,
            added: result.added,
            updated: result.updated,
            sold: result.sold
          });

          successCount++;
          totalAdded += result.added;
          totalUpdated += result.updated;
          totalSold += result.sold;

          logger.info(`Scrape completed for ${competitor.name}:`, {
            added: result.added,
            updated: result.updated,
            sold: result.sold
          });

        } catch (error) {
          logger.error(`Failed to scrape ${competitor.name}:`, {
            error: error.message,
            stack: error.stack
          });

          results.push({
            competitorId: competitor.id,
            competitorName: competitor.name,
            success: false,
            error: error.message
          });

          failureCount++;
        }

        // Small delay between competitors to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const completedAt = new Date();
      const duration = Date.now() - startTime;

      this.lastRun = completedAt;
      this.lastResult = {
        success: true,
        competitorsScraped: successCount,
        totalAdded,
        totalUpdated,
        totalSold,
        failures: failureCount,
        details: results,
        duration,
        timestamp: this.lastRun
      };

      // Save to database
      await marketDb.saveJobExecution({
        jobName: 'competitorScraper',
        status: successCount > 0 ? 'success' : 'partial',
        startedAt,
        completedAt,
        durationMs: duration,
        resultData: this.lastResult,
        errorMessage: failureCount > 0 ? `${failureCount} competitor(s) failed` : null,
        triggeredBy
      });

      logger.info('Competitor scraper job completed', {
        competitorsScraped: successCount,
        totalVehiclesAdded: totalAdded,
        totalVehiclesUpdated: totalUpdated,
        totalVehiclesSold: totalSold,
        failures: failureCount,
        duration: `${Math.round(duration / 1000)}s`
      });

      return this.lastResult;

    } catch (error) {
      const completedAt = new Date();
      const duration = Date.now() - startTime;

      logger.error('Competitor scraper job failed', {
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
        jobName: 'competitorScraper',
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

module.exports = new CompetitorScraperJob();
