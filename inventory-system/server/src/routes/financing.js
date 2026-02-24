const express = require('express');
const router = express.Router();
const financingController = require('../controllers/financingController');
const { isAdmin } = require('../middleware/auth');
const { validateFinancingApplication } = require('../middleware/validation');

/**
 * @route   POST /api/financing/apply
 * @desc    Submit financing application (public endpoint)
 * @access  Public
 */
router.post('/apply', validateFinancingApplication, financingController.submitApplication);

/**
 * @route   GET /api/financing/test-connection
 * @desc    Test Gmail SMTP connection
 * @access  Public (for debugging)
 */
router.get('/test-connection', financingController.testConnection);

/**
 * @route   GET /api/financing/test-email
 * @desc    Test email configuration (admin only)
 * @access  Admin
 */
router.get('/test-email', isAdmin, financingController.testEmail);

module.exports = router;
