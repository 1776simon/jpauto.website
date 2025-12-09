const { Sequelize } = require('sequelize');
const logger = require('./logger');
require('dotenv').config();

// Sequelize options (applied whether using DATABASE_URL or individual params)
const sequelizeOptions = {
  dialect: 'postgres',
  logging: false, // Disable all Sequelize query logging in production
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Create Sequelize instance
// If DATABASE_URL is set (Railway), use it; otherwise use individual params
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, sequelizeOptions)
  : new Sequelize({
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      ...sequelizeOptions
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
