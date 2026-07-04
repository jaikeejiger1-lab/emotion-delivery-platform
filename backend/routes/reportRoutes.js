/**
 * reportRoutes.js — Protected Admin Reporting Routes
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { downloadReport } = require('../controllers/reportController');

// All report routes require admin or superadmin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// GET /api/reports/download
router.get('/download', downloadReport);

module.exports = router;
