const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    paymentAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAttempt', index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    mtnTransactionId: { type: String },
    financialTransactionId: { type: String },
    idempotencyKey: { type: String, index: true },
    ledgerPostingGroupId: { type: String, index: true },
    status: { type: String, required: true },
    commission: { type: Number, default: 0 },
    hostPayout: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
