const { Inventory, PendingSubmission, User } = require('../models');
const { uploadFile, deleteMultipleFiles, extractKeyFromUrl, uploadFileWithVerification } = require('../services/r2Storage');
const { processVehicleImages, scanForVirus } = require('../services/imageProcessor');
const { Op } = require('sequelize');

/**
 * Sanitize user input for LIKE queries to prevent SQL wildcards in user input
 * Escapes % and _ characters that have special meaning in LIKE queries
 */
const sanitizeLikeInput = (input) => {
  if (!input) return input;
  return input.replace(/[%_]/g, '\\$&');
};

/**
 * Get all inventory
 * GET /api/inventory
 */
const getAllInventory = async (req, res) => {
  try {
    const {
      status = 'available',
      featured,
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    if (make) {
      where.make = { [Op.iLike]: `%${sanitizeLikeInput(make)}%` };
    }

    if (model) {
      where.model = { [Op.iLike]: `%${sanitizeLikeInput(model)}%` };
    }

    if (yearMin || yearMax) {
      where.year = {};
      if (yearMin) where.year[Op.gte] = parseInt(yearMin);
      if (yearMax) where.year[Op.lte] = parseInt(yearMax);
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price[Op.gte] = parseFloat(priceMin);
      if (priceMax) where.price[Op.lte] = parseFloat(priceMax);
    }

    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order]],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PendingSubmission,
          as: 'sourceSubmission',
          attributes: ['id', 'customerName', 'customerEmail']
        }
      ]
    });

    res.json({
      inventory,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory',
      message: error.message
    });
  }
};

/**
 * Get inventory by ID
 * GET /api/inventory/:id
 */
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PendingSubmission,
          as: 'sourceSubmission',
          attributes: ['id', 'customerName', 'customerEmail', 'customerNotes']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle',
      message: error.message
    });
  }
};

/**
 * Create new inventory item
 * POST /api/inventory
 */
const createInventory = async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      createdBy: req.user.id,
      source: 'manual'
    };

    const vehicle = await Inventory.create(vehicleData);

    res.status(201).json({
      message: 'Vehicle added to inventory',
      vehicle
    });
  } catch (error) {
    console.error('Error creating inventory:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A vehicle with this VIN or stock number already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create inventory',
      message: error.message
    });
  }
};

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    await vehicle.update({
      ...req.body,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating inventory:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A vehicle with this VIN or stock number already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to update inventory',
      message: error.message
    });
  }
};

/**
 * Upload/Update images for inventory item
 * POST /api/inventory/:id/images
 */
const uploadInventoryImages = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images uploaded'
      });
    }

    // Process and upload images
    const processedImages = await processVehicleImages(req.files, vehicle.vin);

    const imageUrls = [];
    const failedUploads = [];

    // Upload full-size images to R2 with verification
    for (const image of processedImages.fullSize) {
      // Optional: Scan for virus
      if (process.env.ENABLE_VIRUS_SCAN === 'true') {
        await scanForVirus(image.buffer);
      }

      const result = await uploadFileWithVerification(
        image.buffer,
        image.path,
        'image/jpeg'
      );

      if (result.success) {
        imageUrls.push(result.url);
      } else {
        failedUploads.push({
          fileName: image.fileName,
          error: result.error
        });
      }
    }

    // Append to existing images or replace
    const { replace = false } = req.query;

    let finalImages;
    if (replace === 'true') {
      // Delete old images from R2
      if (vehicle.images && vehicle.images.length > 0) {
        const oldImageKeys = vehicle.images.map(url => extractKeyFromUrl(url));
        await deleteMultipleFiles(oldImageKeys);
      }
      finalImages = imageUrls;
    } else {
      // Append new images
      finalImages = [...(vehicle.images || []), ...imageUrls];
    }

    // Update vehicle with latest photo modified timestamp
    await vehicle.update({
      images: finalImages,
      primaryImageUrl: finalImages[0] || null,
      latestPhotoModified: new Date(),
      updatedBy: req.user.id
    });

    const response = {
      message: failedUploads.length > 0
        ? `${imageUrls.length} images uploaded successfully, ${failedUploads.length} failed`
        : 'Images uploaded and verified successfully',
      imageCount: imageUrls.length,
      totalImages: finalImages.length,
      images: finalImages
    };

    if (failedUploads.length > 0) {
      response.failedUploads = failedUploads;
      response.warning = 'Some images failed to upload after multiple retries';
    }

    res.json(response);
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      message: error.message
    });
  }
};

/**
 * Reorder photos for inventory item
 * PUT /api/inventory/:id/photos/reorder
 */
const reorderPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({
        error: 'imageUrls array is required'
      });
    }

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    // Validate that all URLs exist in the current images
    const currentImages = vehicle.images || [];
    const invalidUrls = imageUrls.filter(url => !currentImages.includes(url));

    if (invalidUrls.length > 0) {
      return res.status(400).json({
        error: 'Invalid image URLs provided',
        invalidUrls
      });
    }

    // Update vehicle with reordered images and update latestPhotoModified
    await vehicle.update({
      images: imageUrls,
      primaryImageUrl: imageUrls[0] || null,
      latestPhotoModified: new Date(),
      updatedBy: req.user.id
    });

    res.json({
      message: 'Photos reordered successfully',
      images: imageUrls
    });
  } catch (error) {
    console.error('Error reordering photos:', error);
    res.status(500).json({
      error: 'Failed to reorder photos',
      message: error.message
    });
  }
};

/**
 * Delete a photo from inventory item
 * DELETE /api/inventory/:id/photos
 */
const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: 'imageUrl is required'
      });
    }

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    const currentImages = vehicle.images || [];

    if (!currentImages.includes(imageUrl)) {
      return res.status(404).json({
        error: 'Image not found in vehicle images'
      });
    }

    // Remove image from array
    const updatedImages = currentImages.filter(url => url !== imageUrl);

    // Delete from R2 storage
    try {
      const { deleteFile, extractKeyFromUrl } = require('../services/r2Storage');
      const imageKey = extractKeyFromUrl(imageUrl);
      await deleteFile(imageKey);
    } catch (storageError) {
      console.error('Error deleting from R2:', storageError);
      // Continue even if R2 deletion fails
    }

    // Update vehicle with remaining images and update latestPhotoModified
    await vehicle.update({
      images: updatedImages,
      primaryImageUrl: updatedImages[0] || null,
      latestPhotoModified: new Date(),
      updatedBy: req.user.id
    });

    res.json({
      message: 'Photo deleted successfully',
      images: updatedImages
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      error: 'Failed to delete photo',
      message: error.message
    });
  }
};

/**
 * Delete inventory item
 * DELETE /api/inventory/:id
 */
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    // Delete images from R2
    if (vehicle.images && vehicle.images.length > 0) {
      const imageKeys = vehicle.images.map(url => extractKeyFromUrl(url));
      await deleteMultipleFiles(imageKeys);
    }

    await vehicle.destroy();

    res.json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({
      error: 'Failed to delete inventory',
      message: error.message
    });
  }
};

/**
 * Mark vehicle as sold
 * POST /api/inventory/:id/mark-sold
 */
const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    await vehicle.update({
      status: 'sold',
      soldDate: new Date(),
      updatedBy: req.user.id
    });

    res.json({
      message: 'Vehicle marked as sold',
      vehicle
    });
  } catch (error) {
    console.error('Error marking as sold:', error);
    res.status(500).json({
      error: 'Failed to mark vehicle as sold',
      message: error.message
    });
  }
};

/**
 * Toggle featured status
 * POST /api/inventory/:id/toggle-featured
 */
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    await vehicle.update({
      featured: !vehicle.featured,
      updatedBy: req.user.id
    });

    res.json({
      message: `Vehicle ${vehicle.featured ? 'featured' : 'unfeatured'}`,
      vehicle
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({
      error: 'Failed to toggle featured status',
      message: error.message
    });
  }
};

/**
 * Get inventory statistics
 * GET /api/inventory/stats
 */
const getInventoryStats = async (req, res) => {
  try {
    const [
      totalInventory,
      availableInventory,
      soldInventory,
      pendingSubmissions,
      totalValueResult,
      averagePrice,
      averageMileage
    ] = await Promise.all([
      Inventory.count(),
      Inventory.count({ where: { status: 'available' } }),
      Inventory.count({ where: { status: 'sold' } }),
      PendingSubmission.count({ where: { submissionStatus: 'pending' } }),
      Inventory.findOne({
        attributes: [[Inventory.sequelize.fn('SUM', Inventory.sequelize.col('price')), 'totalValue']],
        where: { status: 'available' },
        raw: true
      }),
      Inventory.findOne({
        attributes: [[Inventory.sequelize.fn('AVG', Inventory.sequelize.col('price')), 'avgPrice']],
        where: { status: 'available' },
        raw: true
      }),
      Inventory.findOne({
        attributes: [[Inventory.sequelize.fn('AVG', Inventory.sequelize.col('mileage')), 'avgMileage']],
        where: { status: 'available' },
        raw: true
      })
    ]);

    res.json({
      total: totalInventory,
      available: availableInventory,
      sold: soldInventory,
      pending: pendingSubmissions,
      totalValue: parseFloat(totalValueResult?.totalValue || 0),
      averagePrice: parseFloat(averagePrice?.avgPrice || 0),
      averageMileage: parseInt(averageMileage?.avgMileage || 0)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  uploadInventoryImages,
  reorderPhotos,
  deletePhoto,
  deleteInventory,
  markAsSold,
  toggleFeatured,
  getInventoryStats
};
