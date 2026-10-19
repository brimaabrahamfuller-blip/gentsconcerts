const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const mtnMomo = require('../services/mtnMomo');
const ticketController = require('../controllers/ticketController');
const WebhookEvent = require('../models/WebhookEvent');
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
    return res.status(410).json({
        success: false,
        message: 'Standalone payment initiation has been retired. Use the ticket purchase flow so the request is idempotent and ledger-backed.'
    });
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
    let webhookEvent;
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

        const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');
        const eventKey = `mtn_momo:collection:${referenceId}`;
        webhookEvent = await WebhookEvent.findOne({ eventKey });
        if (webhookEvent?.status === 'processed' || webhookEvent?.status === 'deferred') {
            return res.status(200).send('Callback already processed');
        }
        if (!webhookEvent) {
            try {
                webhookEvent = await WebhookEvent.create({
                    eventKey,
                    providerReference: referenceId,
                    payloadHash,
                    requestId: req.id,
                    status: 'received'
                });
            } catch (creationError) {
                if (creationError?.code !== 11000) throw creationError;
                webhookEvent = await WebhookEvent.findOne({ eventKey });
                if (!webhookEvent) throw creationError;
                if (webhookEvent.status === 'processed' || webhookEvent.status === 'deferred') {
                    return res.status(200).send('Callback already processed');
                }
            }
        }
        webhookEvent.status = 'received';
        webhookEvent.requestId = req.id;
        webhookEvent.lastError = undefined;
        await webhookEvent.save();

        // The controller checks MTN directly and performs an idempotent state
        // transition for both SUCCESSFUL and FAILED outcomes.
        const result = await ticketController.confirmPayment(null, referenceId);
        webhookEvent.attemptCount += 1;
        webhookEvent.status = result.success ? 'processed' : 'deferred';
        webhookEvent.outcome = result.success ? 'payment_confirmed' : (result.status || 'payment_pending');
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        console.log('[MTN Callback] Processed payment callback', { referenceId, success: result.success, requestId: req.id });
        return res.status(200).send('Callback processed');
    } catch (error) {
        if (webhookEvent) {
            webhookEvent.status = 'failed';
            webhookEvent.attemptCount += 1;
            webhookEvent.lastError = error.message || 'Callback processing error';
            await webhookEvent.save().catch((saveError) => console.error('[MTN Callback] Failed to save webhook error', saveError.message));
        }
        console.error('[MTN Callback] Error:', error);
        return res.status(500).send('Callback processing error');
    }
});

module.exports = router;
