const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Send reminders for upcoming events (admin/host only, or automated)
router.post('/send-event-reminders', protect, restrictTo('host', 'admin'), notificationController.sendEventReminders);

// Send notification to all users about a specific event (admin only)
router.post('/broadcast', protect, restrictTo('admin'), notificationController.broadcastNotification);

// Get notification history (admin)
router.get('/history', protect, restrictTo('admin'), notificationController.getNotificationHistory);

module.exports = router;
