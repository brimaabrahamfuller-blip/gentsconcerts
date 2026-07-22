const express = require("express");
const router = express.Router();
const mtnMomo = require("../services/mtnMomo");
const ticketController = require("../controllers/ticketController");

/**
 * POST /api/payments/initiate
 * Initiate a standalone payment (not tied to ticket purchase)
 */
router.post("/initiate", async (req, res) => {
    const { amount, currency, phoneNumber, externalId, description } = req.body;
    try {
        const referenceId = await mtnMomo.requestToPay(amount, currency, phoneNumber, externalId, description);
        res.status(200).json({
            success: true,
            referenceId,
            message: "Payment initiated. Please complete on your MTN app."
        });
    } catch (error) {
        console.error("Error initiating payment:", error);
        res.status(502).json({
            success: false,
            message: "Payment gateway is temporarily unavailable",
            error: error.message || 'Unknown error'
        });
    }
});

/**
 * GET /api/payments/status/:referenceId
 * Check payment status by MTN reference ID
 */
router.get("/status/:referenceId", async (req, res) => {
    const { referenceId } = req.params;
    try {
        const status = await mtnMomo.getPaymentStatus(referenceId);
        res.status(200).json({ success: true, status });
    } catch (error) {
        console.error("Error getting payment status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve payment status",
            error: error.message || 'Unknown error'
        });
    }
});

/**
 * POST /api/payments/callback
 * Webhook for MTN MoMo to confirm payment status
 * MTN sends a POST to this endpoint when payment status changes
 */
router.post("/callback", async (req, res) => {
    try {
        console.log("[MTN Callback] Received:", JSON.stringify(req.body));

        // MTN MoMo callback format:
        // {
        //   "resource": "/collection/v1_0/requesttopay/{referenceId}",
        //   "notificationId": "...",
        //   "providerCallbackHost": "...",
        //   "status": "SUCCESSFUL" | "FAILED"
        // }

        const { status, resource } = req.body;

        if (status === "SUCCESSFUL") {
            // Extract reference ID from resource URL
            const referenceIdMatch = resource?.match(/\/([a-f0-9-]{36})$/);
            const referenceId = referenceIdMatch ? referenceIdMatch[1] : null;

            if (!referenceId) {
                console.error("[MTN Callback] Could not extract reference ID from:", resource);
                return res.status(400).send("Invalid callback format");
            }

            try {
                await ticketController.confirmPayment(null, referenceId);
                console.log("[MTN Callback] Payment confirmed for reference:", referenceId);
            } catch (confirmError) {
                console.error("[MTN Callback] Error confirming payment:", confirmError.message);
            }
        } else if (status === "FAILED") {
            console.log("[MTN Callback] Payment failed:", req.body);
        }

        res.status(200).send("Callback processed successfully");
    } catch (error) {
        console.error("[MTN Callback] Error:", error);
        res.status(500).send("Error processing callback");
    }
});

module.exports = router;
