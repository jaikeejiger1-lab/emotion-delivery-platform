/**
 * AuditLog.js - Mongoose Schema (Production-Ready)
 * Records admin and staff mutations across the application for compliance & security audit trails.
 */
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // e.g., 'UPDATE_USER', 'DELETE_PRODUCT'
    },
    targetCollection: {
      type: String,
      required: true, // e.g., 'Users', 'Orders', 'Products'
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    oldState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ targetCollection: 1, targetId: 1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
