const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const mtnMomo = require("../services/mtnMomo");
const emailService = require("../services/emailService");
const pushNotificationService = require("../services/pushNotificationService");
const QRCode = require("qrcode");
const crypto = require("crypto");

const USD_TO_LRD = 150;
const convertToLRD = (usd) => usd * USD_TO_LRD;

/**
 * Purchase a ticket and initiate MTN MoMo payment
 */
exports.purchaseTicket = async (req, res) => {
    try {
        const { eventId, tierName, quantity, purchaserName, purchaserPhone } = req.body;

        // Validate event
        const event = await Event.findById(eventId).populate('organizerId');
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });
        if (event.status !== 'active') {
            return res.status(400).json({ success: false, message: "Event is not available for booking" });
        }

        // Validate ticket tier
        const tier = event.ticketTiers.find(t => t.name === tierName);
        if (!tier) return res.status(400).json({ success: false, message: "Invalid ticket tier" });
        if (tier.quantity - tier.sold < quantity) {
            return res.status(400).json({ success: false, message: "Insufficient tickets available" });
        }

        // Calculate totals
        const totalUSD = tier.price * quantity;
        const totalLRD = convertToLRD(totalUSD);

        // Create ticket record (paymentStatus: pending)
        const ticket = await Ticket.create({
            eventId,
            userId: req.user._id,
            tierName,
            tierPrice: tier.price,
            quantity,
            totalAmountUSD: totalUSD,
            totalAmountLRD: totalLRD,
            purchaserName,
            purchaserPhone,
            paymentStatus: 'pending'
        });

        // Create transaction record
        const transaction = await Transaction.create({
            ticketId: ticket._id,
            eventId,
            userId: req.user._id,
            amount: totalLRD,
            currency: 'LRD',
            status: 'pending'
        });

        // Initiate MTN MoMo Payment
        let mtnReferenceId;
        try {
            mtnReferenceId = await mtnMomo.requestToPay(
                totalLRD,
                "LRD", // Use LRD for Liberia
                purchaserPhone,
                ticket._id.toString(),
                `Ticket for ${event.title} - ${tierName} x${quantity}`
            );

            ticket.mtnTransactionId = mtnReferenceId;
            transaction.mtnTransactionId = mtnReferenceId;
            await ticket.save();
            await transaction.save();
        } catch (mtnError) {
            // If MTN fails, mark ticket as failed but keep record
            ticket.paymentStatus = 'failed';
            await ticket.save();
            transaction.status = 'failed';
            await transaction.save();

            return res.status(502).json({
                success: false,
                message: "Payment gateway is temporarily unavailable. Your ticket is saved and can be retried.",
                data: { ticketId: ticket._id, retryEndpoint: '/api/payments/retry/' + ticket._id }
            });
        }

        res.status(201).json({
            success: true,
            message: "Payment initiated. Please complete payment on your MTN Mobile Money app.",
            data: {
                ticket: ticket,
                referenceId: mtnReferenceId,
                statusUrl: `/api/payments/status/${mtnReferenceId}`
            }
        });
    } catch (error) {
        console.error("Ticket purchase error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Confirm payment after MTN callback or manual check
 */
exports.confirmPayment = async (ticketId, financialTransactionId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        throw new Error("Ticket not found");
    }

    // Check payment status from MTN
    const status = await mtnMomo.getPaymentStatus(ticket.mtnTransactionId);

    if (status.status === "SUCCESSFUL") {
        // Generate unique QR code
        const qrCodeValue = `GC-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        ticket.qrCode = qrCodeValue;
        ticket.qrCodeImage = await QRCode.toDataURL(
            `https://gentsconcerts.netlify.app/ticket-verify.html?id=${qrCodeValue}`
        );
        ticket.paymentStatus = "confirmed";
        ticket.financialTransactionId = financialTransactionId || status.financialTransactionId;
        await ticket.save();

        // Update event sold count
        const event = await Event.findById(ticket.eventId);
        if (event) {
            const tier = event.ticketTiers.find(t => t.name === ticket.tierName);
            if (tier) {
                tier.sold += ticket.quantity;
                await event.save();
            }
        }

        // Update transaction
        await Transaction.findOneAndUpdate(
            { ticketId: ticket._id },
            { status: 'completed', financialTransactionId: financialTransactionId }
        );

        // Send email confirmation (non-blocking)
        try {
            const user = await User.findById(ticket.userId);
            if (user) {
                await emailService.sendTicketConfirmation(user, ticket, event);
            }
        } catch (emailError) {
            console.error('Failed to send ticket confirmation email:', emailError.message);
        }

        // Send push notification (non-blocking)
        try {
            const user = await User.findById(ticket.userId);
            if (user && user.expoPushToken) {
                await pushNotificationService.sendTicketConfirmation(
                    user.expoPushToken,
                    event.title,
                    ticket._id.toString()
                );
            }
        } catch (pushError) {
            console.error('Failed to send push notification:', pushError.message);
        }

        return { success: true, data: ticket };
    } else {
        // Payment not yet successful
        await Transaction.findOneAndUpdate(
            { ticketId: ticket._id },
            { status: status.status === 'FAILED' ? 'failed' : 'pending' }
        );

        return { success: false, message: "Payment not successful yet", status: status.status };
    }
};

