const express = require("express");
const router = express.Router();
const mtnMomo = require("../services/mtnMomo");
const ticketController = require("../controllers/ticketController");

// POST /api/payments/initiate
router.post("/initiate", async (req, res) => {
    const { amount, currency, phoneNumber, externalId, description } = req.body;
    try {
        const referenceId = await mtnMomo.requestToPay(amount, currency, phoneNumber, externalId, description);
        res.status(200).json({ referenceId });
    } catch (error) {
        console.error("Error initiating payment:", error);
        res.status(500).json({ message: "Payment initiation failed", error: error.message });
    }
});

// GET /api/payments/status/:referenceId
router.get("/status/:referenceId", async (req, res) => {
    const { referenceId } = req.params;
    try {
        const status = await mtnMomo.getPaymentStatus(referenceId);
        res.status(200).json({ status });
    } catch (error) {
        console.error("Error getting payment status:", error);
        res.status(500).json({ message: "Failed to retrieve payment status", error: error.message });
    }
});

// POST /api/payments/callback - Webhook for MTN to confirm payment
router.post("/callback", async (req, res) => {
    // This endpoint would typically receive a callback from MTN MoMo
    // with the status of a transaction. The implementation here is a placeholder.
    // In a real scenario, you would verify the callback and update your database.
    console.log("MTN MoMo Callback received:", req.body);
    const { status, externalId, financialTransactionId } = req.body; // externalId from MTN should be our ticket._id

    if (status === "SUCCESSFUL") {
        try {
            await ticketController.confirmPayment(externalId, financialTransactionId);
            res.status(200).send("Callback processed successfully");
        } catch (error) {
            console.error("Error processing callback:", error);
            res.status(500).send("Error processing callback");
        }
    } else {
        console.log("Payment not successful:", req.body);
        res.status(200).send("Payment not successful");
    }
});

module.exports = router;
