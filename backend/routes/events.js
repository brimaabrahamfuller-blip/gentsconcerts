const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadEventFlyer, handleUploadError } = require('../middleware/upload');

router.get('/', eventController.getAllEvents);

router.use(protect);
router.get('/host/my-events', restrictTo('host', 'admin'), eventController.getMyEvents);
router.get('/:id', eventController.getEvent);
router.post('/', restrictTo('host', 'admin'), uploadEventFlyer, handleUploadError, eventController.createEvent);
router.put('/:id', restrictTo('host', 'admin'), uploadEventFlyer, handleUploadError, eventController.updateEvent);
router.delete('/:id', restrictTo('host', 'admin'), eventController.deleteEvent);

module.exports = router;
