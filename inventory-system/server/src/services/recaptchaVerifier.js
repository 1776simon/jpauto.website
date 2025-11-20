/**
 * Google reCAPTCHA v3 Verification Service
 */

/**
 * Verify reCAPTCHA token with Google
 * @param {string} token - reCAPTCHA token from frontend
 * @param {string} action - Expected action name (e.g., 'submit')
 * @param {number} minScore - Minimum acceptable score (0.0 to 1.0, default 0.5)
 * @returns {Promise<{success: boolean, score: number, action: string, error?: string}>}
 */
async function verifyRecaptcha(token, action = 'submit', minScore = 0.5) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Skip verification if reCAPTCHA is not configured
  if (!secretKey || secretKey === 'YOUR_SECRET_KEY_HERE') {
    console.warn('⚠️  reCAPTCHA not configured - skipping verification');
    return {
      success: true,
      score: 1.0,
      action: action,
      message: 'reCAPTCHA not configured'
    };
  }

  // Token is required if reCAPTCHA is configured
  if (!token) {
    return {
      success: false,
      score: 0,
      action: '',
      error: 'reCAPTCHA token missing'
    };
  }

  try {
    // Verify with Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    // Check verification result
    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: data.action || '',
        error: 'reCAPTCHA verification failed',
        errorCodes: data['error-codes']
      };
    }

    // Check action matches
    if (data.action !== action) {
      return {
        success: false,
        score: data.score || 0,
        action: data.action,
        error: `Action mismatch: expected '${action}', got '${data.action}'`
      };
    }

    // Check score threshold
    if (data.score < minScore) {
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: `Score too low: ${data.score} < ${minScore}`
      };
    }

    // Success
    return {
      success: true,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      challengeTs: data.challenge_ts
    };

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      score: 0,
      action: '',
      error: 'Verification request failed: ' + error.message
    };
  }
}

/**
 * Express middleware for reCAPTCHA verification
 * @param {string} action - Expected action name
 * @param {number} minScore - Minimum acceptable score (default 0.5)
 */
function recaptchaMiddleware(action = 'submit', minScore = 0.5) {
  return async (req, res, next) => {
    const token = req.body.recaptchaToken;

    const result = await verifyRecaptcha(token, action, minScore);

    if (!result.success) {
      console.log(`❌ reCAPTCHA verification failed:`, result.error);
      return res.status(400).json({
        error: 'Bot protection verification failed',
        message: 'Please try again. If the problem persists, contact support.',
        details: process.env.NODE_ENV === 'development' ? result : undefined
      });
    }

    console.log(`✅ reCAPTCHA verified: score=${result.score}, action=${result.action}`);

    // Attach score to request for logging/analytics
    req.recaptchaScore = result.score;

    next();
  };
}

module.exports = {
  verifyRecaptcha,
  recaptchaMiddleware
};
