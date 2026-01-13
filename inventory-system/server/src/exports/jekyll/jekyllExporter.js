const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const archiver = require('archiver');
const { createWriteStream } = require('fs');

/**
 * Export inventory to Jekyll markdown files
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {string} outputPath - Path to _vehicles directory
 * @returns {Promise<object>} - Export results
 */
const exportToJekyll = async (vehicles, outputPath = '../../../_vehicles') => {
  try {
    const results = {
      success: [],
      errors: [],
      total: vehicles.length
    };

    // Resolve output path
    const vehiclesDir = path.resolve(__dirname, outputPath);

    // Ensure directory exists
    try {
      await fs.access(vehiclesDir);
    } catch {
      await fs.mkdir(vehiclesDir, { recursive: true });
    }

    // Process each vehicle
    for (const vehicle of vehicles) {
      try {
        const markdown = generateVehicleMarkdown(vehicle);
        const fileName = generateFileName(vehicle);
        const filePath = path.join(vehiclesDir, fileName);

        await fs.writeFile(filePath, markdown, 'utf8');

        results.success.push({
          vin: vehicle.vin,
          fileName,
          path: filePath
        });
      } catch (error) {
        results.errors.push({
          vin: vehicle.vin,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Jekyll export failed: ${error.message}`);
  }
};

/**
 * Generate Jekyll markdown file for a vehicle
 * @param {object} vehicle - Vehicle object
 * @returns {string} - Markdown content with frontmatter
 */
const generateVehicleMarkdown = (vehicle) => {
  // Generate stock number from last 8 characters of VIN (uppercase)
  const stockNumber = vehicle.vin.slice(-8).toUpperCase();

  // Frontmatter data
  const frontmatter = {
    layout: 'vehicle',
    title: vehicle.marketingTitle || `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim(),
    permalink: `/vehicles/${stockNumber}/`,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim || null,
    price: vehicle.price,
    mileage: vehicle.mileage,
    vin: vehicle.vin,
    status: vehicle.status,
    featured: vehicle.featured,

    // Vehicle Details
    exterior_color: vehicle.exteriorColor,
    interior_color: vehicle.interiorColor,
    transmission: vehicle.transmission,
    engine: vehicle.engine,
    fuel_type: vehicle.fuelType,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.bodyType,
    doors: vehicle.doors,
    title_status: vehicle.titleStatus,

    // Performance
    mpg_city: vehicle.mpgCity,
    mpg_highway: vehicle.mpgHighway,
    horsepower: vehicle.horsepower,

    // Features
    features: Array.isArray(vehicle.features) ? vehicle.features : [],

    // Images
    images: Array.isArray(vehicle.images) ? vehicle.images : [],
    primary_image: vehicle.primaryImageUrl || (vehicle.images && vehicle.images[0]) || null,

    // History
    previous_owners: vehicle.previousOwners,
    accident_history: vehicle.accidentHistory || 'None',
    service_records_on_file: vehicle.serviceRecordsOnFile || 'Available',
    carfax_available: vehicle.carfaxAvailable,
    carfax_url: vehicle.carfaxUrl || null,

    // Warranty
    warranty: vehicle.warrantyDescription,

    // Metadata
    date_added: vehicle.dateAdded || vehicle.createdAt,
    stock_number: vehicle.stockNumber
  };

  // Remove null/undefined values
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === null || frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  // Vehicle description (body content)
  const description = vehicle.description || generateDefaultDescription(vehicle);

  // Combine frontmatter and content
  const markdown = matter.stringify(description, frontmatter);

  return markdown;
};

/**
 * Generate a filename for the vehicle markdown file
 * @param {object} vehicle - Vehicle object
 * @returns {string} - Filename
 */
const generateFileName = (vehicle) => {
  // Use last 8 characters of VIN as stock number (uppercased)
  // This matches the Dealer Center format
  const stockNumber = vehicle.vin.slice(-8).toUpperCase();

  return `${stockNumber}.md`;
};

/**
 * Generate default description if none exists
 * @param {object} vehicle - Vehicle object
 * @returns {string} - Default description
 */
const generateDefaultDescription = (vehicle) => {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim();

  let description = `This ${title} is `;

  if (vehicle.status === 'available') {
    description += 'now available at JP Auto. ';
  }

  if (vehicle.mileage) {
    description += `With ${vehicle.mileage.toLocaleString()} miles, `;
  }

  if (vehicle.titleStatus) {
    description += `this vehicle comes with a ${vehicle.titleStatus.toLowerCase()} title. `;
  }

  if (vehicle.mpgCity && vehicle.mpgHighway) {
    description += `\n\nFuel economy: ${vehicle.mpgCity}/${vehicle.mpgHighway} MPG (city/highway). `;
  }

  if (vehicle.features && vehicle.features.length > 0) {
    const topFeatures = vehicle.features.slice(0, 5).join(', ');
    description += `\n\nKey features include: ${topFeatures}${vehicle.features.length > 5 ? ', and more' : ''}. `;
  }

  if (vehicle.warrantyDescription) {
    description += `\n\n**Warranty:** ${vehicle.warrantyDescription}`;
  }

  description += '\n\n**Schedule a test drive today!**';

  return description;
};

/**
 * Delete a vehicle markdown file
 * @param {object} vehicle - Vehicle object
 * @param {string} outputPath - Path to _vehicles directory
 * @returns {Promise<boolean>}
 */
const deleteVehicleFile = async (vehicle, outputPath = '../../../_vehicles') => {
  try {
    const vehiclesDir = path.resolve(__dirname, outputPath);
    const fileName = generateFileName(vehicle);
    const filePath = path.join(vehiclesDir, fileName);

    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting Jekyll file for VIN ${vehicle.vin}:`, error);
    return false;
  }
};

/**
 * Clear all vehicle files from Jekyll directory
 * @param {string} outputPath - Path to _vehicles directory
 * @returns {Promise<number>} - Number of files deleted
 */
const clearJekyllDirectory = async (outputPath = '../../../_vehicles') => {
  try {
    const vehiclesDir = path.resolve(__dirname, outputPath);
    const files = await fs.readdir(vehiclesDir);

    let count = 0;
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(path.join(vehiclesDir, file));
        count++;
      }
    }

    return count;
  } catch (error) {
    throw new Error(`Failed to clear Jekyll directory: ${error.message}`);
  }
};

/**
 * Export inventory to Jekyll markdown files as ZIP
 * @param {Array} vehicles - Array of vehicle objects from database
 * @returns {Promise<object>} - Export results with file path
 */
const exportToJekyllZip = async (vehicles) => {
  try {
    const results = {
      success: [],
      errors: [],
      total: vehicles.length,
      filePath: null
    };

    // Create temporary directory for markdown files
    const tempDir = path.resolve(__dirname, '../../../temp-jekyll-export');
    const zipPath = path.resolve(__dirname, '../../../jekyll-inventory-export.zip');

    // Ensure temp directory exists
    try {
      await fs.access(tempDir);
      // Clear existing files
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file));
      }
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    // Generate markdown files
    for (const vehicle of vehicles) {
      try {
        const markdown = generateVehicleMarkdown(vehicle);
        const fileName = generateFileName(vehicle);
        const filePath = path.join(tempDir, fileName);

        await fs.writeFile(filePath, markdown, 'utf8');

        results.success.push({
          vin: vehicle.vin,
          fileName
        });
      } catch (error) {
        results.errors.push({
          vin: vehicle.vin,
          error: error.message
        });
      }
    }

    // Create ZIP file
    await new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        results.filePath = zipPath;
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add all markdown files to zip
      archive.directory(tempDir, false);

      archive.finalize();
    });

    // Clean up temp directory
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      await fs.unlink(path.join(tempDir, file));
    }
    await fs.rmdir(tempDir);

    return results;
  } catch (error) {
    throw new Error(`Jekyll ZIP export failed: ${error.message}`);
  }
};

module.exports = {
  exportToJekyll,
  exportToJekyllZip,
  generateVehicleMarkdown,
  generateFileName,
  deleteVehicleFile,
  clearJekyllDirectory
};
