/**
 * requireRole.js — Role-Based Access Control Middleware Factory
 * Supports both array argument: requireRole(['admin', 'superadmin'])
 * and rest parameters: requireRole('admin', 'superadmin')
 */
const requireRole = (...roles) => {
  // Flatten in case an array was passed as the first argument
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before verifying permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`,
      });
    }

    next();
  };
};

module.exports = requireRole;
