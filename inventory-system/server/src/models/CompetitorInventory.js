const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompetitorInventory = sequelize.define('CompetitorInventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  competitorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'competitor_id',
    references: {
      model: 'competitors',
      key: 'id'
    }
  },
  // Identifiers
  vin: {
    type: DataTypes.STRING(17),
    allowNull: true
  },
  stockNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'stock_number'
  },
  hasVin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'has_vin'
  },
  isDuplicateVin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_duplicate_vin'
  },
  duplicateWarning: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'duplicate_warning'
  },
  // Vehicle details
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  make: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  trim: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  exteriorColor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'exterior_color'
  },
  // Pricing
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'current_price'
  },
  initialPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'initial_price'
  },
  // Status tracking
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'sold', 'removed']]
    }
  },
  firstSeenAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'first_seen_at'
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_seen_at'
  },
  soldAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sold_at'
  },
  daysOnMarket: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'days_on_market'
  },
  // Data quality
  completeness: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  dataWarnings: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'data_warnings'
  },
  // Audit
  lastUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_updated_at'
  }
}, {
  tableName: 'competitor_inventory',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = CompetitorInventory;
