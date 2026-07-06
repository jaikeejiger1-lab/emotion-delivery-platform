/**
 * orderController.js
 *
 * Handles:
 *  POST /api/orders/create-razorpay-order   — Step 1: Create Razorpay order
 *  POST /api/orders/checkout                — Step 2: Verify payment + persist order
 *  GET  /api/orders                         — User's order history
 *  GET  /api/orders/:id                     — Single order detail
 *  GET  /api/orders/tracking/:id            — Live tracking data
 *  PATCH /api/orders/:id/tracking           — Agent updates position (internal/admin)
 */

const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const MemoryVault = require('../models/MemoryVault');
const razorpay = require('../config/razorpay');
const { sendOrderConfirmation, notifyAdmins, sendOrderStatusAlert } = require('../services/notificationService');
const { generateVideoQR, buildVideoShortLink } = require('../services/qrService');

// ------------------------------------------------------------------
// Helper
// ------------------------------------------------------------------
const throwError = (msg, code = 400) => {
  const e = new Error(msg);
  e.statusCode = code;
  throw e;
};

// ------------------------------------------------------------------
// POST /api/orders/create-razorpay-order
//
// Creates a Razorpay Order (does NOT persist our Order yet).
// Body: { amount: number (paise), currency: 'INR', receipt: string }
// ------------------------------------------------------------------
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0) throwError('amount is required and must be > 0');

    const options = {
      amount: Math.round(amount), // Amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        platform: 'EmotionDelivery',
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// POST /api/orders/checkout
//
// Called AFTER Razorpay payment succeeds on the frontend.
// Verifies the payment signature, creates the Order document,
// generates QR code if needed, logs gift to MemoryVault, and
// fires all notification channels.
// ------------------------------------------------------------------
exports.checkout = async (req, res, next) => {
  try {
    const {
      // Razorpay payment verification fields
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

      // Order data
      items,
      packaging,
      handwrittenLetter,
      videoMessage,
      secretSurpriseMode,
      anonymousGift,
      deliveryAddress,
      scheduledDelivery,
      pricing,
      relationId,
    } = req.body;

    // ── 1. Verify Razorpay signature ──────────────────────────────
    let isValidSignature = false;
    if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.startsWith('your_')) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      isValidSignature = expectedSignature === razorpaySignature;
    } else {
      console.warn('⚠️ Razorpay Key Secret is not configured or in template state. Bypassing payment signature verification for simulation.');
      isValidSignature = true;
    }

    if (!isValidSignature) {
      throwError('Payment verification failed — invalid signature', 400);
    }

    // ── 2. Check for duplicate payment ───────────────────────────
    const existingOrder = await Order.findOne({
      'payment.razorpayPaymentId': razorpayPaymentId,
    });
    if (existingOrder) {
      return res.json({
        success: true,
        message: 'Order already processed',
        data: { orderId: existingOrder._id },
      });
    }

    // ── 3. Generate Video QR (if opted-in) ───────────────────────
    let qrCodeUrl = '';
    let shortLink = '';
    if (videoMessage?.enabled && videoMessage?.videoUrl) {
      // In production, upload buffer to S3 and store the S3 URL
      // Here we store the Base64 data-URI (sufficient for MVP)
      const tempOrderId = `tmp_${Date.now()}`;
      shortLink = buildVideoShortLink(tempOrderId);
      qrCodeUrl = await generateVideoQR(shortLink);
    }

    // ── 4. Persist the Order ──────────────────────────────────────
    const order = await Order.create({
      userId: req.user._id,
      relationId: relationId || null,
      items,
      packaging,
      handwrittenLetter: {
        ...handwrittenLetter,
        price: handwrittenLetter?.enabled ? 99 : 0,
      },
      videoMessage: {
        ...videoMessage,
        qrCodeUrl,
        shortLink,
        price: videoMessage?.enabled ? 149 : 0,
      },
      secretSurpriseMode: secretSurpriseMode || false,
      anonymousGift: anonymousGift || false,
      deliveryAddress,
      scheduledDelivery,
      pricing,
      payment: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        status: 'Paid',
        paidAt: new Date(),
      },
      status: 'Paid',
      tracking: {
        events: [
          {
            status: 'order_placed',
            message: 'Your order has been placed and is being prepared.',
            timestamp: new Date(),
          },
        ],
      },
    });

    // ── 5. Update video message with real order ID ────────────────
    if (videoMessage?.enabled) {
      const realShortLink = buildVideoShortLink(order._id.toString());
      const realQrCodeUrl = await generateVideoQR(realShortLink);
      order.videoMessage.shortLink = realShortLink;
      order.videoMessage.qrCodeUrl = realQrCodeUrl;
      await order.save();
    }

    // ── 6. Log gift in MemoryVault (if linked to a relation) ─────
    if (relationId) {
      const vault = await MemoryVault.findOne({ userId: req.user._id });
      if (vault) {
        const relation = vault.relations.id(relationId);
        if (relation && items.length > 0) {
          const primaryItem = items[0];
          relation.pastGifts.push({
            orderId: order._id,
            productName: primaryItem.name,
            productSnapshot: {
              id: primaryItem.productId,
              name: primaryItem.name,
              image: primaryItem.image,
              price: primaryItem.price,
            },
            giftedOn: new Date(),
          });
          await vault.save();
        }
      }
    }

    // ── 7. Fire notifications (non-blocking) ─────────────────────
    const user = await User.findById(req.user._id);
    sendOrderConfirmation(order, user).catch((err) =>
      console.error('Notification error:', err.message)
    );
    notifyAdmins({
      title: `New Order Placed — ${order.orderNumber}`,
      message: `Customer ${user.firstName} placed an order worth ₹${order.pricing.total.toLocaleString('en-IN')}.`,
      type: 'order_update',
      actionUrl: '/admin/orders',
    });

    // ── 8. Mark notifications sent ────────────────────────────────
    order.notifications.orderConfirmationSent = true;
    await order.save();

    res.status(201).json({
      success: true,
      message: '🎁 Order placed successfully!',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        qrCodeUrl: order.videoMessage.qrCodeUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// GET /api/orders
// User's order history (paginated)
// ------------------------------------------------------------------
exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user._id, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-payment.razorpaySignature')
        .lean(), // Optimize memory overhead
      Order.countDocuments({ userId: req.user._id, isActive: true }),
    ]);

    res.json({
      success: true,
      data: { orders, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// GET /api/orders/:id
// ------------------------------------------------------------------
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    }).select('-payment.razorpaySignature').lean();

    if (!order) throwError('Order not found', 404);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// GET /api/orders/tracking/:id
//
// Returns live tracking coordinates and events.
// Used to feed the Google Maps component on the frontend.
// ------------------------------------------------------------------
exports.getTracking = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('tracking status scheduledDelivery orderNumber');

    if (!order) throwError('Order not found', 404);

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        scheduledDelivery: order.scheduledDelivery,
        tracking: {
          currentCoordinates: order.tracking.currentCoordinates,
          estimatedArrival: order.tracking.estimatedArrival,
          agentName: order.tracking.agentName,
          agentPhone: order.tracking.agentPhone,
          events: order.tracking.events,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// PATCH /api/orders/:id/tracking  (Admin / Delivery Agent only)
// Updates the agent's current GPS position and optionally adds an event
// ------------------------------------------------------------------
exports.updateTracking = async (req, res, next) => {
  try {
    const { lat, lng, status, message, estimatedArrival } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throwError('Order not found', 404);

    // Update coordinates
    if (lat !== undefined && lng !== undefined) {
      order.tracking.currentCoordinates = { lat, lng };
    }
    if (estimatedArrival) {
      order.tracking.estimatedArrival = new Date(estimatedArrival);
    }

    // Push a new tracking event
    if (status) {
      order.tracking.events.push({
        status,
        message: message || '',
        coordinates: lat && lng ? { lat, lng } : undefined,
        timestamp: new Date(),
      });

      // Sync top-level order status
      const statusMap = {
        out_for_delivery: 'out_for_delivery',
        delivered: 'delivered',
        failed_delivery: 'confirmed', // Reset for re-delivery
      };
      if (statusMap[status]) {
        order.status = statusMap[status];
        sendOrderStatusAlert(order._id, order.status, message);
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Tracking updated',
      data: order.tracking,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// GET /api/orders/my-deliveries (Delivery Partner / Agent only)
// Fetches orders assigned to this agent
// ------------------------------------------------------------------
exports.getMyDeliveries = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const filter = { status: { $ne: 'Cancelled' } };

    if (!isAdmin) {
      filter['tracking.agentId'] = req.user._id;
    } else {
      // For executive admins, show orders with an assigned agent or active delivery lifecycle statuses
      filter.$or = [
        { 'tracking.agentId': { $ne: null } },
        { status: { $in: ['Confirmed', 'Packing', 'Out for Delivery', 'Delivered'] } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ 'scheduledDelivery.date': 1, createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// PATCH /api/orders/:id/location
// Receives GPS coordinates from delivery agent and updates order tracking
// ------------------------------------------------------------------
exports.updateOrderLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng, latitude, longitude, speed = 0, heading = 0, status, message } = req.body;
    const targetLat = lat !== undefined ? lat : latitude;
    const targetLng = lng !== undefined ? lng : longitude;

    if (targetLat === undefined || targetLng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude coordinates are required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify courier authorization
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      String(order.tracking.agentId) !== String(req.user._id)
    ) {
      if (!order.tracking.agentId) {
        order.tracking.agentId = req.user._id;
        order.tracking.agentName = `${req.user.firstName} ${req.user.lastName}`;
        order.tracking.agentPhone = req.user.phone;
      } else {
        return res.status(403).json({ success: false, message: 'You are not assigned to deliver this order' });
      }
    }

    order.tracking.currentCoordinates = {
      lat: Number(targetLat),
      lng: Number(targetLng),
    };

    if (!order.tracking.estimatedArrival) {
      order.tracking.estimatedArrival = new Date(Date.now() + 25 * 60 * 1000);
    }

    if (status) {
      order.status = status;
      order.tracking.events.push({
        status,
        description: message || `Order status updated to ${status} via live telemetry`,
        location: `${Number(targetLat).toFixed(4)}, ${Number(targetLng).toFixed(4)}`,
        timestamp: new Date(),
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: order.tracking,
    });
  } catch (error) {
    next(error);
  }
};


