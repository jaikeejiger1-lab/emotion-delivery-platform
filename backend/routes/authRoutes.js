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

// ── Public Authentication Routes ────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp-reset', verifyOtpReset);
router.post('/login/delivery-partner', loginDeliveryPartner);
router.get('/rescue-admin', rescueAdmin);
router.post('/rescue-admin', rescueAdmin);

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
