const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Actor
    role: { type: String }, // Actor role at time of action
    action: { type: String, required: true },
    targetType: { type: String }, // e.g., 'User', 'Event', 'Ticket'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed }, // Snapshot before change
    after: { type: mongoose.Schema.Types.Mixed }, // Snapshot after change
    details: { type: String },
    type: { type: String, enum: ['auth', 'event', 'ticket', 'system', 'finance'], default: 'system' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    source: { type: String }, // 'web', 'mobile', 'system_job'
    correlationId: { type: String }, // To link related events
    outcome: { type: String, enum: ['success', 'failure', 'pending'], default: 'success' },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ActivityLog', activityLogSchema);
