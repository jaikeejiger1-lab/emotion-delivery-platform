/**
 * orderRoutes.js
 */

const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  checkout,
  getUserOrders,
  getOrderById,
  getTracking,
  updateTracking,
  getMyDeliveries,
  updateOrderLocation,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(protect);

// POST /api/orders/create-razorpay-order & /api/payments/order
router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/order', createRazorpayOrder);

// POST /api/orders/checkout & /api/payments/verify
router.post('/checkout', checkout);
router.post('/verify', checkout);

// GET /api/orders/my-deliveries (Delivery Partner only)
router.get(
  '/my-deliveries',
  authorize('delivery', 'delivery_partner', 'delivery_agent', 'admin', 'superadmin'),
  getMyDeliveries
);

// GET /api/orders
router.get('/', getUserOrders);

// GET  /api/orders/tracking/:id
router.get('/tracking/:id', getTracking);

// GET /api/orders/:id
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/tracking — Admin / Delivery Agent only
router.patch(
  '/:id/tracking',
  authorize('admin', 'superadmin', 'delivery', 'delivery_partner', 'delivery_agent'),
  updateTracking
);

// PATCH /api/orders/:id/location — Live GPS Telemetry Update
router.patch(
  '/:id/location',
  authorize('admin', 'superadmin', 'delivery', 'delivery_partner', 'delivery_agent'),
  updateOrderLocation
);

module.exports = router;

