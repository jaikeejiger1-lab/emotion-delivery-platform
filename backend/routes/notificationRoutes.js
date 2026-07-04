/**
 * notificationRoutes.js — Protected Notification API Endpoints
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

router.get('/', getUserNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/read/:id', markNotificationRead);

module.exports = router;
