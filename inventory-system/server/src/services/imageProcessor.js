const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH) || 2000;
const THUMBNAIL_WIDTH = parseInt(process.env.THUMBNAIL_WIDTH) || 400;
const IMAGE_QUALITY = parseInt(process.env.IMAGE_QUALITY) || 80;
const MAX_IMAGE_SIZE_MB = parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10;

/**
 * Process and optimize an image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Processed image data
 */
const processImage = async (imageBuffer, options = {}) => {
  try {
    const {
      maxWidth = MAX_WIDTH,
      quality = IMAGE_QUALITY,
      format = 'jpeg'
    } = options;

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();

    // Resize if image width exceeds maximum
    let processedImage = sharp(imageBuffer);

    if (metadata.width > maxWidth) {
      processedImage = processedImage.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Convert to specified format and compress
    if (format === 'jpeg' || format === 'jpg') {
      processedImage = processedImage.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      processedImage = processedImage.png({ quality, compressionLevel: 9 });
    } else if (format === 'webp') {
      processedImage = processedImage.webp({ quality });
    }

    const buffer = await processedImage.toBuffer();

    // Get new metadata after processing
    const newMetadata = await sharp(buffer).metadata();

    return {
      buffer,
      metadata: {
        width: newMetadata.width,
        height: newMetadata.height,
        format: newMetadata.format,
        size: buffer.length,
        sizeMB: (buffer.length / (1024 * 1024)).toFixed(2)
      }
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Create a thumbnail from an image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} width - Thumbnail width
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
const createThumbnail = async (imageBuffer, width = THUMBNAIL_WIDTH) => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new Error('Failed to create thumbnail');
  }
};

/**
 * Validate image file
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimetype - MIME type
 * @returns {Promise<boolean>}
 */
const validateImage = async (imageBuffer, mimetype) => {
  try {
    // Check MIME type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Invalid image type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Check file size
    const sizeMB = imageBuffer.length / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`Image size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${MAX_IMAGE_SIZE_MB}MB)`);
    }

    // Verify it's a valid image by trying to read metadata
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file');
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Process multiple images for a vehicle
 * @param {Array} files - Array of file objects from multer
 * @param {string} vin - Vehicle VIN for folder organization
 * @returns {Promise<object>} - Processed images data
 */
const processVehicleImages = async (files, vin) => {
  try {
    const processedImages = {
      fullSize: [],
      thumbnails: []
    };

    // Process images in parallel batches of 7 to avoid memory issues
    // Conservative limit safe for Railway Hobby plan (512MB)
    const BATCH_SIZE = 7;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            // Validate image
            await validateImage(file.buffer, file.mimetype);

            // Generate unique filename
            const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
            const fileName = `${uuidv4()}${fileExt}`;

            // Process full-size and thumbnail in parallel
            const [fullSize, thumbnailBuffer] = await Promise.all([
              processImage(file.buffer, {
                maxWidth: MAX_WIDTH,
                quality: IMAGE_QUALITY
              }),
              createThumbnail(file.buffer)
            ]);

            return {
              fullSize: {
                fileName,
                buffer: fullSize.buffer,
                metadata: fullSize.metadata,
                path: `vehicles/${vin}/full/${fileName}`
              },
              thumbnail: {
                fileName: `thumb_${fileName}`,
                buffer: thumbnailBuffer,
                path: `vehicles/${vin}/thumbnails/thumb_${fileName}`
              }
            };
          } catch (error) {
            console.error(`Error processing image ${file.originalname}:`, error);
            throw error;
          }
        })
      );

      // Add batch results to processedImages
      batchResults.forEach(result => {
        processedImages.fullSize.push(result.fullSize);
        processedImages.thumbnails.push(result.thumbnail);
      });
    }

    return processedImages;
  } catch (error) {
    console.error('Error processing vehicle images:', error);
    throw error;
  }
};

// Virus scanning removed - implement with ClamAV or VirusTotal if needed

module.exports = {
  processImage,
  createThumbnail,
  validateImage,
  processVehicleImages
};
