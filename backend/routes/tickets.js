const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/purchase', protect, ticketController.purchaseTicket);
router.post('/confirm', protect, ticketController.confirmPaymentRoute);
router.post('/retry/:ticketId', protect, ticketController.retryPayment);
router.post('/use/:qrCode', protect, ticketController.useTicket);
router.get('/verify/:qrCode', ticketController.verifyTicket);
router.get('/:id', protect, ticketController.getTicket);

module.exports = router;
