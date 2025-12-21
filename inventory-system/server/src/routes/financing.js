const express = require('express');
const router = express.Router();
const financingController = require('../controllers/financingController');
const { isAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/financing/apply
 * @desc    Submit financing application (public endpoint)
 * @access  Public
 */
router.post('/apply', financingController.submitApplication);

/**
 * @route   GET /api/financing/test-email
 * @desc    Test email configuration (admin only)
 * @access  Admin
 */
router.get('/test-email', isAdmin, financingController.testEmail);

module.exports = router;
