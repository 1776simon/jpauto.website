const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Competitor = sequelize.define('Competitor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  websiteUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'website_url'
  },
  inventoryUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'inventory_url'
  },
  platformType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'platform_type'
  },
  scraperConfig: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'scraper_config'
  },
  usePlaywright: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'use_playwright'
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastScrapedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_scraped_at'
  },
  lastSuccessfulScrapeAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_successful_scrape_at'
  },
  scrapeError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'scrape_error'
  },
  scrapeErrorType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'scrape_error_type'
  }
}, {
  tableName: 'competitors',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Competitor;
