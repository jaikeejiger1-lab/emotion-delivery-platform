/**
 * memoryVaultController.js
 *
 * Handles all Memory Vault operations:
 *  POST /api/memory-vault/add     — add relation or milestone
 *  GET  /api/memory-vault         — get the user's full vault
 *  PUT  /api/memory-vault/relation/:relId — update a relation
 *  DELETE /api/memory-vault/relation/:relId — remove a relation
 *  GET  /api/memory-vault/upcoming — get upcoming milestones (next 30 days)
 */

const MemoryVault = require('../models/MemoryVault');
const { validationResult } = require('express-validator');

// ------------------------------------------------------------------
// Helper: throw formatted error
// ------------------------------------------------------------------
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

// ------------------------------------------------------------------
// GET /api/memory-vault
// Returns the authenticated user's complete vault
// ------------------------------------------------------------------
exports.getVault = async (req, res, next) => {
  try {
    let vault = await MemoryVault.findOne({ userId: req.user._id });

    if (!vault) {
      // Auto-create an empty vault on first access
      vault = await MemoryVault.create({ userId: req.user._id, relations: [] });
    }

    res.json({
      success: true,
      data: {
        vault,
        upcomingMilestones: vault.upcomingMilestones, // Virtual
      },
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// POST /api/memory-vault/add
//
// Body can be one of:
//   { type: 'relation', ...relationData }          → add a new person
//   { type: 'milestone', relationId, ...msData }   → add a date to a person
//   { type: 'gift', relationId, ...giftData }       → log a past gift
// ------------------------------------------------------------------
exports.addToVault = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, errors: errors.array() });
    }

    const { type } = req.body;

    let vault = await MemoryVault.findOne({ userId: req.user._id });
    if (!vault) {
      vault = await MemoryVault.create({ userId: req.user._id, relations: [] });
    }

    // ---- Case 1: Add a new relation ----
    if (type === 'relation') {
      const { nickname, relation, phone, email, profilePhoto, notes, budgetRange } =
        req.body;

      if (!nickname || !relation) {
        throwError('nickname and relation are required');
      }

      vault.relations.push({
        nickname,
        relation,
        phone: phone || '',
        email: email || '',
        profilePhoto: profilePhoto || '',
        notes: notes || '',
        budgetRange: budgetRange || { min: 500, max: 5000 },
        milestones: [],
        pastGifts: [],
        aiPreferenceTags: [],
      });

      await vault.save();
      const newRelation = vault.relations[vault.relations.length - 1];

      return res.status(201).json({
        success: true,
        message: `${nickname} added to your Memory Vault`,
        data: newRelation,
      });
    }

    // ---- Case 2: Add a milestone to an existing relation ----
    if (type === 'milestone') {
      const { relationId, label, date, isRecurring, reminderDaysBefore } =
        req.body;

      if (!relationId || !label || !date) {
        throwError('relationId, label, and date are required for a milestone');
      }

      const relation = vault.relations.id(relationId);
      if (!relation) throwError('Relation not found in vault', 404);

      relation.milestones.push({
        label,
        date: new Date(date),
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        reminderDaysBefore: reminderDaysBefore || 7,
      });

      await vault.save();
      const newMs = relation.milestones[relation.milestones.length - 1];

      return res.status(201).json({
        success: true,
        message: `Milestone "${label}" added for ${relation.nickname}`,
        data: newMs,
      });
    }

    // ---- Case 3: Log a past gift ----
    if (type === 'gift') {
      const { relationId, orderId, productName, productSnapshot, occasion } =
        req.body;

      if (!relationId || !productName) {
        throwError('relationId and productName are required to log a gift');
      }

      const relation = vault.relations.id(relationId);
      if (!relation) throwError('Relation not found in vault', 404);

      relation.pastGifts.push({
        orderId: orderId || null,
        productName,
        productSnapshot: productSnapshot || {},
        occasion: occasion || '',
        giftedOn: new Date(),
      });

      await vault.save();

      return res.status(201).json({
        success: true,
        message: `Gift logged for ${relation.nickname}`,
      });
    }

    throwError(`Unknown type '${type}'. Use 'relation', 'milestone', or 'gift'`);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// PUT /api/memory-vault/relation/:relId
// Update a relation's details / preference tags / budget
// ------------------------------------------------------------------
exports.updateRelation = async (req, res, next) => {
  try {
    const vault = await MemoryVault.findOne({ userId: req.user._id });
    if (!vault) throwError('Vault not found', 404);

    const relation = vault.relations.id(req.params.relId);
    if (!relation) throwError('Relation not found', 404);

    // Merge updatable fields
    const updatable = [
      'nickname', 'phone', 'email', 'profilePhoto', 'notes',
      'budgetRange', 'aiPreferenceTags',
    ];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) relation[field] = req.body[field];
    });

    await vault.save();

    res.json({ success: true, message: 'Relation updated', data: relation });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// DELETE /api/memory-vault/relation/:relId
// ------------------------------------------------------------------
exports.deleteRelation = async (req, res, next) => {
  try {
    const vault = await MemoryVault.findOne({ userId: req.user._id });
    if (!vault) throwError('Vault not found', 404);

    const relation = vault.relations.id(req.params.relId);
    if (!relation) throwError('Relation not found', 404);

    relation.deleteOne();
    await vault.save();

    res.json({ success: true, message: 'Relation removed from Memory Vault' });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// GET /api/memory-vault/upcoming
// Returns milestones occurring in the next `days` days (default 30)
// ------------------------------------------------------------------
exports.getUpcoming = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const vault = await MemoryVault.findOne({ userId: req.user._id });

    if (!vault) {
      return res.json({ success: true, data: [] });
    }

    const upcoming = vault.upcomingMilestones.filter(
      (m) => m.daysUntil <= days
    );

    res.json({ success: true, data: upcoming });
  } catch (error) {
    next(error);
  }
};
