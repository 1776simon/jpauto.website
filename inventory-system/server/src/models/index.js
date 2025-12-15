const { sequelize } = require('../config/database');
const User = require('./User');
const PendingSubmission = require('./PendingSubmission');
const Inventory = require('./Inventory');
const Competitor = require('./Competitor');
const CompetitorInventory = require('./CompetitorInventory');
const CompetitorPriceHistory = require('./CompetitorPriceHistory');
const CompetitorMetrics = require('./CompetitorMetrics');

// Define associations
User.hasMany(PendingSubmission, {
  foreignKey: 'reviewedBy',
  as: 'reviewedSubmissions'
});

PendingSubmission.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer'
});

PendingSubmission.hasOne(Inventory, {
  foreignKey: 'sourceSubmissionId',
  as: 'inventoryItem'
});

Inventory.belongsTo(PendingSubmission, {
  foreignKey: 'sourceSubmissionId',
  as: 'sourceSubmission'
});

Inventory.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Inventory.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater'
});

// Competitor associations
Competitor.hasMany(CompetitorInventory, {
  foreignKey: 'competitorId',
  as: 'inventory'
});

Competitor.hasMany(CompetitorMetrics, {
  foreignKey: 'competitorId',
  as: 'metrics'
});

CompetitorInventory.belongsTo(Competitor, {
  foreignKey: 'competitorId',
  as: 'competitor'
});

CompetitorInventory.hasMany(CompetitorPriceHistory, {
  foreignKey: 'competitorInventoryId',
  as: 'priceHistory'
});

CompetitorPriceHistory.belongsTo(CompetitorInventory, {
  foreignKey: 'competitorInventoryId',
  as: 'vehicle'
});

CompetitorMetrics.belongsTo(Competitor, {
  foreignKey: 'competitorId',
  as: 'competitor'
});

// Sync models with database
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ All models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  PendingSubmission,
  Inventory,
  Competitor,
  CompetitorInventory,
  CompetitorPriceHistory,
  CompetitorMetrics,
  syncDatabase
};
