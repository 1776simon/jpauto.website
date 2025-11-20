const { sequelize } = require('../config/database');
const User = require('./User');
const PendingSubmission = require('./PendingSubmission');
const Inventory = require('./Inventory');

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
  syncDatabase
};
