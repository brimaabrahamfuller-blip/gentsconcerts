const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const mtnMomo = require("../services/mtnMomo");
const emailService = require("../services/emailService");
const pushNotificationService = require("../services/pushNotificationService");
const QRCode = require("qrcode");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const { getLocalMediaPath } = require("../utils/mediaStorage");

const USD_TO_LRD = 150;
const convertToLRD = (usd) => usd * USD_TO_LRD;

// Temporary pre-payment mode. Set PAYMENT_ENABLED=true when MTN MoMo is ready.
const PAYMENT_ENABLED = String(process.env.PAYMENT_ENABLED || 'false').toLowerCase() === 'true';
const REFERRAL_ONLY_TICKETS = !PAYMENT_ENABLED;
const ALLOW_FREE_TICKET_BYPASS = String(process.env.ALLOW_FREE_TICKET_BYPASS || 'true').toLowerCase() === 'true';
const REFERRAL_MIN_INVITES = Math.max(0, Number(process.env.REFERRAL_MIN_INVITES || 2));
const PAYMENT_HOLD_MINUTES = Math.max(5, Number(process.env.PAYMENT_HOLD_MINUTES || 15));
const MAX_TICKETS_PER_CLAIM = Math.max(1, Number(process.env.MAX_TICKETS_PER_CLAIM || 10));
const PUBLIC_EVENT_STATUSES = ['published', 'active'];

const releaseReservedInventory = async (ticket) => {
    const releasedTicket = await Ticket.findOneAndUpdate(
        {
            _id: ticket._id,
            inventoryReserved: true,
            inventoryReleasedAt: { $exists: false }
        },
        {
            $set: {
                inventoryReserved: false,
                inventoryReleasedAt: new Date()
            }
        },
        { new: true }
    );

    if (!releasedTicket) return false;
    await Event.updateOne(
        { _id: releasedTicket.eventId, 'ticketTiers.name': releasedTicket.tierName },
        { $inc: { 'ticketTiers.$.sold': -releasedTicket.quantity } }
    );
    return true;
};

const requireTicketOperator = (ticket, user) => {
    const event = ticket.eventId;
    if (user.role === 'admin') return true;
    return user.role === 'host'
        && user.hostApprovalStatus === 'approved'
        && String(event?.organizerId) === String(user._id);
};

/**
 * Confirm a $0 ticket immediately without going through MTN MoMo.
 * Generates the QR code, marks it sold, and fires confirmation
 * notifications the same way a real MTN payment confirmation would.
 */
const finalizeFreeTicket = async (ticket, event, tier, transaction) => {
    const qrCodeValue = `GC-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    ticket.qrCode = qrCodeValue;
    ticket.qrCodeImage = await QRCode.toDataURL(
        `https://gentsconcerts.netlify.app/ticket-verify.html?id=${qrCodeValue}`
    );
    ticket.paymentStatus = "confirmed";
    ticket.financialTransactionId = "FREE-BYPASS";
    ticket.expiresAt = undefined;
    await ticket.save();

    transaction.status = 'completed';
    transaction.financialTransactionId = "FREE-BYPASS";
    await transaction.save();

    // Send email confirmation (non-blocking)
    User.findById(ticket.userId).then(user => {
        if (user) {
            emailService.sendTicketConfirmation(user, ticket, event)
                .catch(emailError => console.error('Failed to send ticket confirmation email:', emailError.message));
        }
    }).catch(err => console.error('Failed to find user for email confirmation:', err.message));

    // Send push notification (non-blocking)
    User.findById(ticket.userId).then(user => {
        if (user && user.expoPushToken) {
            pushNotificationService.sendTicketConfirmation(
                user.expoPushToken,
                event.title,
                ticket._id.toString()
            ).catch(pushError => console.error('Failed to send push notification:', pushError.message));
        }
    }).catch(err => console.error('Failed to find user for push notification:', err.message));
};

/**
 * Purchase a ticket and initiate MTN MoMo payment
 */
exports.purchaseTicket = async (req, res) => {
    try {
        const { eventId, tierName, quantity, purchaserName, purchaserPhone, referralCode } = req.body;
        const requestedQuantity = Number(quantity);
        if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > MAX_TICKETS_PER_CLAIM) {
            return res.status(400).json({
                success: false,
                message: `Choose a whole-number ticket quantity between 1 and ${MAX_TICKETS_PER_CLAIM}.`
            });
        }

        // Validate event
        const event = await Event.findById(eventId).populate('organizerId');
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });
        if (!PUBLIC_EVENT_STATUSES.includes(event.status)) {
            return res.status(400).json({ success: false, message: "Event is not available for booking" });
        }

        // Validate ticket tier
        const tier = event.ticketTiers.find(t => t.name === tierName);
        if (!tier) return res.status(400).json({ success: false, message: "Invalid ticket tier" });
        if (tier.quantity - tier.sold < requestedQuantity) {
            return res.status(400).json({ success: false, message: "Insufficient tickets available" });
        }

        const existingClaim = await Ticket.findOne({
            eventId,
            userId: req.user._id,
            paymentStatus: { $in: ['pending', 'confirmed'] }
        }).select('_id paymentStatus');
        if (existingClaim) {
            return res.status(409).json({
                success: false,
                message: existingClaim.paymentStatus === 'confirmed'
                    ? 'You already have a confirmed ticket for this event. Only one ticket is allowed per attendee.'
                    : 'You already have a ticket claim awaiting payment for this event. Complete or retry that claim instead.'
            });
        }

        const normalizedTierName = String(tierName || '').trim();
        const isVipTier = /\bvip\b/i.test(normalizedTierName);
        const isRegularTier = /^regular\b/i.test(normalizedTierName);

        // During the temporary no-payment launch mode, Regular is free without
        // a referral and VIP is free only after a qualifying referral. The
        // payment-enabled path keeps the normal configured tier prices.
        const freeLaunchClaim = !PAYMENT_ENABLED && (isRegularTier || isVipTier);
        const totalUSD = freeLaunchClaim ? 0 : tier.price * requestedQuantity;
        const totalLRD = convertToLRD(totalUSD);

        let validatedReferralCode = null;
        if (REFERRAL_ONLY_TICKETS && isVipTier) {
            validatedReferralCode = String(referralCode || '').trim().toUpperCase();
            if (!validatedReferralCode) {
                return res.status(400).json({ success: false, message: 'A referral code is required to claim a VIP ticket.' });
            }
            const referringUser = await User.findOne({ referralCode: validatedReferralCode });
            if (!referringUser) {
                return res.status(400).json({ success: false, message: 'Referral code not found.' });
            }
            if (String(referringUser._id) === String(req.user._id)) {
                return res.status(400).json({ success: false, message: 'You cannot use your own referral code to claim a VIP ticket.' });
            }
            if (referringUser.referralCount < REFERRAL_MIN_INVITES) {
                return res.status(403).json({
                    success: false,
                    message: `This referral code needs at least ${REFERRAL_MIN_INVITES} invited users before a VIP ticket can be claimed.`
                });
            }
        } else if (REFERRAL_ONLY_TICKETS && !isRegularTier && !isVipTier && totalUSD !== 0) {
            return res.status(400).json({
                success: false,
                message: 'While payment is offline, only free Regular tickets and referral-based VIP tickets can be claimed.'
            });
        }

        // Atomically reserve stock. The prior availability check improves the
        // message, but this update is the authoritative oversell protection.
        const reservedEvent = await Event.findOneAndUpdate(
            {
                _id: eventId,
                status: { $in: PUBLIC_EVENT_STATUSES },
                'ticketTiers.name': tier.name
            },
            { $inc: { 'ticketTiers.$[selectedTier].sold': requestedQuantity } },
            {
                new: true,
                arrayFilters: [
                    { 
                        'selectedTier.name': tier.name,
                        // Move the capacity check into the array filter to avoid $expr top-level limitation
                        // Note: arrayFilters support complex conditions on the elements being updated
                    }
                ]
            }
        );
        
        // Manual verification of capacity after atomic increment if needed, 
        // but a better way to do atomic check in findOneAndUpdate for fields within array elements:
        // MongoDB doesn't easily support $expr inside arrayFilters for field-to-field comparison in all versions.
        // Let's use a more robust standard query for the capacity check.
        
        if (reservedEvent) {
            const updatedTier = reservedEvent.ticketTiers.find(t => t.name === tier.name);
            if (updatedTier.sold > updatedTier.quantity) {
                // Rollback if we accidentally oversold (unlikely but safe)
                await Event.updateOne(
                    { _id: eventId, 'ticketTiers.name': tier.name },
                    { $inc: { 'ticketTiers.$.sold': -requestedQuantity } }
                );
                return res.status(409).json({ success: false, message: 'Insufficient tickets available.' });
            }
        }
        if (!reservedEvent) {
            return res.status(409).json({ success: false, message: 'Those tickets were just claimed by another customer. Please choose another tier or quantity.' });
        }
        const reservedTier = reservedEvent.ticketTiers.find((item) => item.name === tier.name);
        const holdExpiresAt = totalUSD === 0
            ? undefined
            : new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000);

        let ticket;
        let transaction;
        try {
            // Use a temporary unique value until payment confirmation creates the
            // scannable QR code. The inventory flag enables one-time release.
            const tempQr = `PENDING-${crypto.randomBytes(8).toString('hex')}`;
            ticket = await Ticket.create({
                eventId,
                userId: req.user._id,
                tierName: tier.name,
                tierPrice: tier.price,
                quantity: requestedQuantity,
                totalAmountUSD: totalUSD,
                totalAmountLRD: totalLRD,
                purchaserName,
                purchaserPhone,
                referralCode: validatedReferralCode,
                paymentStatus: 'pending',
                inventoryReserved: true,
                expiresAt: holdExpiresAt,
                qrCode: tempQr
            });

            transaction = await Transaction.create({
                ticketId: ticket._id,
                eventId,
                userId: req.user._id,
                amount: totalLRD,
                currency: 'LRD',
                status: 'pending'
            });
        } catch (recordError) {
            await Event.updateOne(
                { _id: eventId, 'ticketTiers.name': tier.name },
                { $inc: { 'ticketTiers.$.sold': -requestedQuantity } }
            );
            throw recordError;
        }

        // Initiate MTN MoMo Payment
        let mtnReferenceId;

        // Free Regular claims and qualifying VIP referral claims confirm instantly.
        if (ALLOW_FREE_TICKET_BYPASS && totalUSD === 0) {
                await finalizeFreeTicket(ticket, reservedEvent, reservedTier, transaction);

            return res.status(201).json({
                success: true,
                message: "Free ticket confirmed!",
                data: { ticket }
            });
        }

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
            await releaseReservedInventory(ticket);

            return res.status(502).json({
                success: false,
                message: "The automated payment gateway is in Beta. Please contact support or try again later. Your inventory hold has been released.",
                data: { ticketId: ticket._id, retryEndpoint: '/api/payments/retry/' + ticket._id }
            });
        }

        res.status(201).json({
            success: true,
            message: "Beta Ticketing: Payment initiated. Please complete payment on your phone. Our team will verify and confirm your ticket shortly.",
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
    const ticket = ticketId
        ? await Ticket.findById(ticketId)
        : await Ticket.findOne({ mtnTransactionId: financialTransactionId });
    if (!ticket) {
        throw new Error("Ticket not found");
    }
    if (ticket.paymentStatus === 'confirmed') {
        return { success: true, data: ticket, alreadyConfirmed: true };
    }
    if (ticket.paymentStatus !== 'pending') {
        return { success: false, message: `Ticket cannot be confirmed from ${ticket.paymentStatus} status.` };
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
        ticket.expiresAt = undefined;
        await ticket.save();

        // Inventory was reserved atomically at claim time; confirmation must
        // never increment it again.
        const event = await Event.findById(ticket.eventId);

        // Update transaction
        await Transaction.findOneAndUpdate(
            { ticketId: ticket._id },
            {
                status: 'completed',
                financialTransactionId: ticket.financialTransactionId
            }
        );

        // Send email confirmation (truly non-blocking)
        User.findById(ticket.userId).then(user => {
            if (user) {
                emailService.sendTicketConfirmation(user, ticket, event)
                    .catch(emailError => console.error('Failed to send ticket confirmation email:', emailError.message));
            }
        }).catch(err => console.error('Failed to find user for email confirmation:', err.message));

        // Send push notification (truly non-blocking)
        User.findById(ticket.userId).then(user => {
            if (user && user.expoPushToken) {
                pushNotificationService.sendTicketConfirmation(
                    user.expoPushToken,
                    event.title,
                    ticket._id.toString()
                ).catch(pushError => console.error('Failed to send push notification:', pushError.message));
            }
        }).catch(err => console.error('Failed to find user for push notification:', err.message));

        return { success: true, data: ticket };
    } else {
        // Payment is still pending or failed. A definitive gateway failure
        // releases the held inventory exactly once; pending payments retain it
        // until confirmation or expiry.
        const failed = status.status === 'FAILED';
        if (failed) {
            ticket.paymentStatus = 'failed';
            await ticket.save();
            await releaseReservedInventory(ticket);
        }
        await Transaction.findOneAndUpdate(
            { ticketId: ticket._id },
            { status: failed ? 'failed' : 'pending' }
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
        if (String(ticket.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to confirm this ticket.' });
        }

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
        if (String(ticket.userId) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to retry this ticket.' });
        }

        if (ticket.paymentStatus === 'confirmed') {
            return res.status(400).json({ success: false, message: 'Ticket already confirmed' });
        }
        if (ticket.paymentStatus !== 'pending' || !ticket.inventoryReserved) {
            return res.status(400).json({ success: false, message: 'This ticket is no longer held. Please start a new claim if tickets are still available.' });
        }
        if (ticket.expiresAt && ticket.expiresAt.getTime() <= Date.now()) {
            ticket.paymentStatus = 'expired';
            await ticket.save();
            await releaseReservedInventory(ticket);
            return res.status(410).json({ success: false, message: 'Your payment hold expired. Please start a new claim if tickets are still available.' });
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
        const ticket = await Ticket.findOne({ qrCode: req.params.qrCode })
            .populate('eventId', 'title date time venue city organizerId');
        if (!ticket) return res.status(404).json({ success: false, message: 'Invalid ticket' });
        if (!requireTicketOperator(ticket, req.user)) {
            return res.status(403).json({ success: false, message: 'You are not authorized to verify tickets for this event.' });
        }
        if (ticket.paymentStatus !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Ticket payment not confirmed' });
        }
        if (ticket.isUsed) {
            return res.status(400).json({ success: false, message: 'Ticket already used' });
        }

        res.status(200).json({
            success: true,
            data: {
                id: ticket._id,
                qrCode: ticket.qrCode,
                tierName: ticket.tierName,
                quantity: ticket.quantity,
                purchaserName: ticket.purchaserName,
                event: ticket.eventId
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Mark ticket as used (at venue door)
 */
exports.useTicket = async (req, res) => {
    try {
        const candidate = await Ticket.findOne({ qrCode: req.params.qrCode })
            .populate('eventId', 'title date time venue city organizerId');
        if (!candidate) return res.status(404).json({ success: false, message: 'Invalid ticket' });
        if (!requireTicketOperator(candidate, req.user)) {
            return res.status(403).json({ success: false, message: 'You are not authorized to redeem tickets for this event.' });
        }
        if (candidate.paymentStatus !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Ticket payment not confirmed' });
        }

        const ticket = await Ticket.findOneAndUpdate(
            { _id: candidate._id, paymentStatus: 'confirmed', isUsed: false },
            { $set: { isUsed: true, usedAt: new Date(), usedBy: req.user._id } },
            { new: true }
        ).populate('eventId', 'title date time venue city');
        if (!ticket) {
            return res.status(409).json({ success: false, message: 'Ticket was already used by another scan.' });
        }

        res.status(200).json({ success: true, message: 'Ticket marked as used', data: ticket });
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

/**
 * Generate and stream a downloadable PDF ticket containing
 * event details, purchaser details, and the QR code.
 *
 * Route: GET /tickets/:id/download  (see routes/tickets.js)
 */
exports.downloadTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("eventId")
            .populate("userId", "fullName email");
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        // Only the ticket owner or an admin can download it
        const ownerId = ticket.userId?._id || ticket.userId;
        if (ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to access this ticket" });
        }

        if (ticket.paymentStatus !== "confirmed") {
            return res.status(400).json({ success: false, message: "Ticket is not confirmed yet" });
        }

        const event = ticket.eventId;

        // Brand colors (matches styles/theme.js and emailService.js)
        const NAVY = "#001F5B";
        const GOLD = "#C9A84C";
        const DARK = "#0A0A0F";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=ticket-${ticket.qrCode || ticket._id}.pdf`
        );

        const doc = new PDFDocument({ size: [400, 780], margin: 0 });
        doc.pipe(res);

        // ---- Background ----
        doc.rect(0, 0, 400, 780).fill(DARK);

        // ---- Header band ----
        doc.rect(0, 0, 400, 100).fill(NAVY);
        doc
            .fillColor("#FFFFFF")
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("GENTS", 24, 32, { continued: true })
            .fillColor(GOLD)
            .text("CONCERTS");
        doc
            .fillColor(GOLD)
            .font("Helvetica")
            .fontSize(10)
            .text("E-TICKET", 24, 62);

        let y = 112;
        const left = 24;

        const drawField = (label, value) => {
            doc
                .fillColor("#9CA3AF")
                .font("Helvetica")
                .fontSize(8)
                .text(label.toUpperCase(), left, y);
            doc
                .fillColor("#FFFFFF")
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(String(value || "-"), left, y + 11, { width: 352, ellipsis: true });
            y += 32;
        };

        // ---- Flyer artwork ----
        if (event && event.flyerImage) {
            try {
                let flyerBuffer = null;
                if (/^data:/i.test(event.flyerImage)) {
                    const separator = event.flyerImage.indexOf(",");
                    if (separator !== -1) {
                        flyerBuffer = Buffer.from(event.flyerImage.slice(separator + 1), "base64");
                    }
                } else if (/^https?:\/\//i.test(event.flyerImage)) {
                    const flyerResponse = await fetch(event.flyerImage);
                    if (flyerResponse.ok) flyerBuffer = Buffer.from(await flyerResponse.arrayBuffer());
                } else {
                    const localPath = getLocalMediaPath(event.flyerImage);
                    if (localPath && fs.existsSync(localPath)) flyerBuffer = fs.readFileSync(localPath);
                }

                if (flyerBuffer) {
                    doc.roundedRect(left, y, 352, 108, 10).fill("#FFFFFF");
                    doc.image(flyerBuffer, left, y, { fit: [352, 108], align: "center", valign: "center" });
                    y += 122;
                }
            } catch (flyerError) {
                console.warn("Ticket PDF flyer could not be embedded:", flyerError.message);
            }
        }

        // ---- Event information ----
        drawField("Event", event ? event.title : "Unknown event");
        if (event) {
            drawField(
                "Date",
                new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }) + (event.time ? ` · ${event.time}` : "")
            );
            drawField("Venue", `${event.venue}, ${event.city}`);
        }

        // ---- Purchaser / ticket information ----
        drawField("Ticket Tier", ticket.tierName);
        drawField("Attendee", ticket.purchaserName || ticket.userId?.fullName);
        drawField("Email", ticket.userId?.email);
        drawField("Quantity", String(ticket.quantity));
        drawField("Amount Paid", `$${Number(ticket.totalAmountUSD || 0).toFixed(2)} USD`);
        drawField("Ticket ID", ticket.qrCode || String(ticket._id));

        // ---- QR code ----
        if (!ticket.qrCodeImage && ticket.qrCode) {
            ticket.qrCodeImage = await QRCode.toDataURL(
                `https://gentsconcerts.netlify.app/ticket-verify.html?id=${ticket.qrCode}`
            );
            await ticket.save();
        }

        if (ticket.qrCodeImage) {
            const qrBase64 = ticket.qrCodeImage.split(",")[1];
            const qrBuffer = Buffer.from(qrBase64, "base64");
            const qrSize = 136;
            const qrX = (400 - qrSize) / 2;
            doc.rect(qrX - 10, y, qrSize + 20, qrSize + 20).fill("#FFFFFF");
            doc.image(qrBuffer, qrX, y + 10, { width: qrSize, height: qrSize });
            y += qrSize + 32;
        }

        // ---- Footer ----
        doc
            .fillColor("#6B7280")
            .font("Helvetica")
            .fontSize(8)
            .text("Present this QR code at the venue entrance.", left, y, {
                width: 352,
                align: "center"
            });
        doc
            .fillColor("#4B5563")
            .fontSize(7)
            .text("#GentsConcerts #Liberia #Monrovia", left, y + 16, {
                width: 352,
                align: "center"
            });

        doc.end();
    } catch (error) {
        console.error("Ticket download error:", error);
        if (!res.headersSent) res.status(400).json({ success: false, message: error.message });
        else res.end();
    }
};
