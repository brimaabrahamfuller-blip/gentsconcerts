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
        // Attach flyer image path if uploaded
        if (req.file) {
            req.body.flyerImage = `/uploads/events/${req.file.filename}`;
        }

        req.body.organizerId = req.user._id;

        // Set status to active if all required fields are present
        if (req.body.flyerImage && req.body.ticketTiers && req.body.ticketTiers.length > 0) {
            req.body.status = 'active';
        } else {
            req.body.status = 'pending';
        }

        const newEvent = await Event.create(req.body);

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
            console.error('Failed to send event notification:', notifError.message);
        }

        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        // Attach flyer image path if uploaded
        if (req.file) {
            req.body.flyerImage = `/uploads/events/${req.file.filename}`;
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
