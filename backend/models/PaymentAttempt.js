const mongoose = require('mongoose');

const paymentAttemptSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['mtn_momo'], required: true, default: 'mtn_momo' },
    operation: { type: String, enum: ['collection'], required: true, default: 'collection' },
    idempotencyKey: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 160 },
    attemptNumber: { type: Number, required: true, min: 1, default: 1 },
    providerReference: { type: String, index: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'successful', 'failed', 'expired', 'reversed'],
        default: 'initiated',
        index: true
    },
    providerStatus: { type: String, trim: true },
    failureCode: { type: String, trim: true },
    failureMessage: { type: String, trim: true, maxlength: 500 },
    requestContext: { type: mongoose.Schema.Types.Mixed, default: undefined },
    lastCheckedAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true, minimize: false });

paymentAttemptSchema.index({ provider: 1, providerReference: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);
