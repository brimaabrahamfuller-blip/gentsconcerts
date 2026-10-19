const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    provider: { type: String, enum: ['mtn_momo'], required: true, default: 'mtn_momo' },
    operation: { type: String, enum: ['collection'], required: true, default: 'collection' },
    eventKey: { type: String, required: true, unique: true, index: true },
    providerReference: { type: String, required: true, index: true },
    payloadHash: { type: String, required: true, index: true },
    requestId: { type: String, index: true },
    status: { type: String, enum: ['received', 'processed', 'deferred', 'failed'], default: 'received', index: true },
    attemptCount: { type: Number, min: 0, default: 0 },
    lastError: { type: String, maxlength: 500 },
    outcome: { type: String, maxlength: 120 },
    receivedAt: { type: Date, default: Date.now, immutable: true },
    processedAt: { type: Date }
}, { timestamps: true, versionKey: false });

webhookEventSchema.index({ provider: 1, providerReference: 1, status: 1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
