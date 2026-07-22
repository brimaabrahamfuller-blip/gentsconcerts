const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const pushNotificationService = require('../services/pushNotificationService');
const emailService = require('../services/emailService');

/**
 * Send event reminders to all ticket holders for events happening in the next N days
 * This can be called by a scheduled job (cron) or manually by admin/host
 */
exports.sendEventReminders = async (req, res) => {
    try {
        const { daysAhead = 1 } = req.body;
        const now = new Date();
        const reminderDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

        // Find events happening within the next N days
        const upcomingEvents = await Event.find({
            status: 'active',
            date: { $gte: now, $lte: reminderDate }
        });

        let totalSent = 0;
        const results = [];

        for (const event of upcomingEvents) {
            // Find all ticket holders for this event
            const ticketHolders = await Ticket.find({
                eventId: event._id,
                paymentStatus: 'confirmed'
            }).populate('userId');

            const daysUntil = Math.ceil((event.date - now) / (24 * 60 * 60 * 1000));

            for (const ticket of ticketHolders) {
                if (!ticket.userId) continue;

                // Send push notification
                if (ticket.userId.expoPushToken) {
                    try {
                        await pushNotificationService.sendEventReminder(
                            ticket.userId.expoPushToken,
                            event.title,
                            event.date
                        );
                        totalSent++;
                    } catch (pushError) {
                        console.error(`Failed to send push to ${ticket.userId.email}:`, pushError.message);
                    }
                }

                // Send email reminder
                try {
                    await emailService.sendEventReminder(ticket.userId, event, daysUntil);
                } catch (emailError) {
                    console.error(`Failed to send email to ${ticket.userId.email}:`, emailError.message);
                }
            }

            results.push({
                eventTitle: event.title,
                ticketHoldersCount: ticketHolders.length,
                daysUntil
            });
        }

        res.status(200).json({
            success: true,
            message: `Reminder notifications sent successfully`,
            data: {
                totalRemindersSent: totalSent,
                events: results
            }
        });
    } catch (error) {
        console.error("Error sending event reminders:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Broadcast a notification to all subscribed users
 */
exports.broadcastNotification = async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({ success: false, message: 'Title and body are required' });
        }

        // Get all users with push tokens who have notifications enabled
        const recipients = await User.find({
            expoPushToken: { $exists: true, $ne: null },
            'notificationPreferences.newEvents': true
        });

        if (recipients.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No recipients found',
                data: { sent: 0 }
            });
        }

        const recipientList = recipients.map(u => ({ expoPushToken: u.expoPushToken }));

        await pushNotificationService.sendToMultiple(recipientList, title, body, data || {});

        res.status(200).json({
            success: true,
            message: `Broadcast sent to ${recipients.length} users`,
            data: { sent: recipients.length }
        });
    } catch (error) {
        console.error("Error broadcasting notification:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Get notification sending history (admin)
 */
exports.getNotificationHistory = async (req, res) => {
    try {
        // Return recent ticket confirmations and event reminders as history
        const recentTickets = await Ticket.find({
            paymentStatus: 'confirmed'
        })
            .populate('eventId', 'title date')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: recentTickets.map(t => ({
                type: 'ticket_confirmation',
                eventName: t.eventId?.title || 'Unknown',
                user: t.userId?.fullName || 'Unknown',
                date: t.createdAt
            }))
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
