/**
 * authController.js — Production Authentication Controller
 *
 * Implements:
 *  - Secure Registration & Login with Bcrypt + JWT
 *  - Account Lockout mechanism (5 failed attempts -> 15 min lock)
 *  - Forgot & Reset Password Flow with 6-digit phone OTP via Twilio
 *  - Delivery Partner Login & Google OAuth callback
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MemoryVault = require('../models/MemoryVault');
const { sendEmail, sendSMS, notifyAdmins, sendNotification } = require('../services/notificationService');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev_fallback_secret_key_12345';
const JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

// ── Helper: Issue JWT Token Response ────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { userId: user._id, id: user._id, role: user.role },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES() }
  );

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      staffPermissions: user.staffPermissions,
    },
  });
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Public sign-up — creates account and logs the user in immediately.
// Email verification is currently disabled (SMTP not yet configured).
// ────────────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'An account with this phone number already exists.',
        });
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || undefined,
      password,
      role: role === 'delivery' ? 'delivery' : 'customer',
      isVerified: true,   // Auto-verified — email verification not required for now
      isActive: true,
      isBanned: false,
    });

    // Notify admins a new account was created (non-blocking, safe if it fails)
    try {
      await notifyAdmins({
        title: 'New user registered',
        message: `${user.firstName} ${user.lastName} (${user.email}) just created an account.`,
      });
    } catch (notifyErr) {
      console.warn('notifyAdmins failed (non-fatal):', notifyErr.message);
    }

    // Log the user straight in after signup
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Features: 5 failed attempts lockout for 15 mins
// ────────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
      isBanned: false,
    }).select('+password +failedLoginAttempts +accountLockedUntil');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      const remainingMins = Math.ceil((user.accountLockedUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to excessive failed login attempts. Please try again in ${remainingMins} minutes.`,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address is not verified. Please check your email for the verification link.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save({ validateBeforeSave: false });
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes after 5 consecutive failed login attempts.',
        });
      }

      await user.save({ validateBeforeSave: false });
      const remainingAttempts = 5 - user.failedLoginAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. You have ${remainingAttempts} attempt(s) left before temporary account lockout.`,
      });
    }

    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
    }

    if (['staff', 'admin', 'superadmin'].includes(user.role)) {
      if (!Array.isArray(user.activityLog)) user.activityLog = [];
      user.activityLog.unshift({ action: 'login', ip: req.ip || '' });
      if (user.activityLog.length > 50) user.activityLog = user.activityLog.slice(0, 50);
    }

    await user.save({ validateBeforeSave: false });
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email
// (Kept for future use if you re-enable email verification later)
// ────────────────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendNotification({
      userId: user._id,
      title: 'Welcome to Aurora! 🎉',
      message: `Hi ${user.firstName}, your account is verified! Explore our personalized Aurora gift boxes.`,
      type: 'system',
      channel: ['in_app', 'email'],
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?verified=true`);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password (Phone-based via Twilio OTP)
// ────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account matching that phone number was found.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const messageBody = `Your Aurora verification code is: ${otp}. It expires in 10 minutes.`;
    await sendSMS(user.phone, messageBody);

    res.json({
      success: true,
      message: 'Password reset OTP has been sent to your phone number via SMS.',
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp-reset
// ────────────────────────────────────────────────────────────────────────
exports.verifyOtpReset = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, OTP, and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      phone,
      isActive: true,
    }).select('+otpCode +otpExpire +password');

    if (!user || !user.otpCode || !user.otpExpire) {
      return res.status(400).json({ success: false, message: 'No reset request found for this phone number. Please request OTP first.' });
    }

    if (user.otpExpire < Date.now()) {
      user.otpCode = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (String(user.otpCode).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP.' });
    }

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/login/delivery-partner (Phone + OTP login for delivery)
// ────────────────────────────────────────────────────────────────────────
exports.loginDeliveryPartner = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({
      phone,
      role: { $in: ['delivery', 'delivery_partner'] },
      isActive: true,
    }).select('+otpHash +otpExpire');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Delivery partner account not found' });
    }
    if (!user.otpHash || !user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(401).json({ success: false, message: 'OTP expired or not generated. Request a new one.' });
    }

    const isValid = await bcrypt.compare(String(otp), user.otpHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    user.otpHash = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// ────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ────────────────────────────────────────────────────────────────────────
// Google OAuth callback handler
// ────────────────────────────────────────────────────────────────────────
exports.googleCallback = async (req, res) => {
  try {
    sendTokenResponse(req.user, 200, res);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?error=oauth_failed`);
  }
};

// ────────────────────────────────────────────────────────────────────────
// GET/POST /api/auth/rescue-admin (Master Admin Recovery)
// ────────────────────────────────────────────────────────────────────────
exports.rescueAdmin = async (req, res, next) => {
  try {
    const adminEmail = process.env.RESCUE_ADMIN_EMAIL;
    const adminPassword = process.env.RESCUE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: 'RESCUE_ADMIN_EMAIL and RESCUE_ADMIN_PASSWORD env vars are required.',
      });
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      adminUser.password = adminPassword;
      adminUser.role = 'superadmin';
      adminUser.isVerified = true;
      adminUser.isActive = true;
      adminUser.isBanned = false;
      adminUser.failedLoginAttempts = 0;
      adminUser.accountLockedUntil = null;
      await adminUser.save();
    } else {
      adminUser = await User.create({
        firstName: 'Master',
        lastName: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        isVerified: true,
        isActive: true,
      });
    }

    sendTokenResponse(adminUser, 200, res);
  } catch (error) {
    next(error);
  }
};