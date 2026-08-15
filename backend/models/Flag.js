const mongoose = require('mongoose');
const flagSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['User', 'Event', 'Comment', 'Payment', 'System'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    details: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    source: { type: String, default: 'user_report' }, // 'user_report', 'system_monitor', 'gateway_callback'
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin assigned to this flag
    status: { type: String, enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending' },
    actionTaken: { type: String },
    dueTime: { type: Date },
    nextAction: { type: String },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Flag', flagSchema);
