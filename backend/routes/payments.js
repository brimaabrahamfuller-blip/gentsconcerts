const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mtnMomo = require('../services/mtnMomo');
const ticketController = require('../controllers/ticketController');
const { protect, restrictTo } = require('../middleware/auth');

const hasMatchingCallbackToken = (receivedToken) => {
    const expectedToken = process.env.MTN_MOMO_CALLBACK_TOKEN;
    if (!expectedToken || !receivedToken) return false;
    const received = Buffer.from(String(receivedToken));
    const expected = Buffer.from(String(expectedToken));
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

/**
 * Standalone collection operations are intentionally limited to administrators.
 * Customer ticket payments are initiated through the protected ticket flow.
 */
router.post('/initiate', protect, restrictTo('admin'), async (req, res) => {
    const { amount, currency, phoneNumber, externalId, description } = req.body;
    try {
        const referenceId = await mtnMomo.requestToPay(amount, currency, phoneNumber, externalId, description);
        res.status(200).json({
            success: true,
            referenceId,
            message: 'Payment initiated. Please complete it in your MTN app.'
        });
    } catch (error) {
        console.error('[Payments] Initiation error:', error);
        res.status(502).json({ success: false, message: 'Payment gateway is temporarily unavailable' });
    }
});

router.get('/status/:referenceId', protect, restrictTo('admin'), async (req, res) => {
    try {
        const status = await mtnMomo.getPaymentStatus(req.params.referenceId);
        res.status(200).json({ success: true, status });
    } catch (error) {
        console.error('[Payments] Status error:', error);
        res.status(502).json({ success: false, message: 'Failed to retrieve payment status' });
    }
});

/**
 * MTN callback endpoint. Configure MTN to send the same private callback token
 * in the X-MoMo-Callback-Token header before enabling PAYMENT_ENABLED.
 */
router.post('/callback', async (req, res) => {
    try {
        const suppliedToken = req.get('x-momo-callback-token')
            || req.get('x-webhook-token')
            || req.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!hasMatchingCallbackToken(suppliedToken)) {
            return res.status(401).send('Unauthorized callback');
        }

        const { resource } = req.body || {};
        const referenceId = resource?.match(/\/([^/]+)$/)?.[1];
        if (!referenceId) {
            return res.status(400).send('Invalid callback format');
        }

        // The controller checks MTN directly and performs an idempotent state
        // transition for both SUCCESSFUL and FAILED outcomes.
        const result = await ticketController.confirmPayment(null, referenceId);
        console.log('[MTN Callback] Processed payment callback', { referenceId, success: result.success });
        return res.status(200).send('Callback processed');
    } catch (error) {
        console.error('[MTN Callback] Error:', error);
        return res.status(500).send('Callback processing error');
    }
});

module.exports = router;
