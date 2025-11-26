const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../config/logger');
require('dotenv').config();

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Upload a file to Cloudflare R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - File path/key in the bucket
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Return public URL
    return `${PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file to R2');
  }
};

/**
 * Delete a file from Cloudflare R2
 * @param {string} key - File path/key in the bucket
 * @returns {Promise<boolean>}
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error('Failed to delete file from R2');
  }
};

/**
 * Delete multiple files from Cloudflare R2
 * @param {string[]} keys - Array of file keys
 * @returns {Promise<boolean>}
 */
const deleteMultipleFiles = async (keys) => {
  try {
    const deletePromises = keys.map(key => deleteFile(key));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple files from R2:', error);
    throw new Error('Failed to delete files from R2');
  }
};

/**
 * Generate a presigned URL for temporary access
 * @param {string} key - File key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

/**
 * Extract key from full R2 URL
 * @param {string} url - Full R2 URL
 * @returns {string} - File key
 */
const extractKeyFromUrl = (url) => {
  if (!url) return null;

  // Remove the public URL base to get just the key
  return url.replace(`${PUBLIC_URL}/`, '');
};

/**
 * Verify if a file exists in R2 storage
 * @param {string} key - File path/key in the bucket
 * @returns {Promise<boolean>}
 */
const verifyFileExists = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    logger.error(`Error verifying R2 file ${key}:`, error.message);
    return false;
  }
};

/**
 * Upload a file to R2 with verification and retry logic
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - File path/key in the bucket
 * @param {string} contentType - MIME type
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<object>} - Upload result with URL and verification status
 */
const uploadFileWithVerification = async (fileBuffer, key, contentType, maxRetries = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Upload the file
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await r2Client.send(command);

      // Verify the upload succeeded
      const exists = await verifyFileExists(key);

      if (exists) {
        const url = `${PUBLIC_URL}/${key}`;
        logger.info(`Successfully uploaded and verified: ${key}`);
        return {
          success: true,
          url,
          key,
          verified: true,
          attempts: attempt
        };
      } else {
        logger.warn(`Upload verification failed for ${key} (attempt ${attempt}/${maxRetries})`);
        lastError = new Error('File upload verification failed');

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      logger.error(`Error uploading to R2 (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error;

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  logger.error(`Failed to upload ${key} after ${maxRetries} attempts`);
  return {
    success: false,
    url: null,
    key,
    verified: false,
    attempts: maxRetries,
    error: lastError?.message || 'Upload failed after all retries'
  };
};

module.exports = {
  uploadFile,
  deleteFile,
  deleteMultipleFiles,
  getPresignedUrl,
  extractKeyFromUrl,
  verifyFileExists,
  uploadFileWithVerification,
  r2Client
};
