const { PendingSubmission, Inventory, User, sequelize } = require('../models');
const { uploadFile, deleteMultipleFiles, extractKeyFromUrl } = require('../services/r2Storage');
const { processVehicleImages, scanForVirus } = require('../services/imageProcessor');
const { Op } = require('sequelize');

/**
 * Create a new vehicle submission (public)
 * POST /api/submissions
 */
const createSubmission = async (req, res) => {
  try {
    const {
      year, make, model, trim, vin, mileage, askingPrice,
      customerName, customerEmail, customerPhone,
      exteriorColor, interiorColor, transmission, engine,
      fuelType, drivetrain, bodyType, doors, titleStatus,
      conditionRating, conditionNotes, accidentHistory, serviceRecords,
      customerNotes
    } = req.body;

    // Create submission without images first
    const submission = await PendingSubmission.create({
      year, make, model, trim, vin, mileage, askingPrice,
      customerName, customerEmail, customerPhone,
      exteriorColor, interiorColor, transmission, engine,
      fuelType, drivetrain, bodyType, doors, titleStatus,
      conditionRating, conditionNotes, accidentHistory, serviceRecords,
      customerNotes,
      submissionStatus: 'pending'
    });

    res.status(201).json({
      message: 'Submission created successfully',
      submission: {
        id: submission.id,
        year: submission.year,
        make: submission.make,
        model: submission.model,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    console.error('Error creating submission:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A submission with this VIN already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create submission',
      message: error.message
    });
  }
};

/**
 * Upload images for a submission
 * POST /api/submissions/:id/images
 */
const uploadSubmissionImages = async (req, res) => {
  try {
    const { id } = req.params;

    // Find submission
    const submission = await PendingSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images uploaded'
      });
    }

    // Process and upload images
    const vinFolder = submission.vin || `submission-${submission.id}`;
    const processedImages = await processVehicleImages(req.files, vinFolder);

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

    // Update submission with image URLs
    await submission.update({
      images: imageUrls,
      primaryImageUrl: imageUrls[0] || null
    });

    res.json({
      message: 'Images uploaded successfully',
      imageCount: imageUrls.length,
      images: imageUrls
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
 * Get all submissions (admin only)
 * GET /api/submissions
 */
const getAllSubmissions = async (req, res) => {
  try {
    const {
      status = 'pending',
      page = 1,
      limit = 20,
      sortBy = 'submittedAt',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') {
      where.submissionStatus = status;
    }

    const { count, rows: submissions } = await PendingSubmission.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order]],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      submissions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
};

/**
 * Get single submission by ID
 * GET /api/submissions/:id
 */
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await PendingSubmission.findByPk(id, {
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      error: 'Failed to fetch submission',
      message: error.message
    });
  }
};

/**
 * Approve submission and move to inventory
 * POST /api/submissions/:id/approve
 */
const approveSubmission = async (req, res) => {
  // Start a database transaction for data integrity
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { price, stockNumber, internalNotes } = req.body;

    const submission = await PendingSubmission.findByPk(id, { transaction });

    if (!submission) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    if (submission.submissionStatus !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Submission already reviewed'
      });
    }

    // Create inventory item from submission
    const inventoryData = {
      // Basic info
      year: submission.year,
      make: submission.make,
      model: submission.model,
      trim: submission.trim,
      vin: submission.vin,
      stockNumber: stockNumber || null,

      // Pricing
      price: price || submission.askingPrice || 0,

      // Details
      mileage: submission.mileage,
      exteriorColor: submission.exteriorColor,
      interiorColor: submission.interiorColor,
      transmission: submission.transmission,
      engine: submission.engine,
      fuelType: submission.fuelType,
      drivetrain: submission.drivetrain,
      bodyType: submission.bodyType,
      doors: submission.doors,
      titleStatus: submission.titleStatus,

      // Images
      images: submission.images,
      primaryImageUrl: submission.primaryImageUrl,

      // History
      accidentHistory: submission.accidentHistory,
      serviceRecords: submission.serviceRecords,

      // Metadata
      source: 'submission',
      sourceSubmissionId: submission.id,
      createdBy: req.user.id,
      status: 'available'
    };

    const inventory = await Inventory.create(inventoryData, { transaction });

    // Update submission status
    await submission.update({
      submissionStatus: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      internalNotes
    }, { transaction });

    // Commit transaction - all operations succeeded
    await transaction.commit();

    res.json({
      message: 'Submission approved and added to inventory',
      submission,
      inventory: {
        id: inventory.id,
        vin: inventory.vin,
        stockNumber: inventory.stockNumber
      }
    });
  } catch (error) {
    // Rollback transaction on any error
    await transaction.rollback();
    console.error('Error approving submission:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A vehicle with this VIN already exists in inventory'
      });
    }

    res.status(500).json({
      error: 'Failed to approve submission',
      message: error.message
    });
  }
};

/**
 * Reject submission
 * POST /api/submissions/:id/reject
 */
const rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const submission = await PendingSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    if (submission.submissionStatus !== 'pending') {
      return res.status(400).json({
        error: 'Submission already reviewed'
      });
    }

    await submission.update({
      submissionStatus: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      rejectionReason
    });

    res.json({
      message: 'Submission rejected',
      submission
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({
      error: 'Failed to reject submission',
      message: error.message
    });
  }
};

/**
 * Delete submission
 * DELETE /api/submissions/:id
 */
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await PendingSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }

    // Delete images from R2
    if (submission.images && submission.images.length > 0) {
      const imageKeys = submission.images.map(url => extractKeyFromUrl(url));
      await deleteMultipleFiles(imageKeys);
    }

    await submission.destroy();

    res.json({
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      error: 'Failed to delete submission',
      message: error.message
    });
  }
};

module.exports = {
  createSubmission,
  uploadSubmissionImages,
  getAllSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
  deleteSubmission
};
