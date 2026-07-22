const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const pushNotificationService = {
    /**
     * Send a push notification via Expo Push API
     * @param {string} expoPushToken - The user's Expo push token
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Additional data payload
     * @returns {Promise<object>} - Expo API response
     */
    async sendNotification(expoPushToken, title, body, data = {}) {
        if (!expoPushToken) {
            console.log('[PUSH] No push token provided, skipping notification');
            return null;
        }

        const message = {
            to: expoPushToken,
            sound: 'default',
            title: title,
            body: body,
            data: {
                ...data,
                timestamp: new Date().toISOString()
            }
        };

        try {
            const response = await axios.post(EXPO_PUSH_URL, message, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                }
            });

            console.log('[PUSH] Notification sent successfully:', title);
            return response.data;
        } catch (error) {
            console.error('[PUSH] Failed to send notification:', error.response?.data || error.message);
            return null;
        }
    },

    /**
     * Send push notifications to multiple users
     * @param {Array<{expoPushToken: string, userId: string}>} recipients
     * @param {string} title
     * @param {string} body
     * @param {object} data
     */
    async sendToMultiple(recipients, title, body, data = {}) {
        if (!recipients || recipients.length === 0) return;

        const messages = recipients
            .filter(r => r.expoPushToken)
            .map(r => ({
                to: r.expoPushToken,
                sound: 'default',
                title,
                body,
                data: { ...data, timestamp: new Date().toISOString() }
            }));

        if (messages.length === 0) return;

        try {
            // Expo Push API supports up to 100 messages per request
            const chunks = [];
            for (let i = 0; i < messages.length; i += 100) {
                chunks.push(messages.slice(i, i + 100));
            }

            for (const chunk of chunks) {
                const response = await axios.post(EXPO_PUSH_URL, chunk, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip, deflate',
                    }
                });
                console.log(`[PUSH] Sent ${chunk.length} notifications: ${title}`);
            }
        } catch (error) {
            console.error('[PUSH] Failed to send bulk notifications:', error.message);
        }
    },

    /**
     * Send ticket confirmation notification
     */
    async sendTicketConfirmation(expoPushToken, eventTitle, ticketId) {
        return this.sendNotification(
            expoPushToken,
            '🎟️ Ticket Confirmed!',
            `Your ticket for "${eventTitle}" has been confirmed. Check your Tickets section.`,
            { type: 'ticket_confirmation', ticketId, screen: 'Tickets' }
        );
    },

    /**
     * Send event reminder notification
     */
    async sendEventReminder(expoPushToken, eventTitle, eventDate) {
        const dateStr = new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        return this.sendNotification(
            expoPushToken,
            '🎶 Event Reminder',
            `"${eventTitle}" is coming up on ${dateStr}. Don't forget your digital ticket!`,
            { type: 'event_reminder', screen: 'Tickets' }
        );
    },

    /**
     * Send new event notification to all subscribers of a category
     */
    async sendNewEventNotification(recipients, eventTitle, eventCategory) {
        const messages = recipients
            .filter(r => r.expoPushToken)
            .map(r => ({
                to: r.expoPushToken,
                sound: 'default',
                title: '🎵 New Event Alert',
                body: `"${eventTitle}" just went live on GentsConcerts! Get your tickets now.`,
                data: {
                    type: 'new_event',
                    category: eventCategory,
                    timestamp: new Date().toISOString()
                }
            }));

        if (messages.length === 0) return;

        try {
            const response = await axios.post(EXPO_PUSH_URL, messages, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                }
            });
            console.log(`[PUSH] New event notification sent to ${messages.length} users`);
            return response.data;
        } catch (error) {
            console.error('[PUSH] Failed to send new event notifications:', error.message);
            return null;
        }
    }
};

module.exports = pushNotificationService;
