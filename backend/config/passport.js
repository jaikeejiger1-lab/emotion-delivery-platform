/**
 * passport.js — Google OAuth 2.0 strategy
 */
const passport     = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User         = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'GOOGLE_CLIENT_ID_HERE',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_HERE',
      callbackURL:  `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value?.toLowerCase();
        const avatar = profile.photos?.[0]?.value || '';

        // 1. Try to find by googleId
        let user = await User.findOne({ googleId: profile.id });

        // 2. Try to find by email (link existing account)
        if (!user && email) user = await User.findOne({ email });

        // 3. Create new user
        if (!user) {
          const nameParts = (profile.displayName || '').split(' ');
          user = await User.create({
            firstName:    nameParts[0] || 'User',
            lastName:     nameParts.slice(1).join(' ') || 'Hardyy',
            email,
            googleId:     profile.id,
            googleAvatar: avatar,
            avatar,
            isVerified:   true,
            role:         'customer',
          });
        } else {
          // Update google fields if missing
          if (!user.googleId) { user.googleId = profile.id; user.googleAvatar = avatar; }
          if (!user.avatar && avatar) user.avatar = avatar;
          await user.save({ validateBeforeSave: false });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
