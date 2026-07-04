/**
 * adminController.js — Master Admin Portal Controllers
 *
 * Implements real Mongoose aggregation stats, User management (ban, suspend, reset password),
 * and Order management (status mutation, delivery partner assignment).
 * Every mutation creates a compliance record in the AuditLog collection.
 */
const User = require('../models/User');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { sendOrderStatusAlert } = require('../services/notificationService');

// Helper function to create audit logs
const createAuditLog = async ({ performedBy, action, targetCollection, targetId, oldState, newState, req, description }) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      targetCollection,
      targetId,
      oldState: oldState || null,
      newState: newState || null,
      ipAddress: req ? req.ip : '',
      userAgent: req ? req.get('user-agent') || '' : '',
      description: description || `${action} on ${targetCollection} (${targetId})`,
    });
  } catch (err) {
    console.error('Failed to write AuditLog:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/stats — Real Mongoose Aggregation Metrics
// ─────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    // Run parallel aggregation & count queries
    const [
      totalUsers,
      deliveryPartners,
      activeOrders,
      revenueResult,
      recentOrders,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({ role: { $in: ['delivery_partner', 'delivery'] } }),
      Order.countDocuments({
        status: { $in: ['Pending', 'Confirmed', 'Packing', 'Out for Delivery', 'confirmed', 'processing', 'out_for_delivery'] },
      }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } },
      ]),
      Order.find()
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      AuditLog.find()
        .populate('performedBy', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRevenue,
        activeOrders,
        deliveryPartners,
        recentOrders,
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/users — List & search platform users
// ─────────────────────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const { role, banned, search, page = 1 } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (banned !== undefined && banned !== 'all') filter.isBanned = banned === 'true';
    if (search) {
      const r = new RegExp(search, 'i');
      filter.$or = [{ firstName: r }, { lastName: r }, { email: r }, { phone: r }];
    }

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (Number(page) - 1) * limit;
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -resetPasswordOTP -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: users,
      meta: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/ban — Suspend / Ban or Unban User
// ─────────────────────────────────────────────────────────────────────
exports.toggleBan = async (req, res, next) => {
  try {
    const { banned, reason = '' } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'superadmin' || (user.role === 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ success: false, message: 'Cannot suspend privileged admin accounts' });
    }

    const oldState = { isBanned: user.isBanned, bannedReason: user.bannedReason };
    user.isBanned = !!banned;
    user.bannedReason = banned ? reason : '';
    await user.save({ validateBeforeSave: false });

    // CRITICAL: Write audit log
    await createAuditLog({
      performedBy: req.user._id,
      action: banned ? 'SUSPEND_USER' : 'UNBAN_USER',
      targetCollection: 'Users',
      targetId: user._id,
      oldState,
      newState: { isBanned: user.isBanned, bannedReason: user.bannedReason },
      req,
      description: `Admin ${req.user.email} ${banned ? 'suspended' : 'unbanned'} user ${user.email}`,
    });

    res.json({
      success: true,
      message: `User ${banned ? 'suspended' : 'unbanned'} successfully`,
      data: { _id: user._id, isBanned: user.isBanned, bannedReason: user.bannedReason },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/admin/users/:id/reset-password — Trigger Password Reset
// ─────────────────────────────────────────────────────────────────────
exports.triggerPasswordReset = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate temporary 8-char password
    const tempPassword = `Temp@${Math.floor(100000 + Math.random() * 900000)}`;
    user.password = tempPassword;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    // CRITICAL: Write audit log
    await createAuditLog({
      performedBy: req.user._id,
      action: 'RESET_USER_PASSWORD',
      targetCollection: 'Users',
      targetId: user._id,
      oldState: { passwordReset: false },
      newState: { passwordReset: true },
      req,
      description: `Admin ${req.user.email} triggered temporary password reset for user ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword, // Return so admin can securely disclose to staff/user
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id — Delete user
// ─────────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });
    }

    const oldState = { email: user.email, role: user.role };
    await user.deleteOne();

    await createAuditLog({
      performedBy: req.user._id,
      action: 'DELETE_USER',
      targetCollection: 'Users',
      targetId: req.params.id,
      oldState,
      newState: null,
      req,
      description: `Admin ${req.user.email} permanently deleted user ${user.email}`,
    });

    res.json({ success: true, message: 'User deleted permanently' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/orders — List all platform orders
// ─────────────────────────────────────────────────────────────────────
exports.listOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (Number(page) - 1) * limit;
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('tracking.agentId', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: orders,
      meta: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/:id/status — Update order status
// ─────────────────────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message = '' } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const oldState = { status: order.status };
    order.status = status;

    // Push tracking event
    order.tracking.events.push({
      status,
      message: message || `Order status updated to ${status} by admin`,
      timestamp: new Date(),
    });

    await order.save();

    // Trigger customer notification
    sendOrderStatusAlert(order._id, status, message);

    // CRITICAL: Write audit log
    await createAuditLog({
      performedBy: req.user._id,
      action: 'UPDATE_ORDER_STATUS',
      targetCollection: 'Orders',
      targetId: order._id,
      oldState,
      newState: { status: order.status },
      req,
      description: `Admin ${req.user.email} updated order #${order._id} status from ${oldState.status} to ${status}`,
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/:id/assign — Assign delivery partner
// ─────────────────────────────────────────────────────────────────────
exports.assignDeliveryPartner = async (req, res, next) => {
  try {
    const { deliveryPartnerId } = req.body;
    if (!deliveryPartnerId) {
      return res.status(400).json({ success: false, message: 'deliveryPartnerId is required' });
    }

    const partner = await User.findById(deliveryPartnerId);
    if (!partner || !['delivery_partner', 'delivery'].includes(partner.role)) {
      return res.status(400).json({ success: false, message: 'Selected user is not a registered delivery partner' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const oldState = { agentId: order.tracking.agentId, agentName: order.tracking.agentName };
    order.tracking.agentId = partner._id;
    order.tracking.agentName = `${partner.firstName} ${partner.lastName}`;
    order.tracking.agentPhone = partner.phone;

    if (order.status === 'Pending' || order.status === 'Confirmed') {
      order.status = 'Packing';
    }

    order.tracking.events.push({
      status: order.status,
      message: `Assigned delivery partner: ${partner.firstName} ${partner.lastName}`,
      timestamp: new Date(),
    });

    await order.save();

    // CRITICAL: Write audit log
    await createAuditLog({
      performedBy: req.user._id,
      action: 'ASSIGN_DELIVERY_PARTNER',
      targetCollection: 'Orders',
      targetId: order._id,
      oldState,
      newState: { agentId: partner._id, agentName: order.tracking.agentName },
      req,
      description: `Admin ${req.user.email} assigned delivery partner ${order.tracking.agentName} to order #${order._id}`,
    });

    res.json({
      success: true,
      message: `Assigned ${order.tracking.agentName} to order`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/delivery-partners — List delivery agents for dropdowns
// ─────────────────────────────────────────────────────────────────────
exports.listDeliveryPartners = async (req, res, next) => {
  try {
    const partners = await User.find({ role: { $in: ['delivery_partner', 'delivery'] }, isBanned: false })
      .select('firstName lastName email phone')
      .sort({ firstName: 1 })
      .lean();
    res.json({ success: true, data: partners });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs — Paginated read-only list of system audits
// ─────────────────────────────────────────────────────────────────────
exports.listAuditLogs = async (req, res, next) => {
  try {
    const { action, collection, page = 1 } = req.query;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const filter = {};

    if (action && action !== 'all') filter.action = action;
    if (collection && collection !== 'all') filter.targetCollection = collection;

    const skip = (Number(page) - 1) * limit;
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: logs,
      meta: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
