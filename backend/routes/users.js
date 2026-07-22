const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');

router.use(protect);
router.get('/profile', userController.getProfile);
router.put('/profile', uploadProfileImage, handleUploadError, userController.updateProfile);
router.get('/my-tickets', userController.getMyTickets);
router.post('/push-token', userController.updatePushToken);
router.put('/notification-preferences', userController.updateNotificationPreferences);

module.exports = router;
