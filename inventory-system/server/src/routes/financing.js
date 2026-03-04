const express = require('express');
const router = express.Router();
const financingController = require('../controllers/financingController');
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
 * @route   GET /api/financing/test-email?secret=TEST_SECRET
 * @desc    Test email configuration
 * @access  Secret token
 */
router.get('/test-email', (req, res, next) => {
  const secret = process.env.TEST_EMAIL_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, financingController.testEmail);

module.exports = router;
