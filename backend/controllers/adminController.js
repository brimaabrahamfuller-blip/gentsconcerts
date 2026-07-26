const ActivityLog = require('../models/ActivityLog');
const Flag = require('../models/Flag');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

exports.getStats = async (req, res) => {
    try {
        // Use totalAmountUSD field which exists on Ticket model
        const totalRevenue = await Ticket.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmountUSD" } } }
        ]);
        // Event status enum is 'pending', 'active', 'cancelled' — use 'active'
        const activeEvents = await Event.countDocuments({ status: 'active' });
        const totalUsers = await User.countDocuments();
        const pendingFlags = await Flag.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                activeEvents,
                totalUsers,
                pendingFlags
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .populate('user', 'fullName email')
            .sort({ timestamp: -1 })
            .limit(50);
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getFlags = async (req, res) => {
    try {
        const flags = await Flag.find()
            .populate('reporter', 'fullName email')
            .sort({ timestamp: -1 });
        res.status(200).json({ success: true, data: flags });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateFlag = async (req, res) => {
    try {
        const { status, actionTaken } = req.body;
        // Validate status against Flag model enum: 'pending', 'reviewed', 'resolved', 'dismissed'
        const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        const flag = await Flag.findByIdAndUpdate(req.params.id, { status, actionTaken }, { new: true });
        res.status(200).json({ success: true, data: flag });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.manageUser = async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'active', 'suspended', 'banned'
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
