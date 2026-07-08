/**
 * WebsiteSettings.js - Mongoose Schema (Production-Ready)
 * Global site configuration singleton, managing features, banners, fees, and operational states.
 */
const mongoose = require("mongoose");

const WebsiteSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "Aurora",
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcementBanner: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "" },
      type: { type: String, enum: ["info", "warning", "promotion", "alert"], default: "info" },
    },
    deliveryFees: {
      standard: { type: Number, default: 49, min: 0 },
      express: { type: Number, default: 99, min: 0 },
      freeDeliveryThreshold: { type: Number, default: 999, min: 0 },
    },
    serviceablePincodes: {
      type: [String],
      default: [], // If empty, all pincodes accepted or handled dynamically
    },
    maxDailySlots: {
      type: Number,
      default: 50,
    },
    contactInfo: {
      supportEmail: { type: String, default: "support@emotiondelivery.com" },
      supportPhone: { type: String, default: "+91 9876543210" },
      address: { type: String, default: "123 Emotion Boulevard, Tech Park" },
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    seo: {
      metaTitle: { type: String, default: "Aurora — Crafting Meaningful Gift Boxes" },
      metaDescription: { type: String, default: "Send personalised gift boxes with handwritten letters and video messages." },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WebsiteSettings", WebsiteSettingsSchema);
