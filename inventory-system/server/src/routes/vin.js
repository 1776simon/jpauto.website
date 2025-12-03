/**
 * VIN Decoder Routes
 *
 * Provides endpoints for decoding VINs and retrieving vehicle specifications
 */

const express = require('express');
const router = express.Router();
const vinDecoder = require('../services/vinDecoder');
const logger = require('../config/logger');

/**
 * POST /api/vin/decode
 * Decode a VIN and return vehicle specifications
 *
 * Body: { vin: "17-character VIN" }
 * Returns: {
 *   success: true,
 *   data: { year, make, model, trim, engine, drivetrain, mpgCity, mpgHighway, ... }
 * }
 */
router.post('/decode', async (req, res) => {
  try {
    const { vin } = req.body;

    // Validate input
    if (!vin) {
      return res.status(400).json({
        success: false,
        error: 'VIN is required'
      });
    }

    // Decode VIN
    const vehicleData = await vinDecoder.decodeVIN(vin);

    // Return success response
    res.json({
      success: true,
      data: vehicleData
    });

  } catch (error) {
    logger.error('VIN decode endpoint error:', error);

    // Return error response
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to decode VIN'
    });
  }
});

/**
 * GET /api/vin/decode/:vin
 * Alternative GET endpoint for VIN decoding
 *
 * Returns: Same as POST endpoint
 */
router.get('/decode/:vin', async (req, res) => {
  try {
    const { vin } = req.params;

    // Validate input
    if (!vin) {
      return res.status(400).json({
        success: false,
        error: 'VIN is required'
      });
    }

    // Decode VIN
    const vehicleData = await vinDecoder.decodeVIN(vin);

    // Return success response
    res.json({
      success: true,
      data: vehicleData
    });

  } catch (error) {
    logger.error('VIN decode endpoint error:', error);

    // Return error response
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to decode VIN'
    });
  }
});

module.exports = router;
