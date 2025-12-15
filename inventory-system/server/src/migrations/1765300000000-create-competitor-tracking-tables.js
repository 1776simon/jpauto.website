/**
 * Migration: Create Competitor Tracking Tables
 *
 * Creates 4 tables for competitor inventory tracking:
 * 1. competitors - Competitor dealer information and scraper config
 * 2. competitor_inventory - Tracked vehicles from competitors
 * 3. competitor_price_history - Price changes over time
 * 4. competitor_metrics - Daily aggregated metrics (inventory count, sales, DOM)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Competitors Table
    await queryInterface.createTable('competitors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Dealer name'
      },
      website_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Main website URL'
      },
      inventory_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Inventory page URL to scrape'
      },
      platform_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'dealercenter, dealersync, custom, etc.'
      },
      scraper_config: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Platform-specific selectors and pagination strategy'
      },
      use_playwright: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Use Playwright (heavy) vs axios+cheerio (light)'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Enable/disable tracking'
      },
      last_scraped_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last scrape attempt (success or fail)'
      },
      last_successful_scrape_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last successful scrape'
      },
      scrape_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Last error message if scrape failed'
      },
      scrape_error_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'BLOCKED_403, NO_VEHICLES_FOUND, JAVASCRIPT_REQUIRED, etc.'
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

    await queryInterface.addIndex('competitors', ['active']);
    await queryInterface.addIndex('competitors', ['platform_type']);

    // 2. Competitor Inventory Table
    await queryInterface.createTable('competitor_inventory', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'competitors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Identifiers
      vin: {
        type: Sequelize.STRING(17),
        allowNull: true,
        comment: 'Full VIN if available'
      },
      stock_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Stock number (fallback identifier)'
      },
      has_vin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True if VIN was extracted'
      },
      is_duplicate_vin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True if same VIN found at multiple competitors'
      },
      duplicate_warning: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Warning message if duplicate detected'
      },
      // Vehicle details
      year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      make: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      model: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      trim: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      mileage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      exterior_color: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      // Pricing
      current_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      initial_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Price when first seen'
      },
      // Status tracking
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        comment: 'active, sold, removed'
      },
      first_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      sold_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date vehicle was marked as sold (disappeared from inventory)'
      },
      days_on_market: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Calculated when sold: (sold_at - first_seen_at) in days'
      },
      // Data quality
      completeness: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Percentage of fields populated (0-100)'
      },
      data_warnings: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of warnings: ["Mileage missing", "VIN not found"]'
      },
      // Audit
      last_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Last time this record was updated from scrape'
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

    // Indexes for competitor_inventory
    await queryInterface.addIndex('competitor_inventory', ['competitor_id']);
    await queryInterface.addIndex('competitor_inventory', ['vin']);
    await queryInterface.addIndex('competitor_inventory', ['stock_number']);
    await queryInterface.addIndex('competitor_inventory', ['status']);
    await queryInterface.addIndex('competitor_inventory', ['sold_at']);
    // Composite unique constraint on competitor_id + VIN + stock_number
    await queryInterface.addIndex('competitor_inventory', ['competitor_id', 'vin', 'stock_number'], {
      unique: true,
      name: 'unique_competitor_vehicle',
      where: {
        vin: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    // 3. Competitor Price History Table
    await queryInterface.createTable('competitor_price_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      competitor_inventory_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'competitor_inventory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      mileage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('competitor_price_history', ['competitor_inventory_id']);
    await queryInterface.addIndex('competitor_price_history', ['recorded_at']);

    // 4. Competitor Metrics Table (Daily snapshots)
    await queryInterface.createTable('competitor_metrics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'competitors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date of snapshot (usually end of day)'
      },
      total_inventory: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total active vehicles on this date'
      },
      avg_days_on_market: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Average DOM for active inventory'
      },
      monthly_sales: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Sales in current calendar month'
      },
      avg_sale_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Average sale price for vehicles sold this month'
      },
      avg_price_drop: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Average price drop (initial - final) for sold vehicles'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('competitor_metrics', ['competitor_id']);
    await queryInterface.addIndex('competitor_metrics', ['date']);
    await queryInterface.addIndex('competitor_metrics', ['competitor_id', 'date'], {
      unique: true,
      name: 'unique_competitor_date'
    });

    console.log('✅ Successfully created all 4 competitor tracking tables');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('competitor_metrics');
    await queryInterface.dropTable('competitor_price_history');
    await queryInterface.dropTable('competitor_inventory');
    await queryInterface.dropTable('competitors');

    console.log('✅ Successfully dropped all competitor tracking tables');
  }
};
