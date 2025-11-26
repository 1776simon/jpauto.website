const { Inventory, PendingSubmission } = require('../models');
const { verifyVehicleImages } = require('../services/imageVerifier');
const logger = require('../config/logger');

/**
 * Verify and clean images for a specific vehicle
 * POST /api/inventory/:id/verify-images
 */
const verifyInventoryImages = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Inventory.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found'
      });
    }

    if (!vehicle.images || vehicle.images.length === 0) {
      return res.json({
        message: 'No images to verify',
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model
        },
        verification: {
          totalChecked: 0,
          validCount: 0,
          invalidCount: 0,
          cleaned: false
        }
      });
    }

    // Verify images
    const verification = await verifyVehicleImages(vehicle.images);

    // Auto-clean if requested
    const shouldClean = req.query.clean === 'true' || req.body.clean === true;

    if (shouldClean && verification.invalidCount > 0) {
      await vehicle.update({
        images: verification.validUrls,
        primaryImageUrl: verification.validUrls[0] || null
      });

      logger.info(`Cleaned ${verification.invalidCount} broken images from vehicle ${vehicle.vin}`);
    }

    res.json({
      message: shouldClean ? 'Images verified and cleaned' : 'Images verified',
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model
      },
      verification: {
        ...verification,
        cleaned: shouldClean && verification.invalidCount > 0
      },
      validImages: verification.validUrls,
      invalidImages: verification.invalidUrls
    });
  } catch (error) {
    logger.error('Error verifying vehicle images:', error);
    res.status(500).json({
      error: 'Failed to verify images',
      message: error.message
    });
  }
};

/**
 * Verify and clean images for all vehicles in inventory
 * POST /api/inventory/verify-all-images
 */
const verifyAllInventoryImages = async (req, res) => {
  try {
    const vehicles = await Inventory.findAll({
      attributes: ['id', 'vin', 'year', 'make', 'model', 'images', 'primaryImageUrl']
    });

    const results = [];
    let totalCleaned = 0;
    let totalInvalid = 0;

    for (const vehicle of vehicles) {
      if (!vehicle.images || vehicle.images.length === 0) {
        continue;
      }

      const verification = await verifyVehicleImages(vehicle.images);

      if (verification.invalidCount > 0) {
        totalInvalid += verification.invalidCount;

        // Auto-clean if requested
        const shouldClean = req.query.clean === 'true' || req.body.clean === true;

        if (shouldClean) {
          await vehicle.update({
            images: verification.validUrls,
            primaryImageUrl: verification.validUrls[0] || null
          });

          totalCleaned += verification.invalidCount;

          logger.info(`Cleaned ${verification.invalidCount} broken images from vehicle ${vehicle.vin}`);
        }

        results.push({
          vehicle: {
            id: vehicle.id,
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model
          },
          verification
        });
      }
    }

    res.json({
      message: `Verified ${vehicles.length} vehicles`,
      totalVehicles: vehicles.length,
      vehiclesWithIssues: results.length,
      totalInvalidImages: totalInvalid,
      totalCleanedImages: totalCleaned,
      results
    });
  } catch (error) {
    logger.error('Error verifying all vehicle images:', error);
    res.status(500).json({
      error: 'Failed to verify images',
      message: error.message
    });
  }
};

/**
 * Verify and clean images for a specific submission
 * POST /api/submissions/:id/verify-images
 */
const verifySubmissionImages = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await PendingSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    if (!submission.images || submission.images.length === 0) {
      return res.json({
        message: 'No images to verify',
        submission: {
          id: submission.id,
          vin: submission.vin,
          year: submission.year,
          make: submission.make,
          model: submission.model
        },
        verification: {
          totalChecked: 0,
          validCount: 0,
          invalidCount: 0,
          cleaned: false
        }
      });
    }

    // Verify images
    const verification = await verifyVehicleImages(submission.images);

    // Auto-clean if requested
    const shouldClean = req.query.clean === 'true' || req.body.clean === true;

    if (shouldClean && verification.invalidCount > 0) {
      await submission.update({
        images: verification.validUrls,
        primaryImageUrl: verification.validUrls[0] || null
      });

      logger.info(`Cleaned ${verification.invalidCount} broken images from submission ${submission.vin}`);
    }

    res.json({
      message: shouldClean ? 'Images verified and cleaned' : 'Images verified',
      submission: {
        id: submission.id,
        vin: submission.vin,
        year: submission.year,
        make: submission.make,
        model: submission.model
      },
      verification: {
        ...verification,
        cleaned: shouldClean && verification.invalidCount > 0
      },
      validImages: verification.validUrls,
      invalidImages: verification.invalidUrls
    });
  } catch (error) {
    logger.error('Error verifying submission images:', error);
    res.status(500).json({
      error: 'Failed to verify images',
      message: error.message
    });
  }
};

module.exports = {
  verifyInventoryImages,
  verifyAllInventoryImages,
  verifySubmissionImages
};
