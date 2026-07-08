/**
 * paymentRoutes.js — Razorpay Payment Gateway Routes
 *
 * Dedicated payment route file extracted from orderRoutes.
 * Mounted at /api/payments in server.js.
 */

const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  checkout,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All payment routes require authentication
router.use(protect);

// POST /api/payments/order — Create a Razorpay order
router.post('/order', createRazorpayOrder);

// POST /api/payments/verify — Verify Razorpay payment signature and confirm order
router.post('/verify', checkout);

module.exports = router;
