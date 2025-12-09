const { Sequelize } = require('sequelize');
const logger = require('./logger');
require('dotenv').config();

// Custom query logger - condenses SQL queries into single line
const queryLogger = (sql, timing) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    const condensed = sql.replace(/\s+/g, ' ').substring(0, 100);
    logger.debug(`DB Query: ${condensed}... (${timing}ms)`);
  }
};

const sequelize = new Sequelize(process.env.DATABASE_URL || {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false, // Disable all Sequelize query logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection };
