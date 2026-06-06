const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const mtnMomo = require("../services/mtnMomo");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const USD_TO_LRD = 150;
const convertToLRD = (usd) => usd * USD_TO_LRD;

exports.purchaseTicket = async (req, res) => {
    try {
        const { eventId, tierName, quantity, purchaserName, purchaserPhone } = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const tier = event.ticketTiers.find(t => t.name === tierName);
        if (!tier || tier.quantity - tier.sold < quantity) {
            return res.status(400).json({ success: false, message: "Insufficient tickets available" });
        }

        const totalUSD = tier.price * quantity;
        const totalLRD = convertToLRD(totalUSD);

        const ticket = await Ticket.create({
            eventId,
            userId: req.user._id,
            tierName,
            tierPrice: tier.price,
            quantity,
            totalAmountUSD: totalUSD,
            totalAmountLRD: totalLRD,
            purchaserName,
            purchaserPhone
        });

        // Initiate MTN Payment
        const referenceId = await mtnMomo.requestToPay(
            totalLRD,
            "EUR", // Sandbox often requires EUR/UGX
            purchaserPhone,
            ticket._id.toString(),
            `Ticket for ${event.title}`
        );

        ticket.mtnTransactionId = referenceId;
        await ticket.save();

        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Refactored confirmPayment to be a standalone function
exports.confirmPayment = async (externalId, financialTransactionId) => {
    try {
        const ticket = await Ticket.findById(externalId); // Assuming externalId is the ticket._id
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        const status = await mtnMomo.getPaymentStatus(ticket.mtnTransactionId);
        if (status.status === "SUCCESSFUL") {
            ticket.paymentStatus = "confirmed";
            ticket.financialTransactionId = financialTransactionId; // Store MTN's financial transaction ID
            
            // Generate QR Code
            const qrCodeValue = `GC-2026-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
            ticket.qrCode = qrCodeValue;
            const qrDataUrl = await QRCode.toDataURL(`https://gentsconcerts.netlify.app/ticket-verify.html?id=${qrCodeValue}`);
            ticket.qrCodeImage = qrDataUrl;

            await ticket.save();

            // Update Event Sold Count
            const event = await Event.findById(ticket.eventId);
            const tier = event.ticketTiers.find(t => t.name === ticket.tierName);
            tier.sold += ticket.quantity;
            await event.save();

            return { success: true, data: ticket };
        } else {
            return { success: false, message: "Payment not successful yet", status: status.status };
        }
    } catch (error) {
        console.error("Error in confirmPayment:", error);
        throw error;
    }
};

// Original confirmPayment route handler (now calls the refactored function)
exports.confirmPaymentRoute = async (req, res) => {
    try {
        const { mtnTransactionId } = req.body;
        const ticket = await Ticket.findOne({ mtnTransactionId });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        const result = await exports.confirmPayment(ticket._id.toString(), mtnTransactionId); // Pass ticket ID and MTN transaction ID
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.verifyTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ qrCode: req.params.qrCode }).populate("eventId");
        if (!ticket) return res.status(404).json({ success: false, message: "Invalid ticket" });
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

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
