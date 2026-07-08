/**
 * Order.js — Mongoose Schema (Production-Ready)
 *
 * Linked to User model via ObjectId and features robust status enums.
 */

const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const DeliveryAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false }
);

const TrackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Packing',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'order_placed',
        'gift_crafting',
        'quality_check',
        'out_for_delivery',
        'nearby',
        'delivered',
        'failed_delivery',
      ],
    },
    message: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    // Ordering user link
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Optional link to MemoryVault relation
    relationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (v) => v && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    packaging: {
      tier: {
        type: String,
        enum: ['standard', 'premium', 'luxury'],
        default: 'standard',
      },
      color: { type: String, default: 'kraft' },
      ribbon: { type: Boolean, default: false },
      packagingPrice: { type: Number, default: 0, min: 0 },
    },

    handwrittenLetter: {
      enabled: { type: Boolean, default: false },
      message: {
        type: String,
        trim: true,
        maxlength: [600, 'Letter message cannot exceed 600 characters'],
        default: '',
      },
      fontStyle: {
        type: String,
        enum: ['cursive', 'print', 'calligraphy'],
        default: 'cursive',
      },
      price: { type: Number, default: 99, min: 0 },
    },

    videoMessage: {
      enabled: { type: Boolean, default: false },
      videoUrl: { type: String, default: '' },
      qrCodeUrl: { type: String, default: '' },
      shortLink: { type: String, default: '' },
      price: { type: Number, default: 149, min: 0 },
    },

    secretSurpriseMode: {
      type: Boolean,
      default: false,
    },

    anonymousGift: {
      type: Boolean,
      default: false,
    },

    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },

    scheduledDelivery: {
      date: { type: Date, required: true },
      timeSlot: {
        type: String,
        enum: [
          '08:00-10:00',
          '10:00-12:00',
          '12:00-14:00',
          '14:00-16:00',
          '16:00-18:00',
          '18:00-20:00',
          '20:00-22:00',
        ],
        required: true,
      },
    },

    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      packagingFee: { type: Number, default: 0, min: 0 },
      letterFee: { type: Number, default: 0, min: 0 },
      videoFee: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },

    payment: {
      razorpayOrderId: { type: String, default: '' },
      razorpayPaymentId: { type: String, default: '' },
      razorpaySignature: { type: String, default: '' },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'Paid', 'Pending', 'Failed'],
        default: 'pending',
      },
      paidAt: { type: Date, default: null },
      method: { type: String, default: '' },
    },

    // Robust lifecycle status supporting standardized uppercase and lowercase statuses
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Paid',
        'Packing',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'draft',
        'confirmed',
        'paid',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'Pending',
    },

    tracking: {
      agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      agentName: { type: String, default: '' },
      agentPhone: { type: String, default: '' },
      currentCoordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      estimatedArrival: { type: Date, default: null },
      events: [TrackingEventSchema],
    },

    notifications: {
      orderConfirmationSent: { type: Boolean, default: false },
      outForDeliverySent: { type: Boolean, default: false },
      deliveredSent: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ 'payment.razorpayOrderId': 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'tracking.agentId': 1, status: 1 });
OrderSchema.index({ 'scheduledDelivery.date': 1 });

OrderSchema.virtual('orderNumber').get(function () {
  return `EDP-${this._id.toString().slice(-8).toUpperCase()}`;
});

module.exports = mongoose.model('Order', OrderSchema);
