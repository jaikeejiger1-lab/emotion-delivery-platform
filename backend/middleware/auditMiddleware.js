/**
 * auditMiddleware.js — Global Compliance Audit Interceptor
 *
 * Automatically records POST, PATCH, PUT, and DELETE requests made to protected
 * administrative endpoints (/api/admin/*) into the MongoDB AuditLog collection.
 */
const AuditLog = require('../models/AuditLog');

const globalAuditMiddleware = async (req, res, next) => {
  // Only monitor mutating HTTP methods
  const mutatingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Hook into res.on('finish') so we log the completed administrative action
  res.on('finish', async () => {
    try {
      // Only log successful or client-attempted mutations where a user is authenticated
      if (req.user && res.statusCode >= 200 && res.statusCode < 500) {
        // Sanitize sensitive fields from body before storing
        const sanitizedPayload = { ...req.body };
        if (sanitizedPayload.password) sanitizedPayload.password = '[REDACTED]';
        if (sanitizedPayload.token) sanitizedPayload.token = '[REDACTED]';

        // Derive action name from route path and HTTP method
        const routePath = req.originalUrl || req.baseUrl + req.path;
        const actionName = `ADMIN_${req.method}_${routePath.replace('/api/admin/', '').split('/')[0].toUpperCase()}`;
        const targetCollection = routePath.includes('/users') ? 'Users' : routePath.includes('/orders') ? 'Orders' : 'System';
        
        // Extract targetId if present in URL params or path
        const targetIdMatch = routePath.match(/\/([0-9a-fA-F]{24})/);
        const targetId = targetIdMatch ? targetIdMatch[1] : req.user._id;

        await AuditLog.create({
          performedBy: req.user._id,
          action: actionName,
          targetCollection,
          targetId,
          newState: sanitizedPayload,
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || '',
          description: `Global Intercept: ${req.method} ${routePath} (HTTP ${res.statusCode}) by ${req.user.email}`,
        });
      }
    } catch (err) {
      console.error('[AuditMiddleware] Failed to write automated audit record:', err.message);
    }
  });

  next();
};

module.exports = globalAuditMiddleware;
