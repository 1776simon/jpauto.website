/**
 * Migration: Add Alert Dismiss Feature and Job Execution History
 *
 * Changes:
 * 1. Add dismissed and dismissed_at columns to market_alerts table
 * 2. Create job_execution_history table for persistent job tracking
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add dismissed columns to market_alerts
    await queryInterface.addColumn('market_alerts', 'dismissed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this alert has been dismissed by user'
    });

    await queryInterface.addColumn('market_alerts', 'dismissed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the alert was dismissed'
    });

    // Add index for dismissed field (for filtering)
    await queryInterface.addIndex('market_alerts', ['dismissed']);

    // 2. Create job_execution_history table
    await queryInterface.createTable('job_execution_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      job_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the job (marketResearch, marketCleanup, storageMonitoring)'
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'success / failed / running'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Execution duration in milliseconds'
      },
      result_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Job execution results and metadata'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if job failed'
      },
      triggered_by: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'scheduled',
        comment: 'scheduled / manual / api'
      }
    });

    // Add indexes for job_execution_history
    await queryInterface.addIndex('job_execution_history', ['job_name']);
    await queryInterface.addIndex('job_execution_history', ['status']);
    await queryInterface.addIndex('job_execution_history', ['started_at']);
    await queryInterface.addIndex('job_execution_history', ['job_name', 'started_at']);

    console.log('✅ Successfully added alert dismiss feature and job execution history tracking');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop job_execution_history table
    await queryInterface.dropTable('job_execution_history');

    // Remove indexes from market_alerts
    await queryInterface.removeIndex('market_alerts', ['dismissed']);

    // Remove columns from market_alerts
    await queryInterface.removeColumn('market_alerts', 'dismissed_at');
    await queryInterface.removeColumn('market_alerts', 'dismissed');

    console.log('✅ Successfully rolled back alert dismiss and job history changes');
  }
};
