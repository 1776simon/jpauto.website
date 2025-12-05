/**
 * Job Manager
 *
 * Centralized control for all scheduled jobs
 * Manages: Market research, cleanup, storage monitoring
 */

const marketResearchJob = require('./marketResearchJob');
const marketCleanupJob = require('./marketCleanupJob');
const storageMonitoringJob = require('./storageMonitoringJob');
const logger = require('../config/logger');

class JobManager {
  constructor() {
    this.jobs = {
      marketResearch: marketResearchJob,
      marketCleanup: marketCleanupJob,
      storageMonitoring: storageMonitoringJob
    };
  }

  /**
   * Start all jobs
   */
  startAll() {
    logger.info('Starting all scheduled jobs...');

    Object.entries(this.jobs).forEach(([name, job]) => {
      try {
        job.start();
        logger.info(`Job started: ${name}`);
      } catch (error) {
        logger.error(`Failed to start job: ${name}`, {
          error: error.message
        });
      }
    });

    logger.info('All jobs started successfully');
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    logger.info('Stopping all scheduled jobs...');

    Object.entries(this.jobs).forEach(([name, job]) => {
      try {
        job.stop();
        logger.info(`Job stopped: ${name}`);
      } catch (error) {
        logger.error(`Failed to stop job: ${name}`, {
          error: error.message
        });
      }
    });

    logger.info('All jobs stopped');
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobName) {
    const job = this.jobs[jobName];

    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    logger.info(`Manually triggering job: ${jobName}`);

    try {
      const result = await job.run();
      logger.info(`Job completed: ${jobName}`, result);
      return result;
    } catch (error) {
      logger.error(`Job failed: ${jobName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status = {};

    Object.entries(this.jobs).forEach(([name, job]) => {
      status[name] = job.getStatus();
    });

    return status;
  }

  /**
   * Get status of a specific job
   */
  getJobStatus(jobName) {
    const job = this.jobs[jobName];

    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    return job.getStatus();
  }
}

module.exports = new JobManager();
