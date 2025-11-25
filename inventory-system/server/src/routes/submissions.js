const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  createSubmission,
  uploadSubmissionImages,
  getAllSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
  deleteSubmission
} = require('../controllers/submissionsController');
const {
  isAuthenticated,
  isManagerOrAdmin,
  isAdmin
} = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  validateSubmission,
  validateUUID,
  validatePagination
} = require('../middleware/validation');
const { recaptchaMiddleware } = require('../services/recaptchaVerifier');

// Rate limiting for public submission endpoint
const submissionLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 submissions per 30 minutes per IP
  message: {
    error: 'Too many submissions',
    message: 'Please try again later'
  }
});

/**
 * Public Routes
 */

// Create new submission (public)
router.post('/',
  submissionLimiter,
  recaptchaMiddleware('submit', 0.5), // Verify reCAPTCHA with minimum score 0.5
  validateSubmission,
  createSubmission
);

// Upload images for submission (public - but requires submission ID)
router.post('/:id/images',
  submissionLimiter,
  validateUUID,
  uploadMultiple,
  uploadSubmissionImages
);

/**
 * Protected Routes (Admin/Manager)
 */

// Get all submissions
router.get('/',
  isAuthenticated,
  validatePagination,
  getAllSubmissions
);

// Get single submission
router.get('/:id',
  isAuthenticated,
  validateUUID,
  getSubmissionById
);

// Approve submission
router.post('/:id/approve',
  isManagerOrAdmin,
  validateUUID,
  approveSubmission
);

// Reject submission
router.post('/:id/reject',
  isManagerOrAdmin,
  validateUUID,
  rejectSubmission
);

// Delete submission
router.delete('/:id',
  isAdmin,
  validateUUID,
  deleteSubmission
);

module.exports = router;
