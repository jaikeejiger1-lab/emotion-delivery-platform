/**
 * memoryVaultRoutes.js
 *
 * All routes protected by JWT (protect middleware).
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getVault,
  addToVault,
  updateRelation,
  deleteRelation,
  getUpcoming,
} = require('../controllers/memoryVaultController');
const { protect } = require('../middleware/authMiddleware');

// All vault routes require authentication
router.use(protect);

// GET  /api/memory-vault           → full vault
// GET  /api/memory-vault/upcoming  → next N upcoming milestones
// POST /api/memory-vault/add       → add relation | milestone | gift
// PUT  /api/memory-vault/relation/:relId
// DELETE /api/memory-vault/relation/:relId

router.get('/', getVault);
router.get('/upcoming', getUpcoming);

router.post(
  '/add',
  [
    body('type')
      .isIn(['relation', 'milestone', 'gift'])
      .withMessage("type must be 'relation', 'milestone', or 'gift'"),
  ],
  addToVault
);

router.put('/relation/:relId', updateRelation);
router.delete('/relation/:relId', deleteRelation);

module.exports = router;
