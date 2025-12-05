/**
 * Migration: Create Market Research Tables
 *
 * Creates 6 tables for market research functionality:
 * 1. market_snapshots - Full listing data and price stats
 * 2. market_metrics - Computed metrics per snapshot
 * 3. market_alerts - Alert history with email tracking
 * 4. market_platform_tracking - Track VIN appearances across platforms
 * 5. market_price_history - Cumulative price changes with alert flags
 * 6. system_metrics - Storage monitoring and system health
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Market Snapshots Table
    await queryInterface.createTable('market_snapshots', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      search_params: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Search parameters used for this snapshot'
      },
      listings_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Full array of market listings'
      },
      total_listings: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      unique_listings: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      median_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      average_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      min_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      max_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      snapshot_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for market_snapshots
    await queryInterface.addIndex('market_snapshots', ['vehicle_id']);
    await queryInterface.addIndex('market_snapshots', ['snapshot_date']);
    await queryInterface.addIndex('market_snapshots', ['vehicle_id', 'snapshot_date']);

    // 2. Market Metrics Table
    await queryInterface.createTable('market_metrics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      snapshot_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'market_snapshots',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      our_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      price_delta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Difference between our price and market median'
      },
      price_delta_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage difference'
      },
      percentile_rank: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Where our price falls in market distribution (0-100)'
      },
      cheaper_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of listings cheaper than ours'
      },
      more_expensive_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of listings more expensive than ours'
      },
      competitive_position: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'competitive / above_market / below_market'
      },
      days_in_market: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Days our vehicle has been in inventory'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for market_metrics
    await queryInterface.addIndex('market_metrics', ['vehicle_id']);
    await queryInterface.addIndex('market_metrics', ['snapshot_id']);
    await queryInterface.addIndex('market_metrics', ['competitive_position']);

    // 3. Market Alerts Table
    await queryInterface.createTable('market_alerts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      snapshot_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'market_snapshots',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      alert_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'price_above_market / market_median_change / inventory_surge / competitor_pricing / own_vehicle_detected'
      },
      severity: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'info / warning / critical'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      alert_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional data specific to alert type'
      },
      emailed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      emailed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for market_alerts
    await queryInterface.addIndex('market_alerts', ['vehicle_id']);
    await queryInterface.addIndex('market_alerts', ['alert_type']);
    await queryInterface.addIndex('market_alerts', ['severity']);
    await queryInterface.addIndex('market_alerts', ['emailed']);
    await queryInterface.addIndex('market_alerts', ['created_at']);

    // 4. Market Platform Tracking Table
    await queryInterface.createTable('market_platform_tracking', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vin: {
        type: Sequelize.STRING(17),
        allowNull: false
      },
      platform: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      is_own_vehicle: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True if this is one of our vehicles detected on external platform'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      dealer_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      listing_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      first_seen: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_seen: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      times_seen: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for market_platform_tracking
    await queryInterface.addIndex('market_platform_tracking', ['vin']);
    await queryInterface.addIndex('market_platform_tracking', ['platform']);
    await queryInterface.addIndex('market_platform_tracking', ['is_own_vehicle']);
    await queryInterface.addIndex('market_platform_tracking', ['vin', 'platform'], {
      unique: true,
      name: 'unique_vin_platform'
    });

    // 5. Market Price History Table
    await queryInterface.createTable('market_price_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      median_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      change_1week: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cumulative price change over last 7 days'
      },
      change_2week: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cumulative price change over last 14 days'
      },
      change_1month: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cumulative price change over last 30 days'
      },
      alert_sent_1week: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Alert sent for 1-week change threshold'
      },
      alert_sent_2week: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Alert sent for 2-week change threshold'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for market_price_history
    await queryInterface.addIndex('market_price_history', ['vehicle_id']);
    await queryInterface.addIndex('market_price_history', ['date']);
    await queryInterface.addIndex('market_price_history', ['vehicle_id', 'date'], {
      unique: true,
      name: 'unique_vehicle_date'
    });

    // 6. System Metrics Table
    await queryInterface.createTable('system_metrics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      metric_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'storage_usage / api_usage / job_execution / error_rate'
      },
      metric_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      metric_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      metric_unit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'bytes / count / milliseconds / percent'
      },
      metric_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata'
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for system_metrics
    await queryInterface.addIndex('system_metrics', ['metric_type']);
    await queryInterface.addIndex('system_metrics', ['metric_name']);
    await queryInterface.addIndex('system_metrics', ['recorded_at']);

    console.log('✅ Successfully created all 6 market research tables');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('system_metrics');
    await queryInterface.dropTable('market_price_history');
    await queryInterface.dropTable('market_platform_tracking');
    await queryInterface.dropTable('market_alerts');
    await queryInterface.dropTable('market_metrics');
    await queryInterface.dropTable('market_snapshots');

    console.log('✅ Successfully dropped all market research tables');
  }
};
