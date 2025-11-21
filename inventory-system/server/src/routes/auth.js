const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

/**
 * Google OAuth Routes
 */

// Initiate Google OAuth
router.get('/google',
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
