const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

router.post('/purchase', protect, ticketController.purchaseTicket);
router.post('/confirm', protect, ticketController.confirmPayment);
router.get('/verify/:qrCode', ticketController.verifyTicket);
router.get('/:id', protect, ticketController.getTicket);

module.exports = router;
