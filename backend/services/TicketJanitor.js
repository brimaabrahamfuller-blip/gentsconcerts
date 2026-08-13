const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

const expireTicketHold = async (ticket) => {
    const releasedTicket = await Ticket.findOneAndUpdate(
        {
            _id: ticket._id,
            paymentStatus: 'pending',
            inventoryReserved: true,
            inventoryReleasedAt: { $exists: false },
            expiresAt: { $lt: new Date() }
        },
        {
            $set: {
                paymentStatus: 'expired',
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

/**
 * Releases paid-ticket inventory holds that have exceeded their configured
 * payment window. Each hold is atomically claimed before inventory changes,
 * which makes concurrent workers safe and prevents double release.
 */
const initializeTicketJanitorWorker = () => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const candidates = await Ticket.find({
                paymentStatus: 'pending',
                inventoryReserved: true,
                expiresAt: { $lt: new Date() }
            }).select('_id eventId tierName quantity');

            let releasedCount = 0;
            for (const ticket of candidates) {
                if (await expireTicketHold(ticket)) releasedCount += 1;
            }
            if (releasedCount > 0) {
                console.log(`[TicketJanitor] Released ${releasedCount} expired payment hold(s).`);
            }
        } catch (error) {
            console.error('[TicketJanitor] Failed to release expired ticket holds:', error);
        }
    });
};

module.exports = { initializeTicketJanitorWorker };
