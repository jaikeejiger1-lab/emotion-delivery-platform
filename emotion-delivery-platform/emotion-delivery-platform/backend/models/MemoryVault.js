/**
 * MemoryVault.js — Mongoose Schema
 *
 * Acts as a personal CRM for each user.
 * Stores relationships (Mom, Partner, Friend…), important dates
 * (birthday, anniversary, etc.), past gift history, and AI-generated
 * preference tags used by the recommendation engine.
 */

const mongoose = require('mongoose');

// ------------------------------------------------------------------
// Sub-schema: A single important date / milestone
// ------------------------------------------------------------------
const MilestoneSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Milestone label is required'],
      trim: true,
      // e.g. "Birthday", "Anniversary", "Work Promotion", "Graduation"
    },
    date: {
      type: Date,
      required: [true, 'Milestone date is required'],
    },
    isRecurring: {
      type: Boolean,
      default: true, // Most occasions repeat annually
    },
    reminderDaysBefore: {
      type: Number,
      default: 7, // Send reminder 7 days before event
      min: 0,
      max: 60,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    // Auto-calculated on the frontend / aggregation pipeline
    daysUntilNext: {
      type: Number,
      default: null,
    },
  },
  { _id: true }
);

// ------------------------------------------------------------------
// Sub-schema: A past gifting record linked to this relation
// ------------------------------------------------------------------
const PastGiftSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    productName: {
      type: String,
      trim: true,
    },
    productSnapshot: {
      // Denormalised snapshot so we can display without joining Order
      id: String,
      name: String,
      image: String,
      price: Number,
    },
    occasion: {
      type: String,
      trim: true, // e.g. "Birthday 2024"
    },
    recipientRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null, // Recipient can rate via QR / link
    },
    giftedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ------------------------------------------------------------------
// Sub-schema: A person in the user's life
// ------------------------------------------------------------------
const RelationSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, 'Nickname / name is required'],
      trim: true,
      maxlength: [80, 'Nickname cannot exceed 80 characters'],
    },
    relation: {
      type: String,
      required: [true, 'Relation type is required'],
      enum: [
        'Mom',
        'Dad',
        'Girlfriend',
        'Boyfriend',
        'Wife',
        'Husband',
        'Sister',
        'Brother',
        'Friend',
        'Colleague',
        'Boss',
        'Child',
        'Grandparent',
        'Other',
      ],
    },
    // Optional contact info to pre-fill order delivery
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },

    // Important dates for this person
    milestones: [MilestoneSchema],

    // History of gifts sent to this person
    pastGifts: [PastGiftSchema],

    // AI preference tags (inferred from past gifts + ratings)
    // e.g. ["chocolate", "luxury", "self-care", "tech"]
    aiPreferenceTags: {
      type: [String],
      default: [],
    },

    // User-curated notes
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },

    // Budget preference (in INR)
    budgetRange: {
      min: { type: Number, default: 500 },
      max: { type: Number, default: 5000 },
    },
  },
  { _id: true, timestamps: true }
);

// ------------------------------------------------------------------
// Root MemoryVault schema  (one per user)
// ------------------------------------------------------------------
const MemoryVaultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Exactly one vault per user
    },

    relations: [RelationSchema],

    // Vault-level AI summary (regenerated periodically by cron)
    // e.g. "You tend to gift luxury items to your Mom and tech to your Dad."
    aiInsightSummary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ------------------------------------------------------------------
// Virtual: upcoming milestones (flattened across all relations)
// NOTE: This is computed on read; for large vaults use an aggregation
// pipeline or store daysUntilNext via a scheduled job.
// ------------------------------------------------------------------
MemoryVaultSchema.virtual('upcomingMilestones').get(function () {
  const today = new Date();
  const events = [];

  this.relations.forEach((rel) => {
    rel.milestones.forEach((ms) => {
      const upcoming = new Date(ms.date);
      upcoming.setFullYear(today.getFullYear());
      if (upcoming < today) upcoming.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((upcoming - today) / (1000 * 60 * 60 * 24));
      events.push({
        relationId: rel._id,
        nickname: rel.nickname,
        relation: rel.relation,
        label: ms.label,
        date: upcoming,
        daysUntil: diff,
        milestoneId: ms._id,
        aiPreferenceTags: rel.aiPreferenceTags,
        budgetRange: rel.budgetRange,
      });
    });
  });

  // Sort by soonest first
  return events.sort((a, b) => a.daysUntil - b.daysUntil);
});

module.exports = mongoose.model('MemoryVault', MemoryVaultSchema);
