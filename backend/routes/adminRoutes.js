/**
 * adminRoutes.js — Protected Admin API Routes with Global Audit Interceptor
 * Requires valid JWT and role: 'admin' or 'superadmin'
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const globalAuditMiddleware = require('../middleware/auditMiddleware');
const {
  getStats,
  listUsers,
  toggleBan,
  triggerPasswordReset,
  deleteUser,
  listOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  listDeliveryPartners,
  listAuditLogs,
} = require('../controllers/adminController');

// Apply protection, role check, and automated audit logging middleware to all admin routes
const adminOnly = [protect, requireRole('admin', 'superadmin'), globalAuditMiddleware];

// Dashboard overview & stats
router.get('/stats', ...adminOnly, getStats);

// User management
router.get('/users', ...adminOnly, listUsers);
router.patch('/users/:id/ban', ...adminOnly, toggleBan);
router.post('/users/:id/reset-password', ...adminOnly, triggerPasswordReset);
router.delete('/users/:id', ...adminOnly, deleteUser);

// Order management
router.get('/orders', ...adminOnly, listOrders);
router.patch('/orders/:id/status', ...adminOnly, updateOrderStatus);
router.patch('/orders/:id/assign', ...adminOnly, assignDeliveryPartner);

// Delivery partners & audit trail
router.get('/delivery-partners', ...adminOnly, listDeliveryPartners);
router.get('/audit-logs', ...adminOnly, listAuditLogs);

module.exports = router;
