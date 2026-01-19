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
    // Check MIME type (including HEIC/HEIF for iPhone photos)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence'
    ];

    if (!allowedTypes.includes(mimetype)) {
      throw new Error(`Invalid image type: ${mimetype}. Only JPEG, PNG, WebP, and HEIC are allowed.`);
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

    // Log successful validation (helpful for mobile debugging)
    console.log(`[ImageProcessor] Validated ${mimetype} image: ${metadata.width}x${metadata.height}, ${sizeMB.toFixed(2)}MB`);

    return true;
  } catch (error) {
    console.error(`[ImageProcessor] Validation failed for ${mimetype}:`, error.message);
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

/**
 * Company contact information for banner
 */
const COMPANY_INFO = {
  address: '2529 Connie Dr #15, Sacramento, CA 95815',
  email: 'jpautomotivegroupllc@gmail.com',
  phone: '(916) 618-7197',
  website: 'www.jpautomotivegroup.com'
};

/**
 * Add JP Auto banner to vehicle image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {object} options - Banner options
 * @param {number} options.height - Banner height in pixels (default: 180)
 * @param {string} options.position - Banner position 'top' | 'bottom' (default: 'bottom')
 * @param {object} options.vehicleData - Vehicle-specific data
 * @param {string} options.vehicleData.titleStatus - Title status (e.g., "Clean Title")
 * @param {number} options.vehicleData.price - Vehicle price
 * @returns {Promise<Buffer>} - Processed image buffer with banner
 */
const addJPAutoBanner = async (imageBuffer, options = {}) => {
  const {
    height: bannerHeight = 180,
    position = 'bottom',
    vehicleData = {}
  } = options;

  const { titleStatus = 'Clean Title', price = 0 } = vehicleData;

  try {
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width || 1920;
    const imageHeight = metadata.height || 1080;

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);

    // Create banner SVG
    const bannerSvg = `
      <svg width="${imageWidth}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bannerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#0D4D62;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#083344;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Banner background -->
        <rect width="${imageWidth}" height="${bannerHeight}" fill="url(#bannerGradient)"/>

        <!-- Top accent line -->
        <rect x="0" y="0" width="${imageWidth}" height="4" fill="#FF4433"/>

        <!-- Left section: Company info (static) -->
        <text x="40" y="50" font-family="Arial, sans-serif" font-size="18" fill="white" font-weight="bold">
          JP AUTOMOTIVE GROUP
        </text>
        <text x="40" y="80" font-family="Arial, sans-serif" font-size="14" fill="#d4d4d8">
          ${escapeXml(COMPANY_INFO.address)}
        </text>
        <text x="40" y="105" font-family="Arial, sans-serif" font-size="14" fill="#d4d4d8">
          ${escapeXml(COMPANY_INFO.phone)} | ${escapeXml(COMPANY_INFO.email)}
        </text>
        <text x="40" y="130" font-family="Arial, sans-serif" font-size="14" fill="#FF4433">
          ${escapeXml(COMPANY_INFO.website)}
        </text>

        <!-- Right section: Vehicle info (dynamic) -->
        <text x="${imageWidth - 40}" y="55" font-family="Arial, sans-serif" font-size="22" fill="white" font-weight="bold" text-anchor="end">
          ${escapeXml(titleStatus)}
        </text>
        <text x="${imageWidth - 40}" y="100" font-family="Arial, sans-serif" font-size="40" fill="#FF4433" font-weight="bold" text-anchor="end">
          ${escapeXml(formattedPrice)}
        </text>

        <!-- Decorative separator -->
        <line x1="${imageWidth * 0.6}" y1="25" x2="${imageWidth * 0.6}" y2="${bannerHeight - 25}" stroke="#FF4433" stroke-width="2" stroke-opacity="0.5"/>
      </svg>
    `;

    // Create banner image from SVG
    const bannerBuffer = await sharp(Buffer.from(bannerSvg))
      .png()
      .toBuffer();

    // Composite banner onto original image
    let composite;
    if (position === 'top') {
      // Extend canvas at top and place banner there
      composite = await sharp(imageBuffer)
        .extend({
          top: bannerHeight,
          bottom: 0,
          left: 0,
          right: 0,
          background: { r: 8, g: 51, b: 68, alpha: 1 }
        })
        .composite([
          {
            input: bannerBuffer,
            top: 0,
            left: 0
          }
        ])
        .jpeg({ quality: IMAGE_QUALITY, progressive: true })
        .toBuffer();
    } else {
      // Extend canvas at bottom and place banner there
      composite = await sharp(imageBuffer)
        .extend({
          top: 0,
          bottom: bannerHeight,
          left: 0,
          right: 0,
          background: { r: 8, g: 51, b: 68, alpha: 1 }
        })
        .composite([
          {
            input: bannerBuffer,
            top: imageHeight,
            left: 0
          }
        ])
        .jpeg({ quality: IMAGE_QUALITY, progressive: true })
        .toBuffer();
    }

    return composite;
  } catch (error) {
    console.error('Error adding banner to image:', error);
    throw new Error(`Failed to add banner: ${error.message}`);
  }
};

/**
 * Escape XML special characters for SVG
 */
const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

module.exports = {
  processImage,
  createThumbnail,
  validateImage,
  processVehicleImages,
  addJPAutoBanner
};
