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
        // Only account fields that a user is allowed to edit are accepted.
        // This prevents a multipart profile request from changing role, email,
        // verification, referral, or other protected account values.
        const updates = {};
        ['fullName', 'phone'].forEach((field) => {
            if (typeof req.body[field] === 'string') {
                updates[field] = req.body[field].trim();
            }
        });

        // A newly selected image takes precedence over a removal request. The
        // durable data value ensures every dashboard avatar survives a Render
        // redeploy, while clearing both legacy aliases restores initials.
        if (req.file) {
            const profileValue = getStoredMediaValue(req.file, 'profiles');
            updates.profileImage = profileValue;
            updates.profilePhoto = profileValue;
        } else if (String(req.body.removeProfilePhoto).toLowerCase() === 'true') {
            updates.profileImage = null;
            updates.profilePhoto = null;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No photo provided' });
        }
        const profileValue = getStoredMediaValue(req.file, 'profiles');
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: profileValue, profilePhoto: profileValue },
            { new: true }
        );
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

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
        }
        
        const user = await User.findById(req.user._id);
        
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.becomeHost = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'admin' || (user.role === 'host' && user.hostApprovalStatus === 'approved')) {
            return res.status(200).json({
                success: true,
                message: 'Your host access is already approved.',
                data: user
            });
        }
        if (user.hostApprovalStatus === 'pending') {
            return res.status(200).json({
                success: true,
                message: 'Your host application is already awaiting administrator review.',
                data: user
            });
        }

        user.hostApprovalStatus = 'pending';
        user.hostApplicationSubmittedAt = new Date();
        user.hostReviewedAt = undefined;
        user.hostReviewedBy = undefined;
        user.hostReviewNote = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Your host application has been submitted for administrator review.',
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
