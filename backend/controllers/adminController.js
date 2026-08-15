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
        // Include new reviewed publications and legacy active listings during migration.
        const activeEvents = await Event.countDocuments({ status: { $in: ['published', 'active'] } });
        const totalUsers = await User.countDocuments();
        const pendingFlags = await Flag.countDocuments({ status: 'pending' });
        const failedPayments = await Ticket.countDocuments({ paymentStatus: 'failed' });
        const pendingReviews = await Event.countDocuments({ status: 'pending_review' });
        const pendingHosts = await User.countDocuments({ hostApprovalStatus: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                activeEvents,
                totalUsers,
                pendingFlags,
                failedPayments,
                pendingReviews,
                pendingHosts,
                platformPulse: {
                    totalTickets: await Ticket.countDocuments(),
                    confirmedTickets: await Ticket.countDocuments({ paymentStatus: 'confirmed' }),
                    totalHosts: await User.countDocuments({ role: 'host' }),
                    newUsersToday: await User.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } })
                }
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

const recordAdminAction = async (adminId, action, details, type = 'system') => {
    try {
        await ActivityLog.create({ user: adminId, action, details, type, severity: 'info' });
    } catch (error) {
        console.error('[ADMIN] Failed to record activity:', error.message);
    }
};

exports.getPendingHostApplications = async (req, res) => {
    try {
        const applications = await User.find({
            $or: [
                { hostApprovalStatus: 'pending' },
                { role: 'host', hostApprovalStatus: { $exists: false } }
            ]
        })
            .select('fullName email phone profileImage profilePhoto hostApplicationSubmittedAt createdAt')
            .sort({ hostApplicationSubmittedAt: 1, createdAt: 1 });
        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.reviewHostApplication = async (req, res) => {
    try {
        const decision = String(req.body.decision || '').toLowerCase();
        const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : '';
        if (!['approve', 'reject'].includes(decision)) {
            return res.status(400).json({ success: false, message: 'Decision must be approve or reject.' });
        }
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Administrators cannot review their own host application.' });
        }

        const applicant = await User.findOne({
            _id: req.params.id,
            $or: [
                { hostApprovalStatus: 'pending' },
                { role: 'host', hostApprovalStatus: { $exists: false } }
            ]
        });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Pending host application not found.' });
        }

        const approved = decision === 'approve';
        applicant.role = approved ? 'host' : 'attendee';
        applicant.hostApprovalStatus = approved ? 'approved' : 'rejected';
        applicant.hostReviewedAt = new Date();
        applicant.hostReviewedBy = req.user._id;
        applicant.hostReviewNote = note || undefined;
        await applicant.save();
        await recordAdminAction(
            req.user._id,
            approved ? 'Host application approved' : 'Host application rejected',
            `${applicant.fullName} (${applicant.email})`,
            'auth'
        );

        res.status(200).json({
            success: true,
            message: approved ? 'Host application approved.' : 'Host application rejected.',
            data: applicant
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getPendingEventReviews = async (req, res) => {
    try {
        const events = await Event.find({ status: 'pending_review' })
            .populate('organizerId', 'fullName email phone profileImage profilePhoto')
            .sort({ submittedForReviewAt: 1 });
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.reviewEventPublication = async (req, res) => {
    try {
        const decision = String(req.body.decision || '').toLowerCase();
        const note = typeof req.body.note === 'string' ? req.body.note.trim().slice(0, 500) : '';
        if (!['publish', 'reject'].includes(decision)) {
            return res.status(400).json({ success: false, message: 'Decision must be publish or reject.' });
        }

        const event = await Event.findOne({ _id: req.params.id, status: 'pending_review' });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Pending event review not found.' });
        }

        const published = decision === 'publish';
        event.status = published ? 'published' : 'rejected';
        event.reviewedAt = new Date();
        event.reviewedBy = req.user._id;
        event.reviewNote = note || undefined;
        await event.save();
        await recordAdminAction(
            req.user._id,
            published ? 'Event published' : 'Event publication rejected',
            `${event.title} (${event._id})`,
            'event'
        );

        res.status(200).json({
            success: true,
            message: published ? 'Event published to the public catalogue.' : 'Event submission rejected.',
            data: event
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// NEW: Advanced User Management
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Chart data: User growth over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const growth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: users,
            growth
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin' || user.role === 'owner') {
            return res.status(403).json({ success: false, message: 'Cannot delete administrative accounts.' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        await recordAdminAction(req.user._id, 'User account deleted', `${user.fullName} (${user.email})`, 'auth');
        
        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// NEW: Advanced Ticket Monitoring
exports.getAllTickets = async (req, res) => {
    try {
        const { eventId, userId, paymentStatus, page = 1, limit = 50 } = req.query;
        const query = {};
        if (eventId) query.eventId = eventId;
        if (userId) query.userId = userId;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const tickets = await Ticket.find(query)
            .populate('userId', 'fullName email phone')
            .populate('eventId', 'title eventDate')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Ticket.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: tickets
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        
        await Ticket.findByIdAndDelete(req.params.id);
        await recordAdminAction(req.user._id, 'Ticket deleted', `Ticket ID: ${ticket._id}, User: ${ticket.userId}`, 'event');
        
        res.status(200).json({ success: true, message: 'Ticket deleted successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// NEW: Feedback & Warnings
exports.sendFeedback = async (req, res) => {
    try {
        const { userId, type, message } = req.body; // type: 'feedback', 'warning', 'notice'
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // In a real app, this would send an email or a push notification.
        // For now, we record it as an activity log entry for the user.
        await recordAdminAction(req.user._id, `Admin ${type} sent`, `To: ${user.fullName}, Message: ${message}`, 'system');
        
        res.status(200).json({ success: true, message: `Feedback sent to ${user.fullName}.` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
