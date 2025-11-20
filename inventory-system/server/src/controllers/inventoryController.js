const { Inventory, PendingSubmission, User } = require('../models');
const { uploadFile, deleteMultipleFiles, extractKeyFromUrl } = require('../services/r2Storage');
const { processVehicleImages, scanForVirus } = require('../services/imageProcessor');
const { Op } = require('sequelize');

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
      where.make = { [Op.iLike]: `%${make}%` };
    }

    if (model) {
      where.model = { [Op.iLike]: `%${model}%` };
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

    // Upload full-size images to R2
    for (const image of processedImages.fullSize) {
      // Optional: Scan for virus
      if (process.env.ENABLE_VIRUS_SCAN === 'true') {
        await scanForVirus(image.buffer);
      }

      const url = await uploadFile(
        image.buffer,
        image.path,
        'image/jpeg'
      );

      imageUrls.push(url);
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

    // Update vehicle
    await vehicle.update({
      images: finalImages,
      primaryImageUrl: finalImages[0] || null,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Images uploaded successfully',
      imageCount: imageUrls.length,
      totalImages: finalImages.length,
      images: finalImages
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      error: 'Failed to upload images',
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
      totalVehicles,
      availableVehicles,
      soldVehicles,
      featuredVehicles,
      averagePrice,
      averageMileage
    ] = await Promise.all([
      Inventory.count(),
      Inventory.count({ where: { status: 'available' } }),
      Inventory.count({ where: { status: 'sold' } }),
      Inventory.count({ where: { featured: true } }),
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
      totalVehicles,
      availableVehicles,
      soldVehicles,
      featuredVehicles,
      averagePrice: parseFloat(averagePrice?.avgPrice || 0).toFixed(2),
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
  deleteInventory,
  markAsSold,
  toggleFeatured,
  getInventoryStats
};
