/**
 * Job Manager
 *
 * Centralized control for all scheduled jobs
 * Manages: Market research, cleanup, storage monitoring
 */

const marketResearchJob = require('./marketResearchJob');
const marketCleanupJob = require('./marketCleanupJob');
const storageMonitoringJob = require('./storageMonitoringJob');
const marketDb = require('../services/marketDatabaseService');
const logger = require('../config/logger');
const parser = require('cron-parser');

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
      const result = await job.run('manual');
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
   * Get next run time from cron schedule
   */
  getNextRunTime(cronSchedule) {
    try {
      const interval = parser.parseExpression(cronSchedule, {
        tz: 'America/Los_Angeles'
      });
      return interval.next().toDate();
    } catch (error) {
      logger.error('Failed to parse cron schedule', {
        schedule: cronSchedule,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get human-readable schedule description
   */
  getHumanReadableSchedule(cronSchedule) {
    const scheduleMap = {
      '0 0 */3 * *': 'Every 3 days at midnight PST',
      '0 3 * * 0': 'Every Sunday at 3 AM PST',
      '0 0 * * *': 'Daily at midnight PST'
    };

    return scheduleMap[cronSchedule] || cronSchedule;
  }

  /**
   * Get status of all jobs
   * Loads from database if not in memory (after server restart)
   */
  async getStatus() {
    const status = {};

    for (const [name, job] of Object.entries(this.jobs)) {
      const jobStatus = job.getStatus();

      // If lastRun is null (server restarted), load from database
      if (!jobStatus.lastRun) {
        const latestExecution = await marketDb.getLatestJobExecution(name);

        if (latestExecution) {
          jobStatus.lastRun = latestExecution.completed_at || latestExecution.started_at;
          jobStatus.lastResult = latestExecution.result_data || {
            success: latestExecution.status === 'success',
            error: latestExecution.error_message,
            duration: latestExecution.duration_ms,
            timestamp: jobStatus.lastRun,
            loadedFromDatabase: true
          };
        }
      }

      // Add next run time and human-readable schedule
      if (jobStatus.schedule) {
        jobStatus.nextRun = this.getNextRunTime(jobStatus.schedule);
        jobStatus.humanReadableSchedule = this.getHumanReadableSchedule(jobStatus.schedule);
      }

      status[name] = jobStatus;
    }

    return status;
  }

  /**
   * Get status of a specific job
   * Loads from database if not in memory (after server restart)
   */
  async getJobStatus(jobName) {
    const job = this.jobs[jobName];

    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    const jobStatus = job.getStatus();

    // If lastRun is null (server restarted), load from database
    if (!jobStatus.lastRun) {
      const latestExecution = await marketDb.getLatestJobExecution(jobName);

      if (latestExecution) {
        jobStatus.lastRun = latestExecution.completed_at || latestExecution.started_at;
        jobStatus.lastResult = latestExecution.result_data || {
          success: latestExecution.status === 'success',
          error: latestExecution.error_message,
          duration: latestExecution.duration_ms,
          timestamp: jobStatus.lastRun,
          loadedFromDatabase: true
        };
      }
    }

    return jobStatus;
  }
}

module.exports = new JobManager();
