const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompetitorPriceHistory = sequelize.define('CompetitorPriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  competitorInventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'competitor_inventory_id',
    references: {
      model: 'competitor_inventory',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  }
}, {
  tableName: 'competitor_price_history',
  underscored: true,
  timestamps: false
});

module.exports = CompetitorPriceHistory;
