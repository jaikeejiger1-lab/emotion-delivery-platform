/**
 * User.js - Mongoose Schema (Production-Ready, RBAC Extended)
 * Roles: customer | delivery | staff | admin | superadmin
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    ip: { type: String, default: "" },
  },
  { timestamps: true, _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name required"],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, "Last name required"],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, "Invalid phone number"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    googleId: { type: String, default: "" },
    googleAvatar: { type: String, default: "" },
    avatar: { type: String, default: "" },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: { lat: Number, lng: Number },
    },
    // Role-Based Access Control
    role: {
      type: String,
      enum: ["customer", "delivery", "delivery_partner", "staff", "admin", "superadmin"],
      default: "customer",
    },
    staffPermissions: {
      type: [String],
      enum: [
        "view_orders",
        "update_orders",
        "view_customers",
        "manage_inventory",
        "view_analytics",
        "manage_coupons",
      ],
      default: [],
    },
    activityLog: { type: [ActivityLogSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String, default: "" },

    // Security & Account Lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },

    // OTP Reset & Verification Fields
    resetPasswordOTP: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    otpHash: { type: String, select: false },
    otpCode: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpire: { type: Date, select: false },
    verificationToken: { type: String, select: false },
    razorpayCustomerId: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual("memoryVault", {
  ref: "MemoryVault",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

// Pre-save hook for password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is currently locked
UserSchema.methods.isLocked = function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

// Activity logging helper
UserSchema.methods.logActivity = async function (action, ip = "") {
  this.activityLog.unshift({ action, ip });
  if (this.activityLog.length > 50) this.activityLog = this.activityLog.slice(0, 50);
  await this.save();
};

UserSchema.index({ role: 1, isActive: 1, isBanned: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", UserSchema);
