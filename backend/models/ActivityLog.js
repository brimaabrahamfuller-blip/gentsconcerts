const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: String },
    type: { type: String, enum: ['auth', 'event', 'ticket', 'system'], default: 'system' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ActivityLog', activityLogSchema);
