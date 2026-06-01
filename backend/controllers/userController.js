const User = require('../models/User');
const Ticket = require('../models/Ticket');

exports.getProfile = async (req, res) => {
    res.status(200).json({ success: true, data: req.user });
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user._id }).populate('eventId');
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
