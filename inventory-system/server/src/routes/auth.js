const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');

// Rate limiter for auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for trusted proxies (Railway uses proxies)
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1'
});

/**
 * Google OAuth Routes
 */

// Initiate Google OAuth
router.get('/google',
  authLimiter, // Add rate limiting
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication - save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }

      // Redirect to admin dashboard
      const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';
      res.redirect(`${adminUrl}/dashboard`);
    });
  }
);

/**
 * Microsoft OAuth Routes
 */

// Initiate Microsoft OAuth
router.get('/microsoft',
  authLimiter, // Add rate limiting
  passport.authenticate('microsoft', {
    scope: ['user.read']
  })
);

// Microsoft OAuth callback
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const redirectUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/dashboard`);
  }
);

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: err.message
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Session destruction failed',
          message: err.message
        });
      }

      res.json({
        message: 'Logged out successfully'
      });
    });
  });
});

/**
 * Get current authentication status
 */
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl
      }
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

module.exports = router;
