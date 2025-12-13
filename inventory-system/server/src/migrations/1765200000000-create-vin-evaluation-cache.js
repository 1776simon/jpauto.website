/**
 * Migration: Create VIN Evaluation Cache Table
 *
 * Purpose: Cache Auto.dev market research results for vehicles we're considering buying
 * Retention: 1 week (cleaned up by marketCleanupJob)
 * Scope: Vehicles NOT in our inventory (potential purchases)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vin_evaluation_cache', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      // Vehicle identification
      vin: {
        type: Sequelize.STRING(17),
        allowNull: false,
        comment: 'Vehicle VIN being evaluated'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      trim: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mileage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Vehicle mileage used for market search'
      },

      // Market data summary (cached from Auto.dev)
      median_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Median market price from comparable listings'
      },
      min_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum market price'
      },
      max_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum market price'
      },
      average_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Average market price'
      },
      total_listings: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of comparable listings found'
      },
      unique_listings: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Unique listings after deduplication'
      },

      // Search parameters used (for reference)
      search_params: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Auto.dev API search parameters used (mileage range, radius, etc.)'
      },

      // Sample listings data (top 5-10 for reference)
      sample_listings: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Sample of competitor listings (VIN last 4, price, mileage, location, VDP)'
      },

      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When this cache entry was created (used for 1-week TTL cleanup)'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index on VIN for fast lookups
    await queryInterface.addIndex('vin_evaluation_cache', ['vin'], {
      name: 'idx_vin_evaluation_vin'
    });

    // Index on created_at for cleanup job
    await queryInterface.addIndex('vin_evaluation_cache', ['created_at'], {
      name: 'idx_vin_evaluation_created_at'
    });

    // Composite index on year/make/model for searches
    await queryInterface.addIndex('vin_evaluation_cache', ['year', 'make', 'model'], {
      name: 'idx_vin_evaluation_ymm'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vin_evaluation_cache');
  }
};
