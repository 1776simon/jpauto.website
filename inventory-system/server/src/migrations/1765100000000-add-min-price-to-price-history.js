/**
 * Migration: Add Minimum Price to Price History
 *
 * Adds min_price column to market_price_history table
 * This enables tracking minimum market prices over time (critical for buyer's market analysis)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('market_price_history', 'min_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Minimum market price for this date'
    });

    await queryInterface.addColumn('market_price_history', 'max_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Maximum market price for this date'
    });

    console.log('✅ Successfully added min_price and max_price columns to market_price_history');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('market_price_history', 'min_price');
    await queryInterface.removeColumn('market_price_history', 'max_price');

    console.log('✅ Successfully removed min_price and max_price columns');
  }
};