/**
 * Confirm payment route (manual check endpoint)
 */
exports.confirmPaymentRoute = async (req, res) => {
    try {
        const { mtnTransactionId } = req.body;
        const ticket = await Ticket.findOne({ mtnTransactionId });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        const result = await exports.confirmPayment(ticket._id.toString(), mtnTransactionId);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Retry payment for a failed ticket
 */
exports.retryPayment = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId).populate('eventId');
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (ticket.paymentStatus === 'confirmed') {
            return res.status(400).json({ success: false, message: 'Ticket already confirmed' });
        }

        // Re-initiate MTN payment
        const mtnReferenceId = await mtnMomo.requestToPay(
            ticket.totalAmountLRD,
            "LRD",
            ticket.purchaserPhone,
            ticket._id.toString(),
            `Ticket for ${ticket.eventId.title} - ${ticket.tierName} x${ticket.quantity}`
        );

        ticket.mtnTransactionId = mtnReferenceId;
        ticket.paymentStatus = 'pending';
        await ticket.save();

        // Update transaction
        await Transaction.findOneAndUpdate(
            { ticketId: ticket._id },
            { mtnTransactionId: mtnReferenceId, status: 'pending' }
        );

        res.status(200).json({
            success: true,
            message: "Payment retry initiated. Please complete payment on your MTN app.",
            data: { referenceId: mtnReferenceId }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Verify a ticket by QR code (for venue staff)
 */
exports.verifyTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ qrCode: req.params.qrCode }).populate("eventId");
        if (!ticket) return res.status(404).json({ success: false, message: "Invalid ticket" });

        if (ticket.paymentStatus !== 'confirmed') {
            return res.status(400).json({ success: false, message: "Ticket payment not confirmed" });
        }

        if (ticket.isUsed) {
            return res.status(400).json({ success: false, message: "Ticket already used" });
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Mark ticket as used (at venue door)
 */
exports.useTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ qrCode: req.params.qrCode }).populate("eventId");
        if (!ticket) return res.status(404).json({ success: false, message: "Invalid ticket" });
        if (ticket.isUsed) return res.status(400).json({ success: false, message: "Ticket already used" });

        ticket.isUsed = true;
        ticket.usedAt = Date.now();
        ticket.usedBy = req.user._id;
        await ticket.save();

        res.status(200).json({ success: true, message: "Ticket marked as used", data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Get a single ticket (for the owner or admin)
 */
exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate("eventId");
        if (!ticket || (ticket.userId.toString() !== req.user._id.toString() && req.user.role !== "admin")) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
