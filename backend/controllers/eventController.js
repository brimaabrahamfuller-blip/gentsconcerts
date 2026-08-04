const Event = require('../models/Event');
const User = require('../models/User');
const pushNotificationService = require('../services/pushNotificationService');

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).populate('organizerId', 'fullName email');
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'fullName email');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        console.log('[CREATE_EVENT] Starting for user:', req.user && req.user._id);
        console.log('[CREATE_EVENT] Body received:', JSON.stringify(req.body));
        console.log('[CREATE_EVENT] File received:', req.file ? req.file.filename : 'none');

        // Attach flyer image path if uploaded
        if (req.file) {
            req.body.flyerImage = `/uploads/events/${req.file.filename}`;
        }

        req.body.organizerId = req.user._id;

        // Parse ticketTiers if it's a string (happens with FormData)
        if (typeof req.body.ticketTiers === 'string') {
            try {
                req.body.ticketTiers = JSON.parse(req.body.ticketTiers);
            } catch (e) {
                console.error('[CREATE_EVENT] Failed to parse ticketTiers:', e.message);
            }
        }

        // Set status to active if all required fields are present
        if (req.body.flyerImage && req.body.ticketTiers && req.body.ticketTiers.length > 0) {
            req.body.status = 'active';
        } else {
            req.body.status = 'pending';
        }

        console.log('[CREATE_EVENT] Final payload before save:', JSON.stringify(req.body));

        const newEvent = await Event.create(req.body);
        console.log('[CREATE_EVENT] Event created successfully:', newEvent._id);

        // Send push notifications to subscribers
        try {
            const subscribers = await User.find({
                'notificationPreferences.newEvents': true,
                expoPushToken: { $exists: true, $ne: null }
            });

            if (subscribers.length > 0) {
                await pushNotificationService.sendNewEventNotification(
                    subscribers.map(u => ({ expoPushToken: u.expoPushToken })),
                    newEvent.title,
                    newEvent.category
                );
            }
        } catch (notifError) {
            console.error('[CREATE_EVENT] Failed to send event notification:', notifError.message);
        }

        console.log('[CREATE_EVENT] Sending success response for:', newEvent._id);
        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        console.error('[CREATE_EVENT] Error creating event:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        // Attach flyer image path if uploaded
        if (req.file) {
            req.body.flyerImage = `/uploads/events/${req.file.filename}`;
        }

        // Parse ticketTiers if it's a string (happens with FormData)
        if (typeof req.body.ticketTiers === 'string') {
            try {
                req.body.ticketTiers = JSON.parse(req.body.ticketTiers);
            } catch (e) {
                console.error('Failed to parse ticketTiers:', e);
            }
        }

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, organizerId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, organizerId: req.user._id },
            { status: 'cancelled' },
            { new: true }
        );
        if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        res.status(200).json({ success: true, message: 'Event cancelled' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user._id });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
