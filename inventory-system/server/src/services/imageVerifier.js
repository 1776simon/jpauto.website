const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Check if a file exists in R2 storage
 * @param {string} key - File path/key in the bucket
 * @returns {Promise<boolean>}
 */
const fileExistsInR2 = async (key) => {
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
    // For other errors, log but assume file doesn't exist
    console.error(`Error checking R2 file ${key}:`, error.message);
    return false;
  }
};

/**
 * Extract R2 key from public URL
 * @param {string} url - Public URL of the file
 * @returns {string|null} - R2 key or null if invalid
 */
const extractKeyFromUrl = (url) => {
  try {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!url || !url.startsWith(publicUrl)) {
      return null;
    }
    // Remove public URL prefix and leading slash
    return url.replace(publicUrl + '/', '');
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};

/**
 * Verify vehicle images and return valid URLs
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<object>} - Object with valid and invalid URLs
 */
const verifyVehicleImages = async (imageUrls) => {
  const validUrls = [];
  const invalidUrls = [];

  for (const url of imageUrls) {
    const key = extractKeyFromUrl(url);

    if (!key) {
      invalidUrls.push(url);
      continue;
    }

    const exists = await fileExistsInR2(key);

    if (exists) {
      validUrls.push(url);
    } else {
      invalidUrls.push(url);
    }
  }

  return {
    validUrls,
    invalidUrls,
    totalChecked: imageUrls.length,
    validCount: validUrls.length,
    invalidCount: invalidUrls.length
  };
};

module.exports = {
  fileExistsInR2,
  extractKeyFromUrl,
  verifyVehicleImages
};
