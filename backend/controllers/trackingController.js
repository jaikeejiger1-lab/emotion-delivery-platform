/**
 * trackingController.js — Production GPS Telemetry & Tracking Engine
 *
 * Implements REST endpoints and WebSocket protocol for live courier tracking.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { sendOrderStatusAlert } = require('../services/notificationService');

// In-memory live telemetry cache: orderId -> { lat, lng, speed, partnerId, partnerName, updatedAt }
const liveLocations = new Map();
const clients = new Map(); // ws -> { userId, role, type }

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev_fallback_secret_key_12345';

// ─────────────────────────────────────────────────────────────────────
// POST /api/tracking/update — Courier pushes GPS coordinates
// Body: { orderId, lat, lng, speed, status, message }
// ─────────────────────────────────────────────────────────────────────
exports.updateTrackingPosition = async (req, res, next) => {
  try {
    const { orderId, lat, lng, speed = 0, status, message } = req.body;
    if (!orderId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'orderId, lat, and lng are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify courier authorization
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      String(order.tracking.agentId) !== String(req.user._id)
    ) {
      // If agentId wasn't set on order yet, auto-assign this delivery partner
      if (!order.tracking.agentId) {
        order.tracking.agentId = req.user._id;
        order.tracking.agentName = `${req.user.firstName} ${req.user.lastName}`;
        order.tracking.agentPhone = req.user.phone;
      } else {
        return res.status(403).json({ success: false, message: 'You are not assigned to deliver this order' });
      }
    }

    // Update MongoDB record
    order.tracking.currentCoordinates = { lat: Number(lat), lng: Number(lng) };

    // Calculate approximate ETA based on speed or default 25 mins
    if (!order.tracking.estimatedArrival) {
      order.tracking.estimatedArrival = new Date(Date.now() + 25 * 60 * 1000);
    }

    if (status) {
      order.status = status;
      order.tracking.events.push({
        status,
        message: message || `GPS telemetry update: Courier moving at ${speed} km/h`,
        coordinates: { lat: Number(lat), lng: Number(lng) },
        timestamp: new Date(),
      });
    }

    await order.save();
    if (status) {
      sendOrderStatusAlert(order._id, status, message);
    }

    // Cache in live telemetry map
    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      speed: Number(speed),
      partnerId: String(req.user._id),
      partnerName: `${req.user.firstName} ${req.user.lastName}`,
      status: order.status,
      estimatedArrival: order.tracking.estimatedArrival,
      updatedAt: new Date().toISOString(),
    };
    liveLocations.set(String(order._id), payload);

    // Broadcast over WebSocket if active admins/customers are listening
    clients.forEach((meta, ws) => {
      if (ws.readyState === 1 /* OPEN */) {
        ws.send(JSON.stringify({ type: 'location_update', orderId: String(order._id), ...payload }));
      }
    });

    res.json({
      success: true,
      message: 'Telemetry broadcast successfully',
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/tracking/:orderId — Fetch latest coordinates & ETA
// ─────────────────────────────────────────────────────────────────────
exports.getTrackingStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Check live memory cache first
    const cached = liveLocations.get(orderId);

    // Fetch full order record from MongoDB
    const order = await Order.findById(orderId)
      .select('tracking status scheduledDelivery orderNumber deliveryAddress items');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Tracking record not found' });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        recipientCity: order.deliveryAddress?.city,
        deliveryAddress: order.deliveryAddress,
        scheduledDelivery: order.scheduledDelivery,
        currentCoordinates: cached
          ? { lat: cached.lat, lng: cached.lng }
          : order.tracking.currentCoordinates,
        speed: cached?.speed || 0,
        estimatedArrival: order.tracking.estimatedArrival,
        agentName: order.tracking.agentName || cached?.partnerName || 'Assigned Courier',
        agentPhone: order.tracking.agentPhone || '',
        events: order.tracking.events || [],
        lastUpdated: cached?.updatedAt || order.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// WebSocket Server implementation
// ─────────────────────────────────────────────────────────────────────
const authenticateWS = async (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    return await User.findById(decoded.id).select('role firstName lastName');
  } catch { return null; }
};

exports.setupWebSocket = (wss) => {
  wss.on('connection', async (ws, req) => {
    const params = new URLSearchParams(req.url.replace('/ws/tracking', '').replace('?', ''));
    const token = params.get('token');
    const type = params.get('type');

    let user = await authenticateWS(token);
    if (!user) {
      user = { _id: 'anon', role: 'customer', firstName: 'Guest' };
    }

    clients.set(ws, { userId: String(user._id), role: user.role, type });
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw);
        if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } catch {}
    });

    ws.on('close', () => clients.delete(ws));
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
};

exports.liveLocations = liveLocations;
