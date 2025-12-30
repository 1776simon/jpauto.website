const ftp = require('basic-ftp');
const fs = require('fs').promises;
const path = require('path');
const dealerCenterConfig = require('../config/dealerCenter');
const carsforsaleConfig = require('../config/carsforsale');
const logger = require('../config/logger');

/**
 * Upload file to DealerCenter FTP server
 * @param {string} localFilePath - Path to local file
 * @param {string} remoteFileName - Name for file on FTP server
 * @returns {Promise<object>} - Upload result
 */
const uploadToDealerCenter = async (localFilePath, remoteFileName = null) => {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development';

  try {
    // Connect to FTP server
    await client.access({
      host: dealerCenterConfig.ftp.host,
      user: dealerCenterConfig.ftp.user,
      password: dealerCenterConfig.ftp.password,
      port: dealerCenterConfig.ftp.port,
      secure: dealerCenterConfig.ftp.secure,
      secureOptions: dealerCenterConfig.ftp.secureOptions
    });

    logger.info('Connected to DealerCenter FTP server');

    // Upload file
    const remotePath = path.join(
      dealerCenterConfig.export.remotePath,
      remoteFileName || path.basename(localFilePath)
    );

    await client.uploadFrom(localFilePath, remotePath);

    logger.info(`File uploaded successfully: ${remotePath}`);

    return {
      success: true,
      remotePath,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('FTP upload failed:', error);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
};

/**
 * Test FTP connection
 * @returns {Promise<boolean>} - Connection success
 */
const testConnection = async () => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: dealerCenterConfig.ftp.host,
      user: dealerCenterConfig.ftp.user,
      password: dealerCenterConfig.ftp.password,
      port: dealerCenterConfig.ftp.port,
      secure: dealerCenterConfig.ftp.secure,
      secureOptions: dealerCenterConfig.ftp.secureOptions
    });

    logger.info('FTP connection test successful');
    return true;
  } catch (error) {
    logger.error('FTP connection test failed:', error);
    return false;
  } finally {
    client.close();
  }
};

/**
 * Upload DealerCenter export
 * @param {string} csvFilePath - Path to CSV export file
 * @returns {Promise<object>} - Upload result
 */
const uploadDealerCenterExport = async (csvFilePath) => {
  try {
    const result = await uploadToDealerCenter(
      csvFilePath,
      dealerCenterConfig.export.filename
    );

    logger.info('DealerCenter export uploaded successfully');

    return {
      ...result,
      fileName: dealerCenterConfig.export.filename
    };
  } catch (error) {
    logger.error('Failed to upload DealerCenter export:', error);
    throw error;
  }
};

/**
 * Upload file to CarsForSale FTP server
 * @param {string} localFilePath - Path to local file
 * @param {string} remoteFileName - Name for file on FTP server
 * @returns {Promise<object>} - Upload result
 */
const uploadToCarsForSale = async (localFilePath, remoteFileName = null) => {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development';

  try {
    // Connect to FTP server
    await client.access({
      host: carsforsaleConfig.ftp.host,
      user: carsforsaleConfig.ftp.user,
      password: carsforsaleConfig.ftp.password,
      port: carsforsaleConfig.ftp.port,
      secure: carsforsaleConfig.ftp.secure,
      secureOptions: carsforsaleConfig.ftp.secureOptions
    });

    logger.info('Connected to CarsForSale FTP server');

    // Upload file
    const remotePath = path.join(
      carsforsaleConfig.export.remotePath,
      remoteFileName || path.basename(localFilePath)
    );

    await client.uploadFrom(localFilePath, remotePath);

    logger.info(`File uploaded successfully: ${remotePath}`);

    return {
      success: true,
      remotePath,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('CarsForSale FTP upload failed:', error);
    throw new Error(`CarsForSale FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
};

/**
 * Upload CarsForSale export
 * @param {string} txtFilePath - Path to TXT export file
 * @returns {Promise<object>} - Upload result
 */
const uploadCarsForSaleExport = async (txtFilePath) => {
  try {
    const result = await uploadToCarsForSale(
      txtFilePath,
      carsforsaleConfig.export.filename
    );

    logger.info('CarsForSale export uploaded successfully');

    return {
      ...result,
      fileName: carsforsaleConfig.export.filename
    };
  } catch (error) {
    logger.error('Failed to upload CarsForSale export:', error);
    throw error;
  }
};

module.exports = {
  uploadToDealerCenter,
  testConnection,
  uploadDealerCenterExport,
  uploadToCarsForSale,
  uploadCarsForSaleExport
};
