/**
 * trackingRoutes.js — GPS Telemetry API Routes
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { updateTrackingPosition, getTrackingStatus } = require('../controllers/trackingController');

// POST /api/tracking/update — Courier / Partner pushes live GPS coordinates
router.post(
  '/update',
  protect,
  authorize('delivery', 'delivery_partner', 'delivery_agent', 'admin', 'superadmin'),
  updateTrackingPosition
);

// GET /api/tracking/:orderId — Public / Protected status & coordinate check
router.get('/:orderId', getTrackingStatus);

module.exports = router;
