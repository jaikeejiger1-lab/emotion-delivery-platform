/**
 * authRoutes.js — Authentication API Routes
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  verifyEmail,
  verifyOtpReset,
  loginDeliveryPartner,
  googleCallback,
  rescueAdmin,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ── Rescue Admin Guard ── Only callable with the correct RESCUE_ADMIN_SECRET env var
const rescueAdminGuard = (req, res, next) => {
  const secret = process.env.RESCUE_ADMIN_SECRET;
  if (!secret) {
    // If no secret is configured, endpoint is disabled entirely
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const provided =
    req.headers['x-rescue-secret'] ||
    req.query.secret ||
    req.body?.secret;
  if (provided !== secret) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
};

// ── Public Authentication Routes ────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp-reset', verifyOtpReset);
router.post('/login/delivery-partner', loginDeliveryPartner);
router.get('/rescue-admin', rescueAdminGuard, rescueAdmin);
router.post('/rescue-admin', rescueAdminGuard, rescueAdmin);

// ── Protected Authentication Routes ─────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// ── Google OAuth Routes ─────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure', session: false }),
  googleCallback
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ success: false, message: 'Google authentication failed' });
});

module.exports = router;
