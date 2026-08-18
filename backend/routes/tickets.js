const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, requireApprovedHost } = require('../middleware/auth');

router.post('/purchase', protect, ticketController.purchaseTicket);
router.post('/confirm', protect, ticketController.confirmPaymentRoute);
router.post('/retry/:ticketId', protect, ticketController.retryPayment);
router.post('/scan', protect, requireApprovedHost, ticketController.scanTicket);
router.post('/use/:qrCode', protect, requireApprovedHost, ticketController.useTicket);
router.get('/verify/:qrCode', protect, requireApprovedHost, ticketController.verifyTicket);
router.get('/:id/download', protect, ticketController.downloadTicket);
router.get('/:id', protect, ticketController.getTicket);

module.exports = router;
