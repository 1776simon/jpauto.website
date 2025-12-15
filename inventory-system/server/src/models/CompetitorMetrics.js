const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompetitorMetrics = sequelize.define('CompetitorMetrics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  totalInventory: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_inventory'
  },
  avgDaysOnMarket: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'avg_days_on_market'
  },
  monthlySales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'monthly_sales'
  },
  avgSalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'avg_sale_price'
  },
  avgPriceDrop: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'avg_price_drop'
  }
}, {
  tableName: 'competitor_metrics',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = CompetitorMetrics;
