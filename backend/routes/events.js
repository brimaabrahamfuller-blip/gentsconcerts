const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, requireApprovedHost } = require('../middleware/auth');
const { uploadEventMedia, handleUploadError } = require('../middleware/upload');

// Public catalogue routes only return approved, published events.
router.get('/', eventController.getAllEvents);
router.get('/:id/promo-video', eventController.streamPromoVideo);
router.get('/:id', eventController.getEvent);

router.use(protect);
router.get('/host/my-events', requireApprovedHost, eventController.getMyEvents);
router.post('/', requireApprovedHost, uploadEventMedia, handleUploadError, eventController.createEvent);
router.put('/:id', requireApprovedHost, uploadEventMedia, handleUploadError, eventController.updateEvent);
router.post('/:id/submit', requireApprovedHost, eventController.submitEventForReview);
router.delete('/:id', requireApprovedHost, eventController.deleteEvent);

module.exports = router;
