const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all routes and restrict to owners/super-admins
router.use(protect);
router.use(restrictTo('admin', 'owner'));

router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivityLogs);
router.get('/flags', adminController.getFlags);
router.patch('/flags/:id', adminController.updateFlag);
router.patch('/users/:id/status', adminController.manageUser);

module.exports = router;
