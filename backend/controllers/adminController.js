const ActivityLog = require('../models/ActivityLog');
const Flag = require('../models/Flag');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const emailService = require('../services/emailService');
const pushNotificationService = require('../services/pushNotificationService');
const { recordAuditEvent } = require('../services/auditService');
const AuditEvent = require('../models/AuditEvent');
const PaymentAttempt = require('../models/PaymentAttempt');
const Transaction = require('../models/Transaction');
const LedgerEntry = require('../models/LedgerEntry');
const WebhookEvent = require('../models/WebhookEvent');
const FinancialApproval = require('../models/FinancialApproval');
const crypto = require('crypto');
const StepUpChallenge = require('../models/StepUpChallenge');
const { createChallenge, verifyChallenge, consumeGrant } = require('../services/stepUpService');
const { postAdjustment } = require('../services/ledgerService');
const { DEPARTMENTS, PERMISSIONS } = require('../constants/permissions');

const getAuditContext = (req) => ({
    requestId: req.id,
    permission: req.permission,
    department: req.user?.departments?.[0]
});

exports.getStats = async (req, res) => {
    try {
        // Include new reviewed publications and legacy active listings during migration.
        const activeEvents = await Event.countDocuments({ status: { $in: ['published', 'active'] } });
        const totalUsers = await User.countDocuments();
        const pendingFlags = await Flag.countDocuments({ status: 'pending' });
        const failedPayments = await Ticket.countDocuments({ paymentStatus: 'failed' });
        const pendingReviews = await Event.countDocuments({ status: 'pending_review' });
        const pendingHosts = await User.countDocuments({ hostApprovalStatus: 'pending' });

        const totalTickets = await Ticket.countDocuments();
        const confirmedTickets = await Ticket.countDocuments({ paymentStatus: 'confirmed' });
        
        res.status(200).json({
            success: true,
            data: {
                lastSynced: new Date(),
                // Payment monitoring is deliberately limited to operational
                // status counts; partner transaction values are not exposed.
                reconciled: true,
                activeEvents,
                totalUsers,
                pendingFlags,
                failedPayments,
                pendingReviews,
                pendingHosts,
                platformPulse: {
                    totalTickets,
                    confirmedTickets,
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
        const existingFlag = await Flag.findById(req.params.id);
        if (!existingFlag) return res.status(404).json({ success: false, message: 'Flag not found.' });
        const before = { status: existingFlag.status, actionTaken: existingFlag.actionTaken };
        existingFlag.status = status || existingFlag.status;
        existingFlag.actionTaken = actionTaken;
        await existingFlag.save();
        const flag = existingFlag;
        await recordAdminAction(req.user, 'Flag status updated', `Flag ID: ${flag._id}`, { type: 'Flag', id: flag._id }, { before, after: { status: flag.status, actionTaken: flag.actionTaken } }, 'system', getAuditContext(req));
        res.status(200).json({ success: true, data: flag });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.manageUser = async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'active', 'suspended', 'banned'
        if (!['active', 'suspended', 'banned'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid account status.' });
        }
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Administrators cannot suspend or ban themselves.' });
        }
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
        if (target.role === 'admin' || target.role === 'owner') {
            return res.status(403).json({ success: false, message: 'Administrative accounts cannot be changed here.' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        await recordAdminAction(req.user, `User account ${status}`, `${user.fullName} (${user.email})`, { type: 'User', id: user._id }, { before: { status: target.status }, after: { status: user.status } }, 'auth', getAuditContext(req));
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const recordAdminAction = async (admin, action, details, target = {}, snapshots = {}, type = 'system', context = {}) => {
    try {
        await ActivityLog.create({
            user: admin._id,
            role: admin.role,
            action,
            targetType: target.type,
            targetId: target.id,
            before: snapshots.before,
            after: snapshots.after,
            details,
            type,
            source: 'web_admin_portal',
            outcome: 'success'
        });
        await recordAuditEvent({
            actor: admin,
            action,
            targetType: target.type,
            targetId: target.id,
            before: snapshots.before,
            after: snapshots.after,
            department: context.department,
            permission: context.permission,
            requestId: context.requestId,
            source: 'web_admin_portal'
        });
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
        const before = { role: applicant.role, hostApprovalStatus: applicant.hostApprovalStatus };
        
        applicant.role = approved ? 'host' : 'attendee';
        applicant.hostApprovalStatus = approved ? 'approved' : 'rejected';
        applicant.hostReviewedAt = new Date();
        applicant.hostReviewedBy = req.user._id;
        applicant.hostReviewNote = note || undefined;
        await applicant.save();
        
        await recordAdminAction(
            req.user,
            approved ? 'Host application approved' : 'Host application rejected',
            `${applicant.fullName} (${applicant.email}). Note: ${note || 'N/A'}`,
            { type: 'User', id: applicant._id },
            { before, after: { role: applicant.role, hostApprovalStatus: applicant.hostApprovalStatus } },
            'auth',
            getAuditContext(req)
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
        const before = { status: event.status };
        
        event.status = published ? 'published' : 'rejected';
        event.reviewedAt = new Date();
        event.reviewedBy = req.user._id;
        event.reviewNote = note || undefined;
        await event.save();
        
        await recordAdminAction(
            req.user,
            published ? 'Event published' : 'Event publication rejected',
            `${event.title} (${event._id}). Note: ${note || 'N/A'}`,
            { type: 'Event', id: event._id },
            { before, after: { status: event.status } },
            'event',
            getAuditContext(req)
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
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Administrators cannot deactivate their own account.' });
        }
        if (user.role === 'admin' || user.role === 'owner') {
            return res.status(403).json({ success: false, message: 'Cannot delete administrative accounts.' });
        }
        
        const before = { status: user.status, deactivatedAt: user.deactivatedAt };
        user.status = 'suspended';
        user.deactivatedAt = new Date();
        user.deactivatedBy = req.user._id;
        user.deactivationReason = 'Administrative deactivation; record retained for compliance and reconciliation.';
        await user.save();
        await recordAdminAction(req.user, 'User account deactivated', `${user.fullName} (${user.email})`, { type: 'User', id: user._id }, { before, after: { status: user.status, deactivatedAt: user.deactivatedAt } }, 'auth', getAuditContext(req));
        
        res.status(200).json({ success: true, message: 'User deactivated. The record was retained for compliance and reconciliation.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// NEW: Advanced Ticket Monitoring
exports.getAllTickets = async (req, res) => {
    try {
        const { eventId, userId, paymentStatus, search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (eventId) query.eventId = eventId;
        if (userId) query.userId = userId;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Ticket rows display populated user/event fields, so resolve a search
        // term to matching references before querying tickets. Previously the
        // frontend sent `search` but the API silently ignored it.
        if (search?.trim()) {
            const term = search.trim();
            const [matchingUsers, matchingEvents] = await Promise.all([
                User.find({
                    $or: [
                        { fullName: { $regex: term, $options: 'i' } },
                        { email: { $regex: term, $options: 'i' } }
                    ]
                }).select('_id').limit(100),
                Event.find({ title: { $regex: term, $options: 'i' } }).select('_id').limit(100)
            ]);
            query.$or = [
                { userId: { $in: matchingUsers.map(user => user._id) } },
                { eventId: { $in: matchingEvents.map(event => event._id) } },
                ...(eventId || userId ? [] : [{ tierName: { $regex: term, $options: 'i' } }])
            ];
        }

        // Exclude payment-partner identifiers, QR payloads, purchaser contact
        // details, and monetary totals from the operational admin view.
        const tickets = await Ticket.find(query)
            .select('eventId userId tierName quantity paymentStatus isUsed createdAt')
            .populate('userId', 'fullName')
            .populate('eventId', 'title date')
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
        
        const before = { paymentStatus: ticket.paymentStatus, inventoryReserved: ticket.inventoryReserved };
        ticket.paymentStatus = 'cancelled';
        ticket.inventoryReserved = false;
        ticket.inventoryReleasedAt = ticket.inventoryReleasedAt || new Date();
        await ticket.save();
        await recordAdminAction(req.user, 'Ticket voided', `Ticket ID: ${ticket._id}, User: ${ticket.userId}`, { type: 'Ticket', id: ticket._id }, { before, after: { paymentStatus: ticket.paymentStatus, inventoryReserved: ticket.inventoryReserved } }, 'event', getAuditContext(req));
        
        res.status(200).json({ success: true, message: 'Ticket voided and retained for audit and reconciliation.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

        // Retain the record for auditability and partner/legal reconciliation,
        // but remove it from public and operational workflows.
        const before = { status: event.status, title: event.title };
        event.status = 'cancelled';
        event.reviewedAt = new Date();
        event.reviewedBy = req.user._id;
        event.reviewNote = 'Removed by administrator.';
        await event.save();
        await recordAdminAction(req.user, 'Event removed by administrator', `${event.title} (${event._id})`, { type: 'Event', id: event._id }, { before, after: { status: event.status } }, 'event', getAuditContext(req));

        res.status(200).json({ success: true, message: 'Event removed from the platform.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAuditEvents = async (req, res) => {
    try {
        const { action, actorId, targetType, page = 1, limit = 50 } = req.query;
        const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
        const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 100);
        const query = {};
        if (action) query.action = { $regex: String(action).trim().slice(0, 100), $options: 'i' };
        if (actorId) query.actor = actorId;
        if (targetType) query.targetType = String(targetType).trim().slice(0, 50);

        const [events, total] = await Promise.all([
            AuditEvent.find(query)
                .populate('actor', 'fullName email role')
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit),
            AuditEvent.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: safePage,
            pages: Math.ceil(total / safeLimit),
            data: events
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getReconciliationSummary = async (req, res) => {
    try {
        const [ledgerTotals, attempts, pendingCount] = await Promise.all([
            LedgerEntry.aggregate([
                { $match: { currency: 'LRD', status: 'posted' } },
                { $group: { _id: { accountCode: '$accountCode', direction: '$direction' }, amount: { $sum: '$amount' }, entries: { $sum: 1 } } },
                { $sort: { '_id.accountCode': 1, '_id.direction': 1 } }
            ]),
            PaymentAttempt.find({ operation: 'collection' })
                .select('ticketId providerReference amount currency status providerStatus failureMessage createdAt completedAt')
                .populate('ticketId', 'eventId paymentStatus')
                .sort({ createdAt: -1 })
                .limit(100),
            PaymentAttempt.countDocuments({ operation: 'collection', status: { $in: ['initiated', 'pending'] } })
        ]);

        res.status(200).json({
            success: true,
            data: { currency: 'LRD', ledgerTotals, pendingAttempts: pendingCount, recentAttempts: attempts }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getReconciliationExceptions = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
        const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
        const [unlinked, completedWithoutReference, successfulWithoutLedger, stalePending, unbalanced] = await Promise.all([
            Transaction.find({ paymentAttemptId: { $exists: false } }).select('_id ticketId amount currency status createdAt').sort({ createdAt: 1 }).limit(limit).lean(),
            Transaction.find({ status: 'completed', $or: [{ mtnTransactionId: { $exists: false } }, { mtnTransactionId: '' }] }).select('_id ticketId amount currency status createdAt').sort({ createdAt: 1 }).limit(limit).lean(),
            PaymentAttempt.find({ operation: 'collection', status: 'successful' }).populate({ path: 'transactionId', select: 'ledgerPostingGroupId' }).select('_id transactionId providerReference amount currency completedAt').sort({ completedAt: 1 }).limit(limit).lean(),
            PaymentAttempt.find({ operation: 'collection', status: { $in: ['initiated', 'pending'] }, updatedAt: { $lt: staleBefore } }).select('_id transactionId providerReference amount currency status updatedAt').sort({ updatedAt: 1 }).limit(limit).lean(),
            LedgerEntry.aggregate([
                { $match: { currency: 'LRD' } },
                { $group: { _id: '$postingGroupId', debit: { $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] } }, credit: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] } }, entries: { $sum: 1 } } },
                { $match: { $expr: { $ne: ['$debit', '$credit'] } } },
                { $sort: { _id: 1 } },
                { $limit: limit }
            ])
        ]);
        const exceptions = [
            ...unlinked.map((item) => ({ type: 'transaction_missing_payment_attempt', severity: 'high', transactionId: item._id, ticketId: item.ticketId, amount: item.amount, currency: item.currency, status: item.status, createdAt: item.createdAt })),
            ...completedWithoutReference.map((item) => ({ type: 'completed_without_provider_reference', severity: 'high', transactionId: item._id, ticketId: item.ticketId, amount: item.amount, currency: item.currency, status: item.status, createdAt: item.createdAt })),
            ...successfulWithoutLedger.filter((item) => !item.transactionId?.ledgerPostingGroupId).map((item) => ({ type: 'successful_attempt_missing_ledger', severity: 'high', paymentAttemptId: item._id, transactionId: item.transactionId?._id, providerReference: item.providerReference, amount: item.amount, currency: item.currency, completedAt: item.completedAt })),
            ...stalePending.map((item) => ({ type: 'stale_pending_payment_attempt', severity: 'medium', paymentAttemptId: item._id, transactionId: item.transactionId, providerReference: item.providerReference, amount: item.amount, currency: item.currency, status: item.status, updatedAt: item.updatedAt })),
            ...unbalanced.map((item) => ({ type: 'unbalanced_ledger_group', severity: 'critical', postingGroupId: item._id, debit: item.debit, credit: item.credit, entries: item.entries }))
        ];
        if (String(req.query.format || 'json').toLowerCase() === 'csv') {
            const columns = ['type', 'severity', 'transactionId', 'paymentAttemptId', 'postingGroupId', 'ticketId', 'amount', 'currency', 'status', 'providerReference', 'debit', 'credit', 'createdAt', 'completedAt', 'updatedAt'];
            const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
            const rows = [columns.join(','), ...exceptions.map((item) => columns.map((column) => escape(item[column])).join(','))];
            res.set('Content-Type', 'text/csv; charset=utf-8');
            res.set('Content-Disposition', `attachment; filename="gentsconcerts-finance-exceptions-${new Date().toISOString().slice(0, 10)}.csv"`);
            return res.status(200).send(rows.join('\n'));
        }
        return res.status(200).json({ success: true, data: { generatedAt: new Date(), staleBefore, count: exceptions.length, exceptions } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.recordFinancialAdjustment = async (req, res) => {
    try {
        const type = String(req.body.type || '').trim().toLowerCase();
        const transactionId = String(req.body.transactionId || '').trim();
        const providerReference = String(req.body.providerReference || '').trim();
        const idempotencyKey = String(req.get('idempotency-key') || req.body.idempotencyKey || '').trim();
        const verificationNote = String(req.body.verificationNote || '').trim();
        const amount = Number(req.body.amount);
        if (!['refund', 'reversal'].includes(type)) return res.status(400).json({ success: false, message: 'Adjustment type must be refund or reversal.' });
        if (!transactionId || !providerReference || !idempotencyKey) return res.status(400).json({ success: false, message: 'Transaction ID, provider reference, and idempotency key are required.' });
        if (verificationNote.length < 10) return res.status(400).json({ success: false, message: 'A verification note of at least 10 characters is required.' });
        if (type === 'reversal' && req.user.role !== 'owner' && !req.user.permissions?.includes('finance.reconciliation.manage')) {
            return res.status(403).json({ success: false, message: 'Reversals require Finance reconciliation permission.' });
        }
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
        const ticket = await Ticket.findById(transaction.ticketId);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket for transaction not found.' });
        if (type === 'refund') {
            const approval = await FinancialApproval.findOne({ _id: req.body.approvalId, type: 'refund', status: 'approved' });
            if (!approval || String(approval.transactionId || '') !== String(transaction._id) || Number(approval.amount) < amount) {
                return res.status(403).json({ success: false, message: 'A matching approved refund request is required before recording a refund.' });
            }
        }
        await consumeGrant(req.stepUpChallenge);
        const result = await postAdjustment({ type, ticket, transaction, providerReference, idempotencyKey, amount });
        await recordAuditEvent({
            actor: req.user,
            ...getAuditContext(req),
            action: `finance.${type}.ledger_posted`,
            targetType: 'Transaction',
            targetId: transaction._id,
            before: { ledgerPostingGroupId: transaction.ledgerPostingGroupId || null },
            after: { adjustmentPostingGroupId: result.postingGroupId, amount, providerReference, idempotentReplay: result.alreadyPosted },
            reason: verificationNote,
            outcome: 'success',
            severity: 'warning',
            source: 'finance_reconciliation_portal'
        });
        return res.status(result.alreadyPosted ? 200 : 201).json({
            success: true,
            executionEnabled: false,
            message: result.alreadyPosted ? 'The adjustment was already recorded.' : 'Verified adjustment ledger entries recorded. No refund or payout was executed.',
            data: result
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.getWebhookEvents = async (req, res) => {
    try {
        const status = String(req.query.status || '').trim();
        const query = status ? { provider: 'mtn_momo', status } : { provider: 'mtn_momo' };
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
        const events = await WebhookEvent.find(query)
            .select('eventKey providerReference status attemptCount lastError outcome requestId receivedAt processedAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(limit);
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const approvalPermissionFor = (type, action) => {
    if (type === 'payout') return action === 'approve' ? 'finance.payout.approve' : 'finance.payout.create';
    return 'finance.refund.manage';
};

exports.requestFinancialStepUp = async (req, res) => {
    try {
        const challenge = await createChallenge({ user: req.user, purpose: 'financial_approval', requestId: req.id });
        return res.status(201).json({
            success: true,
            data: { challengeId: challenge._id, expiresAt: challenge.expiresAt, delivery: 'email' }
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.verifyFinancialStepUp = async (req, res) => {
    try {
        const { challengeId, code } = req.body;
        if (!challengeId || !/^\d{6}$/.test(String(code || ''))) {
            return res.status(400).json({ success: false, message: 'A challenge ID and six-digit code are required.' });
        }
        const result = await verifyChallenge({ userId: req.user._id, challengeId, code });
        return res.status(200).json({
            success: true,
            message: 'Step-up verification successful. Use the grant token once for the intended financial approval action.',
            data: { grantToken: result.grantToken, expiresAt: result.challenge.expiresAt }
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.createFinancialApproval = async (req, res) => {
    try {
        const type = String(req.body.type || '').trim().toLowerCase();
        const amount = Number(req.body.amount);
        const purpose = String(req.body.purpose || '').trim();
        if (!['payout', 'refund'].includes(type)) return res.status(400).json({ success: false, message: 'Approval type must be payout or refund.' });
        const permission = approvalPermissionFor(type, 'create');
        if (!permission || !req.user.permissions?.includes(permission) && req.user.role !== 'owner') {
            return res.status(403).json({ success: false, message: 'Your account is not authorized to create this approval type.' });
        }
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Approval amount must be a positive number.' });
        if (!purpose) return res.status(400).json({ success: false, message: 'A business purpose is required.' });

        const approvalLimit = type === 'payout'
            ? Number(req.user.approvalLimits?.payoutLRD || 0)
            : Number(req.user.approvalLimits?.refundLRD || 0);
        if (req.user.role !== 'owner' && (approvalLimit <= 0 || amount > approvalLimit)) {
            return res.status(403).json({ success: false, message: `The requested amount exceeds your ${type} approval limit.` });
        }

        const requestKey = String(req.get('idempotency-key') || req.body.requestKey || `approval-${crypto.randomUUID()}`).trim().slice(0, 160);
        const existing = await FinancialApproval.findOne({ requestKey });
        if (existing) {
            if (String(existing.requestedBy) !== String(req.user._id)) return res.status(409).json({ success: false, message: 'This approval key belongs to another requester.' });
            return res.status(200).json({ success: true, idempotentReplay: true, data: existing });
        }
        await consumeGrant(req.stepUpChallenge);

        const approval = await FinancialApproval.create({
            requestKey,
            type,
            amount,
            currency: 'LRD',
            purpose,
            beneficiaryReference: req.body.beneficiaryReference,
            targetId: req.body.targetId || undefined,
            ticketId: req.body.ticketId || undefined,
            transactionId: req.body.transactionId || undefined,
            requestedBy: req.user._id,
            requestPermission: req.permission || permission,
            requestId: req.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await recordAuditEvent({
            actor: req.user,
            ...getAuditContext(req),
            action: `finance.${type}.approval_requested`,
            targetType: 'FinancialApproval',
            targetId: approval._id,
            after: { type, amount, currency: 'LRD', status: approval.status, expiresAt: approval.expiresAt },
            reason: purpose,
            outcome: 'success',
            severity: 'warning'
        });
        return res.status(201).json({ success: true, data: approval });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.getFinancialApprovals = async (req, res) => {
    try {
        const status = String(req.query.status || 'pending').trim();
        const query = ['pending', 'approved', 'rejected', 'expired', 'cancelled'].includes(status) ? { status } : {};
        const approvals = await FinancialApproval.find(query)
            .populate('requestedBy', 'fullName email role')
            .populate('reviewedBy', 'fullName email role')
            .sort({ requestedAt: -1 })
            .limit(100);
        return res.status(200).json({ success: true, data: approvals });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.decideFinancialApproval = async (req, res) => {
    try {
        const decision = String(req.body.decision || '').trim().toLowerCase();
        const reason = String(req.body.reason || '').trim();
        if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ success: false, message: 'Decision must be approve or reject.' });
        if (decision === 'reject' && !reason) return res.status(400).json({ success: false, message: 'A rejection reason is required.' });

        const current = await FinancialApproval.findById(req.params.id);
        if (!current) return res.status(404).json({ success: false, message: 'Financial approval not found.' });
        if (String(current.requestedBy) === String(req.user._id)) return res.status(403).json({ success: false, message: 'The requester cannot approve or reject their own financial request.' });
        const permission = approvalPermissionFor(current.type, 'approve');
        if (req.user.role !== 'owner' && !req.user.permissions?.includes(permission)) {
            return res.status(403).json({ success: false, message: 'Your account is not authorized to review this approval type.' });
        }
        if (current.status !== 'pending') return res.status(409).json({ success: false, message: `This approval is already ${current.status}.` });
        if (current.expiresAt <= new Date()) {
            current.status = 'expired';
            await current.save();
            return res.status(409).json({ success: false, message: 'This approval has expired and must be requested again.' });
        }

        const nextStatus = decision === 'approve' ? 'approved' : 'rejected';
        await consumeGrant(req.stepUpChallenge);
        const updated = await FinancialApproval.findOneAndUpdate(
            { _id: current._id, status: 'pending', requestedBy: { $ne: req.user._id }, expiresAt: { $gt: new Date() } },
            { $set: { status: nextStatus, reviewedBy: req.user._id, reviewPermission: req.permission || permission, reviewRequestId: req.id, reviewReason: reason || 'Approved by authorized checker.', reviewedAt: new Date() } },
            { new: true }
        );
        if (!updated) return res.status(409).json({ success: false, message: 'This approval was already decided by another reviewer.' });

        await recordAuditEvent({
            actor: req.user,
            ...getAuditContext(req),
            action: `finance.${updated.type}.approval_${nextStatus}`,
            targetType: 'FinancialApproval',
            targetId: updated._id,
            before: { status: 'pending', requestedBy: updated.requestedBy },
            after: { status: nextStatus, reviewedBy: req.user._id, reviewedAt: updated.reviewedAt },
            reason: updated.reviewReason,
            outcome: 'success',
            severity: nextStatus === 'approved' ? 'warning' : 'info'
        });
        return res.status(200).json({ success: true, executionEnabled: false, message: 'Approval decision recorded. No payout or refund was executed.', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserAccess = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('fullName email role status departments permissions approvalLimits');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateUserAccess = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
        if (String(target._id) === String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Administrators cannot change their own access.' });
        }
        if (!['admin', 'owner'].includes(target.role)) {
            return res.status(400).json({ success: false, message: 'Department access is limited to administrative accounts.' });
        }
        if (target.role === 'owner' && req.user.role !== 'owner') {
            return res.status(403).json({ success: false, message: 'Only an owner can change owner access.' });
        }

        const departments = Array.isArray(req.body.departments) ? [...new Set(req.body.departments)] : target.departments || [];
        const permissions = Array.isArray(req.body.permissions) ? [...new Set(req.body.permissions)] : target.permissions || [];
        const invalidDepartments = departments.filter((department) => !Object.values(DEPARTMENTS).includes(department));
        const invalidPermissions = permissions.filter((permission) => !PERMISSIONS.includes(permission));
        if (invalidDepartments.length || invalidPermissions.length) {
            return res.status(400).json({
                success: false,
                message: 'Access assignment contains an unknown department or permission.',
                invalidDepartments,
                invalidPermissions
            });
        }
        if (permissions.includes('owner.override') && target.role !== 'owner') {
            return res.status(403).json({ success: false, message: 'The owner override permission cannot be assigned to an administrator.' });
        }

        const before = {
            departments: target.departments || [],
            permissions: target.permissions || [],
            approvalLimits: target.approvalLimits || {}
        };
        target.departments = departments;
        target.permissions = permissions;
        if (req.body.approvalLimits && typeof req.body.approvalLimits === 'object') {
            const payoutLRD = Number(req.body.approvalLimits.payoutLRD ?? target.approvalLimits?.payoutLRD ?? 0);
            const refundLRD = Number(req.body.approvalLimits.refundLRD ?? target.approvalLimits?.refundLRD ?? 0);
            if (![payoutLRD, refundLRD].every((value) => Number.isFinite(value) && value >= 0)) {
                return res.status(400).json({ success: false, message: 'Approval limits must be non-negative numbers.' });
            }
            target.approvalLimits = { payoutLRD, refundLRD };
        }
        await target.save();

        await recordAdminAction(
            req.user,
            'Administrative access updated',
            `${target.fullName} (${target.email})`,
            { type: 'User', id: target._id },
            { before, after: { departments: target.departments, permissions: target.permissions, approvalLimits: target.approvalLimits } },
            'auth',
            getAuditContext(req)
        );

        res.status(200).json({
            success: true,
            message: 'Administrative access updated and audited.',
            data: await User.findById(target._id).select('fullName email role status departments permissions approvalLimits')
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// NEW: Feedback & Warnings
exports.sendFeedback = async (req, res) => {
    try {
        const { userId, type, message } = req.body; // type: 'feedback', 'warning', 'notice'
        if (!userId || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'A recipient and message are required.' });
        }
        if (!['feedback', 'warning', 'notice'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid notice type.' });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const title = `${type.charAt(0).toUpperCase()}${type.slice(1)} from GentsConcerts`;
        const delivery = {
            email: await emailService.sendAdminNotice(user, title, message.trim(), type),
            push: user.expoPushToken
                ? await pushNotificationService.sendNotification(user.expoPushToken, title, message.trim(), { type: 'admin_notice' })
                : null
        };
        await recordAdminAction(req.user, `Admin ${type} sent`, `To: ${user.fullName}, Message: ${message}`, { type: 'User', id: user._id }, { after: { delivery } }, 'system', getAuditContext(req));
        
        res.status(200).json({ success: true, message: `Notice sent to ${user.fullName}.`, data: { delivery: { email: !!delivery.email, push: !!delivery.push } } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
