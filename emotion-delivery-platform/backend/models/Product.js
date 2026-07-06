/**
 * Product.js - Mongoose Schema (Production-Ready)
 * Inventory items available for inclusion in customized gift boxes.
 */
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "chocolates",
        "flowers",
        "plushies",
        "perfumes",
        "personalized",
        "accessories",
        "experiences",
        "birthday",
        "anniversary",
        "proposal",
        "wedding",
        "corporate",
        "other",
      ],
      default: "other",
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      default: null,
    },
    image: {
      type: String,
      required: true,
      default: "",
    },
    gallery: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    attributes: {
      weight: { type: String, default: "" },
      dimensions: { type: String, default: "" },
      color: { type: String, default: "" },
    },
    rating: {
      average: { type: Number, default: 5, min: 1, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.virtual("inStock").get(function () {
  return this.stock > 0 && this.isActive;
});

ProductSchema.index({ isActive: 1, category: 1, price: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", ProductSchema);
