/**
 * authMiddleware.js — JWT Bearer Authentication & Authorization
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no Bearer token provided',
      });
    }

    const secret = process.env.JWT_SECRET || 'dev_fallback_secret_key_12345';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Account suspended. Reason: ${user.bannedReason || 'Violation of terms'}`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token signature' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired — please log in again' });
    }
    next(error);
  }
};

/**
 * Role-based access control helper.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
