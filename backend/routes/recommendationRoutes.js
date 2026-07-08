/**
 * recommendationRoutes.js
 */

const express = require('express');
const router = express.Router();
const { getRecommendations, generateGreeting } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/recommendations
router.get('/', protect, getRecommendations);

// POST /api/recommendations/greeting — accessible with or without auth for builder flow
router.post('/greeting', generateGreeting);

module.exports = router;
