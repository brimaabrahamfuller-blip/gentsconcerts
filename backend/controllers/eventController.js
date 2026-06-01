const Event = require('../models/Event');

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).populate('organizerId', 'fullName');
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'fullName');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        req.body.organizerId = req.user._id;
        const newEvent = await Event.create(req.body);
        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate({ _id: req.params.id, organizerId: req.user._id }, req.body, { new: true, runValidators: true });
        if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate({ _id: req.params.id, organizerId: req.user._id }, { status: 'cancelled' }, { new: true });
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
