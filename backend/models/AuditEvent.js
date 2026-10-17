const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    department: { type: String, trim: true },
    permission: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String, trim: true, maxlength: 1000 },
    requestId: { type: String, trim: true, index: true },
    source: { type: String, required: true, default: 'web_admin_portal' },
    outcome: { type: String, enum: ['success', 'failure', 'pending'], default: 'success' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    createdAt: { type: Date, default: Date.now, immutable: true, index: true }
}, {
    minimize: false,
    versionKey: false
});

auditEventSchema.set('strict', true);

module.exports = mongoose.model('AuditEvent', auditEventSchema);
