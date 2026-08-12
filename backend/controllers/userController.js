const User = require('../models/User');
const Ticket = require('../models/Ticket');
const crypto = require('crypto');
const { getStoredMediaValue } = require('../utils/mediaStorage');

exports.getProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user.referralCode) {
            user.referralCode = `GC${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
            await user.save();
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        // Store the profile image durably so all dashboard avatars keep
        // working after a Render redeploy.
        if (req.file) {
            const profileValue = getStoredMediaValue(req.file, 'profiles');
            req.body.profileImage = profileValue;
            req.body.profilePhoto = profileValue;
        }

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

exports.updatePushToken = async (req, res) => {
    try {
        const { expoPushToken } = req.body;
        if (!expoPushToken) {
            return res.status(400).json({ success: false, message: 'Push token is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { expoPushToken },
            { new: true }
        );
        res.status(200).json({ success: true, message: 'Push token updated' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateNotificationPreferences = async (req, res) => {
    try {
        const { notificationPreferences } = req.body;
        if (!notificationPreferences) {
            return res.status(400).json({ success: false, message: 'Preferences object is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { notificationPreferences },
            { new: true }
        );
        res.status(200).json({ success: true, data: user.notificationPreferences });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.becomeHost = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { role: 'host' },
            { new: true }
        );
        res.status(200).json({ 
            success: true, 
            message: 'You are now a host! You can now create and manage events.',
            data: user 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
