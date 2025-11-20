const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');
require('dotenv').config();

// Serialize user for session
passport.serializeUser((user, done) => {
  console.log('🔵 serializeUser called with user:', user.id, user.email);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  console.log('🔵 deserializeUser called with id:', id);
  try {
    const user = await User.findByPk(id);
    console.log('🔵 deserializeUser found user:', user ? user.email : 'NOT FOUND');
    done(null, user);
  } catch (error) {
    console.error('🔴 deserializeUser error:', error);
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({
        where: {
          oauthProvider: 'google',
          oauthId: profile.id
        }
      });

      if (!user) {
        // Create new user
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          oauthProvider: 'google',
          oauthId: profile.id,
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          role: 'viewer', // Default role
          lastLogin: new Date()
        });

        console.log(`✅ New user registered: ${user.email}`);
      } else {
        // Update last login
        await user.update({ lastLogin: new Date() });
      }

      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/auth/microsoft/callback',
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({
        where: {
          oauthProvider: 'microsoft',
          oauthId: profile.id
        }
      });

      if (!user) {
        // Create new user
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          oauthProvider: 'microsoft',
          oauthId: profile.id,
          avatarUrl: null,
          role: 'viewer', // Default role
          lastLogin: new Date()
        });

        console.log(`✅ New user registered: ${user.email}`);
      } else {
        // Update last login
        await user.update({ lastLogin: new Date() });
      }

      return done(null, user);
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      return done(error, null);
    }
  }));
}

module.exports = passport;
